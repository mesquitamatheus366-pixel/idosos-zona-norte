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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      
      if (error) {
        // If invalid credentials, try to re-create the user (handles project resets or unconfirmed emails)
        if (error.message?.includes('Invalid login credentials')) {
          console.warn('Sign in failed, attempting auto-recovery via signup...');
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/auth/signup`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({ email: trimmedEmail, password, name: 'Admin' }),
              }
            );
            const result = await response.json();
            if (response.ok) {
              // Retry sign in after successful signup
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
              });
              if (retryError) throw retryError;
              if (retryData.session) {
                setUser(retryData.session.user);
                setAccessToken(retryData.session.access_token);
              }
              return;
            }
            // If signup also failed (user already exists but password is truly wrong), throw original error
            console.warn('Auto-recovery signup failed:', result.error);
          } catch (recoveryErr) {
            console.warn('Auto-recovery failed:', recoveryErr);
          }
        }
        throw error;
      }
      
      if (data.session) {
        setUser(data.session.user);
        setAccessToken(data.session.access_token);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      throw new Error(err.message || 'Erro ao fazer login');
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

  async function signUp(email: string, password: string, name: string) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar conta');
      }
      
      // After signup, sign in automatically
      await signIn(email, password);
    } catch (err: any) {
      console.error('Sign up error:', err);
      throw new Error(err.message || 'Erro ao criar conta');
    }
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