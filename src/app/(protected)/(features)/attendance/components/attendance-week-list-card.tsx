import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AttendanceRecordDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { formatDurationFromMinutes } from './attendance-formatters';
import { AttendanceWeekStatusBadge } from './attendance-week-status-badge';
import {
  buildAttendanceWeekSummaries,
  formatWeekPeriodLong,
  WEEKLY_LIST_PAGE_SIZE,
} from './attendance-week-utils';

type AttendanceWeekListCardProps = {
  title: string;
  description: string;
  rows: AttendanceRecordDTO[];
  isLoading: boolean;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  getWeekHref: (weekId: string, fromDate: string, toDate: string) => string;
};

export function AttendanceWeekListCard({
  title,
  description,
  rows,
  isLoading,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  getWeekHref,
}: AttendanceWeekListCardProps) {
  const [page, setPage] = useState(0);

  const weeklyRows = useMemo(() => buildAttendanceWeekSummaries(rows), [rows]);
  const pageCount = Math.max(1, Math.ceil(weeklyRows.length / WEEKLY_LIST_PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  useEffect(() => {
    setPage(0);
  }, [fromDate, toDate]);

  const pageStart = page * WEEKLY_LIST_PAGE_SIZE;
  const paginatedRows = weeklyRows.slice(pageStart, pageStart + WEEKLY_LIST_PAGE_SIZE);
  const displayFrom = weeklyRows.length === 0 ? 0 : pageStart + 1;
  const displayTo = weeklyRows.length === 0 ? 0 : pageStart + paginatedRows.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <AttendanceLoadingRow message="Loading weekly attendance..." />
        ) : weeklyRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance weeks found.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr className="border-b">
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Week ID</th>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Days Worked</th>
                    <th className="px-4 py-3 font-medium">Total Hours</th>
                    <th className="px-4 py-3 font-medium">ST /Hr</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((week) => (
                    <tr key={week.weekId} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        <AttendanceWeekStatusBadge status={week.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={getWeekHref(week.weekId, week.fromDate, week.toDate)}
                          className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700"
                        >
                          {week.weekId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatWeekPeriodLong(week.fromDate, week.toDate)}
                      </td>
                      <td className="px-4 py-3">{week.daysWorked}</td>
                      <td className="px-4 py-3">
                        {formatDurationFromMinutes(week.totalMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDurationFromMinutes(week.totalMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-sm text-muted-foreground">
                {displayFrom}-{displayTo} of {weeklyRows.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page === 0}
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page >= pageCount - 1}
                  onClick={() =>
                    setPage((currentPage) => Math.min(currentPage + 1, pageCount - 1))
                  }
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
