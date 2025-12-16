'use client';

import type { FieldConfig, WizardStepConfig } from '@/entity-library/config';
import { FormField } from './FormField';
import { FormStep } from './FormStep';

export function FormWizardStep<TEntity extends object>({
  step,
  fields,
}: {
  step: WizardStepConfig<TEntity>;
  fields: Array<FieldConfig<TEntity>>;
}) {
  return (
    <FormStep title={step.title} description={step.description}>
      <div className="grid gap-3">
        {fields.map((f) => (
          <FormField key={String(f.field)} field={f} />
        ))}
      </div>
    </FormStep>
  );
}
