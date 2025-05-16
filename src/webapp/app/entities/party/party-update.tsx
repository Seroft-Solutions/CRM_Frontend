import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getCities } from 'app/entities/city/city.reducer';
import { createEntity, getEntity, reset, updateEntity } from './party.reducer';

export const PartyUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const cities = useAppSelector(state => state.city.entities);
  const partyEntity = useAppSelector(state => state.party.entity);
  const loading = useAppSelector(state => state.party.loading);
  const updating = useAppSelector(state => state.party.updating);
  const updateSuccess = useAppSelector(state => state.party.updateSuccess);

  const handleClose = () => {
    navigate(`/party${location.search}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getCities({}));
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    if (values.id !== undefined && typeof values.id !== 'number') {
      values.id = Number(values.id);
    }

    const entity = {
      ...partyEntity,
      ...values,
      city: cities.find(it => it.id.toString() === values.city?.toString()),
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...partyEntity,
          city: partyEntity?.city?.id,
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="crmBackendApp.party.home.createOrEditLabel" data-cy="PartyCreateUpdateHeading">
            <Translate contentKey="crmBackendApp.party.home.createOrEditLabel">Create or edit a Party</Translate>
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="party-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('crmBackendApp.party.name')}
                id="party-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('crmBackendApp.party.mobile')}
                id="party-mobile"
                name="mobile"
                data-cy="mobile"
                type="text"
              />
              <ValidatedField label={translate('crmBackendApp.party.email')} id="party-email" name="email" data-cy="email" type="text" />
              <ValidatedField
                label={translate('crmBackendApp.party.whatsApp')}
                id="party-whatsApp"
                name="whatsApp"
                data-cy="whatsApp"
                type="text"
              />
              <ValidatedField
                label={translate('crmBackendApp.party.contactPerson')}
                id="party-contactPerson"
                name="contactPerson"
                data-cy="contactPerson"
                type="text"
              />
              <ValidatedField
                label={translate('crmBackendApp.party.address1')}
                id="party-address1"
                name="address1"
                data-cy="address1"
                type="text"
              />
              <ValidatedField
                label={translate('crmBackendApp.party.address2')}
                id="party-address2"
                name="address2"
                data-cy="address2"
                type="text"
              />
              <ValidatedField
                label={translate('crmBackendApp.party.address3')}
                id="party-address3"
                name="address3"
                data-cy="address3"
                type="text"
              />
              <ValidatedField
                label={translate('crmBackendApp.party.remark')}
                id="party-remark"
                name="remark"
                data-cy="remark"
                type="textarea"
              />
              <ValidatedField
                label={translate('crmBackendApp.party.tenantId')}
                id="party-tenantId"
                name="tenantId"
                data-cy="tenantId"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField id="party-city" name="city" data-cy="city" label={translate('crmBackendApp.party.city')} type="select">
                <option value="" key="0" />
                {cities
                  ? cities.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/party" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PartyUpdate;
