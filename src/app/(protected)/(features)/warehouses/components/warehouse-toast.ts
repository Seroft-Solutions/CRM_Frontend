import { toast } from 'sonner';

const getErrorDescription = (error: unknown, fallback: string): string => {
  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { title?: string; detail?: string; message?: string } };
      message?: string;
    };

    const serverMessage =
      maybeAxiosError.response?.data?.title ||
      maybeAxiosError.response?.data?.detail ||
      maybeAxiosError.response?.data?.message;

    if (serverMessage) {
      return serverMessage;
    }

    if (maybeAxiosError.message) {
      return maybeAxiosError.message;
    }
  }

  return fallback;
};

export const warehouseToast = {
  created: () =>
    toast.success('Warehouse created', {
      description: 'The warehouse was created successfully.',
    }),

  updated: () =>
    toast.success('Warehouse updated', {
      description: 'The warehouse was updated successfully.',
    }),

  deleted: () =>
    toast.success('Warehouse deleted', {
      description: 'The warehouse was deleted successfully.',
    }),

  createError: (error?: unknown) =>
    toast.error('Create failed', {
      description: getErrorDescription(error, 'Unable to create warehouse.'),
    }),

  updateError: (error?: unknown) =>
    toast.error('Update failed', {
      description: getErrorDescription(error, 'Unable to update warehouse.'),
    }),

  deleteError: (error?: unknown) =>
    toast.error('Delete failed', {
      description: getErrorDescription(error, 'Unable to delete warehouse.'),
    }),
};
