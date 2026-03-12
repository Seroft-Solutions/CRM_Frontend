import { Badge } from '@/components/ui/badge';

type AttendanceStatusBadgeProps = {
  status?: string;
};

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  if (status === 'CHECKED_OUT') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Checked Out</Badge>;
  }

  if (status === 'CHECKED_IN') {
    return <Badge className="bg-blue-600 hover:bg-blue-600">Checked In</Badge>;
  }

  return <Badge variant="secondary">Not Checked In</Badge>;
}
