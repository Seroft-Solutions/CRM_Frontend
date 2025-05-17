/**
 * ErrorMessage component
 *
 * A reusable error message component.
 */
import React from 'react';
import { colors } from '../../design-system/tokens/colors';

export interface ErrorMessageProps {
  /**
   * The error message or messages to display
   */
  message: string | string[] | null | undefined;

  /**
   * The error message variant
   */
  variant?: 'error' | 'warning' | 'info';

  /**
   * Whether to show an icon
   */
  showIcon?: boolean;

  /**
   * CSS class name
   */
  className?: string;
}

export function ErrorMessage({
  message,
  variant = 'error',
  showIcon = true,
  className = '',
}: ErrorMessageProps) {
  if (!message) return null;

  // Map variants to classes using our design system colors
  const variantMap = {
    error: `bg-[${colors.danger[50]}] text-[${colors.danger[800]}] border-[${colors.danger[200]}]`,
    warning: `bg-[${colors.warning[50]}] text-[${colors.warning[800]}] border-[${colors.warning[200]}]`,
    info: `bg-[${colors.primary[50]}] text-[${colors.primary[800]}] border-[${colors.primary[200]}]`,
  };

  // Map variants to icon color
  const iconColorMap = {
    error: `text-[${colors.danger[400]}]`,
    warning: `text-[${colors.warning[400]}]`,
    info: `text-[${colors.primary[400]}]`,
  };

  // Convert single message to array
  const messages = Array.isArray(message) ? message : [message];

  return (
    <div className={`rounded-md p-4 border ${variantMap[variant]} ${className}`}>
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            {variant === 'error' && (
              <svg
                className={`h-5 w-5 ${iconColorMap[variant]}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {variant === 'warning' && (
              <svg
                className={`h-5 w-5 ${iconColorMap[variant]}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {variant === 'info' && (
              <svg
                className={`h-5 w-5 ${iconColorMap[variant]}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
        <div className={`${showIcon ? 'ml-3' : ''}`}>
          {messages.length === 1 ? (
            <p className="text-sm font-medium">{messages[0]}</p>
          ) : (
            <div>
              <div className="text-sm font-medium mb-1">Please fix the following issues:</div>
              <ul className="list-disc pl-5 text-sm">
                {messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
