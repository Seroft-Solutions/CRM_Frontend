import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Party from './party';
import PartyDetail from './party-detail';
import PartyUpdate from './party-update';
import PartyDeleteDialog from './party-delete-dialog';

const PartyRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Party />} />
    <Route path="new" element={<PartyUpdate />} />
    <Route path=":id">
      <Route index element={<PartyDetail />} />
      <Route path="edit" element={<PartyUpdate />} />
      <Route path="delete" element={<PartyDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PartyRoutes;
