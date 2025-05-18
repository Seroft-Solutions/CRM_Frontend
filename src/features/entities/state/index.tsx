import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import State from './state';
import StateDetail from './state-detail';
import StateUpdate from './state-update';
import StateDeleteDialog from './state-delete-dialog';

const StateRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<State />} />
    <Route path="new" element={<StateUpdate />} />
    <Route path=":id">
      <Route index element={<StateDetail />} />
      <Route path="edit" element={<StateUpdate />} />
      <Route path="delete" element={<StateDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default StateRoutes;
