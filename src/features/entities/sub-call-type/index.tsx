import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import SubCallType from './sub-call-type';
import SubCallTypeDetail from './sub-call-type-detail';
import SubCallTypeUpdate from './sub-call-type-update';
import SubCallTypeDeleteDialog from './sub-call-type-delete-dialog';

const SubCallTypeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<SubCallType />} />
    <Route path="new" element={<SubCallTypeUpdate />} />
    <Route path=":id">
      <Route index element={<SubCallTypeDetail />} />
      <Route path="edit" element={<SubCallTypeUpdate />} />
      <Route path="delete" element={<SubCallTypeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default SubCallTypeRoutes;
