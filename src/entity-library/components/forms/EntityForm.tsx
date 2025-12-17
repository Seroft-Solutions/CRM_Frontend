'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { FormConfig } from '@/entity-library/config';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { FormProvider, type DefaultValues, useForm, useWatch } from 'react-hook-form';
import { FormActions } from './FormActions';
import { FormField } from './FormField';
import { FormSection } from './FormSection';

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

  const formData = useWatch({ control: form.control }) as Partial<TEntity>;
  const isSubmitting = form.formState.isSubmitting;

  const visibleFields = useMemo(
    () =>
      config.fields
        .filter((f) => !f.condition || f.condition(formData))
        .map((f) => (config.readOnly ? { ...f, readonly: true } : f)),
    [config.fields, config.readOnly, formData]
  );

  const sections = useMemo(() => {
    const m = new Map<string, typeof visibleFields>();

    for (const f of visibleFields) {
      const key = f.section?.trim() ?? '';
      const prev = m.get(key);

      if (prev) prev.push(f);
      else m.set(key, [f]);
    }

    return m;
  }, [visibleFields]);

  const hasSections = Array.from(sections.keys()).some((k) => k !== '');
  const gridClass = config.layout === 'two-column' ? 'grid gap-3 md:grid-cols-2' : 'grid gap-3';

  const onSubmit =
    config.readOnly || config.showSubmitButton === false
      ? (e: React.FormEvent) => e.preventDefault()
      : form.handleSubmit(async (data) => {
          try {
            await config.onSuccess?.(data as unknown as TEntity);
            if (config.successMessage) toast.success(config.successMessage);
          } catch (e) {
            const err = e instanceof Error ? e : new Error('Failed to submit');

            config.onError?.(err);
            if (!config.onError) toast.error(err.message);
          }
        });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        {hasSections ? (
          <div className="grid gap-3">
            {Array.from(sections.entries()).map(([title, fields]) => (
              <FormSection key={title || 'default'} title={title || undefined}>
                <div className={gridClass}>
                  {fields.map((f) => (
                    <div
                      key={String(f.field)}
                      className={
                        config.layout === 'two-column' && f.colSpan === 2
                          ? 'md:col-span-2'
                          : undefined
                      }
                    >
                      <FormField key={String(f.field)} field={f} />
                    </div>
                  ))}
                </div>
              </FormSection>
            ))}
          </div>
        ) : (
          <div className={gridClass}>
            {visibleFields.map((f) => (
              <div
                key={String(f.field)}
                className={
                  config.layout === 'two-column' && f.colSpan === 2 ? 'md:col-span-2' : undefined
                }
              >
                <FormField field={f} />
              </div>
            ))}
          </div>
        )}
        <FormActions
          isFirst
          isLast
          onPrev={() => undefined}
          onNext={() => undefined}
          onCancel={onCancel}
          submitText={config.submitButtonText ?? 'Submit'}
          cancelText={config.cancelButtonText ?? 'Cancel'}
          showCancel={config.showCancelButton !== false}
          showBack={config.showBackButton !== false}
          showSubmit={config.showSubmitButton !== false && !config.readOnly}
          submitting={isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
