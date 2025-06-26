"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, User, Video, CheckCircle2, ArrowLeft } from "lucide-react";
import { MeetingSchedulerImproved } from "./meeting-scheduler-improved";
import { useGetCustomer } from "@/core/api/generated/spring";
import { cn } from "@/lib/utils";

interface MeetingSchedulerDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  customerId?: number;
  assignedUserId?: number;
  callId?: number;
  onMeetingScheduledAction?: (meetingData: any) => void;
}

export function MeetingSchedulerDialogImproved({
  open,
  onOpenChangeAction,
  customerId,
  assignedUserId,
  callId,
  onMeetingScheduledAction
}: MeetingSchedulerDialogProps) {
  const [showScheduler, setShowScheduler] = useState(false);

  // Fetch customer details for display
  const { data: customerData } = useGetCustomer(customerId || 0, {
    query: { enabled: !!customerId }
  });

  // If no callId is provided, don't show the dialog
  if (!callId) {
    return null;
  }

  const handleScheduleMeeting = () => {
    setShowScheduler(true);
  };

  const handleDecline = () => {
    onOpenChangeAction(false);
  };

  const handleMeetingScheduled = (meetingData: any) => {
    setShowScheduler(false);
    onOpenChangeAction(false);
    if (onMeetingScheduledAction) {
      onMeetingScheduledAction(meetingData);
    }
  };

  const handleBack = () => {
    setShowScheduler(false);
  };

  if (showScheduler) {
    return (
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 gap-0 bg-background border-0 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-9 w-9 p-0 hover:bg-white/80"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    Schedule Meeting
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1 text-gray-600">
                    Book a follow-up meeting with your customer
                  </DialogDescription>
                </div>
              </div>
              
              {/* Customer Info Card */}
              {customerData && (
                <Card className="bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {customerData.customerBusinessName?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {customerData.customerBusinessName}
                        </h4>
                        <p className="text-sm text-gray-500">{customerData.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            <div className="p-8">
              <MeetingSchedulerImproved
                customerId={customerId}
                assignedUserId={assignedUserId}
                callId={callId}
                onMeetingScheduledAction={handleMeetingScheduled}
                disabled={false}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md bg-white border-0 shadow-2xl p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <CalendarDays className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white mb-2">
            Schedule Follow-up Meeting
          </DialogTitle>
          <DialogDescription className="text-blue-100 text-base">
            Would you like to schedule a meeting to continue the conversation?
          </DialogDescription>
        </div>

        {/* Customer Info */}
        {customerData && (
          <div className="px-8 py-6 bg-gray-50 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {customerData.customerBusinessName?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {customerData.customerBusinessName}
                </h4>
                <p className="text-sm text-gray-500">{customerData.email}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Active Customer
              </Badge>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="px-8 py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Continue the conversation</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Build stronger relationships</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Close deals faster</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-8 py-6 bg-gray-50 flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleDecline} 
            className="flex-1 h-11 font-medium border-gray-300 hover:bg-gray-100"
          >
            Not Now
          </Button>
          <Button 
            onClick={handleScheduleMeeting} 
            className="flex-1 h-11 font-medium bg-blue-600 hover:bg-blue-700"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}