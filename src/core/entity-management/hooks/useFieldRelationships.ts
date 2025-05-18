import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/features/core/tanstack-query-api/core/apiClient';
import { 
  DependentFieldRelationship, 
  RelationshipType 
} from '../types/entity-form/field-relationships';

interface UseFieldRelationshipsOptions {
  /**
   * Debounce time in milliseconds for dependency updates
   * @default 100
   */
  debounceMs?: number;
  
  /**
   * Whether to skip initial dependency check on first run
   * @default false
   */
  skipFirstRun?: boolean;
  
  /**
   * Cache time for field options in milliseconds
   * @default 5 minutes
   */
  cacheTime?: number;
  
  /**
   * Enable debug mode to log detailed information
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook to manage field relationships and dependencies in forms
 * This hook provides a mechanism to track dependencies between fields,
 * manage field options based on dependencies, and prevent infinite loops.
 */
export function useFieldRelationships(
  relationships: Record<string, DependentFieldRelationship[]>,
  options: UseFieldRelationshipsOptions = {}
) {
  const {
    debounceMs = 100,
    skipFirstRun = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    debug = false
  } = options;
  
  const form = useFormContext();
  const queryClient = useQueryClient();
  
  // Refs to track previous values and first runs
  const prevDependencyValuesRef = useRef<Record<string, Record<string, any>>>({});
  const firstRunsRef = useRef<Record<string, boolean>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  
  // Get all fields that have dependencies
  const dependentFields = Object.keys(relationships);
  
  // Map of fields to their dependencies
  const [dependencyMap, setDependencyMap] = useState<Record<string, string[]>>({});
  
  // Set up dependency map
  useEffect(() => {
    const map: Record<string, string[]> = {};
    
    // Process all field relationships
    Object.entries(relationships).forEach(([fieldName, fieldRelationships]) => {
      fieldRelationships.forEach(relationship => {
        if (relationship.type === RelationshipType.DEPENDS_ON) {
          const dependsOn = Array.isArray(relationship.fields) 
            ? relationship.fields 
            : [relationship.fields];
            
          map[fieldName] = (map[fieldName] || []).concat(dependsOn);
          
          // Initialize first run tracking
          if (firstRunsRef.current[fieldName] === undefined) {
            firstRunsRef.current[fieldName] = skipFirstRun;
          }
        }
      });
    });
    
    setDependencyMap(map);
  }, [relationships, skipFirstRun]);
  
  // Check if dependencies changed
  const haveDependenciesChanged = useCallback((
    fieldName: string, 
    newValues: Record<string, any>
  ): boolean => {
    const prevValues = prevDependencyValuesRef.current[fieldName] || {};
    
    // First run case
    if (firstRunsRef.current[fieldName]) {
      firstRunsRef.current[fieldName] = false;
      // Store current values
      prevDependencyValuesRef.current[fieldName] = { ...newValues };
      return false;
    }
    
    // Check if any values changed
    let hasChanged = false;
    const deps = dependencyMap[fieldName] || [];
    
    deps.forEach((dep) => {
      if (prevValues[dep] !== newValues[dep]) {
        hasChanged = true;
      }
    });
    
    // Store current values for next comparison
    if (hasChanged) {
      prevDependencyValuesRef.current[fieldName] = { ...newValues };
    }
    
    return hasChanged;
  }, [dependencyMap]);
  
  // Check if all dependencies are filled
  const allDependenciesFilled = useCallback((
    fieldName: string,
    values: Record<string, any>
  ): boolean => {
    const deps = dependencyMap[fieldName] || [];
    return deps.every(dep => {
      const val = values[dep];
      return val !== undefined && val !== null && val !== '';
    });
  }, [dependencyMap]);
  
  // Get field options fetcher function
  const getFieldOptionsFetcher = useCallback((
    fieldName: string,
    dependencies: Record<string, any>
  ) => {
    // Get the relationship config for the field
    const fieldRelationships = relationships[fieldName] || [];
    const dependsOnRelationship = fieldRelationships.find(
      r => r.type === RelationshipType.DEPENDS_ON
    );
    
    if (!dependsOnRelationship) {
      if (debug) console.log(`[useFieldRelationships] No DEPENDS_ON relationship for ${fieldName}`);
      return null;
    }
    
    // Build fetcher function
    return async () => {
      if (debug) {
        console.log(`[useFieldRelationships] Fetching options for ${fieldName}`, dependencies);
      }
      
      // Apply transformations if specified
      const transformedDeps = dependsOnRelationship.transformDependencies
        ? dependsOnRelationship.transformDependencies(dependencies)
        : dependencies;
        
      // Determine the endpoint
      let endpoint: string;
      
      if (dependsOnRelationship.optionsEndpoint) {
        // Replace placeholders in endpoint template
        endpoint = dependsOnRelationship.optionsEndpoint;
        Object.entries(transformedDeps).forEach(([key, value]) => {
          endpoint = endpoint.replace(`:${key}`, String(value));
        });
      } else if (dependsOnRelationship.endpointsConfig && dependsOnRelationship.endpointKey) {
        // Get from endpointsConfig using endpointKey
        const config = dependsOnRelationship.endpointsConfig;
        const keys = dependsOnRelationship.endpointKey.split('.');
        
        let endpointFn: any = config;
        for (const key of keys) {
          if (endpointFn && typeof endpointFn === 'object') {
            endpointFn = endpointFn[key];
          } else {
            throw new Error(`Invalid endpointKey: ${dependsOnRelationship.endpointKey}`);
          }
        }
        
        // If the endpoint is a function, call it with the first dependency value
        if (typeof endpointFn === 'function') {
          const firstDepValue = Object.values(transformedDeps)[0];
          endpoint = endpointFn(firstDepValue);
        } else if (typeof endpointFn === 'string') {
          endpoint = endpointFn;
        } else {
          throw new Error(`Invalid endpoint for ${fieldName}`);
        }
      } else {
        // Try a default endpoint pattern
        const dependencyField = Array.isArray(dependsOnRelationship.fields)
          ? dependsOnRelationship.fields[0]
          : dependsOnRelationship.fields;
          
        const dependencyValue = transformedDeps[dependencyField];
        
        // Construct a query parameter version
        const fieldEntityName = fieldName.replace(/Id$/, '');
        const baseUrl = `/api/masters/${fieldEntityName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        const queryParam = `${dependencyField}=${dependencyValue}`;
        endpoint = `${baseUrl}?${queryParam}`;
      }
      
      // Make the API request
      try {
        const response = await apiClient.get(endpoint);
        
        if (!response.data) {
          return [];
        }
        
        // Format the response data
        const { valueProperty = 'id', displayProperty = 'name' } = 
          dependsOnRelationship.entityConfig || {};
          
        return Array.isArray(response.data)
          ? response.data.map(item => ({
              label: item[displayProperty] || String(item),
              value: String(item[valueProperty] || item)
            }))
          : [];
      } catch (error) {
        console.error(`[useFieldRelationships] Error fetching options for ${fieldName}:`, error);
        return [];
      }
    };
  }, [relationships, debug]);
  
  // Setup form subscription
  useEffect(() => {
    if (!form || !dependentFields.length) return;
    
    // Create the subscription
    const subscription = form.watch((formValues, { name, type }) => {
      // Skip non-change events
      if (type !== 'change') return;
      if (!name) return;
      
      // Get all fields that depend on the changed field
      Object.entries(dependencyMap).forEach(([fieldName, dependencies]) => {
        if (dependencies.includes(name)) {
          // This field depends on the changed field
          const fieldDependencies: Record<string, any> = {};
          
          // Build dependencies object
          dependencies.forEach(dep => {
            fieldDependencies[dep] = formValues[dep];
          });
          
          // Handle the dependency change
          const hasChanged = haveDependenciesChanged(fieldName, fieldDependencies);
          
          if (hasChanged) {
            if (debug) {
              console.log(`[useFieldRelationships] Dependencies changed for ${fieldName}:`, fieldDependencies);
            }
            
            // Get field relationships to determine actions
            const fieldRelationships = relationships[fieldName] || [];
            const dependsOnRelationship = fieldRelationships.find(
              r => r.type === RelationshipType.DEPENDS_ON
            );
            
            if (!dependsOnRelationship) return;
            
            // Check if all dependencies are filled
            const allFilled = allDependenciesFilled(fieldName, fieldDependencies);
            
            // Reset field value if configured and dependencies changed
            const shouldReset = dependsOnRelationship.resetOnChange !== false;
            if (shouldReset && formValues[fieldName]) {
              form.setValue(fieldName, null);
              form.trigger(fieldName).catch(console.error);
            }
            
            // Invalidate query cache to trigger refetch
            if (allFilled) {
              // If we have all dependencies, invalidate the cache with debounce
              if (timeoutRefs.current[fieldName]) {
                clearTimeout(timeoutRefs.current[fieldName]!);
              }
              
              timeoutRefs.current[fieldName] = setTimeout(() => {
                const queryKey = ['fieldOptions', fieldName, Object.values(fieldDependencies).join('_')];
                queryClient.invalidateQueries({ queryKey });
                timeoutRefs.current[fieldName] = null;
              }, debounceMs);
            }
          }
        }
      });
    });
    
    // Clean up
    return () => {
      subscription.unsubscribe();
      
      // Clear any pending timeouts
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [
    form, 
    dependentFields, 
    dependencyMap, 
    relationships, 
    haveDependenciesChanged, 
    allDependenciesFilled, 
    queryClient, 
    debounceMs, 
    debug
  ]);
  
  // Get field options from API based on dependencies
  const getFieldOptions = useCallback((
    fieldName: string
  ) => {
    // Get current field dependencies
    const deps = dependencyMap[fieldName] || [];
    if (!deps.length) return { data: [], isLoading: false };
    
    // Get current values
    const dependencies: Record<string, any> = {};
    deps.forEach(dep => {
      dependencies[dep] = form.getValues(dep);
    });
    
    // Check if all dependencies are filled
    const allFilled = allDependenciesFilled(fieldName, dependencies);
    
    // Create query key including all dependency values
    const queryKey = [
      'fieldOptions', 
      fieldName, 
      Object.values(dependencies).join('_')
    ];
    
    // Create the fetcher function
    const fetcher = getFieldOptionsFetcher(fieldName, dependencies);
    
    // Return the query
    return useQuery({
      queryKey,
      queryFn: fetcher || (() => Promise.resolve([])),
      enabled: allFilled && !!fetcher,
      staleTime: cacheTime,
      gcTime: cacheTime,
      refetchOnWindowFocus: false,
    });
  }, [
    form, 
    dependencyMap, 
    allDependenciesFilled, 
    getFieldOptionsFetcher, 
    cacheTime
  ]);
  
  // Auto-select single option
  const autoSelectSingleOption = useCallback((
    fieldName: string,
    options: Array<{ label: string, value: string }>
  ) => {
    if (!options || options.length !== 1) return;
    
    // Get field relationships
    const fieldRelationships = relationships[fieldName] || [];
    const dependsOnRelationship = fieldRelationships.find(
      r => r.type === RelationshipType.DEPENDS_ON
    );
    
    if (!dependsOnRelationship) return;
    
    // Check if auto-select is enabled
    const shouldAutoSelect = dependsOnRelationship.display?.autoSelectSingleOption;
    if (!shouldAutoSelect) return;
    
    // Get current value
    const currentValue = form.getValues(fieldName);
    
    // Only auto-select if the field is empty or has a different value
    if (!currentValue || currentValue !== options[0].value) {
      if (debug) {
        console.log(`[useFieldRelationships] Auto-selecting only option for ${fieldName}:`, options[0]);
      }
      form.setValue(fieldName, options[0].value);
      form.trigger(fieldName).catch(console.error);
    }
  }, [form, relationships, debug]);
  
  // Check for single options and auto-select if needed
  useEffect(() => {
    dependentFields.forEach(fieldName => {
      const options = getFieldOptions(fieldName).data;
      if (options && options.length === 1) {
        autoSelectSingleOption(fieldName, options);
      }
    });
  }, [dependentFields, getFieldOptions, autoSelectSingleOption]);
  
  return {
    /**
     * Get field options for a dependent field
     */
    getFieldOptions,
    
    /**
     * Check if a field depends on another field
     */
    isDependentOn: useCallback((fieldName: string, dependencyName: string) => {
      const deps = dependencyMap[fieldName] || [];
      return deps.includes(dependencyName);
    }, [dependencyMap]),
    
    /**
     * Check if all dependencies for a field are filled
     */
    hasDependenciesFilled: useCallback((fieldName: string) => {
      const deps = dependencyMap[fieldName] || [];
      const dependencies: Record<string, any> = {};
      deps.forEach(dep => {
        dependencies[dep] = form.getValues(dep);
      });
      return allDependenciesFilled(fieldName, dependencies);
    }, [form, dependencyMap, allDependenciesFilled]),
    
    /**
     * Get dependency message for a field
     */
    getDependencyMessage: useCallback((fieldName: string) => {
      const fieldRelationships = relationships[fieldName] || [];
      const dependsOnRelationship = fieldRelationships.find(
        r => r.type === RelationshipType.DEPENDS_ON
      );
      
      if (!dependsOnRelationship) return '';
      
      // Get custom message if provided
      if (dependsOnRelationship.display?.placeholderMessage) {
        return dependsOnRelationship.display.placeholderMessage;
      }
      
      // Generate default message
      const deps = dependencyMap[fieldName] || [];
      const depLabels = deps.map(dep => {
        // Try to get a more readable field name
        return dep.replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace(/Id$/, '');
      });
      
      return `Select ${depLabels.join('/')} first`;
    }, [relationships, dependencyMap]),
    
    /**
     * Set field value and handle dependency effects
     */
    setFieldValue: useCallback((fieldName: string, value: any) => {
      form.setValue(fieldName, value);
      form.trigger(fieldName).catch(console.error);
      
      // Check if this field is a dependency for other fields
      Object.entries(dependencyMap).forEach(([depFieldName, deps]) => {
        if (deps.includes(fieldName) && relationships[depFieldName]) {
          const fieldRelationships = relationships[depFieldName] || [];
          const dependsOnRelationship = fieldRelationships.find(
            r => r.type === RelationshipType.DEPENDS_ON
          );
          
          if (dependsOnRelationship?.resetOnChange !== false) {
            form.setValue(depFieldName, null);
          }
        }
      });
    }, [form, dependencyMap, relationships]),
  };
}
