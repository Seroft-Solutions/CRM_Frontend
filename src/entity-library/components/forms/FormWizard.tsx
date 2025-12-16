'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { FormConfig } from '@/entity-library/config';
import { FormProvider, type DefaultValues, useForm } from 'react-hook-form';
import { validateWizardStep } from '@/entity-library/utils/validateWizardStep';
import { useFormWizard } from '@/entity-library/hooks/useFormWizard';
import { FormActions } from './FormActions';
import { FormNavigation } from './FormNavigation';
import { FormWizardStep } from './FormWizardStep';

export function FormWizard<TEntity extends object>({
  config,
  onCancel,
}: {
  config: FormConfig<TEntity>;
  onCancel?: () => void;
}) {
  const wizard = config.wizard;

  if (!wizard) throw new Error('FormWizard requires config.wizard');

  const form = useForm<Partial<TEntity>>({
    resolver: zodResolver(config.validationSchema as unknown as never),
    defaultValues: config.defaultValues as DefaultValues<Partial<TEntity>> | undefined,
  });
  const { stepIndex, currentStep, isFirst, isLast, next, prev, goTo } = useFormWizard(wizard.steps);

  const stepFields = config.fields.filter((f) => currentStep.fields.includes(f.field));

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data) => config.onSuccess?.(data as unknown as TEntity))}
        className="space-y-4"
      >
        <FormNavigation steps={wizard.steps} stepIndex={stepIndex} onGoTo={goTo} />
        <FormWizardStep step={currentStep} fields={stepFields} />
        <FormActions
          isFirst={isFirst}
          isLast={isLast}
          onPrev={prev}
          onNext={() =>
            validateWizardStep(currentStep.validationSchema, form.getValues, form.setError)
              ? next()
              : undefined
          }
          onCancel={onCancel}
          submitText={config.submitButtonText ?? 'Submit'}
        />
      </form>
    </FormProvider>
  );
}
