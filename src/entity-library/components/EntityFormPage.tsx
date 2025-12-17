'use client';

import { useCallback, useMemo } from 'react';
import type { EntityFormPageConfig } from '@/entity-library/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { EntityForm } from './forms/EntityForm';
import { FormWizard } from './forms/FormWizard';
import { useEntityMutations } from '../hooks/useEntityMutations';

export function EntityFormPage<TEntity extends object>({
  config,
  id,
}: {
  config: EntityFormPageConfig<TEntity>;
  id?: number;
}) {
  const router = useRouter();
  const { invalidateQueries } = useEntityMutations(config.queryKeyPrefix);

  const isUpdate = config.submitMode === 'update';
  const entityId = isUpdate ? id : undefined;

  const { data: entity, isLoading } = (() => {
    if (!isUpdate) return { data: undefined as TEntity | undefined, isLoading: false };
    if (typeof entityId !== 'number')
      return { data: undefined as TEntity | undefined, isLoading: false };
    if (!config.useGetById) return { data: undefined as TEntity | undefined, isLoading: false };

    return config.useGetById(entityId);
  })();

  const title =
    config.title ?? (isUpdate ? `Edit ${config.entityName}` : `Create ${config.entityName}`);

  const onCancel = useCallback(() => {
    if (config.onCancel) return config.onCancel();
    router.push(config.basePath);
  }, [config, router]);

  const successMessage =
    config.form.successMessage ??
    (isUpdate ? `${config.entityName} updated` : `${config.entityName} created`);

  const submitText = config.form.submitButtonText ?? (isUpdate ? 'Save' : 'Create');

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

      let saved: TEntity;

      if (isUpdate) {
        if (typeof entityId !== 'number')
          throw new Error('EntityFormPage requires `id` for update mode.');
        if (!config.useUpdate)
          throw new Error('EntityFormPage requires `useUpdate` for update mode.');
        const { mutateAsync } = config.useUpdate();

        saved = await mutateAsync({ id: entityId, data: patch });
      } else {
        if (!config.useCreate)
          throw new Error('EntityFormPage requires `useCreate` for create mode.');
        const { mutateAsync } = config.useCreate();

        saved = await mutateAsync({ data: patch });
      }

      await invalidateQueries();
      await config.onSuccess?.(saved);
      await handleAfterSubmit(saved);

      return saved;
    },
    [config, entityId, handleAfterSubmit, invalidateQueries, isUpdate]
  );

  const defaultValues = useMemo(() => {
    if (isUpdate) {
      const fromEntity = config.getDefaultValues
        ? config.getDefaultValues(entity)
        : (entity as Partial<TEntity> | undefined);
      const fromConfig = config.form.defaultValues;

      return { ...(fromEntity ?? {}), ...(fromConfig ?? {}) } as Partial<TEntity>;
    }
    if (config.getDefaultValues) return config.getDefaultValues(undefined);

    return config.form.defaultValues;
  }, [config, entity, isUpdate]);

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

  if (isUpdate) {
    if (typeof entityId !== 'number') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Missing entity id.</CardDescription>
          </CardHeader>
        </Card>
      );
    }
    if (!config.useGetById) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Missing `useGetById` hook for edit mode.</CardDescription>
          </CardHeader>
        </Card>
      );
    }
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
