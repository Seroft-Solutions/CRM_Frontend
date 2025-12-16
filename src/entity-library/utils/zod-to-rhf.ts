import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ZodError } from 'zod';

export function applyZodErrorToForm<TFieldValues extends FieldValues>(
  error: ZodError<unknown>,
  setError: UseFormSetError<TFieldValues>
) {
  for (const issue of error.issues) {
    const path = issue.path.join('.') as Path<TFieldValues>;

    setError(path, { type: 'manual', message: issue.message });
  }
}
