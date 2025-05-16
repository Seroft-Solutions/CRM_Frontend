import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Area from './area';
import AreaDetail from './area-detail';
import AreaUpdate from './area-update';
import AreaDeleteDialog from './area-delete-dialog';

const AreaRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Area />} />
    <Route path="new" element={<AreaUpdate />} />
    <Route path=":id">
      <Route index element={<AreaDetail />} />
      <Route path="edit" element={<AreaUpdate />} />
      <Route path="delete" element={<AreaDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AreaRoutes;
