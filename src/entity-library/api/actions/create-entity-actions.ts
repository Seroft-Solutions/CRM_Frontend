import type { StatusEnum } from '../config/entity/entity-table-page-config';

import { createEntityActions as internalCreateEntityActions } from '../../actions/createEntityActions';

export interface CreateEntityActionsRouter {
  push: (url: string) => void;
}

export interface CreateEntityActionsOptions<TEntity extends object, TStatus extends StatusEnum> {
  updateMutation: (id: number, data: TEntity) => Promise<void>;
  invalidateQueries: () => Promise<void>;
  statusEnum: TStatus;
  router?: CreateEntityActionsRouter;
  basePath?: string;
  getEntityId: (entity: TEntity) => number | undefined;
}

export function createEntityActions<TEntity extends object, TStatus extends StatusEnum>(
  options: CreateEntityActionsOptions<TEntity, TStatus>
) {
  return internalCreateEntityActions<TEntity, TStatus>(options);
}
