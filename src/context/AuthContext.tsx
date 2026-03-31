import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { User } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
  loginAsGuest: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (id: string) => {
    const { data } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();
    if (data) setUser(data as User);
  };

  const refreshUser = async () => {
    if (session?.user?.id) {
      await fetchUser(session.user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) fetchUser(s.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user?.id) fetchUser(s.user.id);
        else setUser(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const loginAsGuest = () => {
    setUser({
      id: 'guest',
      phone: '9800000000',
      full_name: 'Test User',
      role: 'responder',
      qualification: 'first_aid_trained',
      is_active_responder: false,
      current_lat: 27.7172,
      current_lng: 85.3240,
      last_seen: new Date().toISOString(),
      language_preference: 'ne',
      created_at: new Date().toISOString(),
    });
    // Provide a minimal fake session so the navigator's `session && user?.full_name` check passes
    setSession({ access_token: 'guest', token_type: 'bearer' } as unknown as Session);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, refreshUser, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
