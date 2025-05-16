import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './call.reducer';

export const CallDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const callEntity = useAppSelector(state => state.call.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="callDetailsHeading">
          <Translate contentKey="crmBackendApp.call.detail.title">Call</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{callEntity.id}</dd>
          <dt>
            <span id="status">
              <Translate contentKey="crmBackendApp.call.status">Status</Translate>
            </span>
          </dt>
          <dd>{callEntity.status}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.call.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{callEntity.tenantId}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.assignedTo">Assigned To</Translate>
          </dt>
          <dd>{callEntity.assignedTo ? callEntity.assignedTo.login : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.channelParty">Channel Party</Translate>
          </dt>
          <dd>{callEntity.channelParty ? callEntity.channelParty.login : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.priority">Priority</Translate>
          </dt>
          <dd>{callEntity.priority ? callEntity.priority.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.callType">Call Type</Translate>
          </dt>
          <dd>{callEntity.callType ? callEntity.callType.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.subCallType">Sub Call Type</Translate>
          </dt>
          <dd>{callEntity.subCallType ? callEntity.subCallType.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.source">Source</Translate>
          </dt>
          <dd>{callEntity.source ? callEntity.source.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.area">Area</Translate>
          </dt>
          <dd>{callEntity.area ? callEntity.area.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.party">Party</Translate>
          </dt>
          <dd>{callEntity.party ? callEntity.party.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.product">Product</Translate>
          </dt>
          <dd>{callEntity.product ? callEntity.product.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.channelType">Channel Type</Translate>
          </dt>
          <dd>{callEntity.channelType ? callEntity.channelType.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.callCategory">Call Category</Translate>
          </dt>
          <dd>{callEntity.callCategory ? callEntity.callCategory.id : ''}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.call.callStatus">Call Status</Translate>
          </dt>
          <dd>{callEntity.callStatus ? callEntity.callStatus.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/call" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/call/${callEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default CallDetail;
