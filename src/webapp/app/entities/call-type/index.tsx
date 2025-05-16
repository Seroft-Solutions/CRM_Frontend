import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CallType from './call-type';
import CallTypeDetail from './call-type-detail';
import CallTypeUpdate from './call-type-update';
import CallTypeDeleteDialog from './call-type-delete-dialog';

const CallTypeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CallType />} />
    <Route path="new" element={<CallTypeUpdate />} />
    <Route path=":id">
      <Route index element={<CallTypeDetail />} />
      <Route path="edit" element={<CallTypeUpdate />} />
      <Route path="delete" element={<CallTypeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CallTypeRoutes;
