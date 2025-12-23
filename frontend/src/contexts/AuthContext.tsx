import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

interface Participante {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'PRESIDENTE' | 'ASSISTENTE' | 'USER';
  uidAuth?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: Participante | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch user profile from your backend using the UID or Email
          // We need an endpoint to get "ME". Or we can query by email/uid if we have a generic endpoint.
          // Let's assume we can fetch by UID or just use the token to identify self.
          // For now, let's try fetching by ID if we knew it, but we don't.
          // We probably need a /users/me endpoint or similar.
          // Using a temporary hack: fetch all users and find logic (NOT SECURE/SCALABLE but works for small app)
          // OR: update backend to support GET /users/me
          // Let's assume we update backend to support GET /users/me later.
          // For now, let's just fetch all users (if allowed) or fetch by email?
          // The backend users controller has generic findAll, but maybe protected?
          // Let's try to implement /users/me in backend quickly.

          // Actually, let's use the new backend endpoint I should create: GET /users/profile
          // I will add this to backend next.

          // Placeholder for now: using token to get profile data if backend supports it.
          // I'll leave userProfile null for a moment until I fix backend.
          const token = await user.getIdToken();
          const response = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserProfile(response.data);
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
