// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import { toast } from "sonner";

// Toast notification utilities for UserAvailability
export const userAvailabilityToast = {
  // Success messages
  created: (entityName?: string) => 
    toast.success("✅ Success!", {
      description: `${entityName || 'User Availability'} created successfully`,
      action: {
        label: "View",
        onClick: () => window.location.href = "/user-availabilities"
      }
    }),
    
  updated: (entityName?: string) => 
    toast.success("✅ Updated!", {
      description: `${entityName || 'User Availability'} updated successfully`,
      action: {
        label: "View All",
        onClick: () => window.location.href = "/user-availabilities"
      }
    }),
    
  deleted: (entityName?: string) => 
    toast.success("🗑️ Deleted!", {
      description: `${entityName || 'User Availability'} deleted successfully`
    }),
    
  bulkDeleted: (count: number) => 
    toast.success("🗑️ Bulk Delete!", {
      description: `${count} user availabilities deleted successfully`
    }),
    
  relationshipUpdated: (relationshipName: string) => 
    toast.success("🔗 Updated!", {
      description: `${relationshipName} updated successfully`,
      duration: 2000, // Shorter duration for less interruption
    }),
    
  exported: (format: string) => 
    toast.success("📤 Exported!", {
      description: `User Availabilities exported to ${format} successfully`
    }),
    
  imported: (count: number) => 
    toast.success("📥 Imported!", {
      description: `${count} user availabilities imported successfully`
    }),

  // Error messages
  createError: (error?: string) => 
    toast.error("❌ Creation Failed", {
      description: error || `Failed to create useravailability. Please try again.`,
      action: {
        label: "Retry",
        onClick: () => window.location.reload()
      }
    }),
    
  updateError: (error?: string) => 
    toast.error("❌ Update Failed", {
      description: error || `Failed to update useravailability. Please try again.`,
      action: {
        label: "Retry",
        onClick: () => window.location.reload()
      }
    }),
    
  deleteError: (error?: string) => 
    toast.error("❌ Delete Failed", {
      description: error || `Failed to delete useravailability. Please try again.`
    }),
    
  bulkDeleteError: (error?: string) => 
    toast.error("❌ Bulk Delete Failed", {
      description: error || `Failed to delete selected user availabilities. Please try again.`
    }),
    
  validationError: (fields?: string[]) => 
    toast.error("⚠️ Validation Error", {
      description: fields?.length ? 
        `Please check: ${fields.join(', ')}` : 
        "Please check your input and try again."
    }),
    
  permissionError: () => 
    toast.error("🚫 Permission Denied", {
      description: "You don't have permission to perform this action."
    }),
    
  networkError: () => 
    toast.error("🌐 Network Error", {
      description: "Please check your internet connection and try again.",
      action: {
        label: "Retry",
        onClick: () => window.location.reload()
      }
    }),

  // Warning messages  
  unsavedChanges: () => 
    toast.warning("⚠️ Unsaved Changes", {
      description: "You have unsaved changes. Save or they will be lost.",
      duration: 6000
    }),
    
  formRestored: () => 
    toast.success("🔄 Form Restored", {
      description: "Your previous form data has been restored."
    }),
    
  duplicateWarning: (field: string) => 
    toast.warning("⚠️ Duplicate Found", {
      description: `${field} already exists. Please use a different value.`
    }),

  // Info messages
  loading: (action: string) => 
    toast.loading(`${action}...`, {
      description: "Please wait while we process your request."
    }),
    
  processingBulk: (count: number, action: string) => 
    toast.loading(`${action} ${count} items...`, {
      description: "This may take a few moments."
    }),
    
  refreshing: () => 
    toast.loading("🔄 Refreshing...", {
      description: "Updating data from server."
    }),

  // Custom actions
  custom: {
    success: (title: string, description: string, action?: { label: string; onClick: () => void }) => 
      toast.success(title, { description, action }),
      
    error: (title: string, description: string, action?: { label: string; onClick: () => void }) => 
      toast.error(title, { description, action }),
      
    warning: (title: string, description: string) => 
      toast.warning(title, { description }),
      
    info: (title: string, description: string) => 
      toast.info(title, { description })
  }
};

// Helper function to handle API errors with toast
export const handleUserAvailabilityError = (error: any) => {
  const errorMessage = error?.response?.data?.message || 
                      error?.message || 
                      'An unexpected error occurred';
  
  if (error?.response?.status === 403) {
    userAvailabilityToast.permissionError();
  } else if (error?.response?.status === 422) {
    const validationErrors = error?.response?.data?.fieldErrors;
    const fields = validationErrors ? Object.keys(validationErrors) : [];
    userAvailabilityToast.validationError(fields);
  } else if (error?.code === 'NETWORK_ERROR') {
    userAvailabilityToast.networkError();
  } else {
    toast.error("❌ Error", {
      description: errorMessage,
      action: {
        label: "Report",
        onClick: () => console.error('Error details:', error)
      }
    });
  }
};
