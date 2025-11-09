'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, RefreshCw } from 'lucide-react';

interface MeetingErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
  errorMessage?: string;
  redirectToCalls?: boolean;
}

export function MeetingErrorDialog({
  open,
  onOpenChange,
  onRetry,
  errorMessage,
  redirectToCalls = true,
}: MeetingErrorDialogProps) {
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);

    if (redirectToCalls) {
      setTimeout(() => {
        router.push('/calls');
      }, 100);
    }
  };

  const handleRetry = () => {
    onOpenChange(false);
    onRetry?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-0 shadow-2xl p-0 gap-0 overflow-hidden">
        {/* Error Header */}
        <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-white mb-2">
              Meeting Scheduling Failed
            </DialogTitle>
            <DialogDescription className="text-red-100 text-sm leading-relaxed">
              We encountered an issue while scheduling your meeting
            </DialogDescription>
          </div>
        </div>

        {/* Error Content */}
        <div className="px-6 py-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 text-sm mb-1">
                  Unable to Schedule Meeting
                </h4>
                <p className="text-sm text-red-700">
                  {errorMessage ||
                    "We're unable to schedule the meeting at this time. Please try again later or contact support if the issue persists."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 text-sm mb-2">What you can do:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Try scheduling the meeting again</li>
              <li>• Check your internet connection</li>
              <li>• Contact support if the problem continues</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="px-6 py-4 bg-gray-50 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-11 font-medium border-gray-300 hover:bg-gray-100"
          >
            Back to Calls
          </Button>
          {onRetry && (
            <Button
              onClick={handleRetry}
              className="flex-1 h-11 font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
