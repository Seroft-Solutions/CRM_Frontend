'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface ProductFormActionsProps {
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductFormActions({ onCancel, isSubmitting = false }: ProductFormActionsProps) {
  return (
    <Card className="border shadow-md">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isSubmitting} className="w-full h-9 text-sm">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            variant="outline"
            className="w-full h-9 text-sm"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
