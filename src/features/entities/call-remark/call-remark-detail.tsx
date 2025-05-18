import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { TextFormat, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './call-remark.reducer';

export const CallRemarkDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const callRemarkEntity = useAppSelector(state => state.callRemark.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="callRemarkDetailsHeading">
          <Translate contentKey="crmBackendApp.callRemark.detail.title">CallRemark</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{callRemarkEntity.id}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.callRemark.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{callRemarkEntity.remark}</dd>
          <dt>
            <span id="dateTime">
              <Translate contentKey="crmBackendApp.callRemark.dateTime">Date Time</Translate>
            </span>
          </dt>
          <dd>
            {callRemarkEntity.dateTime ? <TextFormat value={callRemarkEntity.dateTime} type="date" format={APP_DATE_FORMAT} /> : null}
          </dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.callRemark.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{callRemarkEntity.tenantId}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.callRemark.call">Call</Translate>
          </dt>
          <dd>{callRemarkEntity.call ? callRemarkEntity.call.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/call-remark" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/call-remark/${callRemarkEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default CallRemarkDetail;
