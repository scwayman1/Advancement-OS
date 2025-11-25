import { GoogleGenAI, Tool, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AGENTS, GEMINI_MODEL } from "../constants";
import { db } from "./db";
import { CRMEntity } from '../types';

// --- Tool Definitions ---

const createEntityTool: FunctionDeclaration = {
  name: "create_crm_entity",
  description: "Create a new profile in the CRM database for a person, company, or foundation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the person or organization" },
      type: { 
        type: Type.STRING, 
        enum: ["Corporation", "Foundation", "Individual", "Contact"],
        description: "Type of entity"
      },
      capacity: { type: Type.STRING, description: "Estimated giving capacity (e.g. '$1M+', '$50k')" },
      status: { 
        type: Type.STRING, 
        enum: ['Identified', 'Qualification', 'Cultivation', 'Solicitation', 'Stewardship'],
        description: "Current status in the pipeline"
      },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Tags describing interests (e.g. 'STEM', 'Alumni', 'Tech')"
      },
      sourceAgentId: { type: Type.STRING, description: "The ID of the agent creating this entry" }
    },
    required: ["name", "type"]
  }
};

const batchCreateEntityTool: FunctionDeclaration = {
  name: "batch_create_crm_entities",
  description: "Create multiple CRM profiles at once. Use this when generating lists of prospects.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      entities: {
        type: Type.ARRAY,
        description: "List of entities to create",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Corporation", "Foundation", "Individual", "Contact"] },
            capacity: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['Identified', 'Qualification', 'Cultivation', 'Solicitation', 'Stewardship'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            sourceAgentId: { type: Type.STRING }
          },
          required: ["name", "type"]
        }
      }
    },
    required: ["entities"]
  }
};

const updateStatusTool: FunctionDeclaration = {
  name: "update_crm_status",
  description: "Update the pipeline status and next step for an existing CRM entity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID of the entity to update" },
      status: { 
         type: Type.STRING, 
         enum: ['Identified', 'Qualification', 'Cultivation', 'Solicitation', 'Stewardship']
      },
      nextStep: { type: Type.STRING, description: "The next action to take" }
    },
    required: ["id", "status"]
  }
};

const getCRMDataTool: FunctionDeclaration = {
  name: "get_crm_data",
  description: "Retrieve all current entries from the CRM database to analyze the pipeline.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const TOOLS: Tool[] = [{
  functionDeclarations: [createEntityTool, batchCreateEntityTool, updateStatusTool, getCRMDataTool]
}];

// --- Service Logic ---

export const generateAgentResponse = async (
  agentId: string,
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string,
  userName: string,
  userRole: string,
  userId: string,
  userOrganizationId?: string,
  activeEntity?: CRMEntity // Contextual Entity
): Promise<AsyncIterable<GenerateContentResponse>> => {
  
  // Check Env (Standard or React App prefix), then LocalStorage
  let apiKey = process.env.API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
     apiKey = localStorage.getItem('advancement_os_gemini_key') || undefined;
  }
  
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please configure it in Team Settings > System Configuration or set REACT_APP_GEMINI_API_KEY in your environment.");
  }

  if (!userMessage || userMessage.trim() === "") {
    throw new Error("Message cannot be empty.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) throw new Error("Agent definition not found");

  // IMPORTANT: Do not mix Google Search with Function Calling in the same request.
  // Prioritize CRM tools for agents that need to read/write DB.
  let activeTools: Tool[] = [];
  
  const crmAgents = [
    'sherlock', 'rainmaker', 'loop_builder', 'pulse', 
    'connector', 'alliance_agent', 'steward', 'advance', 'grant_hunter',
    'cultivation_courier'
  ];

  if (crmAgents.includes(agentId)) {
      activeTools = [...TOOLS];
  } else if (agent.usesSearch) {
      activeTools = [{ googleSearch: {} }];
  }

  const validHistory = history.filter(h => 
    h.parts && h.parts.length > 0 && h.parts.every(p => p.text && p.text.trim() !== "")
  );
  
  // Context injection for the model
  let contextPrompt = `You are speaking with ${userName}, who is a ${userRole}. Tailor your responses to their role.`;
  
  if (activeEntity) {
      contextPrompt += `\n\nCRITICAL CONTEXT: You are currently working inside the CRM account for: ${activeEntity.name}.
      Here is the active entity data:
      ${JSON.stringify(activeEntity, null, 2)}
      
      Please tailor your response specifically to this entity. If asked to draft emails or strategies, use this entity's details.`;
  }

  const fullSystemInstruction = `${agent.systemInstruction}\n${contextPrompt}`;
  
  // Fallback for Org ID in mock mode
  const safeOrgId = userOrganizationId || 'org_coast';

  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: fullSystemInstruction,
        tools: activeTools,
      },
      history: validHistory.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message: userMessage });
    
    const functionCall = result.functionCalls?.[0];

    if (functionCall) {
      let toolResult: any = { result: "Success" };

      try {
        if (functionCall.name === 'create_crm_entity') {
          const args = functionCall.args as any;
          // Await DB operation
          const entity = await db.add({
            name: args.name,
            type: args.type,
            capacity: args.capacity || 'Unknown',
            status: args.status || 'Identified',
            tags: args.tags || [],
            sourceAgentId: args.sourceAgentId || agentId,
            createdBy: userId,
            organizationId: safeOrgId, // Explicitly set Tenant ID
            organization: args.organization // Optional Company Name
          });
          toolResult = { result: "Entity Created", entity };
          
        } else if (functionCall.name === 'batch_create_crm_entities') {
          const args = functionCall.args as any;
          if (args.entities && Array.isArray(args.entities)) {
            
            // Chunking for safety (Firestore limit is 500, but we stay lower for safety)
            const chunkSize = 200;
            const chunks = [];
            for (let i = 0; i < args.entities.length; i += chunkSize) {
                chunks.push(args.entities.slice(i, i + chunkSize));
            }

            let totalCreated = 0;
            for (const chunk of chunks) {
                 await db.addBatch(chunk.map((e: any) => ({
                    name: e.name,
                    type: e.type,
                    capacity: e.capacity || 'Unknown',
                    status: e.status || 'Identified',
                    tags: e.tags || [],
                    sourceAgentId: e.sourceAgentId || agentId,
                    createdBy: userId,
                    organizationId: safeOrgId, 
                    organization: e.organization 
                  })));
                  totalCreated += chunk.length;
            }
            
            toolResult = { result: "Batch Entities Created", count: totalCreated };
          } else {
             toolResult = { error: "Invalid entities array" };
          }

        } else if (functionCall.name === 'get_crm_data') {
          // Await DB operation
          const data = await db.getAll(safeOrgId);
          toolResult = { count: data.length, data: data };

        } else if (functionCall.name === 'update_crm_status') {
          const args = functionCall.args as any;
          // Await DB operation
          const updated = await db.updateStatus(args.id, args.status, args.nextStep);
          toolResult = updated ? { result: "Updated", entity: updated } : { error: "Entity not found" };
        }
      } catch (e) {
        console.error("DB Operation Error", e);
        toolResult = { error: "Failed to execute database operation." };
      }

      return await chat.sendMessageStream({
        message: [{
          functionResponse: {
            id: functionCall.id,
            name: functionCall.name,
            response: toolResult
          }
        }]
      });
    }

    const text = result.text;
    return {
      async *[Symbol.asyncIterator]() {
        if (text) {
          yield { text: text } as GenerateContentResponse;
        }
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};