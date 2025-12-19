'use client';

import { useCallback, useMemo } from 'react';
import type { EntityFormPageConfig } from '@/entity-library/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { EntityForm } from '../forms/EntityForm';
import { FormWizard } from '../forms/FormWizard';

export function EntityFormPageView<TEntity extends object>({
  config,
  id,
  children,
}: {
  config: EntityFormPageConfig<TEntity> & {
    submitMode: 'view';
    useGetById: NonNullable<EntityFormPageConfig<TEntity>['useGetById']>;
  };
  id: number;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { data: entity, isLoading } = config.useGetById(id);

  const title = config.title ?? `View ${config.entityName}`;

  const onCancel = useCallback(() => {
    if (config.onCancel) return config.onCancel();
    router.push(config.basePath);
  }, [config, router]);

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
      readOnly: true,
      showSubmitButton: false,
      showBackButton: false,
      showCancelButton: true,
      cancelButtonText: 'Back',
      onSuccess: async () => undefined,
    }),
    [config.form, defaultValues]
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
