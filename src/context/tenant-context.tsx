'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localStorageCleanup } from '@/core/auth';

interface TenantContextType {
  selectedOrgName: string | null;
  setSelectedOrgName: (orgName: string | null) => void;
  getTenantHeader: () => string | undefined;
  clearOrganizationData: () => void;
  syncOrganizationData: (orgId: string, orgName: string) => void;
  ensureOrganizationDataExists: () => { id: string | null; name: string | null };
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [selectedOrgName, setSelectedOrgNameState] = useState<string | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrganizationId');
    const storedOrgName = localStorage.getItem('selectedOrganizationName');

    console.log('TenantContext: Initializing from localStorage', {
      storedOrgId,
      storedOrgName,
    });

    if (storedOrgName) {
      setSelectedOrgNameState(storedOrgName);
    } else if (storedOrgId && !storedOrgName) {
      console.warn('TenantContext: Organization ID exists but name is missing from localStorage');
    }
  }, []);

  const setSelectedOrgName = (orgName: string | null) => {
    setSelectedOrgNameState(orgName);
    if (orgName) {
      localStorage.setItem('selectedOrganizationName', orgName);
    } else {
      localStorage.removeItem('selectedOrganizationName');
    }
  };

  const getTenantHeader = (): string | undefined => {
    if (!selectedOrgName) return undefined;

    return selectedOrgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  const clearOrganizationData = () => {
    console.log('Clearing organization data via tenant context');
    localStorageCleanup.organization();
    setSelectedOrgNameState(null);
  };

  const syncOrganizationData = (orgId: string, orgName: string) => {
    console.log('TenantContext: Syncing organization data', { orgId, orgName });

    localStorage.setItem('selectedOrganizationId', orgId);
    localStorage.setItem('selectedOrganizationName', orgName);

    document.cookie = `selectedOrganizationId=${orgId}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `selectedOrganizationName=${encodeURIComponent(orgName)}; path=/; max-age=31536000; SameSite=Lax`;

    setSelectedOrgNameState(orgName);
  };

  const ensureOrganizationDataExists = () => {
    const storedOrgId = localStorage.getItem('selectedOrganizationId');
    const storedOrgName = localStorage.getItem('selectedOrganizationName');

    console.log('TenantContext: Checking organization data existence', {
      storedOrgId,
      storedOrgName,
      stateOrgName: selectedOrgName,
    });

    return {
      id: storedOrgId,
      name: storedOrgName || selectedOrgName,
    };
  };

  return (
    <TenantContext.Provider
      value={{
        selectedOrgName,
        setSelectedOrgName,
        getTenantHeader,
        clearOrganizationData,
        syncOrganizationData,
        ensureOrganizationDataExists,
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
