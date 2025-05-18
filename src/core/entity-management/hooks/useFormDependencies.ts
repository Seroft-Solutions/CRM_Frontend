import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Custom hook to safely handle form field dependencies
 * and prevent infinite useEffect loops in forms
 * 
 * This hook helps manage relationships between form fields where
 * changing one field affects others (like dropdown cascading).
 * 
 * @param dependencies Array of field names that this field depends on
 * @param onChange Callback when dependencies change
 * @param options Configuration options
 */
export function useDependentFields<T = Record<string, any>>(
  dependencies: string[],
  onChange: (values: T) => void,
  options: {
    clearFieldOnChange?: boolean;
    fieldToClear?: string;
    debounceMs?: number;
    transformValues?: (values: Record<string, any>) => T;
    onlyWhenAllDependenciesFilled?: boolean;
    skipFirstRun?: boolean;
  } = {}
) {
  const { 
    clearFieldOnChange = true,
    fieldToClear,
    debounceMs = 0,
    transformValues = (v) => v as unknown as T,
    onlyWhenAllDependenciesFilled = true,
    skipFirstRun = true
  } = options;
  
  const form = useFormContext();
  
  // Use refs to track previous values and prevent unnecessary triggers
  const prevDependencyValuesRef = useRef<Record<string, any>>({});
  const skipFirstRunRef = useRef<boolean>(skipFirstRun);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a dependency checker
  const haveDependenciesChanged = (newValues: Record<string, any>) => {
    const prevValues = prevDependencyValuesRef.current;
    
    // First run case
    if (skipFirstRunRef.current) {
      skipFirstRunRef.current = false;
      // Store current values
      dependencies.forEach((dep) => {
        prevDependencyValuesRef.current[dep] = newValues[dep];
      });
      return false;
    }
    
    // Check if any values changed
    let hasChanged = false;
    dependencies.forEach((dep) => {
      if (prevValues[dep] !== newValues[dep]) {
        hasChanged = true;
      }
    });
    
    // Store current values for next comparison
    if (hasChanged) {
      dependencies.forEach((dep) => {
        prevDependencyValuesRef.current[dep] = newValues[dep];
      });
    }
    
    return hasChanged;
  };
  
  // Check if all dependencies have values
  const allDependenciesFilled = (values: Record<string, any>) => {
    return dependencies.every(dep => {
      const val = values[dep];
      return val !== undefined && val !== null && val !== '';
    });
  };
  
  // Handle dependency changes
  const handleDependencyChange = (formValues: Record<string, any>) => {
    // Create dependency values object
    const dependencyValues: Record<string, any> = {};
    dependencies.forEach((dep) => {
      dependencyValues[dep] = formValues[dep];
    });
    
    // Check if dependencies have changed
    const hasChanges = haveDependenciesChanged(dependencyValues);
    
    if (!hasChanges) return;
    
    // Check if all dependencies filled if required
    const allFilled = allDependenciesFilled(dependencyValues);
    if (onlyWhenAllDependenciesFilled && !allFilled) {
      // Clear the field if configured
      if (clearFieldOnChange && fieldToClear) {
        form.setValue(fieldToClear, '');
      }
      return;
    }
    
    // Clear the field if configured
    if (clearFieldOnChange && fieldToClear) {
      form.setValue(fieldToClear, '');
    }
    
    // Call onChange with debounce
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        onChange(transformValues(dependencyValues));
      }, debounceMs);
    } else {
      onChange(transformValues(dependencyValues));
    }
  };
  
  // Set up form subscription
  useEffect(() => {
    // Create the subscription
    const subscription = form.watch((formValues, { name }) => {
      // Only process if the changed field is one of our dependencies
      if (name && dependencies.includes(name)) {
        handleDependencyChange(formValues);
      }
    });
    
    // Cleanup
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dependencies)]);
  
  return {
    isDependentOn: (fieldName: string) => dependencies.includes(fieldName),
  };
}
