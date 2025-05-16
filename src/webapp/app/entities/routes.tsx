import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Priority from './priority';
import CallType from './call-type';
import SubCallType from './sub-call-type';
import Source from './source';
import CallCategory from './call-category';
import Party from './party';
import CallStatus from './call-status';
import Product from './product';
import ChannelType from './channel-type';
import Call from './call';
import CallRemark from './call-remark';
import State from './state';
import District from './district';
import City from './city';
import Area from './area';
/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route path="priority/*" element={<Priority />} />
        <Route path="call-type/*" element={<CallType />} />
        <Route path="sub-call-type/*" element={<SubCallType />} />
        <Route path="source/*" element={<Source />} />
        <Route path="call-category/*" element={<CallCategory />} />
        <Route path="party/*" element={<Party />} />
        <Route path="call-status/*" element={<CallStatus />} />
        <Route path="product/*" element={<Product />} />
        <Route path="channel-type/*" element={<ChannelType />} />
        <Route path="call/*" element={<Call />} />
        <Route path="call-remark/*" element={<CallRemark />} />
        <Route path="state/*" element={<State />} />
        <Route path="district/*" element={<District />} />
        <Route path="city/*" element={<City />} />
        <Route path="area/*" element={<Area />} />
        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
