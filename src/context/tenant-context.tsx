'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TenantContextType {
  selectedOrgName: string | null;
  setSelectedOrgName: (orgName: string | null) => void;
  getTenantHeader: () => string | undefined;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [selectedOrgName, setSelectedOrgNameState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrganizationId');
    const storedOrgName = localStorage.getItem('selectedOrganizationName');

    if (storedOrgName) {
      setSelectedOrgNameState(storedOrgName);
    }
  }, []);

  // Update localStorage when org name changes
  const setSelectedOrgName = (orgName: string | null) => {
    setSelectedOrgNameState(orgName);
    if (orgName) {
      localStorage.setItem('selectedOrganizationName', orgName);
    } else {
      localStorage.removeItem('selectedOrganizationName');
    }
  };

  // Convert org name to tenant header format
  const getTenantHeader = (): string | undefined => {
    if (!selectedOrgName) return undefined;
    // Convert to lowercase and replace special characters with underscores
    return selectedOrgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  return (
    <TenantContext.Provider
      value={{
        selectedOrgName,
        setSelectedOrgName,
        getTenantHeader,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
