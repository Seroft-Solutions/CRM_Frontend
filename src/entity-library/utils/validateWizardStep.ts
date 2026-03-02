import type { FieldValues, UseFormGetValues, UseFormSetError } from 'react-hook-form';
import type { z } from 'zod';
import { applyZodErrorToForm } from './zod-to-rhf';

export function validateWizardStep<TFieldValues extends FieldValues>(
  schema: z.ZodType<unknown>,
  getValues: UseFormGetValues<TFieldValues>,
  setError: UseFormSetError<TFieldValues>
): boolean {
  const parsed = schema.safeParse(getValues());

  if (parsed.success) return true;

  applyZodErrorToForm(parsed.error, setError);

  return false;
}
