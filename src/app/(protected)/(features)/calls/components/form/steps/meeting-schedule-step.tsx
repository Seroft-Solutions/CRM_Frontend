"use client";

import React, {useState} from "react";
import { format } from "date-fns";
import { MeetingScheduler } from "../../form/meeting-scheduler";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../call-form-provider";

export function MeetingScheduleStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
    const { form, actions } = useEntityForm();

    const customerId = form.watch("customer");
    const assignedUserId = form.watch("assignedTo");
    const hasRequiredFields = customerId && assignedUserId;
    const [meetingData, setMeetingData] = useState<any>(null);


    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-medium">Schedule Meeting</h3>
                <p className="text-muted-foreground">Schedule a follow-up meeting with the customer</p>
            </div>
            <MeetingScheduler
                customerId={form.watch('customer')}
                assignedUserId={form.watch('assignedTo')}
                onMeetingScheduled={(meeting) => {
                    setMeetingData(meeting);
                }}
                // disabled={!form.watch('customer') || !form.watch('assignedTo')}
            />

            {meetingData && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium text-green-800 mb-2">✅ Meeting Scheduled Successfully</h4>
                    <p className="text-sm text-green-700">
                        Meeting scheduled for {format(new Date(meetingData.meetingDateTime), "PPP 'at' p")}
                    </p>
                </div>
            )}
        </div>
    );
}