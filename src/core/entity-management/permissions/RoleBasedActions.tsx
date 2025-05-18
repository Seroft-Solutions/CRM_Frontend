import React from 'react';
import { usePermission } from './PermissionGuard';

export interface RoleBasedAction<T = any> {
  /**
   * Action label
   */
  label: string;
  
  /**
   * Click handler
   */
  onClick: (item: T) => void;
  
  /**
   * Button variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg';
  
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Whether the action is disabled
   */
  disabled?: boolean | ((item: T) => boolean);
  
  /**
   * Required permission
   */
  permission?: {
    feature: string;
    action: string;
  };
  
  /**
   * Order of the action (for sorting)
   */
  order?: number;
  
  /**
   * Whether to show the action in a dropdown menu
   */
  showInDropdown?: boolean;
  
  /**
   * Whether to confirm before executing
   */
  confirmRequired?: boolean;
  
  /**
   * Confirmation message
   */
  confirmMessage?: string;
  
  /**
   * Custom tooltip
   */
  tooltip?: string;
}

export interface RoleBasedActionsProps<T = any> {
  /**
   * Actions to filter
   */
  actions: RoleBasedAction<T>[];
  
  /**
   * Current item
   */
  item: T;
  
  /**
   * Feature the actions belong to
   */
  feature: string;
  
  /**
   * Whether to filter actions based on permissions
   */
  filterByPermission?: boolean;
  
  /**
   * Render function for actions
   */
  renderActions?: (actions: RoleBasedAction<T>[]) => React.ReactNode;
}

/**
 * Component to filter and render actions based on user permissions
 */
export function RoleBasedActions<T = any>({
  actions,
  item,
  feature,
  filterByPermission = true,
  renderActions,
}: RoleBasedActionsProps<T>) {
  const { checkPermission } = usePermission();
  
  // Filter actions based on permissions
  const filteredActions = React.useMemo(() => {
    if (!filterByPermission) {
      return actions;
    }
    
    return actions.filter(action => {
      // If no permission is specified, always allow
      if (!action.permission) {
        return true;
      }
      
      // Check if user has the required permission
      const { feature: actionFeature, action: permission } = action.permission;
      return checkPermission(actionFeature || feature, permission);
    });
  }, [actions, feature, filterByPermission, checkPermission]);
  
  // Sort actions by order
  const sortedActions = React.useMemo(() => {
    return [...filteredActions].sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return orderA - orderB;
    });
  }, [filteredActions]);
  
  // Process actions (apply disabled state)
  const processedActions = React.useMemo(() => {
    return sortedActions.map(action => {
      const isDisabled = typeof action.disabled === 'function'
        ? action.disabled(item)
        : action.disabled;
      
      return {
        ...action,
        disabled: isDisabled,
      };
    });
  }, [sortedActions, item]);
  
  // If custom render function is provided, use it
  if (renderActions) {
    return <>{renderActions(processedActions)}</>;
  }
  
  // Default rendering (just return the actions array)
  return <>{processedActions}</>;
}

/**
 * Hook to filter actions based on permissions
 */
export function useRoleBasedActions<T = any>(
  actions: RoleBasedAction<T>[],
  feature: string,
  filterByPermission = true
) {
  const { checkPermission } = usePermission();
  
  return React.useMemo(() => {
    if (!filterByPermission) {
      return actions;
    }
    
    return actions
      .filter(action => {
        // If no permission is specified, always allow
        if (!action.permission) {
          return true;
        }
        
        // Check if user has the required permission
        const { feature: actionFeature, action: permission } = action.permission;
        return checkPermission(actionFeature || feature, permission);
      })
      .sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        return orderA - orderB;
      });
  }, [actions, feature, filterByPermission, checkPermission]);
}
