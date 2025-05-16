import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getCallTypes } from 'app/entities/call-type/call-type.reducer';
import { createEntity, getEntity, reset, updateEntity } from './sub-call-type.reducer';

export const SubCallTypeUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const callTypes = useAppSelector(state => state.callType.entities);
  const subCallTypeEntity = useAppSelector(state => state.subCallType.entity);
  const loading = useAppSelector(state => state.subCallType.loading);
  const updating = useAppSelector(state => state.subCallType.updating);
  const updateSuccess = useAppSelector(state => state.subCallType.updateSuccess);

  const handleClose = () => {
    navigate(`/sub-call-type${location.search}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getCallTypes({}));
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
      ...subCallTypeEntity,
      ...values,
      callType: callTypes.find(it => it.id.toString() === values.callType?.toString()),
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
          ...subCallTypeEntity,
          callType: subCallTypeEntity?.callType?.id,
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="crmBackendApp.subCallType.home.createOrEditLabel" data-cy="SubCallTypeCreateUpdateHeading">
            <Translate contentKey="crmBackendApp.subCallType.home.createOrEditLabel">Create or edit a SubCallType</Translate>
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
                  id="sub-call-type-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('crmBackendApp.subCallType.name')}
                id="sub-call-type-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('crmBackendApp.subCallType.description')}
                id="sub-call-type-description"
                name="description"
                data-cy="description"
                type="text"
              />
              <ValidatedField
                label={translate('crmBackendApp.subCallType.remark')}
                id="sub-call-type-remark"
                name="remark"
                data-cy="remark"
                type="textarea"
              />
              <ValidatedField
                label={translate('crmBackendApp.subCallType.tenantId')}
                id="sub-call-type-tenantId"
                name="tenantId"
                data-cy="tenantId"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                id="sub-call-type-callType"
                name="callType"
                data-cy="callType"
                label={translate('crmBackendApp.subCallType.callType')}
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
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/sub-call-type" replace color="info">
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

export default SubCallTypeUpdate;
