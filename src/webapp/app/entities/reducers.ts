import priority from 'app/entities/priority/priority.reducer';
import callType from 'app/entities/call-type/call-type.reducer';
import subCallType from 'app/entities/sub-call-type/sub-call-type.reducer';
import source from 'app/entities/source/source.reducer';
import callCategory from 'app/entities/call-category/call-category.reducer';
import party from 'app/entities/party/party.reducer';
import callStatus from 'app/entities/call-status/call-status.reducer';
import product from 'app/entities/product/product.reducer';
import channelType from 'app/entities/channel-type/channel-type.reducer';
import call from 'app/entities/call/call.reducer';
import callRemark from 'app/entities/call-remark/call-remark.reducer';
import state from 'app/entities/state/state.reducer';
import district from 'app/entities/district/district.reducer';
import city from 'app/entities/city/city.reducer';
import area from 'app/entities/area/area.reducer';
/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  priority,
  callType,
  subCallType,
  source,
  callCategory,
  party,
  callStatus,
  product,
  channelType,
  call,
  callRemark,
  state,
  district,
  city,
  area,
  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
