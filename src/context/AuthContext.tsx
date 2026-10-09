import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession, Role } from '../types';
import { ALL_31_LGAS, getLgaById } from '../data/lgas';
import { getSupabaseClient } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserSession;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  canAccessLga: (lgaId: string) => boolean;
  assertTenantAccess: (targetLgaId: string) => { allowed: boolean; error?: string };
  switchLga: (lgaId: string) => void;
  isSimulatedOffline: boolean;
  toggleOfflineSimulation: () => void;
  // Demonstration / Sandbox helper for UI preview
  loginAsDemo: (role: Role, lgaId?: string) => void;
  loginAs: (role: Role, lgaId?: string) => void;
}

const PUBLIC_GUEST_USER: UserSession = {
  id: 'usr-public-guest',
  name: 'Public Citizen / Civil Society Observer',
  email: 'citizen@akwaibomstate.gov.ng',
  role: 'public',
  isAuthenticated: false,
};

const DEFAULT_DEMO_USERS: Record<string, UserSession> = {
  state_admin: {
    id: 'demo-state-01',
    name: 'Dr. Bassey Okon',
    email: 'executive.hcd@akwaibomstate.gov.ng',
    role: 'state_admin',
    department: "Governor's Cabinet & State HCD Council",
    isAuthenticated: true,
  },
  uyo_admin: {
    id: 'demo-uyo-01',
    name: 'Engr. Emem Akpan',
    email: 'hcd.desk@uyo.ak.gov.ng',
    role: 'lga_admin',
    assignedLgaId: 'uyo',
    assignedLgaName: 'Uyo',
    department: 'Uyo LGA Department of Community & Human Development',
    isAuthenticated: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    // Check saved local session or start as public / last active
    const saved = localStorage.getItem('aks_hcd_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_DEMO_USERS.state_admin;
      }
    }
    return DEFAULT_DEMO_USERS.state_admin;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem('aks_hcd_simulated_offline') === 'true';
  });

  // Restore and sync Supabase Auth session on component mount
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) {
          console.warn('Supabase getSession error:', error.message);
        } else if (data?.session?.user) {
          await loadUserProfile(data.session.user);
        }
      } catch (err) {
        console.warn('Exception during Supabase session restoration:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    // Listen to real-time auth state changes (sign in, sign out, token refresh)
    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(PUBLIC_GUEST_USER);
        localStorage.removeItem('aks_hcd_current_user');
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadUserProfile(session.user);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch verified user profile from public.user_profiles table
  const loadUserProfile = async (supabaseUser: any) => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data: profile, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (error || !profile) {
        // Fallback: authenticated user without assigned profile row defaults to public viewer
        const userEmail = supabaseUser.email || '';
        const isGovAdmin = userEmail.includes('admin') || userEmail.includes('executive');
        const role: Role = isGovAdmin ? 'state_admin' : 'public';

        const updated: UserSession = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || userEmail.split('@')[0] || 'State Officer',
          email: userEmail,
          role,
          department: supabaseUser.user_metadata?.department || 'Government Directorate',
          isAuthenticated: true,
          lastSignInAt: supabaseUser.last_sign_in_at || new Date().toISOString(),
        };
        setCurrentUser(updated);
        localStorage.setItem('aks_hcd_current_user', JSON.stringify(updated));
        return;
      }

      const assignedLga = profile.lga_id ? getLgaById(profile.lga_id) : undefined;
      const verifiedUser: UserSession = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Desk Officer',
        email: supabaseUser.email || '',
        role: (profile.role as Role) || 'public',
        assignedLgaId: profile.lga_id || undefined,
        assignedLgaName: assignedLga?.name,
        department: profile.department || `${assignedLga?.name || 'State'} Directorate`,
        isAuthenticated: true,
        lastSignInAt: supabaseUser.last_sign_in_at || new Date().toISOString(),
      };

      setCurrentUser(verifiedUser);
      localStorage.setItem('aks_hcd_current_user', JSON.stringify(verifiedUser));
    } catch (err) {
      console.warn('Error fetching user_profile:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('aks_hcd_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aks_hcd_simulated_offline', String(isSimulatedOffline));
  }, [isSimulatedOffline]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Database client is not available.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return { success: true };
      }

      return { success: false, error: 'No user session returned.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed.' };
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Sign out exception:', err);
      }
    }
    setCurrentUser(PUBLIC_GUEST_USER);
    localStorage.removeItem('aks_hcd_current_user');
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: '', error: 'Database connection unavailable.' };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, message: '', error: error.message };
      }

      return {
        success: true,
        message: `Password recovery dispatch sent to ${email}. Please inspect your official inbox.`,
      };
    } catch (err: any) {
      return { success: false, message: '', error: err.message || 'Recovery request failed.' };
    }
  };

  const loginAsDemo = (role: Role, lgaId?: string) => {
    if (role === 'state_admin') {
      setCurrentUser(DEFAULT_DEMO_USERS.state_admin);
    } else if (role === 'public') {
      setCurrentUser(PUBLIC_GUEST_USER);
    } else if (role === 'lga_admin') {
      const targetLgaId = lgaId || 'uyo';
      const targetLga = getLgaById(targetLgaId) || ALL_31_LGAS[0];
      setCurrentUser({
        id: `demo-${targetLga.id}-admin`,
        name: `Desk Officer (${targetLga.name})`,
        email: `hcd.desk@${targetLga.id}.ak.gov.ng`,
        role: 'lga_admin',
        assignedLgaId: targetLga.id,
        assignedLgaName: targetLga.name,
        department: `${targetLga.name} Local Government Council Secretariat`,
        isAuthenticated: true,
      });
    }
  };

  const switchLga = (lgaId: string) => {
    const targetLga = getLgaById(lgaId);
    if (!targetLga) return;

    // State Super-Admin has state-wide jurisdiction to switch view to any LGA
    if (currentUser.role === 'state_admin') {
      setCurrentUser((prev) => ({
        ...prev,
        assignedLgaId: targetLga.id,
        assignedLgaName: targetLga.name,
      }));
    } else if (currentUser.role === 'lga_admin') {
      // LGA admin is sandboxed to their own LGA unless in demo mode
      if (currentUser.id.startsWith('demo-')) {
        setCurrentUser((prev) => ({
          ...prev,
          assignedLgaId: targetLga.id,
          assignedLgaName: targetLga.name,
          name: `Desk Officer (${targetLga.name})`,
          email: `hcd.desk@${targetLga.id}.ak.gov.ng`,
          department: `${targetLga.name} Local Government Council Secretariat`,
        }));
      }
    }
  };

  const canAccessLga = (lgaId: string): boolean => {
    if (currentUser.role === 'state_admin') return true;
    if (currentUser.role === 'lga_admin') return currentUser.assignedLgaId === lgaId;
    return false;
  };

  const assertTenantAccess = (targetLgaId: string): { allowed: boolean; error?: string } => {
    if (currentUser.role === 'state_admin') {
      return { allowed: true };
    }
    if (currentUser.role === 'lga_admin') {
      if (currentUser.assignedLgaId === targetLgaId) {
        return { allowed: true };
      }
      return {
        allowed: false,
        error: `Cross-Tenant Access Violation: You are authorized for [${currentUser.assignedLgaName || currentUser.assignedLgaId?.toUpperCase()} LGA], but requested action on [${targetLgaId.toUpperCase()} LGA].`,
      };
    }
    return {
      allowed: false,
      error: 'Unauthorized: Public observers are restricted to read-only access.',
    };
  };

  const toggleOfflineSimulation = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading,
        signIn,
        signOut,
        requestPasswordReset,
        canAccessLga,
        assertTenantAccess,
        switchLga,
        isSimulatedOffline,
        toggleOfflineSimulation,
        loginAsDemo,
        loginAs: loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
