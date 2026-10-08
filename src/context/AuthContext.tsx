import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession, Role } from '../types';
import { ALL_31_LGAS, getLgaById } from '../data/lgas';

interface AuthContextType {
  currentUser: UserSession;
  loginAs: (role: Role, lgaId?: string) => void;
  canAccessLga: (lgaId: string) => boolean;
  assertTenantAccess: (targetLgaId: string) => { allowed: boolean; error?: string };
  switchLga: (lgaId: string) => void;
  isSimulatedOffline: boolean;
  toggleOfflineSimulation: () => void;
}

const DEFAULT_USERS: Record<string, UserSession> = {
  state_admin: {
    id: 'usr-state-01',
    name: 'Dr. Bassey Okon',
    email: 'executive.hcd@akwaibomstate.gov.ng',
    role: 'state_admin',
    department: "Governor's Cabinet & State HCD Council",
  },
  uyo_admin: {
    id: 'usr-uyo-01',
    name: 'Engr. Emem Akpan',
    email: 'hcd.desk@uyo.ak.gov.ng',
    role: 'lga_admin',
    assignedLgaId: 'uyo',
    assignedLgaName: 'Uyo',
    department: 'Uyo LGA Department of Community & Human Development',
  },
  eket_admin: {
    id: 'usr-eket-01',
    name: 'Mrs. Idorenyin Etuk',
    email: 'hcd.desk@eket.ak.gov.ng',
    role: 'lga_admin',
    assignedLgaId: 'eket',
    assignedLgaName: 'Eket',
    department: 'Eket Local Government Development Directorate',
  },
  public: {
    id: 'usr-public-anon',
    name: 'Civil Society & Citizen Viewer',
    email: 'citizen@public.ak.gov.ng',
    role: 'public',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem('aks_hcd_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USERS.state_admin;
      }
    }
    return DEFAULT_USERS.state_admin; // Start with State Executive overview for full preview
  });

  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem('aks_hcd_simulated_offline') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('aks_hcd_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aks_hcd_simulated_offline', String(isSimulatedOffline));
  }, [isSimulatedOffline]);

  const loginAs = (role: Role, lgaId?: string) => {
    if (role === 'state_admin') {
      setCurrentUser(DEFAULT_USERS.state_admin);
    } else if (role === 'public') {
      setCurrentUser(DEFAULT_USERS.public);
    } else if (role === 'lga_admin') {
      const targetLgaId = lgaId || 'uyo';
      const targetLga = getLgaById(targetLgaId) || ALL_31_LGAS[0];
      setCurrentUser({
        id: `usr-${targetLga.id}-admin`,
        name: `Desk Officer (${targetLga.name})`,
        email: `hcd.desk@${targetLga.id}.ak.gov.ng`,
        role: 'lga_admin',
        assignedLgaId: targetLga.id,
        assignedLgaName: targetLga.name,
        department: `${targetLga.name} Local Government Council Secretariat`,
      });
    }
  };

  const switchLga = (lgaId: string) => {
    const targetLga = getLgaById(lgaId);
    if (!targetLga) return;
    setCurrentUser((prev) => ({
      ...prev,
      role: 'lga_admin',
      assignedLgaId: targetLga.id,
      assignedLgaName: targetLga.name,
      department: `${targetLga.name} Local Government Council Secretariat`,
      name: `Desk Officer (${targetLga.name})`,
      email: `hcd.desk@${targetLga.id}.ak.gov.ng`,
    }));
  };

  const canAccessLga = (targetLgaId: string): boolean => {
    if (currentUser.role === 'state_admin') return true;
    if (currentUser.role === 'public') return true; // public can view published
    if (currentUser.role === 'lga_admin') {
      return currentUser.assignedLgaId?.toLowerCase() === targetLgaId.toLowerCase();
    }
    return false;
  };

  const assertTenantAccess = (targetLgaId: string): { allowed: boolean; error?: string } => {
    if (currentUser.role === 'state_admin') {
      return { allowed: true };
    }
    if (currentUser.role === 'lga_admin') {
      if (currentUser.assignedLgaId?.toLowerCase() !== targetLgaId.toLowerCase()) {
        const errorMsg = `HTTP 403 Forbidden: Tenant Isolation Boundary Triggered. User authenticated under [${currentUser.assignedLgaName || currentUser.assignedLgaId} LGA] is structurally blocked from accessing or mutating workspace data belonging to [${targetLgaId.toUpperCase()} LGA].`;
        return { allowed: false, error: errorMsg };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: 'HTTP 401 Unauthorized: Public role cannot mutate localized government entries.',
    };
  };

  const toggleOfflineSimulation = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginAs,
        canAccessLga,
        assertTenantAccess,
        switchLga,
        isSimulatedOffline,
        toggleOfflineSimulation,
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
