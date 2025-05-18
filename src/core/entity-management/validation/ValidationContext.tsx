import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { zodErrorToObject } from './validationSchemas';
import { logger } from '../utils/logger';

/**
 * Interface for the validation context
 * Provides form validation functionality with error handling
 */
interface ValidationContextType {
  /**
   * Errors record
   */
  errors: Record<string, string>;
  
  /**
   * Set a single error
   */
  setError: (field: string, message: string) => void;
  
  /**
   * Set multiple errors
   */
  setErrors: (errors: Record<string, string>) => void;
  
  /**
   * Clear a single error
   */
  clearError: (field: string) => void;
  
  /**
   * Clear all errors
   */
  clearErrors: () => void;
  
  /**
   * Check if a field has an error
   */
  hasError: (field: string) => boolean;
  
  /**
   * Get the error message for a field
   */
  getError: (field: string) => string | undefined;
  
  /**
   * Validate values against a schema
   */
  validate: <T>(values: T, schema: z.ZodType<T>) => boolean;
  
  /**
   * Validate a single field
   */
  validateField: <T>(
    field: string,
    value: any,
    schema: z.ZodType<T>
  ) => boolean;
  
  /**
   * Get error severity based on error type
   */
  getErrorSeverity: (field: string) => 'error' | 'warning' | 'info';

  /**
   * Set field validation status
   */
  setFieldStatus: (field: string, status: 'valid' | 'invalid' | 'pending') => void;

  /**
   * Get field validation status
   */
  getFieldStatus: (field: string) => 'valid' | 'invalid' | 'pending' | undefined;
}

// Create the context
const ValidationContext = createContext<ValidationContextType>({
  errors: {},
  setError: () => {},
  setErrors: () => {},
  clearError: () => {},
  clearErrors: () => {},
  hasError: () => false,
  getError: () => undefined,
  validate: () => true,
  validateField: () => true,
  getErrorSeverity: () => 'error',
  setFieldStatus: () => {},
  getFieldStatus: () => undefined,
});

/**
 * Provider for the validation context
 */
interface ValidationProviderProps {
  children: React.ReactNode;
  context?: string;
}

export function ValidationProvider({ 
  children,
  context = 'validation' 
}: ValidationProviderProps) {
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [fieldStatus, setFieldStatusState] = useState<Record<string, 'valid' | 'invalid' | 'pending'>>({});
  
  // Create a logger for this validation context
  const validationLogger = useMemo(() => 
    logger.createContext(`ValidationContext:${context}`), 
  [context]);
  
  // Set a single error
  const setError = useCallback((field: string, message: string) => {
    validationLogger.debug(`Setting error for field: ${field}`, 'setError', { message });
    setErrorsState(prev => ({
      ...prev,
      [field]: message,
    }));
    setFieldStatusState(prev => ({
      ...prev,
      [field]: 'invalid'
    }));
  }, [validationLogger]);
  
  // Set multiple errors
  const setErrors = useCallback((newErrors: Record<string, string>) => {
    validationLogger.debug('Setting multiple errors', 'setErrors', { errorCount: Object.keys(newErrors).length });
    setErrorsState(newErrors);
    
    // Update status for all error fields
    const newStatus: Record<string, 'invalid'> = {};
    Object.keys(newErrors).forEach(field => {
      newStatus[field] = 'invalid';
    });
    
    setFieldStatusState(prev => ({
      ...prev,
      ...newStatus
    }));
  }, [validationLogger]);
  
  // Clear a single error
  const clearError = useCallback((field: string) => {
    validationLogger.debug(`Clearing error for field: ${field}`, 'clearError');
    setErrorsState(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    
    setFieldStatusState(prev => {
      const updated = { ...prev };
      if (updated[field] === 'invalid') {
        updated[field] = 'valid';
      }
      return updated;
    });
  }, [validationLogger]);
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    validationLogger.debug('Clearing all errors', 'clearErrors');
    setErrorsState({});
    
    // Update status for all fields with errors
    setFieldStatusState(prev => {
      const updated = { ...prev };
      Object.keys(errors).forEach(field => {
        if (updated[field] === 'invalid') {
          updated[field] = 'valid';
        }
      });
      return updated;
    });
  }, [errors, validationLogger]);
  
  // Check if a field has an error
  const hasError = useCallback(
    (field: string) => {
      return field in errors;
    },
    [errors]
  );
  
  // Get the error message for a field
  const getError = useCallback(
    (field: string) => {
      return errors[field];
    },
    [errors]
  );
  
  // Set field validation status
  const setFieldStatus = useCallback((field: string, status: 'valid' | 'invalid' | 'pending') => {
    validationLogger.debug(`Setting field status: ${field} -> ${status}`, 'setFieldStatus');
    setFieldStatusState(prev => ({
      ...prev,
      [field]: status
    }));
  }, [validationLogger]);
  
  // Get field validation status
  const getFieldStatus = useCallback((field: string) => {
    return fieldStatus[field];
  }, [fieldStatus]);
  
  // Get error severity based on error type
  const getErrorSeverity = useCallback((field: string): 'error' | 'warning' | 'info' => {
    // You can implement custom logic here based on field type or error content
    return 'error';
  }, []);
  
  // Validate values against a schema
  const validate = useCallback(<T,>(values: T, schema: z.ZodType<T>) => {
    validationLogger.debug('Validating schema', 'validate', { values });
    try {
      schema.parse(values);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorObj = zodErrorToObject(error);
        validationLogger.warn('Validation failed', 'validate', { errors: errorObj });
        setErrors(errorObj);
      } else {
        validationLogger.error('Unexpected validation error', 'validate', { error });
      }
      return false;
    }
  }, [setErrors, clearErrors, validationLogger]);
  
  // Validate a single field
  const validateField = useCallback(
    <T,>(field: string, value: any, schema: z.ZodType<T>) => {
      validationLogger.debug(`Validating field: ${field}`, 'validateField', { value });
      setFieldStatus(field, 'pending');
      
      try {
        const obj = { [field]: value } as any;
        schema.parse(obj);
        clearError(field);
        setFieldStatus(field, 'valid');
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = zodErrorToObject(error);
          if (field in errors) {
            validationLogger.debug(`Field validation failed: ${field}`, 'validateField', { error: errors[field] });
            setError(field, errors[field]);
          }
          setFieldStatus(field, 'invalid');
        } else {
          validationLogger.error(`Unexpected field validation error: ${field}`, 'validateField', { error });
        }
        return false;
      }
    },
    [clearError, setError, setFieldStatus, validationLogger]
  );
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    errors,
    setError,
    setErrors,
    clearError,
    clearErrors,
    hasError,
    getError,
    validate,
    validateField,
    getErrorSeverity,
    setFieldStatus,
    getFieldStatus,
  }), [
    errors,
    setError,
    setErrors,
    clearError,
    clearErrors,
    hasError,
    getError,
    validate,
    validateField,
    getErrorSeverity,
    setFieldStatus,
    getFieldStatus,
  ]);
  
  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
}

/**
 * Hook to use validation in components
 */
export function useValidation() {
  return useContext(ValidationContext);
}

/**
 * HOC to provide validation to a component
 */
export function withValidation<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    context?: string;
  } = {}
) {
  const { context } = options;
  
  return function WithValidationComponent(props: P) {
    return (
      <ValidationProvider context={context}>
        <Component {...props} />
      </ValidationProvider>
    );
  };
}
