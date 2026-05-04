'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateOrderItemStatus } from '@/core/api/order-items';

interface BackToManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: number | null;
  orderId?: number;
  onSuccess?: () => void;
}

export function BackToManagerDialog({
  open,
  onOpenChange,
  orderItemId,
  orderId,
  onSuccess,
}: BackToManagerDialogProps) {
  const [comment, setComment] = useState('');
  const { mutateAsync, isPending } = useUpdateOrderItemStatus();

  useEffect(() => {
    if (!open) {
      setComment('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!orderItemId) {
      return;
    }

    await mutateAsync({
      orderDetailId: orderItemId,
      newStatus: 'ISSUE',
      comment: comment.trim() || undefined,
      orderId,
    });
    toast.success('Item sent back to manager');
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Back to Manager</AlertDialogTitle>
          <AlertDialogDescription>Change status to ISSUE</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={comment}
          maxLength={500}
          placeholder="Add a comment (optional)"
          onChange={(event) => setComment(event.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !orderItemId}
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            {isPending ? 'Sending...' : 'Back to Manager'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
