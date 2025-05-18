import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  loggerContext?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch and handle errors in React components
 * Wraps children components and displays a fallback UI when an error occurs
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private boundaryLogger: typeof logger;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    
    // Create a logger for this error boundary
    this.boundaryLogger = logger.createContext(props.loggerContext || 'ErrorBoundary');
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    this.boundaryLogger.error('Error caught by ErrorBoundary:', error.message, {
      error,
      componentStack: errorInfo.componentStack
    });
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Reset error state when props change if resetOnPropsChange is true
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.boundaryLogger.info('Resetting error state due to props change');
      this.setState({
        hasError: false,
        error: null
      });
    }
  }

  // Handler to reset the error state
  resetErrorState = (): void => {
    this.boundaryLogger.info('Manually resetting error state');
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              type="button" // Explicitly set type to prevent form submission
            >
              Reload Page
            </Button>
            <Button 
              onClick={this.resetErrorState}
              type="button" // Explicitly set type to prevent form submission
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap a component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {}
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

export default ErrorBoundary;