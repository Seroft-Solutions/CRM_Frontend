import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './call-type.reducer';

export const CallTypeDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const callTypeEntity = useAppSelector(state => state.callType.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="callTypeDetailsHeading">
          <Translate contentKey="crmBackendApp.callType.detail.title">CallType</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{callTypeEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.callType.name">Name</Translate>
            </span>
          </dt>
          <dd>{callTypeEntity.name}</dd>
          <dt>
            <span id="description">
              <Translate contentKey="crmBackendApp.callType.description">Description</Translate>
            </span>
          </dt>
          <dd>{callTypeEntity.description}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.callType.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{callTypeEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.callType.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{callTypeEntity.tenantId}</dd>
        </dl>
        <Button tag={Link} to="/call-type" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/call-type/${callTypeEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default CallTypeDetail;
