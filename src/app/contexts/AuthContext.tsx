import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default fallback for when context isn't available yet (e.g. during router initialization)
const defaultAuthContext: AuthContextType = {
  user: null,
  accessToken: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not ready'); },
  signOut: async () => { throw new Error('AuthProvider not ready'); },
  signUp: async () => { throw new Error('AuthProvider not ready'); },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth state changes (token refresh, sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // If token refresh failed (stale refresh token), sign out cleanly
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing stale session');
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setAccessToken(null);
          setLoading(false);
          return;
        }
        if (session) {
          setUser(session.user);
          setAccessToken(session.access_token);
        } else {
          setUser(null);
          setAccessToken(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // Stale refresh token — clear it and move on
        console.warn('Session check failed (likely stale refresh token), clearing session:', error.message);
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
        setAccessToken(null);
        setLoading(false);
        return;
      }
      
      if (data.session) {
        // Verify the session is still valid by refreshing it
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed, clearing stale session:', refreshError.message);
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setAccessToken(null);
          setLoading(false);
          return;
        }
        if (refreshData.session) {
          setUser(refreshData.session.user);
          setAccessToken(refreshData.session.access_token);
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
      // On any unexpected error, clear session to avoid infinite error loops
      await supabase.auth.signOut().catch(() => {});
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const trimmedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error) throw new Error(error.message || 'Erro ao fazer login');
    if (data.session) {
      setUser(data.session.user);
      setAccessToken(data.session.access_token);
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setAccessToken(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      throw new Error(err.message || 'Erro ao fazer logout');
    }
  }

  async function signUp(email: string, password: string, _name: string) {
    const { error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
    if (error) throw new Error(error.message || 'Erro ao criar conta');
    await signIn(email, password);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return defaultAuthContext;
  }
  return context;
}