'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { MeetingScheduler } from './components/meeting-scheduler';
import { useGetCustomer } from '@/core/api/generated/spring';

function ScheduleMeetingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const customerId = searchParams.get('customerId')
    ? parseInt(searchParams.get('customerId')!)
    : undefined;
  const assignedUserId = searchParams.get('assignedUserId')
    ? parseInt(searchParams.get('assignedUserId')!)
    : undefined;
  const callId = searchParams.get('callId') ? parseInt(searchParams.get('callId')!) : undefined;

  const { data: customerData } = useGetCustomer(customerId || 0, {
    query: { enabled: !!customerId },
  });

  const handleMeetingScheduled = (meetingData: any) => {
    router.push('/calls?scheduled=true');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-9 w-9 p-0 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Schedule Meeting</h1>
                <p className="text-gray-600 text-sm">
                  Book a follow-up meeting with{' '}
                  {customerData?.customerBusinessName || 'your customer'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <MeetingScheduler
          customerId={customerId}
          assignedUserId={assignedUserId}
          callId={callId}
          onMeetingScheduledAction={handleMeetingScheduled}
          disabled={false}
        />
      </div>
    </div>
  );
}

export default function ScheduleMeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meeting scheduler...</p>
          </div>
        </div>
      }
    >
      <ScheduleMeetingContent />
    </Suspense>
  );
}
