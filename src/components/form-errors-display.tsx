'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FormErrorsDisplayProps {
  errors: Record<string, any>;
  fieldLabels?: Record<string, string>;
  onDismiss?: () => void;
  className?: string;
}

export function FormErrorsDisplay({
  errors,
  fieldLabels = {},
  onDismiss,
  className = '',
}: FormErrorsDisplayProps) {
  const getErrorMessage = (error: any): string | null => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error.message && typeof error.message === 'string') return error.message;
    if (error.type && typeof error.type === 'string') return error.type;
    return 'Invalid field';
  };

  const errorEntries = Object.entries(errors)
    .map(([fieldName, error]) => [fieldName, getErrorMessage(error)])
    .filter(([_, message]) => message && typeof message === 'string' && message.trim() !== '') as [
    string,
    string,
  ][];

  if (errorEntries.length === 0) {
    return null;
  }

  const getFieldLabel = (fieldName: string): string => {
    return (
      fieldLabels[fieldName] ||
      fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
    );
  };

  return (
    <Alert variant="destructive" className={`mb-6 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium mb-3">
              Please fix the following {errorEntries.length} error
              {errorEntries.length > 1 ? 's' : ''} before continuing:
            </p>
            <div className="space-y-2">
              {errorEntries.map(([fieldName, message]) => (
                <div key={fieldName} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {getFieldLabel(fieldName)}
                  </Badge>
                  <span>{message}</span>
                </div>
              ))}
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-auto p-1 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
