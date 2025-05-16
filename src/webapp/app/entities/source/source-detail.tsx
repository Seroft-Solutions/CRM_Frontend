import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './source.reducer';

export const SourceDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const sourceEntity = useAppSelector(state => state.source.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="sourceDetailsHeading">
          <Translate contentKey="crmBackendApp.source.detail.title">Source</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{sourceEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.source.name">Name</Translate>
            </span>
          </dt>
          <dd>{sourceEntity.name}</dd>
          <dt>
            <span id="description">
              <Translate contentKey="crmBackendApp.source.description">Description</Translate>
            </span>
          </dt>
          <dd>{sourceEntity.description}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.source.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{sourceEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.source.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{sourceEntity.tenantId}</dd>
        </dl>
        <Button tag={Link} to="/source" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/source/${sourceEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default SourceDetail;
