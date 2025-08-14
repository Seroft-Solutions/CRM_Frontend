/**
 * FIXED: Enhanced error handling for call deletion with constraint violations
 *
 * This utility provides better error handling for database constraint violations
 * and gives users clear guidance on how to resolve them.
 */

import { toast } from 'sonner';

export interface ConstraintViolationError {
  type: 'constraint_violation';
  entity: string;
  constraintType: 'foreign_key' | 'unique' | 'check' | 'not_null';
  relatedEntities: string[];
  message: string;
  userMessage: string;
  suggestedActions: string[];
}

export interface DeleteOperationResult {
  success: boolean;
  error?: ConstraintViolationError | Error;
  message: string;
}

/**
 * Enhanced error handler for call deletion operations
 */
export class CallDeletionErrorHandler {
  /**
   * Parse error response and determine if it's a constraint violation
   */
  static parseError(error: any): ConstraintViolationError | Error {
    // Check if it's a 500 error with constraint violation indicators
    if (error.status === 500 && error.response?.data?.detail) {
      const detail = error.response.data.detail;

      // Check for common constraint violation patterns
      if (detail.includes('Failure during data access')) {
        return {
          type: 'constraint_violation',
          entity: 'Call',
          constraintType: 'foreign_key',
          relatedEntities: ['Call Remarks', 'Call Attachments'],
          message: detail,
          userMessage: 'This call cannot be deleted because it has associated data.',
          suggestedActions: [
            'Delete all call remarks first',
            'Remove any attachments from this call',
            'Archive the call instead of deleting it',
          ],
        };
      }
    }

    // Check for specific constraint violation keywords
    if (error.message && typeof error.message === 'string') {
      const message = error.message.toLowerCase();

      if (message.includes('foreign key') || message.includes('constraint violation')) {
        return {
          type: 'constraint_violation',
          entity: 'Call',
          constraintType: 'foreign_key',
          relatedEntities: ['Related Records'],
          message: error.message,
          userMessage: 'This call has related data that prevents deletion.',
          suggestedActions: ['Remove related data first', 'Contact administrator for assistance'],
        };
      }

      if (message.includes('cannot delete') || message.includes('still referenced')) {
        return {
          type: 'constraint_violation',
          entity: 'Call',
          constraintType: 'foreign_key',
          relatedEntities: ['Referenced Records'],
          message: error.message,
          userMessage: 'This call is referenced by other records.',
          suggestedActions: [
            'Remove references to this call first',
            'Use archive function instead',
          ],
        };
      }
    }

    // Return as generic error if not a constraint violation
    return error;
  }

  /**
   * Handle call deletion with proper constraint violation handling
   */
  static async handleCallDeletion(
    callId: string | number,
    deleteOperation: () => Promise<void>
  ): Promise<DeleteOperationResult> {
    try {
      await deleteOperation();

      return {
        success: true,
        message: 'Call deleted successfully',
      };
    } catch (error: any) {
      const parsedError = this.parseError(error);

      if (parsedError.type === 'constraint_violation') {
        // Show detailed error message for constraint violations
        toast.error(parsedError.userMessage, {
          description: 'Please see suggested actions below',
          duration: 8000,
          action: {
            label: 'Show Details',
            onClick: () => this.showConstraintViolationDetails(parsedError),
          },
        });

        return {
          success: false,
          error: parsedError,
          message: parsedError.userMessage,
        };
      } else {
        // Handle generic errors
        const errorMessage = error.message || 'Failed to delete call';
        toast.error('Delete Operation Failed', {
          description: errorMessage,
          duration: 5000,
        });

        return {
          success: false,
          error: parsedError,
          message: errorMessage,
        };
      }
    }
  }

  /**
   * Show detailed constraint violation information in a modal or detailed toast
   */
  private static showConstraintViolationDetails(error: ConstraintViolationError) {
    const detailsMessage = `
      **Cannot Delete Call**
      
      **Reason:** ${error.userMessage}
      
      **Related Data:** ${error.relatedEntities.join(', ')}
      
      **Suggested Actions:**
      ${error.suggestedActions.map((action) => `• ${action}`).join('\n')}
      
      **Technical Details:** ${error.message}
    `;

    toast.info('Deletion Requirements', {
      description: detailsMessage,
      duration: 15000,
    });
  }

