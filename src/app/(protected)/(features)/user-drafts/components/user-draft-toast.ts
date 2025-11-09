import { toast } from 'sonner';

export const userDraftToast = {
  created: (entityName?: string) =>
    toast.success('✅ Success!', {
      description: `${entityName || 'User Draft'} created successfully`,
      action: {
        label: 'View',
        onClick: () => (window.location.href = '/user-drafts'),
      },
    }),

  updated: (entityName?: string) =>
    toast.success('✅ Updated!', {
      description: `${entityName || 'User Draft'} updated successfully`,
      action: {
        label: 'View All',
        onClick: () => (window.location.href = '/user-drafts'),
      },
    }),

  deleted: (entityName?: string) =>
    toast.success('🗑️ Deleted!', {
      description: `${entityName || 'User Draft'} deleted successfully`,
    }),

  bulkDeleted: (count: number) =>
    toast.success('🗑️ Bulk Delete!', {
      description: `${count} user drafts deleted successfully`,
    }),

  relationshipUpdated: (relationshipName: string) =>
    toast.success('🔗 Updated!', {
      description: `${relationshipName} updated successfully`,
      duration: 2000,
    }),

  exported: (format: string) =>
    toast.success('📤 Exported!', {
      description: `User Drafts exported to ${format} successfully`,
    }),

  imported: (count: number) =>
    toast.success('📥 Imported!', {
      description: `${count} user drafts imported successfully`,
    }),

  createError: (error?: string) =>
    toast.error('❌ Creation Failed', {
      description: error || `Failed to create userdraft. Please try again.`,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    }),

  updateError: (error?: string) =>
    toast.error('❌ Update Failed', {
      description: error || `Failed to update userdraft. Please try again.`,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    }),

  deleteError: (error?: string) =>
    toast.error('❌ Delete Failed', {
      description: error || `Failed to delete userdraft. Please try again.`,
    }),

  bulkDeleteError: (error?: string) =>
    toast.error('❌ Bulk Delete Failed', {
      description: error || `Failed to delete selected user drafts. Please try again.`,
    }),

  validationError: (fields?: string[]) =>
    toast.error('⚠️ Validation Error', {
      description: fields?.length
        ? `Please check: ${fields.join(', ')}`
        : 'Please check your input and try again.',
    }),

  permissionError: () =>
    toast.error('🚫 Permission Denied', {
      description: "You don't have permission to perform this action.",
    }),

  networkError: () =>
    toast.error('🌐 Network Error', {
      description: 'Please check your internet connection and try again.',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    }),

  unsavedChanges: () =>
    toast.warning('⚠️ Unsaved Changes', {
      description: 'You have unsaved changes. Save or they will be lost.',
      duration: 6000,
    }),

  formRestored: () =>
    toast.success('🔄 Form Restored', {
      description: 'Your previous form data has been restored.',
    }),

  duplicateWarning: (field: string) =>
    toast.warning('⚠️ Duplicate Found', {
      description: `${field} already exists. Please use a different value.`,
    }),

  loading: (action: string) =>
    toast.loading(`${action}...`, {
      description: 'Please wait while we process your request.',
    }),

  processingBulk: (count: number, action: string) =>
    toast.loading(`${action} ${count} items...`, {
      description: 'This may take a few moments.',
    }),

  refreshing: () =>
    toast.loading('🔄 Refreshing...', {
      description: 'Updating data from server.',
    }),

  custom: {
    success: (
      title: string,
      description: string,
      action?: { label: string; onClick: () => void }
    ) => toast.success(title, { description, action }),

    error: (title: string, description: string, action?: { label: string; onClick: () => void }) =>
      toast.error(title, { description, action }),

    warning: (title: string, description: string) => toast.warning(title, { description }),

    info: (title: string, description: string) => toast.info(title, { description }),
  },
};

export const handleUserDraftError = (error: any) => {
  const errorMessage =
    error?.response?.data?.message || error?.message || 'An unexpected error occurred';

  if (error?.response?.status === 403) {
    userDraftToast.permissionError();
  } else if (error?.response?.status === 422) {
    const validationErrors = error?.response?.data?.fieldErrors;
    const fields = validationErrors ? Object.keys(validationErrors) : [];
    userDraftToast.validationError(fields);
  } else if (error?.code === 'NETWORK_ERROR') {
    userDraftToast.networkError();
  } else {
    toast.error('❌ Error', {
      description: errorMessage,
      action: {
        label: 'Report',
        onClick: () => console.error('Error details:', error),
      },
    });
  }
};
