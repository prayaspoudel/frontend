import { Breadcrumbs, Grid, Paper, Typography } from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../../store';
import { memo, useCallback, useContext, useState } from 'react';

import { ADMIN_ROLE } from '../../../../store/User';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { isServer } from '../../../../utils';
import LeaseForm from '../../../../components/organization/LeaseForm';
import LeaseTemplatesCard from '../../../../components/organization/LeaseTemplatesCard';
import Link from '../../../../components/Link';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import RequestError from '../../../../components/RequestError';
import { RestrictButton } from '../../../../components/RestrictedComponents';
import router from 'next/router';
import { toJS } from 'mobx';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

const BreadcrumbBar = memo(function BreadcrumbBar({
  backPath,
  currentPageName,
}) {
  const { t } = useTranslation('common');

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link color="inherit" href={backPath}>
        {t('Settings')}
      </Link>
      <Typography variant="h6" noWrap>
        {currentPageName}
      </Typography>
    </Breadcrumbs>
  );
});

const Lease = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [error, setError] = useState('');
  const [removeLease, setRemoveLease] = useState(false);

  const onLeaseAddUpdate = useCallback(
    async (leasePart) => {
      setError('');

      const lease = {
        ...store.lease.selected,
        ...leasePart,
      };

      let status;
      if (!store.lease.selected._id) {
        const response = await store.lease.create(lease);
        status = response.status;
      } else {
        const response = await store.lease.update(lease);
        status = response.status;
      }

      if (status !== 200) {
        switch (status) {
          case 422:
            return setError(t('Some fields are missing'));
          case 403:
            return setError(t('You are not allowed to update the lease'));
          case 404:
            return setError(t('Lease is not found'));
          case 409:
            return setError(t('The lease already exists'));
          default:
            return setError(t('Something went wrong'));
        }
      }
    },
    [setError]
  );

  const onLeaseRemove = useCallback(async () => {
    const { status } = await store.lease.delete([store.lease.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return setError(
            t('One lease is used by tenants, it cannot be removed')
          );
        case 403:
          return setError(t('You are not allowed to update the lease'));
        default:
          return setError(t('Something went wrong'));
      }
    }
    router.push(`/${store.organization.selected.name}/settings#leases`);
  }, [setError]);

  return (
    <Page
      PrimaryToolbar={
        <BreadcrumbBar
          currentPageName={store.lease.selected?.name || t('New lease')}
          backPath={`/${store.organization.selected.name}/settings#leases`}
        />
      }
      SecondaryToolbar={
        <RestrictButton
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={() => setRemoveLease(true)}
          disabled={
            store.lease.selected?.usedByTenants || store.lease.selected?.system
          }
          disabledTooltipTitle={
            store.lease.selected?.usedByTenants
              ? t('Lease currently used in tenant contracts')
              : store.lease.selected?.system
              ? t('System lease cannot be removed')
              : ''
          }
          onlyRoles={[ADMIN_ROLE]}
        >
          {t('Delete')}
        </RestrictButton>
      }
    >
      <RequestError error={error} />
      <Grid container spacing={5}>
        <Grid item sm={12} md={8}>
          <Paper>
            <LeaseForm onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
          </Paper>
        </Grid>
        <Grid item sm={12} md={4}>
          <LeaseTemplatesCard />
        </Grid>
      </Grid>
      <ConfirmDialog
        title={t('Are you sure to remove this lease?')}
        subTitle={store.lease.selected?.name}
        open={removeLease}
        setOpen={setRemoveLease}
        onConfirm={onLeaseRemove}
      />
    </Page>
  );
});

Lease.getInitialProps = async (context) => {
  console.log('Lease.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();
  const { leaseId } = context.query;

  const responses = await Promise.all([
    store.lease.fetchOne(leaseId),
    store.template.fetch(),
    store.template.fetchFields(),
  ]);

  const errorStatusCode = responses.find(({ status }) => status !== 200);

  if (errorStatusCode) {
    return { error: { statusCode: errorStatusCode } };
  }

  const [leaseResponse] = responses;
  const { data: lease } = leaseResponse;
  store.lease.setSelected(lease);

  return {
    initialState: {
      store: toJS(store),
    },
  };
};

export default withAuthentication(Lease);