  /**
   * Check if a call can be deleted by validating related data
   */
  static async validateCallDeletion(callId: string | number): Promise<{
    canDelete: boolean;
    blockers: string[];
    suggestions: string[];
  }> {
    try {
      // Check for call remarks
      const response = await fetch(`/api/calls/${callId}/validation`, {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        // If validation endpoint doesn't exist, assume deletion is allowed
        return {
          canDelete: true,
          blockers: [],
          suggestions: [],
        };
      }
    } catch (error) {
      console.warn('Call deletion validation failed:', error);
      // If validation fails, allow deletion but warn user
      return {
        canDelete: true,
        blockers: [],
        suggestions: ['Deletion validation unavailable - proceed with caution'],
      };
    }
  }

  /**
   * Safe delete with pre-validation
   */
  static async safeDeleteCall(
    callId: string | number,
    deleteOperation: () => Promise<void>
  ): Promise<DeleteOperationResult> {
    // First validate if deletion is possible
    const validation = await this.validateCallDeletion(callId);

    if (!validation.canDelete) {
      toast.warning('Cannot Delete Call', {
        description: `Blocked by: ${validation.blockers.join(', ')}`,
        duration: 8000,
        action: {
          label: 'Show Solutions',
          onClick: () => {
            toast.info('Suggested Solutions', {
              description: validation.suggestions.join('\n• '),
              duration: 10000,
            });
          },
        },
      });

      return {
        success: false,
        message: `Cannot delete: ${validation.blockers.join(', ')}`,
      };
    }

    // Proceed with deletion if validation passes
    return this.handleCallDeletion(callId, deleteOperation);
  }
}

/**
 * React hook for call deletion with enhanced error handling
 */
export function useCallDeletion() {
  const deleteCall = async (
    callId: string | number,
    deleteOperation: () => Promise<void>,
    options: {
      showConfirmation?: boolean;
      validateBeforeDelete?: boolean;
    } = {}
  ): Promise<DeleteOperationResult> => {
    const { showConfirmation = true, validateBeforeDelete = true } = options;

    // Show confirmation dialog if requested
    if (showConfirmation) {
      const confirmed = window.confirm(
        'Are you sure you want to delete this call? This action cannot be undone.'
      );

      if (!confirmed) {
        return {
          success: false,
          message: 'Deletion cancelled by user',
        };
      }
    }

    // Use safe delete with validation if requested
    if (validateBeforeDelete) {
      return CallDeletionErrorHandler.safeDeleteCall(callId, deleteOperation);
    } else {
      return CallDeletionErrorHandler.handleCallDeletion(callId, deleteOperation);
    }
  };

  const deleteCallWithRemarks = async (
    callId: string | number,
    deleteOperation: () => Promise<void>
  ): Promise<DeleteOperationResult> => {
    // Special handling for calls with remarks
    const confirmed = window.confirm(
      'This call has remarks or other related data. Are you sure you want to delete it? ' +
        'Consider archiving instead of deleting to preserve data relationships.'
    );

    if (!confirmed) {
      return {
        success: false,
        message: 'Deletion cancelled by user',
      };
    }

    return CallDeletionErrorHandler.handleCallDeletion(callId, deleteOperation);
  };

  return {
    deleteCall,
    deleteCallWithRemarks,
    validateDeletion: CallDeletionErrorHandler.validateCallDeletion,
  };
}

/**
 * Generic constraint violation handler for other entities
 */
export function useConstraintViolationHandler() {
  const handleConstraintViolation = (
    error: any,
    entityType: string,
    entityId: string | number
  ): DeleteOperationResult => {
    const parsedError = CallDeletionErrorHandler.parseError(error);

    if (parsedError.type === 'constraint_violation') {
      const constraintError = parsedError as ConstraintViolationError;
      constraintError.entity = entityType;

      toast.error(`Cannot delete ${entityType.toLowerCase()}`, {
        description: constraintError.userMessage,
        duration: 8000,
        action: {
          label: 'Show Help',
          onClick: () => {
            toast.info(`${entityType} Deletion Help`, {
              description: constraintError.suggestedActions.join('\n• '),
              duration: 10000,
            });
          },
        },
      });

      return {
        success: false,
        error: constraintError,
        message: constraintError.userMessage,
      };
    }

    // Handle as generic error
    const errorMessage = error.message || `Failed to delete ${entityType.toLowerCase()}`;
    toast.error('Delete Operation Failed', {
      description: errorMessage,
      duration: 5000,
    });

    return {
      success: false,
      error: parsedError,
      message: errorMessage,
    };
  };

  return { handleConstraintViolation };
}
