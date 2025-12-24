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
  checkClaims: () => Promise<void>;
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

  const checkClaims = async (user?: User | null) => {
    const u = user || currentUser;
    if (!u) return;

    try {
      // Force refresh token to get latest claims
      const tokenResult = await u.getIdTokenResult(true);
      if (tokenResult.claims.mustChangePassword) {
        if (window.location.pathname !== '/change-password') {
          window.location.href = '/change-password';
        }
      }
    } catch (error) {
      console.error('Error checking claims:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Start loading immediately to prevent flash
      setCurrentUser(user);
      if (user) {
        try {
          // Check for forced password change claim
          // FORCE REFRESH to ensure we see the new claim immediately after login/reset
          const tokenResult = await user.getIdTokenResult(true);


          if (tokenResult.claims.mustChangePassword) {

            if (window.location.pathname !== '/change-password') {
              window.location.href = '/change-password';
              return; // Keep loading=true while redirecting
            }
          }

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
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, logout, checkClaims }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
