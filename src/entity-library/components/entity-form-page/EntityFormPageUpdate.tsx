'use client';

import { useCallback, useMemo } from 'react';
import type { EntityFormPageConfig } from '@/entity-library/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { EntityForm } from '../forms/EntityForm';
import { FormWizard } from '../forms/FormWizard';
import { useEntityMutations } from '../../hooks/useEntityMutations';

export function EntityFormPageUpdate<TEntity extends object>({
  config,
  id,
}: {
  config: EntityFormPageConfig<TEntity> & {
    submitMode: 'update';
    useGetById: NonNullable<EntityFormPageConfig<TEntity>['useGetById']>;
    useUpdate: NonNullable<EntityFormPageConfig<TEntity>['useUpdate']>;
  };
  id: number;
}) {
  const router = useRouter();
  const { invalidateQueries } = useEntityMutations(config.queryKeyPrefix);
  const updateMutation = config.useUpdate();
  const { data: entity, isLoading } = config.useGetById(id);

  const title = config.title ?? `Edit ${config.entityName}`;

  const onCancel = useCallback(() => {
    if (config.onCancel) return config.onCancel();

    router.push(config.basePath);
  }, [config, router]);

  const successMessage = config.form.successMessage ?? `${config.entityName} updated`;
  const submitText = config.form.submitButtonText ?? 'Save';

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
        ? await config.transformSubmit(values as Partial<TEntity>, { entity })
        : (values as Partial<TEntity>);

      const payloadMode = config.updatePayloadMode ?? 'merge';
      const data =
        payloadMode === 'merge'
          ? ({ ...(entity as object), ...(patch as object) } as TEntity)
          : patch;

      const saved = await updateMutation.mutateAsync({ id, data });

      await invalidateQueries();
      await config.onSuccess?.(saved);
      await handleAfterSubmit(saved);

      return saved;
    },
    [config, entity, handleAfterSubmit, id, invalidateQueries, updateMutation]
  );

  const defaultValues = useMemo(() => {
    const fromEntity = config.getDefaultValues
      ? config.getDefaultValues(entity)
      : (entity as Partial<TEntity> | undefined);
    const fromConfig = config.form.defaultValues;

    return { ...(fromEntity ?? {}), ...(fromConfig ?? {}) } as Partial<TEntity>;
  }, [config, entity]);

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

  if (isLoading || !entity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-9 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {formConfig.mode === 'wizard' ? (
          <FormWizard<TEntity> config={formConfig} onCancel={onCancel} />
        ) : (
          <EntityForm<TEntity> config={formConfig} onCancel={onCancel} />
        )}
      </CardContent>
    </Card>
  );
}
