'use client';

import type { FieldConfig } from '@/entity-library/config';
import { fieldErrorMessage } from '@/entity-library/utils';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxFieldControl } from './CheckboxFieldControl';
import { SelectFieldControl } from './SelectFieldControl';

export function FormField<TEntity extends object>({
  field,
}: {
  field: FieldConfig<TEntity>;
}) {
  const { register, formState } = useFormContext<Record<string, unknown>>();
  const name = String(field.field);
  const error = fieldErrorMessage(formState.errors, name);

  return (
    <div className="grid gap-1">
      <label className="text-sm font-medium">{field.label}</label>
      {field.type === 'textarea' ? (
        <Textarea className="min-h-24" disabled={field.disabled} {...register(name)} />
      ) : field.type === 'select' ? (
        <SelectFieldControl
          name={name}
          disabled={field.disabled}
          placeholder={field.placeholder}
          options={field.options ?? []}
        />
      ) : field.type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <CheckboxFieldControl name={name} disabled={field.disabled} />
          {field.helpText ? (
            <span className="text-xs text-muted-foreground">{field.helpText}</span>
          ) : null}
        </div>
      ) : (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
          placeholder={field.placeholder}
          disabled={field.disabled}
          {...register(name)}
        />
      )}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
