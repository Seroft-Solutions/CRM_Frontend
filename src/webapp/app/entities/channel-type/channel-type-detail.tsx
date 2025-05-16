import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './channel-type.reducer';

export const ChannelTypeDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const channelTypeEntity = useAppSelector(state => state.channelType.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="channelTypeDetailsHeading">
          <Translate contentKey="crmBackendApp.channelType.detail.title">ChannelType</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{channelTypeEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.channelType.name">Name</Translate>
            </span>
          </dt>
          <dd>{channelTypeEntity.name}</dd>
          <dt>
            <span id="description">
              <Translate contentKey="crmBackendApp.channelType.description">Description</Translate>
            </span>
          </dt>
          <dd>{channelTypeEntity.description}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.channelType.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{channelTypeEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.channelType.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{channelTypeEntity.tenantId}</dd>
        </dl>
        <Button tag={Link} to="/channel-type" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/channel-type/${channelTypeEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default ChannelTypeDetail;
