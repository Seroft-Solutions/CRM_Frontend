import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './call-status.reducer';

export const CallStatusDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const callStatusEntity = useAppSelector(state => state.callStatus.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="callStatusDetailsHeading">
          <Translate contentKey="crmBackendApp.callStatus.detail.title">CallStatus</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{callStatusEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.callStatus.name">Name</Translate>
            </span>
          </dt>
          <dd>{callStatusEntity.name}</dd>
          <dt>
            <span id="description">
              <Translate contentKey="crmBackendApp.callStatus.description">Description</Translate>
            </span>
          </dt>
          <dd>{callStatusEntity.description}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.callStatus.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{callStatusEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.callStatus.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{callStatusEntity.tenantId}</dd>
        </dl>
        <Button tag={Link} to="/call-status" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/call-status/${callStatusEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default CallStatusDetail;
