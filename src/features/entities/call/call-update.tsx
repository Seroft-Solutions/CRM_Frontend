import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getUsers } from 'app/shared/reducers/user-management';
import { getEntities as getPriorities } from 'app/entities/priority/priority.reducer';
import { getEntities as getCallTypes } from 'app/entities/call-type/call-type.reducer';
import { getEntities as getSubCallTypes } from 'app/entities/sub-call-type/sub-call-type.reducer';
import { getEntities as getSources } from 'app/entities/source/source.reducer';
import { getEntities as getCities } from 'app/entities/city/city.reducer';
import { getEntities as getParties } from 'app/entities/party/party.reducer';
import { getEntities as getProducts } from 'app/entities/product/product.reducer';
import { getEntities as getChannelTypes } from 'app/entities/channel-type/channel-type.reducer';
import { getEntities as getCallCategories } from 'app/entities/call-category/call-category.reducer';
import { getEntities as getCallStatuses } from 'app/entities/call-status/call-status.reducer';
import { Status } from 'app/shared/model/enumerations/status.model';
import { createEntity, getEntity, reset, updateEntity } from './call.reducer';

export const CallUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const users = useAppSelector(state => state.userManagement.users);
  const priorities = useAppSelector(state => state.priority.entities);
  const callTypes = useAppSelector(state => state.callType.entities);
  const subCallTypes = useAppSelector(state => state.subCallType.entities);
  const sources = useAppSelector(state => state.source.entities);
  const cities = useAppSelector(state => state.city.entities);
  const parties = useAppSelector(state => state.party.entities);
  const products = useAppSelector(state => state.product.entities);
  const channelTypes = useAppSelector(state => state.channelType.entities);
  const callCategories = useAppSelector(state => state.callCategory.entities);
  const callStatuses = useAppSelector(state => state.callStatus.entities);
  const callEntity = useAppSelector(state => state.call.entity);
  const loading = useAppSelector(state => state.call.loading);
  const updating = useAppSelector(state => state.call.updating);
  const updateSuccess = useAppSelector(state => state.call.updateSuccess);
  const statusValues = Object.keys(Status);

  const handleClose = () => {
    navigate(`/call${location.search}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getUsers({}));
    dispatch(getPriorities({}));
    dispatch(getCallTypes({}));
    dispatch(getSubCallTypes({}));
    dispatch(getSources({}));
    dispatch(getCities({}));
    dispatch(getParties({}));
    dispatch(getProducts({}));
    dispatch(getChannelTypes({}));
    dispatch(getCallCategories({}));
    dispatch(getCallStatuses({}));
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
      ...callEntity,
      ...values,
      assignedTo: users.find(it => it.id.toString() === values.assignedTo?.toString()),
      channelParty: users.find(it => it.id.toString() === values.channelParty?.toString()),
      priority: priorities.find(it => it.id.toString() === values.priority?.toString()),
      callType: callTypes.find(it => it.id.toString() === values.callType?.toString()),
      subCallType: subCallTypes.find(it => it.id.toString() === values.subCallType?.toString()),
      source: sources.find(it => it.id.toString() === values.source?.toString()),
      area: cities.find(it => it.id.toString() === values.area?.toString()),
      party: parties.find(it => it.id.toString() === values.party?.toString()),
      product: products.find(it => it.id.toString() === values.product?.toString()),
      channelType: channelTypes.find(it => it.id.toString() === values.channelType?.toString()),
      callCategory: callCategories.find(it => it.id.toString() === values.callCategory?.toString()),
      callStatus: callStatuses.find(it => it.id.toString() === values.callStatus?.toString()),
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
          status: 'DRAFT',
          ...callEntity,
          assignedTo: callEntity?.assignedTo?.id,
          channelParty: callEntity?.channelParty?.id,
          priority: callEntity?.priority?.id,
          callType: callEntity?.callType?.id,
          subCallType: callEntity?.subCallType?.id,
          source: callEntity?.source?.id,
          area: callEntity?.area?.id,
          party: callEntity?.party?.id,
          product: callEntity?.product?.id,
          channelType: callEntity?.channelType?.id,
          callCategory: callEntity?.callCategory?.id,
          callStatus: callEntity?.callStatus?.id,
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="crmBackendApp.call.home.createOrEditLabel" data-cy="CallCreateUpdateHeading">
            <Translate contentKey="crmBackendApp.call.home.createOrEditLabel">Create or edit a Call</Translate>
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
                  id="call-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField label={translate('crmBackendApp.call.status')} id="call-status" name="status" data-cy="status" type="select">
                {statusValues.map(status => (
                  <option value={status} key={status}>
                    {translate(`crmBackendApp.Status.${status}`)}
                  </option>
                ))}
              </ValidatedField>
              <ValidatedField
                label={translate('crmBackendApp.call.tenantId')}
                id="call-tenantId"
                name="tenantId"
                data-cy="tenantId"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                id="call-assignedTo"
                name="assignedTo"
                data-cy="assignedTo"
                label={translate('crmBackendApp.call.assignedTo')}
                type="select"
              >
                <option value="" key="0" />
                {users
                  ? users.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.login}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-channelParty"
                name="channelParty"
                data-cy="channelParty"
                label={translate('crmBackendApp.call.channelParty')}
                type="select"
              >
                <option value="" key="0" />
                {users
                  ? users.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.login}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-priority"
                name="priority"
                data-cy="priority"
                label={translate('crmBackendApp.call.priority')}
                type="select"
              >
                <option value="" key="0" />
                {priorities
                  ? priorities.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-callType"
                name="callType"
                data-cy="callType"
                label={translate('crmBackendApp.call.callType')}
                type="select"
              >
                <option value="" key="0" />
                {callTypes
                  ? callTypes.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-subCallType"
                name="subCallType"
                data-cy="subCallType"
                label={translate('crmBackendApp.call.subCallType')}
                type="select"
              >
                <option value="" key="0" />
                {subCallTypes
                  ? subCallTypes.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField id="call-source" name="source" data-cy="source" label={translate('crmBackendApp.call.source')} type="select">
                <option value="" key="0" />
                {sources
                  ? sources.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField id="call-area" name="area" data-cy="area" label={translate('crmBackendApp.call.area')} type="select">
                <option value="" key="0" />
                {cities
                  ? cities.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField id="call-party" name="party" data-cy="party" label={translate('crmBackendApp.call.party')} type="select">
                <option value="" key="0" />
                {parties
                  ? parties.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-product"
                name="product"
                data-cy="product"
                label={translate('crmBackendApp.call.product')}
                type="select"
              >
                <option value="" key="0" />
                {products
                  ? products.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-channelType"
                name="channelType"
                data-cy="channelType"
                label={translate('crmBackendApp.call.channelType')}
                type="select"
              >
                <option value="" key="0" />
                {channelTypes
                  ? channelTypes.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-callCategory"
                name="callCategory"
                data-cy="callCategory"
                label={translate('crmBackendApp.call.callCategory')}
                type="select"
              >
                <option value="" key="0" />
                {callCategories
                  ? callCategories.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="call-callStatus"
                name="callStatus"
                data-cy="callStatus"
                label={translate('crmBackendApp.call.callStatus')}
                type="select"
              >
                <option value="" key="0" />
                {callStatuses
                  ? callStatuses.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/call" replace color="info">
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

export default CallUpdate;
