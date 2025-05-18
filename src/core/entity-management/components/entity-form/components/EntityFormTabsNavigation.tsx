import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { SectionConfig } from '../../../types/entity-form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface EntityFormTabsNavigationProps {
  sections: SectionConfig[];
  form: UseFormReturn<any>;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function EntityFormTabsNavigation({
  sections,
  form,
  currentTab,
  onTabChange
}: EntityFormTabsNavigationProps) {
  // Calculate tab indicator for each section
  const getTabIndicator = (section: SectionConfig): 'error' | 'complete' | 'pending' => {
    // Get all field names for this section
    const sectionFieldNames = section.fields.map(field => field.name);
    
    // Check if any fields in this section have errors
    const hasErrors = sectionFieldNames.some(fieldName => 
      form.formState.errors[fieldName] !== undefined
    );
    
    if (hasErrors) {
      return 'error';
    }
    
    // Check if any required fields are dirty (have been interacted with)
    const requiredFieldNames = section.fields
      .filter(field => field.required)
      .map(field => field.name);
    
    const touchedRequiredFields = requiredFieldNames.filter(fieldName => 
      form.formState.touchedFields[fieldName]
    );
    
    if (requiredFieldNames.length > 0 && touchedRequiredFields.length === requiredFieldNames.length) {
      return 'complete';
    }
    
    return 'pending';
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 pt-2 pb-2 border-b border-gray-200 dark:border-gray-800">
      <div className="overflow-auto px-2 pb-2">
        {/* Use scrolling container for smaller screens */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {sections.map((section, index) => {
            const tabId = `tab-${section.title || index}`;
            const indicator = getTabIndicator(section);
            
            return (
              <button
                key={tabId}
                onClick={() => onTabChange(tabId)}
                className={cn(
                  "flex items-center min-w-max whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                  "transition-colors focus-visible:outline-none disabled:pointer-events-none",
                  currentTab === tabId ? 
                    "bg-primary/10 text-primary" : 
                    "hover:bg-muted/80 text-muted-foreground",
                  indicator === 'error' && "text-red-600 dark:text-red-400",
                  "flex-shrink-0" // Prevent shrinking in small screens
                )}
              >
                {section.title || `Section ${index + 1}`}
                
                {/* Status indicator */}
                {indicator === 'error' && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-red-500" />
                )}
                {indicator === 'complete' && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Mobile-friendly indicator when tabs are scrollable */}
      <div className="lg:hidden text-xs text-center text-gray-500 dark:text-gray-400 pb-1">
        {sections.length > 3 && (
          <span>Swipe to see more tabs →</span>
        )}
      </div>
    </div>
  );
}
