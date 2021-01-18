import moment from 'moment';
import { useObserver } from 'mobx-react-lite'
import { StoreContext, getStoreInstance } from '../../../../store'
import { withAuthentication } from '../../../../components/Authentication'
import { useContext, useState } from 'react';
import { isServer } from '../../../../utils';
import { Box, CircularProgress, Grid, Typography } from '@material-ui/core';
import { useStyles } from '../../../../styles/pages/Rents.styles';
import { withTranslation } from '../../../../utils/i18n';
import SendIcon from '@material-ui/icons/Send';
import Page from '../../../../components/Page';
import RentCard from '../../../../components/RentCard';

import MonthPicker from '../../../../components/MonthPicker';
import DashboardCard from '../../../../components/DashboardCard';
import { NumberFormat } from '../../../../utils/numberformat';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import ReceiptIcon from '@material-ui/icons/Receipt';
import { useRouter } from 'next/router';
import FullScreenDialogButton from '../../../../components/FullScreenDialogButton';
import RentTable from '../../../../components/RentTable';
import SearchFilterBar from '../../../../components/SearchFilterBar';

const PeriodToolbar = withTranslation()(({ t, onChange }) => {
  const router = useRouter();
  const rentPeriod = moment(router.query.yearMonth, 'YYYY.MM');
  return (
    <Grid
      container alignItems="center" spacing={2} wrap="nowrap">
      <Grid item>
        <Typography color="textSecondary" variant="h5" noWrap>
          {t('Rents')}
        </Typography>
      </Grid>
      <Grid item>
        <MonthPicker value={rentPeriod} onChange={onChange} />
      </Grid>
    </Grid>
  );
});

const ListToolbar = withTranslation()(({ t, onSearch }) => {
  return (
    <SearchFilterBar
      filters={[
        { id: '', label: t('All') },
        { id: 'notpaid', label: t('Not paid') },
        { id: 'partiallypaid', label: t('Partially paid') },
        { id: 'paid', label: t('Paid') },

      ]}
      onSearch={onSearch}
    />
  )
});

const Rents = withTranslation()(({ t }) => {
  console.log('Rents functional component')
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(false);
  const classes = useStyles();
  const router = useRouter();

  const onSearch = (status, searchText) => {
    store.rent.setFilters({ status, searchText });
  }

  const onPeriodChange = async period => {
    setLoading(true);
    try {
      store.rent.setPeriod(period);
      await router.push(`/${store.organization.selected.name}/rents/${store.rent.period}`);
    } finally {
      setLoading(false);
    }
  }

  const onEdit = async (rent) => {
    store.rent.setSelected(rent);
    await router.push(`/${store.organization.selected.name}/rents/${store.rent.period}/payment/${rent.occupant._id}`);
  };

  return useObserver(() => (
    <Page
      PrimaryToolbar={
        <PeriodToolbar onChange={onPeriodChange} />
      }
      SecondaryToolbar={
        <ListToolbar onSearch={onSearch} />
      }
    >
      <Grid container direction="column">
        {loading && (
          <Grid item xs={12}>
            <div className={classes.loading}>
              <CircularProgress />
            </div>
          </Grid>
        )}
        {!loading && (
          <Box pt={2}>
            <Grid container spacing={4}>
              <Grid item xs={9}>
                <Grid container spacing={3}>
                  {store.rent.filteredItems.map(rent => (
                    <Grid key={rent.uid} item sm={12} md={4}>
                      <RentCard rent={rent} onEdit={onEdit} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              <Grid item xs={3}>
                <Grid container direction="column" spacing={4}>
                  <Grid item>
                    <Box mb={2}>
                      <FullScreenDialogButton
                        variant="contained"
                        buttonLabel={t('Send document')}
                        startIcon={<SendIcon />}
                        dialogTitle={t('Send document')}
                        cancelButtonLabel={t('Close')}
                        showCancel
                        fullWidth
                      >
                        <RentTable />
                      </FullScreenDialogButton>
                    </Box>
                  </Grid>
                  <Grid item>
                    <DashboardCard
                      Icon={ReceiptIcon}
                      title={t('Rents')}
                      info={t('Rents of {{period}}', { period: store.rent._period.format('MMMM YYYY') })}
                    >
                      <Typography align="right" variant="h5">{store.rent.countAll}</Typography>
                    </DashboardCard>
                  </Grid>
                  <Grid item>
                    <DashboardCard
                      variant="success"
                      Icon={TrendingUpIcon}
                      title={t('Paid')}
                      info={t('{{count}} rents paid', { count: store.rent.countPaid + store.rent.countPartiallyPaid })}
                    >
                      <NumberFormat align="right" variant="h5" value={store.rent.totalPaid} />
                    </DashboardCard>
                  </Grid>
                  <Grid item>
                    <DashboardCard
                      variant="warning"
                      Icon={TrendingDownIcon}
                      title={t('Not paid')}
                      info={t('{{count}} rents not paid', { count: store.rent.countNotPaid })}
                    >
                      <NumberFormat align="right" variant="h5" value={store.rent.totalToPay} />
                    </DashboardCard>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}
      </Grid>
    </Page>
  ));
});

Rents.getInitialProps = async (context) => {
  console.log('Rents.getInitialProps')
  const store = isServer() ? context.store : getStoreInstance();

  if (isServer()) {
    const { yearMonth } = context.query;
    const rentPeriod = moment(yearMonth, 'YYYY.MM', true);
    if (!rentPeriod.isValid()) {
      return { error: { statusCode: 404 } };
    }
    store.rent.setPeriod(rentPeriod);
  }

  const fetchStatus = await store.rent.fetch();
  if (fetchStatus !== 200) {
    // TODO check error code to show a more detail error message
    return { error: { statusCode: 500 } };
  }

  return {
    initialState: {
      store: JSON.parse(JSON.stringify(store))
    }
  };
};

export default withAuthentication(Rents);