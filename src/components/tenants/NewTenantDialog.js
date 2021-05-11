import * as Yup from 'yup';
import React, { useContext, useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { Form, Formik } from 'formik';
import { withTranslation } from '../../utils/i18n';
import { Box, DialogTitle } from '@material-ui/core';
import {
  CheckboxField,
  FormTextField,
  SelectField,
  SubmitButton,
} from '../Form';
import { StoreContext } from '../../store';
import { toJS } from 'mobx';
import RequestError from '../RequestError';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCopyFrom: Yup.boolean(),
  copyFrom: Yup.mixed().when('isCopyFrom', {
    is: true,
    then: Yup.string().required(),
  }),
});

const initialValues = {
  name: '',
  copyFrom: '',
  isCopyFrom: false,
};

const NewTenantDialog = withTranslation()(({ t, open, setOpen, onConfirm }) => {
  const store = useContext(StoreContext);
  const [error, setError] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const _onSubmit = async (tenantPart) => {
    let tenant = {
      name: tenantPart.name,
      company: tenantPart.name,
    };
    if (tenantPart.isCopyFrom) {
      const {
        _id,
        reference,
        name,
        manager,
        terminated,
        beginDate,
        endDate,
        terminationDate,
        properties,
        discount,
        guaranty,
        ...originalTenant
      } = toJS(
        store.tenant.items.find(({ _id }) => tenantPart.copyFrom === _id)
      );

      tenant = {
        ...originalTenant,
        ...tenant,
      };
    }

    const { status, data } = await store.tenant.create(tenant);
    if (status !== 200) {
      switch (status) {
        case 422:
          return setError(t('Tenant name is missing.'));
        case 403:
          return setError(t('You are not allowed to create a tenant.'));
        case 409:
          return setError(t('The tenant already exists.'));
        default:
          return setError(t('Something went wrong'));
      }
    }

    handleClose(false);
    await onConfirm(data);
  };

  const tenants = store.tenant.items
    // remove duplicates from tenant list
    .filter((tenant, index, tenants) => {
      return (
        tenants.findIndex(
          (currentTenant) => currentTenant.name === tenant.name
        ) === index
      );
    })
    // transform to use it in select field
    .map(({ _id, name }) => {
      return { id: _id, label: name, value: _id };
    });

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="new-tenant-dialog"
    >
      <DialogTitle>{t('Create a new tenant')}</DialogTitle>
      <Box p={1}>
        <RequestError error={error} />
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ values, isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <FormTextField label={t('Name')} name="name" />
                  {!!tenants.length && (
                    <>
                      <CheckboxField
                        name="isCopyFrom"
                        label={t('Copy information from an existing tenant')}
                        aria-label={t(
                          'Copy information from an existing tenant'
                        )}
                      />
                      {values.isCopyFrom && (
                        <SelectField
                          name="copyFrom"
                          label={t('Tenant')}
                          values={tenants}
                        />
                      )}
                    </>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Create') : t('Creating tenant')}
                  />
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Box>
    </Dialog>
  );
});

export default NewTenantDialog;
