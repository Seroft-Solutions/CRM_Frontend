import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CallStatus from './call-status';
import CallStatusDetail from './call-status-detail';
import CallStatusUpdate from './call-status-update';
import CallStatusDeleteDialog from './call-status-delete-dialog';

const CallStatusRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CallStatus />} />
    <Route path="new" element={<CallStatusUpdate />} />
    <Route path=":id">
      <Route index element={<CallStatusDetail />} />
      <Route path="edit" element={<CallStatusUpdate />} />
      <Route path="delete" element={<CallStatusDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CallStatusRoutes;
