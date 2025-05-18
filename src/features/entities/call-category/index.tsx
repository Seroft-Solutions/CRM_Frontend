import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CallCategory from './call-category';
import CallCategoryDetail from './call-category-detail';
import CallCategoryUpdate from './call-category-update';
import CallCategoryDeleteDialog from './call-category-delete-dialog';

const CallCategoryRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CallCategory />} />
    <Route path="new" element={<CallCategoryUpdate />} />
    <Route path=":id">
      <Route index element={<CallCategoryDetail />} />
      <Route path="edit" element={<CallCategoryUpdate />} />
      <Route path="delete" element={<CallCategoryDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CallCategoryRoutes;
