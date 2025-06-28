import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { AvailableTimeSlotForm } from '../../components/available-time-slot-form';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface EditAvailableTimeSlotPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit AvailableTimeSlot',
};

export default async function EditAvailableTimeSlotPage({
  params,
}: EditAvailableTimeSlotPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="availableTimeSlot:update"
      unauthorizedTitle="Access Denied to Edit Available Time Slot"
      unauthorizedDescription="You don't have permission to edit available time slot records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/available-time-slots"
              defaultLabel="Back to Available Time Slots"
              entityName="AvailableTimeSlot"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Available Time Slot</h1>
              <p className="text-sm text-gray-600 mt-1">
                Update the information for this available time slot
              </p>
            </div>
          </div>

          <AvailableTimeSlotForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
