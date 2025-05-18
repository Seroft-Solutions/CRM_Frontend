import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Priority from './priority';
import PriorityDetail from './priority-detail';
import PriorityUpdate from './priority-update';
import PriorityDeleteDialog from './priority-delete-dialog';

const PriorityRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Priority />} />
    <Route path="new" element={<PriorityUpdate />} />
    <Route path=":id">
      <Route index element={<PriorityDetail />} />
      <Route path="edit" element={<PriorityUpdate />} />
      <Route path="delete" element={<PriorityDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PriorityRoutes;
