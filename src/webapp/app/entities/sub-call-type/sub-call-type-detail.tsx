import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './sub-call-type.reducer';

export const SubCallTypeDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const subCallTypeEntity = useAppSelector(state => state.subCallType.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="subCallTypeDetailsHeading">
          <Translate contentKey="crmBackendApp.subCallType.detail.title">SubCallType</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{subCallTypeEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.subCallType.name">Name</Translate>
            </span>
          </dt>
          <dd>{subCallTypeEntity.name}</dd>
          <dt>
            <span id="description">
              <Translate contentKey="crmBackendApp.subCallType.description">Description</Translate>
            </span>
          </dt>
          <dd>{subCallTypeEntity.description}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.subCallType.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{subCallTypeEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.subCallType.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{subCallTypeEntity.tenantId}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.subCallType.callType">Call Type</Translate>
          </dt>
          <dd>{subCallTypeEntity.callType ? subCallTypeEntity.callType.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/sub-call-type" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/sub-call-type/${subCallTypeEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default SubCallTypeDetail;
