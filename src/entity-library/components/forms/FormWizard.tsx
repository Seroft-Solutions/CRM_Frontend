'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { FormConfig } from '@/entity-library/config';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { FormProvider, type DefaultValues, useForm, useWatch } from 'react-hook-form';
import { validateWizardStep } from '../../utils/validateWizardStep';
import { useFormWizard } from '../../hooks/useFormWizard';
import { FormActions } from './FormActions';
import { FormNavigation } from './FormNavigation';
import { FormWizardStep } from './FormWizardStep';

export function FormWizard<TEntity extends object>({
  config,
  onCancel,
  children,
}: {
  config: FormConfig<TEntity>;
  onCancel?: () => void;
  children?: React.ReactNode;
}) {
  const wizard = config.wizard;

  if (!wizard) throw new Error('FormWizard requires config.wizard');

  const form = useForm<Partial<TEntity>>({
    resolver: zodResolver(config.validationSchema as unknown as never),
    defaultValues: config.defaultValues as DefaultValues<Partial<TEntity>> | undefined,
  });
  const formData = useWatch({ control: form.control }) as Partial<TEntity>;

  const visibleSteps = useMemo(
    () => wizard.steps.filter((s) => !s.condition || s.condition(formData)),
    [wizard.steps, formData]
  );

  const { stepIndex, currentStep, isFirst, isLast, next, prev, goTo } = useFormWizard(visibleSteps);

  const stepFields = config.fields
    .filter((f) => currentStep.fields.includes(f.field) && (!f.condition || f.condition(formData)))
    .map((f) => (config.readOnly ? { ...f, readonly: true } : f));
  const canGoBack = wizard.allowBackwardNavigation !== false;
  const isSubmitting = form.formState.isSubmitting;

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
      {children}
      <form onSubmit={onSubmit} className="space-y-4">
        <FormNavigation
          steps={visibleSteps}
          stepIndex={stepIndex}
          onGoTo={goTo}
          allowBackwardNavigation={canGoBack}
        />
        <FormWizardStep step={currentStep} fields={stepFields} layout={config.layout} />
        <FormActions
          isFirst={isFirst}
          isLast={isLast}
          onPrev={canGoBack ? prev : () => undefined}
          onNext={() =>
            validateWizardStep(currentStep.validationSchema, form.getValues, form.setError)
              ? (wizard.onStepComplete?.(currentStep.id, form.getValues() as Partial<TEntity>),
                next())
              : undefined
          }
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
