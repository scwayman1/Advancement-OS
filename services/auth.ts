import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { auth, firestore, useMockBackend } from "./firebase";
import { User, UserRole } from "../types";

const USERS_COLLECTION = 'users';

// Fallback Data for Mock Mode
const MOCK_USERS: User[] = [
  {
    id: 'user_scott',
    email: 'swayman@cccd.edu',
    name: 'Scott Wayman',
    role: 'ADMIN',
    title: 'Super Admin',
    organization: 'Coast Community College District',
    organizationId: 'org_coast',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scott'
  },
  {
    id: 'user_admin',
    email: 'admin@university.edu',
    name: 'Jennifer Admin',
    role: 'ADMIN',
    title: 'VP of Advancement',
    organization: 'University of Technology',
    organizationId: 'org_tech',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer'
  }
];

class AuthService {
  
  // --- Auth Actions ---

  async login(email: string, password: string = 'password'): Promise<User> {
    if (useMockBackend) {
        // MOCK MODE: Simulate login
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake network delay
        
        // Check mock users
        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (mockUser) return mockUser;

        // Check local storage users (created via signup in mock mode)
        const storedUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
        const storedUser = storedUsers.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
        if (storedUser) return storedUser;

        throw new Error("Invalid credentials (Mock Mode). Try swayman@cccd.edu");
    }

    if (!auth) {
        throw new Error("Firebase not initialized. Check configuration.");
    }

    try {
      // REAL MODE
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const userProfile = await this.getUserProfile(fbUser.uid);
      
      if (!userProfile) {
        // If auth exists but no profile, create fallback or ask for signup
        // Here we try to create a basic profile to prevent lockout
        return this.createFallbackProfile(fbUser);
      }

      return userProfile;
    } catch (error: any) {
      console.error("Login failed", error);
      throw error;
    }
  }

  async signup(email: string, name: string, title: string, organization: string, password: string = 'password'): Promise<User> {
    if (useMockBackend) {
        // MOCK MODE
        await new Promise(resolve => setTimeout(resolve, 800));
        const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            name,
            title,
            role: 'ADMIN',
            organization,
            organizationId: `org_${Date.now()}`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
        };
        
        // Save to "Local DB"
        const storedUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
        storedUsers.push(newUser);
        localStorage.setItem('mock_users_db', JSON.stringify(storedUsers));
        
        return newUser;
    }

    if (!auth) {
        throw new Error("Firebase not initialized. Check configuration.");
    }

    try {
      // REAL MODE
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const newUser: User = {
        id: fbUser.uid,
        email,
        name,
        title,
        role: 'ADMIN', // Creator is Admin
        organization,
        organizationId: `org_${Date.now()}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
      };

      await setDoc(doc(firestore, USERS_COLLECTION, fbUser.uid), newUser);
      return newUser;
    } catch (error: any) {
      console.error("Signup failed", error);
      throw error;
    }
  }

  async logout() {
    if (useMockBackend) return;
    if (auth) await signOut(auth);
  }

  // --- User Management (Team) ---

  async inviteUser(email: string, role: any, name: string, title: string): Promise<User> {
    if (useMockBackend) {
        const currentUserStr = localStorage.getItem('auth_user');
        if (!currentUserStr) throw new Error("Not authenticated");
        const currentUser = JSON.parse(currentUserStr);

        const newUser: User = {
            id: `invite_${Date.now()}`,
            email,
            name,
            title,
            role,
            organization: currentUser.organization,
            organizationId: currentUser.organizationId,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
        };
        
        const storedUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
        storedUsers.push(newUser);
        localStorage.setItem('mock_users_db', JSON.stringify(storedUsers));
        return newUser;
    }

    // REAL MODE
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Not authenticated");
    
    const adminProfile = await this.getUserProfile(currentUser.uid);
    if (!adminProfile) throw new Error("Admin profile not found");

    const placeholderId = `invite_${Date.now()}`;
    const newUser: User = {
      id: placeholderId,
      email,
      name,
      title,
      role,
      organization: adminProfile.organization,
      organizationId: adminProfile.organizationId,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
    };

    await setDoc(doc(firestore, USERS_COLLECTION, placeholderId), newUser);
    return newUser;
  }

  async getAllUsers(organizationId: string): Promise<User[]> {
    if (useMockBackend) {
        const storedUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
        const allUsers = [...MOCK_USERS, ...storedUsers];
        return allUsers.filter(u => u.organizationId === organizationId);
    }

    if (!organizationId) return [];
    const q = query(
      collection(firestore, USERS_COLLECTION), 
      where("organizationId", "==", organizationId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as User);
  }

  async removeUser(userId: string) {
     if (useMockBackend) {
        const storedUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
        const filtered = storedUsers.filter((u: User) => u.id !== userId);
        localStorage.setItem('mock_users_db', JSON.stringify(filtered));
        return;
     }
     await deleteDoc(doc(firestore, USERS_COLLECTION, userId));
  }

  // --- Helpers ---

  async getUserProfile(uid: string): Promise<User | null> {
    if (useMockBackend) return null;

    const docRef = doc(firestore, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  }

  private createFallbackProfile(fbUser: FirebaseUser): User {
    return {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: fbUser.displayName || 'User',
      role: 'VIEWER',
      title: 'Staff',
      organization: 'Demo Org',
      organizationId: 'org_demo'
    };
  }
}

export const authService = new AuthService();