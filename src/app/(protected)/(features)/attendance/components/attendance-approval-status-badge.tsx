import { Badge } from '@/components/ui/badge';

type AttendanceApprovalStatusBadgeProps = {
  status?: string | null;
};

export function AttendanceApprovalStatusBadge({ status }: AttendanceApprovalStatusBadgeProps) {
  if (status === 'APPROVED') {
    return <Badge className="bg-blue-600 hover:bg-blue-600">Approved</Badge>;
  }

  return <Badge className="bg-amber-500 hover:bg-amber-500">Pending Approval</Badge>;
}
