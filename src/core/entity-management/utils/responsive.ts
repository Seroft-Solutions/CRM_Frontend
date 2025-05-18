/**
 * Responsive utility functions and classes for entity management
 * Provides consistent responsive behavior across components
 */

/**
 * Custom breakpoint constants for consistent usage
 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

/**
 * Responsive CSS class map
 * Provides consistent responsive classes for different screen sizes
 */
export const RESPONSIVE_CLASSES = {
  // Container classes
  container: {
    base: "w-full px-4",
    sm: "sm:px-6",
    lg: "lg:px-8 lg:max-w-7xl lg:mx-auto",
  },
  
  // Card classes
  card: {
    base: "bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden",
    sm: "sm:rounded-xl",
  },
  
  // Grid classes
  grid: {
    // One column on mobile, two on tablet and up
    "1-2": "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
    
    // One column on mobile, three on desktop and up
    "1-3": "grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6",
    
    // One column mobile, two columns tablet, four columns desktop
    "1-2-4": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
  },
  
  // Spacing classes
  spacing: {
    section: "my-4 sm:my-6 lg:my-8",
    betweenSections: "mb-4 sm:mb-6 lg:mb-8",
  },
  
  // Table classes
  table: {
    container: "overflow-x-auto",
    wrapper: "min-w-full align-middle",
  },
  
  // Form classes
  form: {
    field: "mb-4",
    fieldGroup: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4",
  },
  
  // Dialog/Modal classes
  dialog: {
    content: "w-[95vw] sm:w-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0",
    maxHeight: "max-h-[85vh] sm:max-h-[80vh]",
  },
  
  // Button classes
  buttons: {
    group: "flex flex-col-reverse sm:flex-row gap-2 sm:gap-3",
    mobileFullWidth: "w-full sm:w-auto",
  },
};

/**
 * Returns true if the current viewport width is below the specified breakpoint
 * @param breakpoint Breakpoint to check against (xs, sm, md, lg, xl)
 * @returns True if viewport width is below the breakpoint
 */
export const isBelowBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS[breakpoint];
};

/**
 * Returns true if the current viewport width is above the specified breakpoint
 * @param breakpoint Breakpoint to check against (xs, sm, md, lg, xl)
 * @returns True if viewport width is above the breakpoint
 */
export const isAboveBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
};

/**
 * Get responsive classes for a specific component type
 * @param componentType Type of component (container, card, grid, etc.)
 * @param variant Specific variant of the component
 * @returns String of CSS classes
 */
export const getResponsiveClasses = (
  componentType: keyof typeof RESPONSIVE_CLASSES,
  variant?: string
): string => {
  const classes = RESPONSIVE_CLASSES[componentType];
  
  if (!classes) {
    return '';
  }
  
  if (variant && classes[variant as keyof typeof classes]) {
    return classes[variant as keyof typeof classes] as string;
  }
  
  // If no variant is specified or variant doesn't exist, return base classes
  if (typeof classes === 'object' && 'base' in classes) {
    return Object.values(classes).join(' ');
  }
  
  return '';
};
