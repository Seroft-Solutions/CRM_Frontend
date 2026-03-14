import { Loader2 } from 'lucide-react';

type AttendanceLoadingRowProps = {
  message: string;
};

export function AttendanceLoadingRow({ message }: AttendanceLoadingRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {message}
    </div>
  );
}
