'use client';

import React from 'react';
import { SundryCreditorForm } from './form/sundry-creditor-form-wizard';

interface SundryCreditorFormProps {
    id?: number;
}

/**
 * Main entry point for the Sundry Creditor form.
 */
export function SundryCreditorFormWrapper({ id }: SundryCreditorFormProps) {
    return <SundryCreditorForm id={id} />;
}

export { SundryCreditorFormWrapper as SundryCreditorForm };
