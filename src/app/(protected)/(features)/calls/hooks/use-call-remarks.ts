/**
 * Utility functions for handling call remarks during form submission
 * This provides direct API calls using the existing spring service mutator
 */
import { toast } from 'sonner';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { CallRemarkDTO } from '@/core/api/generated/spring/schemas/CallRemarkDTO';

export interface CallRemark {
  id: string;
  remark: string;
  dateTime: Date;
}

export async function saveRemarksForCall(callId: number, remarks: CallRemark[]): Promise<void> {
  if (!remarks || remarks.length === 0) {
    return;
  }

  try {
    const savePromises = remarks.map(async (remark) => {
      const callRemarkData: CallRemarkDTO = {
        remark: remark.remark,
        dateTime: remark.dateTime,
        call: { id: callId },
        status: 'ACTIVE',
      };

      return await springServiceMutator<CallRemarkDTO>({
        url: '/api/call-remarks',
        method: 'POST',
        data: callRemarkData,
      });
    });

    await Promise.all(savePromises);
  } catch (error) {
    console.error('Failed to save remarks:', error);
    toast.error('Failed to save some remarks');
    throw error;
  }
}
