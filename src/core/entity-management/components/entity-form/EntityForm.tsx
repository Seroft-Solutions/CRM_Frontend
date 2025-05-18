"use client";

import React, {useCallback, useEffect, useRef} from 'react';
import {FormProvider as RHFFormProvider} from 'react-hook-form';
import {
  EntityFormActions,
  EntityFormContent,
  EntityFormDialog,
  EntityFormFooter,
  EntityFormHeader,
  EntityFormSheet
} from './components';
import {FormProvider} from './context';
import {useFormState} from './hooks';
import {EntityFormProps} from '../../types/entity-form';
import {EntityStore} from '../../store';
import {getVisibleSections} from './components/FormUtils';

export function EntityForm<TData = any>({
  // Modal state
  open,
  onClose,
  
  // Display configuration
  displayMode = 'dialog',
  
  // Form configuration
  formMode = 'view',
  onChangeFormMode,
  title,
  description,
  
  // Field configuration
  sections = [],
  fields = [],
  layout = 'default',
  
  // Data and callbacks
  data,
  onSubmit,
  onDelete,
  
  // Permissions
  canEdit = true,
  canDelete = true,
  
  // Form control
  form: externalForm,
  defaultValues = {},
  validationSchema,
  
  // UI states
  isSubmitting = false,
  submitError,
  
  // Custom rendering
  renderFooter,
  renderHeader,
  
  // Zustand store (optional)
  store
}: EntityFormProps<TData> & { store?: EntityStore<TData> }) {
  // Use form state hook
  const { form, setFormMode } = useFormState({
    defaultValues,
    validationSchema,
    externalForm
  });
  
  // Determine if we're using the store or props
  const isUsingStore = !!store;
  
  // Get state from either store or props
  const isOpen = isUsingStore ? store.getState().isModalOpen : open;
  const currentFormMode = isUsingStore ? store.getState().formMode : formMode;
  const currentData = isUsingStore ? store.getState().selectedItem : data;
  const currentSubmitting = isUsingStore ? store.getState().isSubmitting : isSubmitting;
  const currentSubmitError = isUsingStore ? store.getState().submitError : submitError;
  
  // Subscribe to store updates if using store
  const [storeState, setStoreState] = React.useState({
    isModalOpen: isUsingStore ? store.getState().isModalOpen : false,
    formMode: isUsingStore ? store.getState().formMode : 'view',
    selectedItem: isUsingStore ? store.getState().selectedItem : null,
    isSubmitting: isUsingStore ? store.getState().isSubmitting : false,
    submitError: isUsingStore ? store.getState().submitError : null
  });
  
  useEffect(() => {
    if (!isUsingStore) return;
    
    const unsubscribe = store.subscribe((state) => {
      setStoreState({
        isModalOpen: state.isModalOpen,
        formMode: state.formMode,
        selectedItem: state.selectedItem,
        isSubmitting: state.isSubmitting,
        submitError: state.submitError
      });
    });
    
    return () => unsubscribe();
  }, [isUsingStore, store]);
  
  // Get the sections to render
  const sectionsToRender = getVisibleSections(sections, fields, currentFormMode, currentData, layout);
  
  // Update form mode when changed externally
  useEffect(() => {
    if (!isUsingStore) {
      setFormMode(formMode);
    } else {
      setFormMode(storeState.formMode);
    }
  }, [formMode, storeState.formMode, setFormMode, isUsingStore]);
  
  // Reference to track whether the form has been initialized for the current session
  const formInitialized = useRef(false);
  
  // Manage form state with better cleanup handling
  useEffect(() => {
    // Skip if state is invalid
    console.log("Entity form effect - isOpen:", isOpen);
    if (typeof isOpen === 'undefined') return;
    
    // Create a mount tracker to prevent updates after unmount
    let isMounted = true;
    
    // Create safe reset function that checks mounting state
    const safeReset = (data, options = {}) => {
      if (isMounted) {
        try {
          console.log("Safe reset called with data:", Object.keys(data || {}));
          form.reset(data, options);
        } catch (e) {
          console.error('Form reset error:', e);
        }
      } else {
        console.log("Skipping reset - component unmounted");
      }
    };
    
    // Handle form closing - do cleanup AFTER all operations complete
    if (!isOpen) {
      console.log("Form closing - performing cleanup");
      
      // Mark form as uninitialized immediately
      formInitialized.current = false;
      
      // Reset form to empty state and return early
      const timeout = setTimeout(() => {
        if (isMounted) {
          safeReset({});
        }
      }, 100);
      
      return () => {
        clearTimeout(timeout);
        isMounted = false;
      };
    }
    
    // Handle form opening
    if (isOpen && !formInitialized.current) {
      console.log("Form opening - initializing");
      
      // Set initialization flag to prevent re-runs
      formInitialized.current = true;
      
      // Determine which data to load based on form mode
      const resetData = (() => {
        if (currentData && (currentFormMode === 'edit' || currentFormMode === 'view')) {
          console.log("Initializing form with currentData");
          // Format data properly for the form - ensure IDs are strings
          const formattedData = { ...currentData };
          
          Object.keys(formattedData).forEach(key => {
            if (key.endsWith('Id') && formattedData[key] !== null && formattedData[key] !== undefined) {
              formattedData[key] = String(formattedData[key]);
            }
          });
          
          return formattedData;
        } else if (currentFormMode === 'create') {
          console.log("Initializing form with defaultValues");
          return defaultValues || {};
        }
        
        return {};
      })();
      
      // Use setTimeout to ensure we're outside React's render cycle
      const timeout = setTimeout(() => {
        if (isMounted) {
          console.log("Resetting form with data", Object.keys(resetData));
          safeReset(resetData, { keepDefaultValues: false });
        }
      }, 100);
      
      return () => {
        clearTimeout(timeout);
        isMounted = false;
      };
    }
    
    // Clean up on unmount
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentFormMode, currentData, defaultValues, form]);
  
  // Ensure the form is marked as dirty when the user has filled in values
  useEffect(() => {
    if (isOpen && currentFormMode !== 'view') {
      // Mark form as dirty after a short delay if the user has entered values
      const timer = setTimeout(() => {
        const formValues = form.getValues();
        const hasValues = Object.keys(formValues).some(key => {
          const value = formValues[key];
          if (Array.isArray(value) && value.length > 0) return true;
          if (typeof value === 'string' && value.trim() !== '') return true;
          if (value !== null && value !== undefined && value !== '') return true;
          return false;
        });
        
        if (hasValues) {
          // Force the form to be marked as dirty
          console.log('Form has values, marking as dirty');
          
          // Find the first field that has a value and update it to trigger dirty state
          Object.keys(formValues).forEach(key => {
            const value = formValues[key];
            if (value !== null && value !== undefined && value !== '') {
              try {
                // Set the same value back to trigger isDirty
                form.setValue(key, value, { shouldDirty: true, shouldTouch: true });
              } catch (e) {
                console.error('Error setting form value:', e);
              }
            }
          });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentFormMode, form]);

  // Handle form submit - improved to handle all form submission scenarios
  const handleSubmit = form.handleSubmit(async (formData) => {
    if (isUsingStore) {
      store.setSubmitting(true);
    }
    
    try {
      // Execute the onSubmit function and await its completion
      const result = await onSubmit(formData);
      
      // Close dialog after successful submission
      if (currentFormMode === 'create' || currentFormMode === 'edit') {
        // Close dialog after form processing is complete
        // Wait a short delay to ensure all state updates have completed
        setTimeout(() => {
          if (isUsingStore) {
            store.closeModal();
          } else {
            onClose();
          }
        }, 100);
      }
      
      return result;
    } catch (error) {
      if (isUsingStore) {
        store.setSubmitError(error.message || 'An error occurred');
      }
      throw error;
    } finally {
      if (isUsingStore) {
        store.setSubmitting(false);
      }
    }
  });
  
  // Handle edit mode
  const handleEdit = () => {
    if (isUsingStore) {
      store.setFormMode('edit');
    } else if (onChangeFormMode) {
      onChangeFormMode('edit');
    }
  };
  
  // Handle modal close with completely redesigned closing mechanism
  const isClosingRef = useRef(false);
  const handleClose = useCallback(() => {
    console.log('EntityForm - handleClose called');
    
    // Critical - prevent any execution if already closing
    if (isClosingRef.current) {
      console.log('EntityForm - already closing, ignoring call');
      return;
    }
    
    // Set flag immediately to prevent any further calls during this closing cycle
    isClosingRef.current = true;
    
    // Break out of current event loop completely
    setTimeout(() => {
      try {
        // 1. Mark form as uninitialized first to prevent re-renders with stale data
        formInitialized.current = false;
        
        // 2. Use direct DOM manipulation to blur any active element to prevent focus issues
        if (typeof window !== 'undefined' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        // 3. After a small delay, reset the form state
        setTimeout(() => {
          try {
            // Clear form data
            form.reset({}, { 
              keepValues: false, 
              keepDefaultValues: false, 
              keepErrors: false, 
              keepDirty: false, 
              keepIsSubmitted: false, 
              keepTouched: false, 
              keepIsValid: false, 
              keepSubmitCount: false 
            });
            
            // 4. After form is reset, trigger actual close
            setTimeout(() => {
              if (isUsingStore) {
                store.closeModal();
              } else if (typeof onClose === 'function') {
                onClose();
              }
              
              // 5. Finally reset flag after a sufficient delay
              setTimeout(() => {
                isClosingRef.current = false;
              }, 500);
            }, 50);
          } catch (err) {
            console.error('Error during form reset in handleClose:', err);
            // Even if form reset fails, still close the form
            if (isUsingStore) {
              store.closeModal();
            } else if (typeof onClose === 'function') {
              onClose();
            }
            isClosingRef.current = false;
          }
        }, 50);
      } catch (err) {
        console.error('Error in handleClose:', err);
        isClosingRef.current = false;
      }
    }, 0);
  }, [isUsingStore, store, onClose, form]);
  
  // Choose container based on display mode
  const FormContainer = displayMode === 'sheet' ? EntityFormSheet : EntityFormDialog;
  
  // Determine if we should use the tabbed layout
  const useTabbedLayout = sectionsToRender.length > 1;
  
  return (
    <FormContainer
      open={isOpen}
      onClose={handleClose}
    >
      <FormProvider
        form={form}
        formMode={currentFormMode}
        data={currentData}
        onSubmit={handleSubmit}
        onEdit={handleEdit}
        onClose={handleClose}
        onDelete={onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        isSubmitting={currentSubmitting}
      >
        <RHFFormProvider {...form}>
        <EntityFormHeader
          formMode={currentFormMode}
          title={title}
          description={description}
          data={currentData}
          renderHeader={renderHeader}
        />
        
        <div className={`
          ${useTabbedLayout ? 'p-0 flex-1 flex flex-col' : 'px-6 py-6'} 
          ${displayMode === 'sheet' ? 'flex-1 overflow-y-auto' : 'max-h-[calc(100vh-220px)] overflow-y-auto'} 
          ${!useTabbedLayout ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}
        `}>
          <EntityFormContent
            formMode={currentFormMode}
            displayMode={displayMode}
            sections={sectionsToRender}
            fields={fields}
            layout={layout}
            data={currentData}
            form={form}
            submitError={currentSubmitError}
            onSubmit={handleSubmit}
          />
        </div>
        
        {/* Show appropriate footer based on tabbed or regular layout */}
        {useTabbedLayout ? (
          <EntityFormActions
            formMode={currentFormMode}
            isSubmitting={currentSubmitting}
            onCancel={handleClose}
            onSubmit={handleSubmit}
            form={form}
            sections={sectionsToRender}
          />
        ) : (
          <EntityFormFooter
            formMode={currentFormMode}
            isSubmitting={currentSubmitting}
            onClose={handleClose}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onDelete={onDelete}
            data={currentData}
            canEdit={canEdit}
            canDelete={canDelete}
            renderFooter={renderFooter}
            sections={sectionsToRender}
          />
        )}
        </RHFFormProvider>
      </FormProvider>
    </FormContainer>
  );
}
