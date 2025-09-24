// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import * as React from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { productCategoryToast } from '../product-category-toast';

interface BulkRelationshipAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntityIds: number[];
  relationshipConfigs: Array<{
    name: string;
    displayName: string;
    options: Array<{ id: number; [key: string]: any }>;
    displayField: string;
    isEditable: boolean;
  }>;
  onBulkUpdate: (
    entityIds: number[],
    relationshipName: string,
    newValue: number | null
  ) => Promise<void>;
}

export function BulkRelationshipAssignment({
  open,
  onOpenChange,
  selectedEntityIds,
  relationshipConfigs,
  onBulkUpdate,
}: BulkRelationshipAssignmentProps) {
  const [selectedRelationship, setSelectedRelationship] = React.useState<string>('');
  const [selectedValue, setSelectedValue] = React.useState<number | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [relationshipOpen, setRelationshipOpen] = React.useState(false);
  const [valueOpen, setValueOpen] = React.useState(false);

  // Get editable relationships
  const editableRelationships = relationshipConfigs.filter((config) => config.isEditable);

  // Get current relationship config
  const currentRelationshipConfig = editableRelationships.find(
    (config) => config.name === selectedRelationship
  );

  // Get display value for selected relationship
  const getRelationshipDisplayValue = () => {
    if (!selectedRelationship) return 'Select relationship...';
    const config = currentRelationshipConfig;
    return config ? config.displayName : selectedRelationship;
  };

  // Get display value for selected value
  const getValueDisplayValue = () => {
    if (!currentRelationshipConfig) return 'Select relationship first...';
    if (selectedValue === null) return 'None (clear relationship)';

    const option = currentRelationshipConfig.options.find((opt) => opt.id === selectedValue);
    return option ? option[currentRelationshipConfig.displayField] : 'Select value...';
  };

  // Handle bulk update with smooth transitions (no individual toasts)
  const handleBulkUpdate = async () => {
    if (!selectedRelationship) {
      productCategoryToast.validationError(['relationship field']);
      return;
    }

    setIsUpdating(true);

    try {
      await onBulkUpdate(selectedEntityIds, selectedRelationship, selectedValue);

      // Close dialog and reset state - toast will be handled by parent
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk update error:', error);
      productCategoryToast.custom.error(
        '❌ Bulk Update Failed',
        `Failed to update ${selectedRelationship}`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedRelationship('');
      setSelectedValue(null);
      setIsUpdating(false); // Ensure updating state is reset
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Association Assignment</DialogTitle>
          <DialogDescription>
            Update association fields for {selectedEntityIds.length} selected item
            {selectedEntityIds.length > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {editableRelationships.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No editable relationship fields configured.
              <br />
              Configure relationships in the table settings to enable bulk editing.
            </div>
          ) : (
            <>
              {/* Relationship Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="relationship" className="text-right">
                  Field
                </Label>
                <div className="col-span-3">
                  <Popover open={relationshipOpen} onOpenChange={setRelationshipOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={relationshipOpen}
                        className="w-full justify-between transition-all duration-200"
                        disabled={isUpdating}
                      >
                        <span className="truncate">{getRelationshipDisplayValue()}</span>
                        <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search relationships..." />
                        <CommandList>
                          <CommandEmpty>No relationships found.</CommandEmpty>
                          <CommandGroup>
                            {editableRelationships.map((config) => (
                              <CommandItem
                                key={config.name}
                                value={config.displayName}
                                onSelect={() => {
                                  setSelectedRelationship(config.name);
                                  setSelectedValue(null); // Reset value when relationship changes
                                  setRelationshipOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedRelationship === config.name
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {config.displayName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Value Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Value
                </Label>
                <div className="col-span-3">
                  <Popover open={valueOpen} onOpenChange={setValueOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={valueOpen}
                        className="w-full justify-between transition-all duration-200"
                        disabled={isUpdating || !currentRelationshipConfig}
                      >
                        <span className="truncate">{getValueDisplayValue()}</span>
                        <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search options..." />
                        <CommandList>
                          <CommandEmpty>No options found.</CommandEmpty>
                          <CommandGroup>
                            {/* None option */}
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                setSelectedValue(null);
                                setValueOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedValue === null ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="text-muted-foreground">None (clear)</span>
                            </CommandItem>

                            {/* Available options */}
                            {currentRelationshipConfig?.options.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={option[currentRelationshipConfig.displayField]}
                                onSelect={() => {
                                  setSelectedValue(option.id);
                                  setValueOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedValue === option.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {option[currentRelationshipConfig.displayField]}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={isUpdating || !selectedRelationship || editableRelationships.length === 0}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update All'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
