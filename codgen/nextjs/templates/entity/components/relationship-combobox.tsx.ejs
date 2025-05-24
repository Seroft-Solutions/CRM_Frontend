"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface RelationshipComboboxProps {
  value?: number | number[];
  onValueChange: (value: number | number[] | undefined) => void;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RelationshipCombobox({
  value,
  onValueChange,
  options = [],
  displayField = "name",
  placeholder = "Select option...",
  multiple = false,
  disabled = false,
  className,
}: RelationshipComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Handle single selection
  const handleSingleSelect = (optionId: number) => {
    const newValue = value === optionId ? undefined : optionId;
    onValueChange(newValue);
    setOpen(false);
  };

  // Handle multiple selection
  const handleMultipleSelect = (optionId: number) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((id) => id !== optionId)
      : [...currentValues, optionId];
    
    onValueChange(newValues.length > 0 ? newValues : undefined);
  };

  // Remove item from multiple selection
  const removeItem = (optionId: number) => {
    if (Array.isArray(value)) {
      const newValues = value.filter((id) => id !== optionId);
      onValueChange(newValues.length > 0 ? newValues : undefined);
    }
  };

  // Get display text for selected values
  const getDisplayText = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) {
        return placeholder;
      }
      return `${value.length} item${value.length === 1 ? '' : 's'} selected`;
    } else {
      if (typeof value !== 'number') {
        return placeholder;
      }
      const selectedOption = options.find((option) => option.id === value);
      return selectedOption ? selectedOption[displayField] : placeholder;
    }
  };

  // Get selected options for multiple selection display
  const getSelectedOptions = () => {
    if (!multiple || !Array.isArray(value)) return [];
    return options.filter((option) => value.includes(option.id));
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.id)
                    : value === option.id;

                  return (
                    <CommandItem
                      key={option.id}
                      value={option[displayField]}
                      onSelect={() => {
                        if (multiple) {
                          handleMultipleSelect(option.id);
                        } else {
                          handleSingleSelect(option.id);
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
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

      {/* Display selected items for multiple selection */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {getSelectedOptions().map((option) => (
            <Badge key={option.id} variant="secondary" className="gap-1">
              {option[displayField]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeItem(option.id)}
                type="button"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
