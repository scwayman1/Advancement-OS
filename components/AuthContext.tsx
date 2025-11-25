
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Organization } from '../types';
import { authService } from '../services/auth';
import { auth, useMockBackend } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, title: string, organization: string, password?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (useMockBackend) {
        // MOCK MODE: Load session from localStorage
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.organizationId && parsedUser.organization) {
                setOrganization({ id: parsedUser.organizationId, name: parsedUser.organization });
            }
        }
        setIsLoading(false);
        return;
    }

    // REAL MODE: Listen for Firebase
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const profile = await authService.getUserProfile(firebaseUser.uid);
                if (profile) {
                    setUser(profile);
                    if (profile.organizationId && profile.organization) {
                        setOrganization({
                            id: profile.organizationId,
                            name: profile.organization
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching user profile", e);
            }
        } else {
            setUser(null);
            setOrganization(null);
        }
        setIsLoading(false);
        });
        return () => unsubscribe();
    } else {
        setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    const loggedInUser = await authService.login(email, password);
    if (useMockBackend) {
        setUser(loggedInUser);
        if (loggedInUser.organizationId) {
            setOrganization({ id: loggedInUser.organizationId, name: loggedInUser.organization || '' });
        }
        localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
    }
  };

  const signup = async (email: string, name: string, title: string, orgName: string, password?: string) => {
    const newUser = await authService.signup(email, name, title, orgName, password);
    if (useMockBackend) {
        setUser(newUser);
        setOrganization({ id: newUser.organizationId || '', name: orgName });
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    authService.logout();
    if (useMockBackend) {
        setUser(null);
        setOrganization(null);
        localStorage.removeItem('auth_user');
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'OFFICER' && requiredRole !== 'ADMIN') return true;
    if (user.role === 'VIEWER' && requiredRole === 'VIEWER') return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, login, signup, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
