import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AttendanceDetailsAccessCardProps = {
  href: string;
};

export function AttendanceDetailsAccessCard({ href }: AttendanceDetailsAccessCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Details</CardTitle>
        <CardDescription>
          Open the full attendance details page to view working hours, check in, and check out
          history by date range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={href}>
            <ExternalLink className="h-4 w-4" />
            View My Attendance Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
