import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Call from './call';
import CallDetail from './call-detail';
import CallUpdate from './call-update';
import CallDeleteDialog from './call-delete-dialog';

const CallRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Call />} />
    <Route path="new" element={<CallUpdate />} />
    <Route path=":id">
      <Route index element={<CallDetail />} />
      <Route path="edit" element={<CallUpdate />} />
      <Route path="delete" element={<CallDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CallRoutes;
