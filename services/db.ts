
import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDocs, 
  doc, 
  query, 
  where
} from "firebase/firestore";
import { firestore, useMockBackend } from "./firebase";
import { CRMEntity } from '../types';

const CRM_COLLECTION = 'crm_entities';
const LOCAL_STORAGE_KEY = 'crm_db';

class CRMDatabase {
  
  // --- READ ---

  public async getAll(organizationId?: string): Promise<CRMEntity[]> {
    if (!organizationId) return [];

    if (useMockBackend) {
        // MOCK MODE
        await new Promise(r => setTimeout(r, 300)); // Sim latency
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const all: CRMEntity[] = raw ? JSON.parse(raw) : [];
        return all
            .filter(e => e.organizationId === organizationId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      // REAL MODE
      const q = query(
        collection(firestore, CRM_COLLECTION),
        where("organizationId", "==", organizationId)
      );

      const querySnapshot = await getDocs(q);
      const entities: CRMEntity[] = [];
      
      querySnapshot.forEach((doc) => {
        entities.push({ id: doc.id, ...doc.data() } as CRMEntity);
      });

      return entities.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    } catch (error) {
      console.error("Error fetching CRM data:", error);
      throw error;
    }
  }

  // --- WRITE ---

  public async add(entity: Omit<CRMEntity, 'id' | 'lastAction' | 'nextStep' | 'createdAt'>): Promise<CRMEntity> {
    const newEntityData = {
        ...entity,
        lastAction: 'Created via Agent',
        nextStep: 'Initial Outreach',
        alignmentScore: 85,
        createdAt: new Date().toISOString()
    };

    if (useMockBackend) {
        await new Promise(r => setTimeout(r, 300));
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const newEntity = { id: `crm_${Date.now()}_${Math.random().toString(36).substr(2,9)}`, ...newEntityData };
        all.push(newEntity);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('crm_updated'));
        return newEntity as CRMEntity;
    }

    try {
      const docRef = await addDoc(collection(firestore, CRM_COLLECTION), newEntityData);
      window.dispatchEvent(new Event('crm_updated'));
      return { id: docRef.id, ...newEntityData } as CRMEntity;
    } catch (error) {
      console.error("Error adding CRM entity:", error);
      throw error;
    }
  }

  public async addBatch(entities: Array<Omit<CRMEntity, 'id' | 'lastAction' | 'nextStep' | 'createdAt'>>): Promise<CRMEntity[]> {
    // Batch implementation logic
    const promises = entities.map(entity => this.add(entity));
    return await Promise.all(promises);
  }

  // --- UPDATE ---

  public async updateStatus(id: string, status: CRMEntity['status'], nextStep?: string): Promise<CRMEntity | null> {
    if (useMockBackend) {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const all: CRMEntity[] = raw ? JSON.parse(raw) : [];
        const index = all.findIndex(e => e.id === id);
        
        if (index === -1) return null;
        
        const updated = { ...all[index], status, lastAction: `Status updated to ${status}` };
        if (nextStep) updated.nextStep = nextStep;
        
        all[index] = updated;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('crm_updated'));
        return updated;
    }

    try {
      const docRef = doc(firestore, CRM_COLLECTION, id);
      const updates: any = { status, lastAction: `Status updated to ${status}` };
      if (nextStep) updates.nextStep = nextStep;

      await updateDoc(docRef, updates);
      window.dispatchEvent(new Event('crm_updated'));
      return { id, ...updates } as CRMEntity;

    } catch (error) {
      console.error("Error updating status:", error);
      return null;
    }
  }
}

export const db = new CRMDatabase();
