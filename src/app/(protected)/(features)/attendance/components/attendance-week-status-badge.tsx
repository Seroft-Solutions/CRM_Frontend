import { Badge } from '@/components/ui/badge';
import type { AttendanceWeekStatus } from './attendance-week-utils';

type AttendanceWeekStatusBadgeProps = {
  status: AttendanceWeekStatus;
};

export function AttendanceWeekStatusBadge({
  status,
}: AttendanceWeekStatusBadgeProps) {
  if (status === 'ACTIVE') {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Active</Badge>;
  }

  if (status === 'CHECKED_OUT') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Checked Out</Badge>;
  }

  if (status === 'LEAVE') {
    return <Badge variant="secondary">Leave</Badge>;
  }

  return <Badge className="bg-red-600 hover:bg-red-600">Incomplete</Badge>;
}
