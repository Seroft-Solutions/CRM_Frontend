'use client';

import { useCallback, useMemo } from 'react';
import type { EntityFormPageConfig } from '@/entity-library/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { EntityForm } from '../forms/EntityForm';
import { FormWizard } from '../forms/FormWizard';
import { useEntityMutations } from '../../hooks/useEntityMutations';

export function EntityFormPageCreate<TEntity extends object>({
  config,
  children,
}: {
  config: EntityFormPageConfig<TEntity> & {
    submitMode: 'create';
    useCreate: NonNullable<EntityFormPageConfig<TEntity>['useCreate']>;
  };
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { invalidateQueries } = useEntityMutations(config.queryKeyPrefix);
  const createMutation = config.useCreate();

  const title = config.title ?? `Create ${config.entityName}`;

  const onCancel = useCallback(() => {
    if (config.onCancel) return config.onCancel();

    router.push(config.basePath);
  }, [config, router]);

  const successMessage = config.form.successMessage ?? `${config.entityName} created`;
  const submitText = config.form.submitButtonText ?? 'Create';

  const handleAfterSubmit = useCallback(
    async (saved: TEntity) => {
      const after = config.afterSubmit ?? 'list';

      if (typeof after === 'function') return void (await after(saved));
      if (after === 'stay') return;
      if (after === 'back') return void router.back();
      router.push(config.basePath);
    },
    [config, router]
  );

  const onSuccess = useCallback(
    async (values: TEntity) => {
      const patch = config.transformSubmit
        ? await config.transformSubmit(values as Partial<TEntity>)
        : (values as Partial<TEntity>);

      const saved = await createMutation.mutateAsync({ data: patch });

      await invalidateQueries();
      await config.onSuccess?.(saved);
      await handleAfterSubmit(saved);

      return saved;
    },
    [config, createMutation, handleAfterSubmit, invalidateQueries]
  );

  const defaultValues = useMemo(() => {
    if (config.getDefaultValues) return config.getDefaultValues(undefined);

    return config.form.defaultValues;
  }, [config]);

  const formConfig = useMemo(
    () => ({
      ...config.form,
      defaultValues,
      submitButtonText: submitText,
      successMessage,
      onSuccess: onSuccess as unknown as (data: TEntity) => void | Promise<void>,
    }),
    [config.form, defaultValues, onSuccess, submitText, successMessage]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {formConfig.mode === 'wizard' ? (
          <FormWizard<TEntity> config={formConfig} onCancel={onCancel}>
            {children}
          </FormWizard>
        ) : (
          <EntityForm<TEntity> config={formConfig} onCancel={onCancel}>
            {children}
          </EntityForm>
        )}
      </CardContent>
    </Card>
  );
}
