import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './party.reducer';

export const PartyDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const partyEntity = useAppSelector(state => state.party.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="partyDetailsHeading">
          <Translate contentKey="crmBackendApp.party.detail.title">Party</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{partyEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="crmBackendApp.party.name">Name</Translate>
            </span>
          </dt>
          <dd>{partyEntity.name}</dd>
          <dt>
            <span id="mobile">
              <Translate contentKey="crmBackendApp.party.mobile">Mobile</Translate>
            </span>
          </dt>
          <dd>{partyEntity.mobile}</dd>
          <dt>
            <span id="email">
              <Translate contentKey="crmBackendApp.party.email">Email</Translate>
            </span>
          </dt>
          <dd>{partyEntity.email}</dd>
          <dt>
            <span id="whatsApp">
              <Translate contentKey="crmBackendApp.party.whatsApp">Whats App</Translate>
            </span>
          </dt>
          <dd>{partyEntity.whatsApp}</dd>
          <dt>
            <span id="contactPerson">
              <Translate contentKey="crmBackendApp.party.contactPerson">Contact Person</Translate>
            </span>
          </dt>
          <dd>{partyEntity.contactPerson}</dd>
          <dt>
            <span id="address1">
              <Translate contentKey="crmBackendApp.party.address1">Address 1</Translate>
            </span>
          </dt>
          <dd>{partyEntity.address1}</dd>
          <dt>
            <span id="address2">
              <Translate contentKey="crmBackendApp.party.address2">Address 2</Translate>
            </span>
          </dt>
          <dd>{partyEntity.address2}</dd>
          <dt>
            <span id="address3">
              <Translate contentKey="crmBackendApp.party.address3">Address 3</Translate>
            </span>
          </dt>
          <dd>{partyEntity.address3}</dd>
          <dt>
            <span id="remark">
              <Translate contentKey="crmBackendApp.party.remark">Remark</Translate>
            </span>
          </dt>
          <dd>{partyEntity.remark}</dd>
          <dt>
            <span id="tenantId">
              <Translate contentKey="crmBackendApp.party.tenantId">Tenant Id</Translate>
            </span>
          </dt>
          <dd>{partyEntity.tenantId}</dd>
          <dt>
            <Translate contentKey="crmBackendApp.party.city">City</Translate>
          </dt>
          <dd>{partyEntity.city ? partyEntity.city.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/party" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/party/${partyEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default PartyDetail;
