import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { MeetingReminderForm } from '../../components/meeting-reminder-form';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface EditMeetingReminderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit MeetingReminder',
};

export default async function EditMeetingReminderPage({ params }: EditMeetingReminderPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="meetingReminder:update"
      unauthorizedTitle="Access Denied to Edit Meeting Reminder"
      unauthorizedDescription="You don't have permission to edit meeting reminder records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/meeting-reminders"
              defaultLabel="Back to Meeting Reminders"
              entityName="MeetingReminder"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Meeting Reminder</h1>
              <p className="text-sm text-gray-600 mt-1">
                Update the information for this meeting reminder
              </p>
            </div>
          </div>

          <MeetingReminderForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
