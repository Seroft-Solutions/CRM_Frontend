import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Source from './source';
import SourceDetail from './source-detail';
import SourceUpdate from './source-update';
import SourceDeleteDialog from './source-delete-dialog';

const SourceRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Source />} />
    <Route path="new" element={<SourceUpdate />} />
    <Route path=":id">
      <Route index element={<SourceDetail />} />
      <Route path="edit" element={<SourceUpdate />} />
      <Route path="delete" element={<SourceDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default SourceRoutes;
