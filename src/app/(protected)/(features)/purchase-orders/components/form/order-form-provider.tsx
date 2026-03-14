'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { OrderRecord } from '../../data/purchase-order-data';
import { purchaseOrderFormConfig } from './order-form-config';
import type { PurchaseOrderFormContextValue } from './form-types';

interface PurchaseOrderFormProviderProps {
  children: React.ReactNode;
  initialOrder?: OrderRecord;
}

const PurchaseOrderFormContext = createContext<PurchaseOrderFormContextValue | null>(null);

export function PurchaseOrderFormProvider({ children }: PurchaseOrderFormProviderProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const value = useMemo<PurchaseOrderFormContextValue>(
    () => ({
      config: purchaseOrderFormConfig,
      state: {
        isSubmitting,
        isLoading,
        currentStep: 0,
      },
      actions: {
        setSubmitting,
        setLoading,
      },
    }),
    [isLoading, isSubmitting]
  );

  return (
    <PurchaseOrderFormContext.Provider value={value}>{children}</PurchaseOrderFormContext.Provider>
  );
}

export function useEntityForm() {
  const context = useContext(PurchaseOrderFormContext);
  if (!context) {
    throw new Error('useEntityForm must be used within a PurchaseOrderFormProvider');
  }
  return context;
}

export function useFormConfig() {
  return useEntityForm().config;
}

export function useFormState() {
  return useEntityForm().state;
}

export function useFormActions() {
  return useEntityForm().actions;
}
