'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TablePageSizeSelect({
  pageSize,
  options,
  onChange,
}: {
  pageSize: number;
  options: number[];
  onChange: (size: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-[oklch(0.45_0.06_243)]">Rows</span>
      <Select value={String(pageSize)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger
          size="sm"
          className="w-auto min-w-[60px] h-7 border-[oklch(0.45_0.06_243)]/20 text-[oklch(0.45_0.06_243)] font-medium"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
