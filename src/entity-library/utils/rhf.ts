import type { FieldErrors, FieldValues, Path } from 'react-hook-form';

export function fieldErrorMessage<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  name: Path<TFieldValues> | string
): string | undefined {
  const err = (errors as Record<string, unknown>)[String(name)];
  const msg = err && typeof err === 'object' ? (err as { message?: unknown }).message : undefined;

  return typeof msg === 'string' ? msg : undefined;
}
