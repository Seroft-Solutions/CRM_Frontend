import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CallRemark from './call-remark';
import CallRemarkDetail from './call-remark-detail';
import CallRemarkUpdate from './call-remark-update';
import CallRemarkDeleteDialog from './call-remark-delete-dialog';

const CallRemarkRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CallRemark />} />
    <Route path="new" element={<CallRemarkUpdate />} />
    <Route path=":id">
      <Route index element={<CallRemarkDetail />} />
      <Route path="edit" element={<CallRemarkUpdate />} />
      <Route path="delete" element={<CallRemarkDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CallRemarkRoutes;
