import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { readStoredAuthUser, writeStoredAuthUser } from './session';

type AuthContextValue = {
  user: User | null;
  signIn: (nextUser: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredAuthUser());

  const signIn = (nextUser: User) => {
    writeStoredAuthUser(nextUser);
    setUser(nextUser);
  };

  const signOut = () => {
    writeStoredAuthUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
