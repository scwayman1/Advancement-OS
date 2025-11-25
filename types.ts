import { LucideIcon } from 'lucide-react';

export enum AgentCategory {
  INTELLIGENCE = 'Intelligence',
  RELATIONSHIPS = 'Relationships',
  OUTREACH = 'Outreach Specialists',
  CORPORATE = 'Corporate Strategy',
  OPERATIONS = 'Operations',
  EXECUTIVE = 'Executive',
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  superpower: string;
  category: AgentCategory;
  icon: LucideIcon;
  systemInstruction: string;
  usesSearch?: boolean; 
  visualizationType?: 'KPI' | 'LOOP' | 'NONE';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  agentId?: string;
  isThinking?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  activeAgentId: string;
}

// Auth & User Types
export type UserRole = 'ADMIN' | 'OFFICER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  title?: string;
  organization?: string; // Display name
  organizationId?: string; // Tenant ID
}

export interface Organization {
  id: string;
  name: string;
}

// CRM Types
export type AppView = 'chat' | 'crm' | 'team';

export type CRMEntityType = 'Corporation' | 'Foundation' | 'Individual' | 'Contact';

export interface CRMEntity {
  id: string;
  name: string;
  type: CRMEntityType;
  role?: string;
  organization?: string; // The company name for a contact
  organizationId?: string; // The Tenant ID (e.g. University ID)
  status: 'Identified' | 'Qualification' | 'Cultivation' | 'Solicitation' | 'Stewardship';
  sourceAgentId: string;
  capacity: string;
  lastAction: string;
  nextStep: string;
  tags: string[];
  alignmentScore?: number;
  createdBy?: string; // ID of the user who created this record
  createdAt: string;
}