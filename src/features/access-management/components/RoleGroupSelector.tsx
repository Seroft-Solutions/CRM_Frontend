'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, X } from 'lucide-react';
import type { RoleRepresentation, GroupRepresentation } from '@/core/api/generated/keycloak';

interface RoleGroupSelectorProps<T extends RoleRepresentation | GroupRepresentation> {
  type: 'roles' | 'groups';
  available: T[];
  selected: T[];
  onSelectionChange: (selected: T[]) => void;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function RoleGroupSelector<T extends RoleRepresentation | GroupRepresentation>({
  type,
  available,
  selected,
  onSelectionChange,
  label,
  description,
  required = false,
  disabled = false,
}: RoleGroupSelectorProps<T>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState<T[]>([]);

  const handleOpenDialog = () => {
    setTempSelected([...selected]);
    setSearchTerm('');
    setDialogOpen(true);
  };

  const handleToggleItem = (item: T, checked: boolean) => {
    if (checked) {
      setTempSelected((prev) => [...prev, item]);
    } else {
      setTempSelected((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleConfirm = () => {
    onSelectionChange(tempSelected);
    setDialogOpen(false);
  };

  const handleRemoveItem = (item: T) => {
    onSelectionChange(selected.filter((i) => i.id !== item.id));
  };

  // Filter available items (exclude already selected + search)
  const filteredAvailable = available.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !selected.some((s) => s.id === item.id);
    return matchesSearch && notSelected;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {selected.length > 0 ? 'Manage' : 'Select'}
        </Button>
      </div>

      {/* Selected items display */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/10">
          {selected.map((item) => (
            <Badge key={item.id} variant="secondary" className="gap-1 pr-1">
              {item.name}
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="ml-1 rounded-sm hover:bg-muted"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
          No {type} selected. Click "Select" to choose {type}.
        </div>
      )}

      {/* Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select {label}</DialogTitle>
            <DialogDescription>
              Choose {type} to assign. You can select multiple {type}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${type}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Available items list */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              {filteredAvailable.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  {searchTerm
                    ? `No ${type} found matching "${searchTerm}"`
                    : `No available ${type} to select`}
                </div>
              ) : (
                <div className="p-2">
                  {filteredAvailable.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 p-3 hover:bg-muted rounded-md transition-colors"
                    >
                      <Checkbox
                        checked={tempSelected.some((s) => s.id === item.id)}
                        onCheckedChange={(checked) => handleToggleItem(item, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.name}</div>
                        {type === 'roles' && (item as RoleRepresentation).description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {(item as RoleRepresentation).description}
                          </div>
                        )}
                        {type === 'groups' && (item as GroupRepresentation).path && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {(item as GroupRepresentation).path}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Currently selected count */}
            {tempSelected.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {tempSelected.length} {type} selected
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={required && tempSelected.length === 0}>
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
