'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { FormConfig } from '@/entity-library/config';
import { FormProvider, type DefaultValues, useForm } from 'react-hook-form';
import { FormActions } from './FormActions';
import { FormField } from './FormField';

export function EntityForm<TEntity extends object>({
  config,
  onCancel,
}: {
  config: FormConfig<TEntity>;
  onCancel?: () => void;
}) {
  const form = useForm<Partial<TEntity>>({
    resolver: zodResolver(config.validationSchema as unknown as never),
    defaultValues: config.defaultValues as DefaultValues<Partial<TEntity>> | undefined,
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data) => config.onSuccess?.(data as unknown as TEntity))}
        className="space-y-4"
      >
        <div className="grid gap-3">
          {config.fields.map((f) => (
            <FormField key={String(f.field)} field={f} />
          ))}
        </div>
        <FormActions
          isFirst
          isLast
          onPrev={() => undefined}
          onNext={() => undefined}
          onCancel={onCancel}
          submitText={config.submitButtonText ?? 'Submit'}
        />
      </form>
    </FormProvider>
  );
}
