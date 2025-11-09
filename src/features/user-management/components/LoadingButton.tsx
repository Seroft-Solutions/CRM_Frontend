/**
 * Loading Button Component
 * Enhanced button with loading states using existing dependencies
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Send,
  Mail,
  Save,
  Trash2,
  UserPlus,
  Users,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Plus,
} from 'lucide-react';

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText = 'Loading...',
  icon,
  loadingIcon,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const defaultLoadingIcon = <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <Button disabled={disabled || isLoading} className={`gap-2 ${className}`} {...props}>
      {isLoading ? (
        <>
          {loadingIcon || defaultLoadingIcon}
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}

export function SendInviteButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'icon' | 'loadingText'>) {
  return (
    <LoadingButton
      icon={<Send className="h-4 w-4" />}
      loadingText="Sending..."
      isLoading={isLoading}
      {...props}
    >
      Send Invitation
    </LoadingButton>
  );
}

export function BulkInviteButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'icon' | 'loadingText'>) {
  return (
    <LoadingButton
      icon={<Mail className="h-4 w-4" />}
      loadingText="Sending Invitations..."
      isLoading={isLoading}
      {...props}
    >
      Send All Invitations
    </LoadingButton>
  );
}

export function SaveButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'icon' | 'loadingText'>) {
  return (
    <LoadingButton
      icon={<Save className="h-4 w-4" />}
      loadingText="Saving..."
      isLoading={isLoading}
      {...props}
    >
      Save
    </LoadingButton>
  );
}

export function DeleteButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'icon' | 'loadingText'>) {
  return (
    <LoadingButton
      icon={<Trash2 className="h-4 w-4" />}
      loadingText="Deleting..."
      isLoading={isLoading}
      variant="destructive"
      {...props}
    >
      Delete
    </LoadingButton>
  );
}

export function RefreshButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'icon' | 'loadingText'>) {
  return (
    <LoadingButton
      icon={<RefreshCw className="h-4 w-4" />}
      loadingText="Refreshing..."
      isLoading={isLoading}
      variant="outline"
      {...props}
    >
      Refresh
    </LoadingButton>
  );
}

export function AddRowButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'icon' | 'loadingText'>) {
  return (
    <LoadingButton
      icon={<Plus className="h-4 w-4" />}
      loadingText="Adding..."
      isLoading={isLoading}
      variant="outline"
      size="sm"
      {...props}
    >
      Add Row
    </LoadingButton>
  );
}
