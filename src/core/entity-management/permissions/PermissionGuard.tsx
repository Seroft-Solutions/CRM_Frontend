import React from 'react';

// Define a type for the permission checking function
type PermissionChecker = (feature: string, permission: string) => boolean;

// Create a default context
const PermissionContext = React.createContext<{
  checkPermission: PermissionChecker;
}>({
  // Default permission checker
  checkPermission: () => true, // By default, grant all permissions
});

// Provider props
interface PermissionProviderProps {
  children: React.ReactNode;
  checkPermission: PermissionChecker;
}

/**
 * Permission Provider component to provide permission checking to all child components
 */
export function PermissionProvider({
  children,
  checkPermission,
}: PermissionProviderProps) {
  return (
    <PermissionContext.Provider value={{ checkPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Custom hook to use permissions in any component
 */
export function usePermission() {
  return React.useContext(PermissionContext);
}

/**
 * Permission Guard component to conditionally render content based on permissions
 */
interface PermissionGuardProps {
  /**
   * Feature the permission belongs to
   */
  feature: string;
  
  /**
   * Permission required to view the content
   */
  permission: string;
  
  /**
   * Content to render if allowed
   */
  children: React.ReactNode;
  
  /**
   * Content to render if not allowed
   */
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  feature,
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { checkPermission } = usePermission();
  
  const allowed = checkPermission(feature, permission);
  
  if (allowed) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Higher-order component to apply permission check to any component
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  feature: string,
  permission: string,
  FallbackComponent: React.ComponentType<P> | null = null
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard
        feature={feature}
        permission={permission}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Helper hook to check multiple permissions at once
 */
export function useHasPermissions(
  permissions: Array<{ feature: string; permission: string }>
) {
  const { checkPermission } = usePermission();
  
  return permissions.every(({ feature, permission }) =>
    checkPermission(feature, permission)
  );
}

/**
 * Helper function to check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  permissionChecker: PermissionChecker,
  permissions: Array<{ feature: string; permission: string }>
) {
  return permissions.some(({ feature, permission }) =>
    permissionChecker(feature, permission)
  );
}
