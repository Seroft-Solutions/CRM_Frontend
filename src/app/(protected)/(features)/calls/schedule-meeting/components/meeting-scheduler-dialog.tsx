'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';
import { useGetCustomer } from '@/core/api/generated/spring';

interface MeetingSchedulerDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  customerId?: number;
  assignedUserId?: number | string;
  callId?: number;
  onMeetingScheduledAction?: (meetingData: any) => void;
  onError?: (error: any) => void;
}

export function MeetingSchedulerDialog({
  open,
  onOpenChangeAction,
  customerId,
  assignedUserId,
  callId,
  onMeetingScheduledAction,
  onError,
}: MeetingSchedulerDialogProps) {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState(false);

  const { data: customerData } = useGetCustomer(customerId || 0, {
    query: { enabled: !!customerId },
  });

  if (!callId) return null;

  const handleScheduleMeeting = () => {
    setIsScheduling(true);

    const params = new URLSearchParams({
      customerId: customerId?.toString() || '',
      assignedUserId: assignedUserId?.toString() || '',
      callId: callId.toString(),
    });

    const url = `/calls/schedule-meeting?${params.toString()}`;
    console.log('Navigating to:', url);

    setTimeout(() => {
      router.push(url);
    }, 500);
  };

  const handleDecline = () => {
    onOpenChangeAction(false);
  };

  return (
    <>
      {/* Custom Backdrop with stronger blur */}
      {open && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xl" />}

      <Dialog open={open} onOpenChange={() => {}} modal>
        <DialogContent
          className="sm:max-w-lg max-w-[95vw] bg-background/95 backdrop-blur-md border-0 shadow-2xl p-0 gap-0 overflow-hidden z-50"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <CalendarDays className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold text-white mb-2">
                Schedule Follow-up Meeting
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm leading-relaxed">
                Continue building your relationship with a scheduled meeting
              </DialogDescription>
            </div>
          </div>

          {/* Customer Section */}
          {customerData && (
            <div className="px-6 py-5 bg-gray-50/50 border-b">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-lg font-medium">
                    {customerData.customerBusinessName?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {customerData.customerBusinessName}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">{customerData.email}</p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-50 text-green-700 border-green-200 font-medium"
                >
                  Active Lead
                </Badge>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="px-6 py-5 space-y-4">
            <h5 className="font-medium text-gray-900 text-sm">Meeting Benefits:</h5>
            <div className="space-y-3">
              {[
                'Strengthen customer relationship',
                'Address specific needs & concerns',
                'Accelerate the sales process',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Loading Overlay */}
          {isScheduling && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-card p-6 rounded-lg shadow-lg text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-sm text-muted-foreground font-medium">
                  Opening Meeting Scheduler...
                </p>
                <p className="text-xs text-muted-foreground mt-1">Please wait a moment</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-5 bg-gray-50/50 flex gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isScheduling}
              className="flex-1 h-11 font-medium border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleScheduleMeeting}
              disabled={isScheduling}
              className="flex-1 h-11 font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-sm disabled:opacity-50"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
