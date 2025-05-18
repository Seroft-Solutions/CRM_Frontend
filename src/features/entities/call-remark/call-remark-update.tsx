import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getCalls } from 'app/entities/call/call.reducer';
import { createEntity, getEntity, reset, updateEntity } from './call-remark.reducer';

export const CallRemarkUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const calls = useAppSelector(state => state.call.entities);
  const callRemarkEntity = useAppSelector(state => state.callRemark.entity);
  const loading = useAppSelector(state => state.callRemark.loading);
  const updating = useAppSelector(state => state.callRemark.updating);
  const updateSuccess = useAppSelector(state => state.callRemark.updateSuccess);

  const handleClose = () => {
    navigate(`/call-remark${location.search}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getCalls({}));
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
    values.dateTime = convertDateTimeToServer(values.dateTime);

    const entity = {
      ...callRemarkEntity,
      ...values,
      call: calls.find(it => it.id.toString() === values.call?.toString()),
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {
          dateTime: displayDefaultDateTime(),
        }
      : {
          ...callRemarkEntity,
          dateTime: convertDateTimeFromServer(callRemarkEntity.dateTime),
          call: callRemarkEntity?.call?.id,
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="crmBackendApp.callRemark.home.createOrEditLabel" data-cy="CallRemarkCreateUpdateHeading">
            <Translate contentKey="crmBackendApp.callRemark.home.createOrEditLabel">Create or edit a CallRemark</Translate>
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
                  id="call-remark-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('crmBackendApp.callRemark.remark')}
                id="call-remark-remark"
                name="remark"
                data-cy="remark"
                type="textarea"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('crmBackendApp.callRemark.dateTime')}
                id="call-remark-dateTime"
                name="dateTime"
                data-cy="dateTime"
                type="datetime-local"
                placeholder="YYYY-MM-DD HH:mm"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('crmBackendApp.callRemark.tenantId')}
                id="call-remark-tenantId"
                name="tenantId"
                data-cy="tenantId"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                id="call-remark-call"
                name="call"
                data-cy="call"
                label={translate('crmBackendApp.callRemark.call')}
                type="select"
              >
                <option value="" key="0" />
                {calls
                  ? calls.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/call-remark" replace color="info">
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

export default CallRemarkUpdate;
