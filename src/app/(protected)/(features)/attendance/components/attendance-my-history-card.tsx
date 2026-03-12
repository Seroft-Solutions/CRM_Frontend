import { AttendanceRecordDTO } from '@/core/api/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { AttendanceTable } from './attendance-table';

type AttendanceMyHistoryCardProps = {
  rows: AttendanceRecordDTO[];
  isLoading: boolean;
};

export function AttendanceMyHistoryCard({ rows, isLoading }: AttendanceMyHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Last 7 Days</CardTitle>
        <CardDescription>Recent personal attendance records.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <AttendanceLoadingRow message="Loading history..." />
        ) : (
          <AttendanceTable rows={rows} />
        )}
      </CardContent>
    </Card>
  );
}
