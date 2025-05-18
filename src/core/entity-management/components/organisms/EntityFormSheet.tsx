import React, { useState, useRef, useCallback } from 'react';
import { EntityForm } from '../entity-form/EntityForm';
import { useEntityManager } from '../../context';
import { BaseEntity, FormMode } from '@/features/core/tanstack-query-api';
import { FieldConfig, SectionConfig } from '../../types';

interface EntityFormSheetProps<TData extends BaseEntity = any> {
  open: boolean;
  formMode: FormMode;
  onClose: () => void;
  onChangeFormMode: (mode: FormMode) => void;
  formFields?: FieldConfig[];
  formSections?: SectionConfig[];
  defaultValues?: Partial<TData>;
  formProps?: any;
  validationSchema?: any;
  isSubmitting?: boolean;
  showDeleteInViewMode?: boolean;
}

/**
 * Sheet-style form for entity management
 */
export function EntityFormSheet<TData extends BaseEntity = any>({
  open,
  formMode,
  onClose,
  onChangeFormMode,
  formFields,
  formSections,
  defaultValues,
  formProps,
  validationSchema,
  isSubmitting = false,
  showDeleteInViewMode = false,
}: EntityFormSheetProps<TData>) {
  const {
    entityApi,
    labels,
    canUpdate,
    canDelete,
  } = useEntityManager<TData>();
  
  const [error, setError] = useState<string | null>(null);
  const closeHandlingRef = useRef(false);
  
  // Handle submit
  const handleSubmit = async (formData: any) => {
    try {
      setError(null);
      const result = await entityApi.handleSubmit(formData);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
  
  // Handle delete
  const handleDelete = (id: string | number) => {
    return entityApi.delete(id);
  };
  
  // Handle close with guard against multiple executions
  const safeOnClose = useCallback(() => {
    if (closeHandlingRef.current) return;
    closeHandlingRef.current = true;
    
    // Call the original onClose
    onClose();
    
    // Reset flag after delay
    setTimeout(() => {
      closeHandlingRef.current = false;
    }, 500);
  }, [onClose]);
  
  return (
    <EntityForm
      open={open}
      onClose={safeOnClose}
      displayMode="sheet"
      formMode={formMode}
      onChangeFormMode={onChangeFormMode}
      title={formMode === 'create' 
        ? labels.createTitle || `Create ${labels.entityName}`
        : formMode === 'edit' 
          ? labels.editTitle || `Edit ${labels.entityName}`
          : labels.viewTitle || `${labels.entityName} Details`
      }
      description={formMode === 'create' 
        ? labels.createDescription
        : formMode === 'edit' 
          ? labels.editDescription
          : labels.viewDescription
      }
      fields={formFields}
      sections={formSections}
      data={entityApi.selectedItem}
      onSubmit={handleSubmit}
      onDelete={canDelete && (formMode !== 'view' || showDeleteInViewMode) ? 
        handleDelete : undefined}
      canEdit={canUpdate}
      canDelete={canDelete && (formMode !== 'view' || showDeleteInViewMode)}
      defaultValues={defaultValues}
      validationSchema={validationSchema}
      isSubmitting={isSubmitting || entityApi.isCreating || entityApi.isUpdating}
      submitError={error}
      {...formProps}
    />
  );
}
