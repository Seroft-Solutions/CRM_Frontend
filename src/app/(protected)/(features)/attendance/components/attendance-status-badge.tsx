import { Badge } from '@/components/ui/badge';

type AttendanceStatusBadgeProps = {
  status?: string;
};

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  if (status === 'LEAVE') {
    return <Badge className="bg-red-600 hover:bg-red-600">Leave / Absent</Badge>;
  }

  if (status === 'CHECKED_OUT') {
    return <Badge className="bg-red-600 hover:bg-red-600">Checked Out</Badge>;
  }

  if (status === 'CHECKED_IN_WORK_FROM_HOME') {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Checked In - WFH</Badge>;
  }

  if (status === 'CHECKED_IN_OFFICE') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Checked In - Office</Badge>;
  }

  return <Badge variant="secondary">Not Checked In</Badge>;
}
