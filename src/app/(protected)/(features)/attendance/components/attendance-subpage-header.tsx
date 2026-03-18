import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AttendanceSubpageHeaderProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
};

export function AttendanceSubpageHeader({
  title,
  description,
  backHref,
  backLabel,
}: AttendanceSubpageHeaderProps) {
  return (
    <div className="rounded-lg border bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-100">{description}</p>
        </div>

        <Button
          asChild
          variant="outline"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
