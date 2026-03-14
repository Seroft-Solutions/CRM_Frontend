'use client';

import type { EntityFormPageConfig } from '@/entity-library/config';

import { EntityFormPageCreate } from './entity-form-page/EntityFormPageCreate';
import { EntityFormPageError } from './entity-form-page/EntityFormPageError';
import { EntityFormPageUpdate } from './entity-form-page/EntityFormPageUpdate';
import { EntityFormPageView } from './entity-form-page/EntityFormPageView';

export function EntityFormPage<TEntity extends object>({
  config,
  id,
  children,
}: {
  config: EntityFormPageConfig<TEntity>;
  id?: number;
  children?: React.ReactNode;
}) {
  const title =
    config.title ??
    (config.submitMode === 'update'
      ? `Edit ${config.entityName}`
      : config.submitMode === 'view'
        ? `View ${config.entityName}`
        : `Create ${config.entityName}`);

  if (config.submitMode === 'view') {
    if (typeof id !== 'number') {
      return <EntityFormPageError title={title} description="Missing entity id." />;
    }

    if (!config.useGetById) {
      return (
        <EntityFormPageError title={title} description="Missing `useGetById` hook for view mode." />
      );
    }

    return (
      <EntityFormPageView<TEntity>
        config={
          config as EntityFormPageConfig<TEntity> & {
            submitMode: 'view';
            useGetById: NonNullable<EntityFormPageConfig<TEntity>['useGetById']>;
          }
        }
        id={id}
      >
        {children}
      </EntityFormPageView>
    );
  }

  if (config.submitMode === 'update') {
    if (typeof id !== 'number') {
      return <EntityFormPageError title={title} description="Missing entity id." />;
    }

    if (!config.useGetById) {
      return (
        <EntityFormPageError title={title} description="Missing `useGetById` hook for edit mode." />
      );
    }

    if (!config.useUpdate) {
      return (
        <EntityFormPageError title={title} description="Missing `useUpdate` hook for edit mode." />
      );
    }

    return (
      <EntityFormPageUpdate<TEntity>
        config={
          config as EntityFormPageConfig<TEntity> & {
            submitMode: 'update';
            useGetById: NonNullable<EntityFormPageConfig<TEntity>['useGetById']>;
            useUpdate: NonNullable<EntityFormPageConfig<TEntity>['useUpdate']>;
          }
        }
        id={id}
      >
        {children}
      </EntityFormPageUpdate>
    );
  }

  if (!config.useCreate) {
    return (
      <EntityFormPageError title={title} description="Missing `useCreate` hook for create mode." />
    );
  }

  return (
    <EntityFormPageCreate<TEntity>
      config={
        config as EntityFormPageConfig<TEntity> & {
          submitMode: 'create';
          useCreate: NonNullable<EntityFormPageConfig<TEntity>['useCreate']>;
        }
      }
    >
      {children}
    </EntityFormPageCreate>
  );
}
