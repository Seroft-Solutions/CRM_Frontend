'use client';

import type { FieldConfig, FormLayout, WizardStepConfig } from '@/entity-library/config';
import { FormField } from './FormField';
import { FormStep } from './FormStep';
import { FormSection } from './FormSection';

export function FormWizardStep<TEntity extends object>({
  step,
  fields,
  layout = 'single-column',
}: {
  step: WizardStepConfig<TEntity>;
  fields: Array<FieldConfig<TEntity>>;
  layout?: FormLayout;
}) {
  const hasSections = fields.some((f) => (f.section?.trim() ?? '') !== '');
  const gridClass = layout === 'two-column' ? 'grid gap-3 md:grid-cols-2' : 'grid gap-3';

  const sections = fields.reduce<Map<string, Array<FieldConfig<TEntity>>>>((m, f) => {
    const key = f.section?.trim() ?? '';
    const prev = m.get(key);

    if (prev) prev.push(f);
    else m.set(key, [f]);

    return m;
  }, new Map());

  return (
    <FormStep title={step.title} description={step.description}>
      {hasSections ? (
        <div className="grid gap-3">
          {Array.from(sections.entries()).map(([title, fs]) => (
            <FormSection key={title || 'default'} title={title || undefined}>
              <div className={gridClass}>
                {fs.map((f) => (
                  <div
                    key={String(f.field)}
                    className={
                      layout === 'two-column' && f.colSpan === 2 ? 'md:col-span-2' : undefined
                    }
                  >
                    <FormField field={f} />
                  </div>
                ))}
              </div>
            </FormSection>
          ))}
        </div>
      ) : (
        <div className={gridClass}>
          {fields.map((f) => (
            <div
              key={String(f.field)}
              className={layout === 'two-column' && f.colSpan === 2 ? 'md:col-span-2' : undefined}
            >
              <FormField field={f} />
            </div>
          ))}
        </div>
      )}
    </FormStep>
  );
}
