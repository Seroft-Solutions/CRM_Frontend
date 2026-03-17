import { ShieldCheck } from 'lucide-react';
import { AttendanceRecordDTO } from '@/core/api/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { AttendanceTable } from './attendance-table';

type AttendanceAdminCardProps = {
  adminDate: string;
  onAdminDateChange: (value: string) => void;
  rows: AttendanceRecordDTO[];
  isLoading: boolean;
  onViewDetails: (record: AttendanceRecordDTO) => void;
};

export function AttendanceAdminCard({
  adminDate,
  onAdminDateChange,
  rows,
  isLoading,
  onViewDetails,
}: AttendanceAdminCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Admin Attendance View
        </CardTitle>
        <CardDescription>All user attendance for the selected date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <Input
            type="date"
            value={adminDate}
            onChange={(event) => onAdminDateChange(event.target.value)}
          />
        </div>
        {isLoading ? (
          <AttendanceLoadingRow message="Loading admin attendance..." />
        ) : (
          <AttendanceTable rows={rows} showActions onViewDetails={onViewDetails} />
        )}
      </CardContent>
    </Card>
  );
}
