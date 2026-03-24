import { toast } from 'sonner';

type CustomerErrorPayload = {
  title?: string;
  detail?: string;
  message?: string;
  fieldErrors?: unknown;
};

type CustomerError = {
  response?: {
    status?: number;
    data?: CustomerErrorPayload;
  };
  status?: number;
  data?: CustomerErrorPayload;
  code?: string;
  message?: string;
};

const GENERIC_ERROR_TITLES = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Conflict',
  'Internal Server Error',
]);

const getCustomerErrorPayload = (error: unknown): CustomerErrorPayload | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const customerError = error as CustomerError;

  return customerError.response?.data ?? customerError.data;
};

const getCustomerErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const customerError = error as CustomerError;

  return customerError.response?.status ?? customerError.status;
};

const extractFieldNames = (fieldErrors: unknown): string[] => {
  if (Array.isArray(fieldErrors)) {
    return fieldErrors
      .map((fieldError) => {
        if (typeof fieldError === 'object' && fieldError !== null && 'field' in fieldError) {
          return String(fieldError.field);
        }

        return null;
      })
      .filter((field): field is string => Boolean(field));
  }

  if (typeof fieldErrors === 'object' && fieldErrors !== null) {
    return Object.keys(fieldErrors);
  }

  return [];
};

const getMeaningfulTitle = (title?: string): string | undefined => {
  if (!title) {
    return undefined;
  }

  return GENERIC_ERROR_TITLES.has(title) ? undefined : title;
};

export const extractCustomerErrorMessage = (
  error: unknown,
  fallback = 'An unexpected error occurred'
): string => {
  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const customerError = error as CustomerError;
    const errorPayload = getCustomerErrorPayload(error);
    const payloadMessage =
      getMeaningfulTitle(errorPayload?.title) ||
      errorPayload?.detail ||
      (errorPayload?.message && !errorPayload.message.startsWith('error.')
        ? errorPayload.message
        : undefined);

    return payloadMessage || customerError.message || fallback;
  }

  return fallback;
};

export const customerToast = {
  created: (entityName?: string) =>
    toast.success('✅ Success!', {
      description: `${entityName || 'Customer'} created successfully`,
      action: {
        label: 'View',
        onClick: () => (window.location.href = '/customers'),
      },
    }),

  updated: (entityName?: string) =>
    toast.success('✅ Updated!', {
      description: `${entityName || 'Customer'} updated successfully`,
      action: {
        label: 'View All',
        onClick: () => (window.location.href = '/customers'),
      },
    }),

  deleted: (entityName?: string) =>
    toast.success('🗑️ Deleted!', {
      description: `${entityName || 'Customer'} deleted successfully`,
    }),

  bulkDeleted: (count: number) =>
    toast.success('🗑️ Bulk Delete!', {
      description: `${count} customers deleted successfully`,
    }),

  relationshipUpdated: (relationshipName: string) =>
    toast.success('🔗 Updated!', {
      description: `${relationshipName} updated successfully`,
      duration: 2000,
    }),

  exported: (format: string) =>
    toast.success('📤 Exported!', {
      description: `Customers exported to ${format} successfully`,
    }),

  imported: (count: number) =>
    toast.success('📥 Imported!', {
      description: `${count} customers imported successfully`,
    }),

  createError: (error?: unknown) =>
    toast.error('❌ Creation Failed', {
      description: extractCustomerErrorMessage(
        error,
        'Failed to create customer. Please try again.'
      ),
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    }),

  updateError: (error?: unknown) =>
    toast.error('❌ Update Failed', {
      description: extractCustomerErrorMessage(
        error,
        'Failed to update customer. Please try again.'
      ),
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    }),

  deleteError: (error?: unknown) =>
    toast.error('❌ Delete Failed', {
      description: extractCustomerErrorMessage(
        error,
        'Failed to delete customer. Please try again.'
      ),
    }),

  bulkDeleteError: (error?: unknown) =>
    toast.error('❌ Bulk Delete Failed', {
      description: extractCustomerErrorMessage(
        error,
        'Failed to delete selected customers. Please try again.'
      ),
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

export const handleCustomerError = (error: unknown) => {
  const customerError = (error ?? {}) as CustomerError;
  const errorMessage = extractCustomerErrorMessage(error);

  if (getCustomerErrorStatus(error) === 403) {
    customerToast.permissionError();
  } else if (getCustomerErrorStatus(error) === 422) {
    const validationErrors = getCustomerErrorPayload(error)?.fieldErrors;
    const fields = extractFieldNames(validationErrors);

    customerToast.validationError(fields);
  } else if (customerError.code === 'NETWORK_ERROR' || customerError.code === 'ERR_NETWORK') {
    customerToast.networkError();
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
