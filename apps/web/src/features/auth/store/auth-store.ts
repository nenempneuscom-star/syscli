import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  professionalId?: string;
  specialties?: string[];
  avatar?: string;
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // Sign in with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) throw authError;

          // Get user details from our User table
          const { data: userData, error: userError } = await supabase
            .from('User')
            .select('*, tenant:Tenant(id, name, subdomain)')
            .eq('email', email)
            .single();

          if (userError) throw userError;

          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: userData } = await supabase
              .from('User')
              .select('*, tenant:Tenant(id, name, subdomain)')
              .eq('id', session.user.id)
              .single();

            if (userData) {
              set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'healthflow-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen to auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    useAuthStore.getState().setUser(null);
  } else if (event === 'SIGNED_IN' && session?.user) {
    const { data: userData } = await supabase
      .from('User')
      .select('*, tenant:Tenant(id, name, subdomain)')
      .eq('id', session.user.id)
      .single();

    if (userData) {
      useAuthStore.getState().setUser(userData);
    }
  }
});
