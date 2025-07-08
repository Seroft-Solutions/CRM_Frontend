"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { meetingReminderToast } from "../meeting-reminder-toast";



interface RelationshipCellProps {
  entityId: number;
  relationshipName: string;
  currentValue?: any;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  onUpdate: (entityId: number, relationshipName: string, newValue: number | null) => Promise<void>;
  isEditable?: boolean;
  isLoading?: boolean;
  className?: string;
  // Add props for navigation
  relatedEntityRoute?: string; // The route to the related entity (e.g., 'call-types', 'sources')
  showNavigationIcon?: boolean;
}

export function RelationshipCell({
  entityId,
  relationshipName,
  currentValue,
  options = [],
  displayField = "name",
  onUpdate,
  isEditable = false,
  isLoading = false,
  className,
  relatedEntityRoute,
  showNavigationIcon = true,
}: RelationshipCellProps) {
  const [open, setOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  
  // Optimistic value for smooth UI updates
  const [optimisticValue, setOptimisticValue] = React.useState(currentValue);

  // Update optimistic value when currentValue changes (from parent or cache)
  React.useEffect(() => {
    setOptimisticValue(currentValue);
  }, [currentValue]);

  // Get current display value using optimistic value
  const getCurrentDisplayValue = () => {
    const valueToUse = optimisticValue;
    
    if (!valueToUse) return "";
    
    if (typeof valueToUse === 'object' && valueToUse[displayField]) {
      return valueToUse[displayField];
    }
    
    if (typeof valueToUse === 'object' && valueToUse.id) {
      const option = options.find(opt => opt.id === valueToUse.id);
      return option ? option[displayField] : `ID: ${valueToUse.id}`;
    }
    
    return valueToUse.toString();
  };

  const currentDisplayValue = getCurrentDisplayValue();
  const currentId = optimisticValue?.id || optimisticValue;

  // Enhanced selection handler with optimistic updates and server sync
  const handleSelect = async (optionId: number | null) => {
    if (updating) return;
    
    setUpdating(true);
    setOpen(false);
    
    // Optimistically update the UI immediately
    const selectedOption = optionId ? options.find(opt => opt.id === optionId) : null;
    setOptimisticValue(selectedOption);
    
    try {
      await onUpdate(entityId, relationshipName, optionId);
      // Success - the server response will update the cache and currentValue
      // The useEffect will sync optimisticValue with the new currentValue
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticValue(currentValue);
      
      // Show error toast
      toast.error("❌ Update Failed", {
        description: `Failed to update ${relationshipName}`,
      });
      
      console.error('Relationship update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Show loading state during initial load or updates
  if (isLoading && !optimisticValue) {
    return (
      <div className={cn("px-2 py-1", className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If not editable, display as clickable link or plain text
  if (!isEditable) {
    // If no current value, show empty state
    if (!currentDisplayValue) {
      return (
        <div className={cn("px-1 py-1", className)}>
          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-slate-50/50 border border-slate-100">
            <span className="text-xs text-slate-400">—</span>
          </div>
        </div>
      );
    }

    // If we have a route and current ID, make it clickable
    const currentId = optimisticValue?.id || optimisticValue;
    if (relatedEntityRoute && currentId) {
      return (
        <div className={cn("px-1 py-1", className)}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-auto p-0 text-left justify-start font-normal hover:bg-transparent group"
                >
                  <Link 
                    href={`/${relatedEntityRoute}/${currentId}`} 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
                    onClick={() => {
                      // Store the current page info for context-aware back navigation
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('referrerInfo', JSON.stringify({
                          url: window.location.pathname,
                          title: document.title,
                          entityType: 'MeetingReminder',
                          timestamp: Date.now()
                        }));
                      }
                    }}
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                      {currentDisplayValue}
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-blue-500 opacity-60 group-hover:opacity-100 transition-all" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to view {relationshipName} details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    // Fallback: display as styled badge (non-clickable)
    return (
      <div className={cn("px-1 py-1", className)}>
        <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200">
          <span className="text-sm font-medium text-slate-600">{currentDisplayValue}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-8 px-2 py-1 justify-between text-left font-normal hover:bg-muted",
              "transition-all duration-200", // Smooth transitions
              updating && "opacity-75" // Visual feedback during updates
            )}
            disabled={updating || isLoading}
          >
            <span className="truncate text-sm">
              {updating ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                currentDisplayValue || "Select..."
              )}
            </span>
            <ChevronDown className={cn(
              "ml-1 h-3 w-3 shrink-0 opacity-50 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." className="h-8" />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {/* None/Clear option */}
                <CommandItem
                  value="__none__"
                  onSelect={() => handleSelect(null)}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      !currentId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
                
                {/* Available options */}
                {options.map((option) => {
                  const isSelected = currentId === option.id;
                  
                  return (
                    <CommandItem
                      key={option.id}
                      value={option[displayField]}
                      onSelect={() => handleSelect(option.id)}
                      className="text-sm"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option[displayField]}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
