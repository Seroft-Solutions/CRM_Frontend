import React from 'react';
import { Translate } from 'react-jhipster';

import MenuItem from 'app/shared/layout/menus/menu-item';

const EntitiesMenu = () => {
  return (
    <>
      {/* prettier-ignore */}
      <MenuItem icon="asterisk" to="/priority">
        <Translate contentKey="global.menu.entities.priority" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/call-type">
        <Translate contentKey="global.menu.entities.callType" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/sub-call-type">
        <Translate contentKey="global.menu.entities.subCallType" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/source">
        <Translate contentKey="global.menu.entities.source" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/call-category">
        <Translate contentKey="global.menu.entities.callCategory" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/party">
        <Translate contentKey="global.menu.entities.party" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/call-status">
        <Translate contentKey="global.menu.entities.callStatus" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/product">
        <Translate contentKey="global.menu.entities.product" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/channel-type">
        <Translate contentKey="global.menu.entities.channelType" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/call">
        <Translate contentKey="global.menu.entities.call" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/call-remark">
        <Translate contentKey="global.menu.entities.callRemark" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/state">
        <Translate contentKey="global.menu.entities.state" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/district">
        <Translate contentKey="global.menu.entities.district" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/city">
        <Translate contentKey="global.menu.entities.city" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/area">
        <Translate contentKey="global.menu.entities.area" />
      </MenuItem>
      {/* jhipster-needle-add-entity-to-menu - JHipster will add entities to the menu here */}
    </>
  );
};

export default EntitiesMenu;
