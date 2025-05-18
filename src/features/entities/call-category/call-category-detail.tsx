import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './call-category.reducer';

export const CallCategoryDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const callCategoryEntity = useAppSelector(state => state.callCategory.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="callCategoryDetailsHeading">
          <Translate contentKey="crmBackendApp.callCategory.detail.title">CallCategory</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{callCategoryEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.callCategory.name">Name</Translate>
            </span>
          </dt>
          <dd>{callCategoryEntity.name}</dd>
          <dt>
            <span id="description">
              <Translate contentKey="crmBackendApp.callCategory.description">Description</Translate>
            </span>
          </dt>
          <dd>{callCategoryEntity.description}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.callCategory.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{callCategoryEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.callCategory.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{callCategoryEntity.tenantId}</dd>
        </dl>
        <Button tag={Link} to="/call-category" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/call-category/${callCategoryEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default CallCategoryDetail;
