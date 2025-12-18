'use client';

import type { FieldConfig } from '@/entity-library/config';
import { fieldErrorMessage } from '../../utils/rhf';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxFieldControl } from './CheckboxFieldControl';
import { SelectFieldControl } from './SelectFieldControl';
import { RelationshipFieldControl } from './RelationshipFieldControl';
import { ColorFieldControl } from './ColorFieldControl';

export function FormField<TEntity extends object>({ field }: { field: FieldConfig<TEntity> }) {
  const { register, formState, control } = useFormContext<Record<string, unknown>>();
  const name = String(field.field);
  const error = fieldErrorMessage(formState.errors, name);
  const formData = useWatch({ control }) as Partial<TEntity>;

  if (field.condition && !field.condition(formData)) return null;

  return (
    <div className="grid gap-1">
      <label className="text-sm font-medium">
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </label>
      {field.type === 'textarea' ? (
        <Textarea
          className="min-h-24"
          disabled={field.disabled}
          readOnly={field.readonly}
          placeholder={field.placeholder}
          {...register(name)}
        />
      ) : field.type === 'relationship' && field.relationshipConfig ? (
        <RelationshipFieldControl
          name={name}
          disabled={field.disabled || field.readonly}
          config={field.relationshipConfig}
        />
      ) : field.type === 'select' ? (
        <SelectFieldControl
          name={name}
          disabled={field.disabled || field.readonly}
          placeholder={field.placeholder}
          options={field.options ?? []}
        />
      ) : field.type === 'color' ? (
        <ColorFieldControl
          name={name}
          disabled={field.disabled || field.readonly}
          placeholder={field.placeholder}
        />
      ) : field.type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <CheckboxFieldControl name={name} disabled={field.disabled || field.readonly} />
          {field.helpText ? (
            <span className="text-xs text-muted-foreground">{field.helpText}</span>
          ) : null}
        </div>
      ) : (
        <Input
          type={
            field.type === 'email'
              ? 'email'
              : field.type === 'number'
                ? 'number'
                : field.type === 'password'
                  ? 'password'
                  : field.type === 'date'
                    ? 'date'
                    : field.type === 'datetime'
                      ? 'datetime-local'
                      : 'text'
          }
          placeholder={field.placeholder}
          disabled={field.disabled}
          readOnly={field.readonly}
          required={field.required}
          {...register(name, field.type === 'number' ? { valueAsNumber: true } : undefined)}
        />
      )}
      {field.helpText && field.type !== 'checkbox' ? (
        <span className="text-xs text-muted-foreground">{field.helpText}</span>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
