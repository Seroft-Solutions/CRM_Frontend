'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { [[dto]] } from '@/core/api/generated/schemas';

type [[entity]]ContextType = {
  current: [[dto]] | null;
  setItem: (item: [[dto]] | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  invalidateQueries: () => void;
};

const [[entity]]Context = createContext<[[entity]]ContextType>({
  current: null,
  setItem: () => {},
  loading: false,
  setLoading: () => {},
  error: null,
  setError: () => {},
  invalidateQueries: () => {},
});

export function [[entity]]Provider({ children }: { children: ReactNode }) {
  const [current, setItem] = useState<[[dto]] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Helper to invalidate all related queries when data changes
  const invalidateQueries = () => {
    // Invalidate list queries
    queryClient.invalidateQueries({ queryKey: ['/api/[[kebab]]s'] });
    
    // Invalidate current item query if we have an id
    if (current?.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/[[kebab]]s/${current.id}`] });
    }
  };

  return (
    <[[entity]]Context.Provider
      value={{
        current,
        setItem,
        loading,
        setLoading,
        error,
        setError,
        invalidateQueries,
      }}
    >
      {children}
    </[[entity]]Context.Provider>
  );
}

export function use[[entity]]() {
  const context = useContext([[entity]]Context);
  if (!context) {
    throw new Error('use[[entity]] must be used within [[entity]]Provider');
  }
  return context;
}
