'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface ProductFormActionsProps {
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductFormActions({ onCancel, isSubmitting = false }: ProductFormActionsProps) {
  return (
    <div className="flex flex-row justify-center gap-2">
      <Button type="submit" disabled={isSubmitting} size="default" className="w-fit text-sm">
        <Save className="mr-1.5 h-4 w-4" />
        {isSubmitting ? 'Saving...' : 'Save Product'}
      </Button>
      <Button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        variant="outline"
        size="default"
        className="w-fit text-sm"
      >
        <X className="mr-1.5 h-4 w-4" />
        Cancel
      </Button>
    </div>
  );
}
