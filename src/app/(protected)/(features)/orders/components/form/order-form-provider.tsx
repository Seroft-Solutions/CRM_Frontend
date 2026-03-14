'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { OrderRecord } from '../../data/order-data';
import { orderFormConfig } from './order-form-config';
import type { OrderFormContextValue } from './form-types';

interface OrderFormProviderProps {
  children: React.ReactNode;
  initialOrder?: OrderRecord;
}

const OrderFormContext = createContext<OrderFormContextValue | null>(null);

export function OrderFormProvider({ children }: OrderFormProviderProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const value = useMemo<OrderFormContextValue>(
    () => ({
      config: orderFormConfig,
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

  return <OrderFormContext.Provider value={value}>{children}</OrderFormContext.Provider>;
}

export function useEntityForm() {
  const context = useContext(OrderFormContext);
  if (!context) {
    throw new Error('useEntityForm must be used within an OrderFormProvider');
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
