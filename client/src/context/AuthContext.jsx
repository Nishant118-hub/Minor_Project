import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cyber_awareness_user'));
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!localStorage.getItem('cyber_awareness_token')) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        localStorage.setItem('cyber_awareness_user', JSON.stringify(currentUser));
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function signIn(credentials) {
    const result = await loginRequest(credentials);
    localStorage.setItem('cyber_awareness_token', result.token);
    localStorage.setItem('cyber_awareness_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  function signOut() {
    localStorage.removeItem('cyber_awareness_token');
    localStorage.removeItem('cyber_awareness_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, isLoading, signIn, signOut }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
