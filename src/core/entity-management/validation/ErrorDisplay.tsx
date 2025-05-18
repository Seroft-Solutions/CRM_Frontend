import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { XCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Type definition for an API error
 */
export interface ApiError {
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code?: string;
  
  /**
   * HTTP status code
   */
  status?: number;
  
  /**
   * Field-specific errors
   */
  fieldErrors?: Record<string, string>;
  
  /**
   * Raw error response
   */
  raw?: any;
}

/**
 * Props for the ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /**
   * Error object or message
   */
  error: ApiError | string;
  
  /**
   * Error title
   */
  title?: string;
  
  /**
   * Show retry button
   */
  showRetry?: boolean;
  
  /**
   * Show stack trace
   */
  showStackTrace?: boolean;
  
  /**
   * Retry handler
   */
  onRetry?: () => void;
  
  /**
   * Dismiss handler
   */
  onDismiss?: () => void;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Whether to show field errors
   */
  showFieldErrors?: boolean;
}

/**
 * Component to display API errors
 */
export function ErrorDisplay({
  error,
  title = 'Error',
  showRetry = false,
  showStackTrace = false,
  onRetry,
  onDismiss,
  className,
  showFieldErrors = false,
}: ErrorDisplayProps) {
  // Parse the error
  const errorObj = typeof error === 'string' ? { message: error } : error;
  
  // Get field errors
  const fieldErrors = errorObj.fieldErrors || {};
  
  // Get error severity based on status code
  const getSeverity = () => {
    if (!errorObj.status) return 'error';
    
    if (errorObj.status >= 500) return 'error'; // Server errors
    if (errorObj.status >= 400) return 'warning'; // Client errors
    return 'info'; // Informational
  };
  
  const severity = getSeverity();
  
  // Get icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  return (
    <Alert 
      variant={severity === 'error' ? 'destructive' : 'default'}
      className={cn('relative', className)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="ml-3 flex-grow">
          <AlertTitle className="text-base font-medium">
            {title}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {errorObj.message}
            
            {/* Field errors */}
            {showFieldErrors && Object.keys(fieldErrors).length > 0 && (
              <ul className="mt-2 text-sm space-y-1">
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field} className="flex items-start">
                    <span className="font-medium mr-1">{field}:</span> {message}
                  </li>
                ))}
              </ul>
            )}
            
            {/* Stack trace */}
            {showStackTrace && errorObj.raw?.stack && (
              <pre className="mt-2 text-xs overflow-auto p-2 bg-muted rounded-md max-h-32">
                {errorObj.raw.stack}
              </pre>
            )}
          </AlertDescription>
          
          {/* Action buttons */}
          {(showRetry || onDismiss) && (
            <div className="mt-3 flex justify-end space-x-2">
              {onDismiss && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
              
              {showRetry && onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
