import { axiosInstance } from '../client/axios-client';

/**
 * Options for file upload
 */
export interface FileUploadOptions {
  /**
   * URL endpoint for the file upload
   */
  url: string;

  /**
   * File to upload
   */
  file: File;

  /**
   * Field name for the file in the form data
   */
  fieldName?: string;

  /**
   * Additional form data fields
   */
  additionalData?: Record<string, string | Blob>;

  /**
   * Function to track upload progress
   */
  onProgress?: (percentage: number) => void;

  /**
   * Headers to include in the request
   */
  headers?: Record<string, string>;
}

/**
 * Utility function to handle file uploads with progress tracking
 */
export async function uploadFile<T = any>({
  url,
  file,
  fieldName = 'file',
  additionalData = {},
  onProgress,
  headers = {},
}: FileUploadOptions): Promise<T> {
  // Create form data
  const formData = new FormData();
  formData.append(fieldName, file);

  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  // Make request with progress tracking
  const response = await axiosInstance.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...headers,
    },
    onUploadProgress: onProgress
      ? progressEvent => {
          const percentage = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress(percentage);
        }
      : undefined,
  });

  return response.data;
}

/**
 * Utility function to handle multiple file uploads with progress tracking
 */
export async function uploadMultipleFiles<T = any>({
  url,
  files,
  fieldName = 'files',
  additionalData = {},
  onProgress,
  headers = {},
}: Omit<FileUploadOptions, 'file'> & { files: File[] }): Promise<T> {
  // Create form data
  const formData = new FormData();

  // Append each file with the same field name
  files.forEach(file => {
    formData.append(fieldName, file);
  });

  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  // Make request with progress tracking
  const response = await axiosInstance.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...headers,
    },
    onUploadProgress: onProgress
      ? progressEvent => {
          const percentage = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress(percentage);
        }
      : undefined,
  });

  return response.data;
}
