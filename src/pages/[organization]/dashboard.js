import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Box,
  Button,
  Grid,
  Hidden,
  List,
  ListItem,
  Paper,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { NumberFormat, useFormatNumber } from '../../utils/numberformat';
import { StoreContext, getStoreInstance } from '../../store';
import { useCallback, useContext, useMemo, useState } from 'react';

import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import { DashboardCard } from '../../components/Cards';
import DescriptionIcon from '@material-ui/icons/Description';
import NewLeaseDialog from '../../components/organization/NewLeaseDialog';
import NewPaymentDialog from '../../components/payment/NewPaymentDialog';
import NewPropertyDialog from '../../components/properties/NewPropertyDialog';
import NewTenantDialog from '../../components/tenants/NewTenantDialog';
import Page from '../../components/Page';
import PeopleIcon from '@material-ui/icons/People';
import ReceiptIcon from '@material-ui/icons/Receipt';
import StopIcon from '@material-ui/icons/Stop';
import TenantAvatar from '../../components/tenants/TenantAvatar';
import TerminateLeaseDialog from '../../components/tenants/TerminateLeaseDialog';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { isServer } from '../../utils';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import { useTheme } from '@material-ui/styles';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../components/Authentication';

const FigureCardContent = ({ nav, children }) => (
  <Box position="relative">
    <Box
      height={150}
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="success.dark"
    >
      {children}
    </Box>
    {nav && (
      <Box position="absolute" bottom={0} right={0} fontSize={30}>
        <ArrowRightAltIcon fontSize="inherit" color="action" />
      </Box>
    )}
  </Box>
);

const TenantListItem = ({ tenant, balance, onClick }) => (
  <ListItem button onClick={onClick}>
    <Box display="flex" alignItems="center" width="100%">
      <Box mr={1}>
        <TenantAvatar tenant={tenant} />
      </Box>
      <Box flexGrow={1}>
        <Typography>{tenant.name}</Typography>
      </Box>
      <NumberFormat value={balance} withColor variant="h6" />
    </Box>
  </ListItem>
);

const Shortcuts = () => {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);
  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [openTerminateLease, setOpenTerminateLease] = useState(false);
  const useStyles = makeStyles(() => ({
    root: {
      paddingTop: 10,
      paddingBottom: 10,
    },
  }));
  const classes = useStyles();

  const onCreateTenant = useCallback(
    async (tenant) => {
      store.tenant.setSelected(tenant);
      await router.push(
        `/${store.organization.selected.name}/tenants/${tenant._id}`
      );
    },
    [store.organization.selected.name, store.tenant]
  );

  const onCreateProperty = useCallback(
    async (property) => {
      store.property.setSelected(property);
      await router.push(
        `/${store.organization.selected.name}/properties/${property._id}`
      );
    },
    [store.organization.selected.name, store.property]
  );

  const onCreateLease = useCallback(
    async (lease) => {
      store.lease.setSelected(lease);
      await router.push(
        `/${store.organization.selected.name}/settings/lease/${lease._id}`
      );
    },
    [store.lease, store.organization.selected.name]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Tooltip
          title={t(
            'Cannot enter a payment without renting a property to a tenant'
          )}
          aria-label={t(
            'Cannot enter a payment without renting a property to a tenant'
          )}
          disableHoverListener={!!store.dashboard.data?.overview?.tenantCount}
        >
          <span>
            <Button
              startIcon={<ReceiptIcon style={{ fontSize: 30 }} />}
              variant="outlined"
              size="large"
              className={classes.root}
              fullWidth
              disabled={!store.dashboard.data?.overview?.tenantCount}
              onClick={() => setOpenNewPaymentDialog(true)}
            >
              {t('Enter a rent payment')}
            </Button>
          </span>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          startIcon={<PeopleIcon style={{ fontSize: 30 }} />}
          variant="outlined"
          size="large"
          className={classes.root}
          fullWidth
          onClick={() => setOpenNewTenantDialog(true)}
        >
          {t('Create a new tenant')}
        </Button>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          startIcon={<StopIcon style={{ fontSize: 30 }} />}
          variant="outlined"
          size="large"
          className={classes.root}
          fullWidth
          onClick={() => setOpenTerminateLease(true)}
        >
          {t('Terminate a contract')}
        </Button>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          startIcon={<VpnKeyIcon style={{ fontSize: 30 }} />}
          variant="outlined"
          size="large"
          className={classes.root}
          fullWidth
          onClick={() => setOpenNewPropertyDialog(true)}
        >
          {t('Create a new property')}
        </Button>
      </Grid>
      <Hidden xsDown>
        <Grid item sm={6}></Grid>
      </Hidden>
      <Grid item xs={12} sm={6}>
        <Button
          startIcon={<DescriptionIcon style={{ fontSize: 30 }} />}
          variant="outlined"
          size="large"
          className={classes.root}
          fullWidth
          onClick={() => setOpenNewLeaseDialog(true)}
        >
          {t('Create a new lease')}
        </Button>
      </Grid>

      <NewTenantDialog
        open={openNewTenantDialog}
        setOpen={setOpenNewTenantDialog}
        onConfirm={onCreateTenant}
      />
      <NewPropertyDialog
        open={openNewPropertyDialog}
        setOpen={setOpenNewPropertyDialog}
        onConfirm={onCreateProperty}
      />
      <NewLeaseDialog
        open={openNewLeaseDialog}
        setOpen={setOpenNewLeaseDialog}
        onConfirm={onCreateLease}
      />
      <NewPaymentDialog
        open={openNewPaymentDialog}
        setOpen={setOpenNewPaymentDialog}
      />
      <TerminateLeaseDialog
        open={openTerminateLease}
        setOpen={setOpenTerminateLease}
        tenantList={store.tenant.items.filter((t) => !t.terminated)}
      />
    </Grid>
  );
};

const GeneralFigures = () => {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <Grid container spacing={5}>
      <Grid item xs={12} md={3}>
        <DashboardCard
          title={t('Tenant under contract')}
          onClick={() => {
            router.push(`/${store.organization.selected.name}/tenants`);
          }}
        >
          <FigureCardContent nav>
            <Typography variant="h3">
              {store.dashboard.data.overview?.tenantCount}
            </Typography>
          </FigureCardContent>
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={3}>
        <DashboardCard
          title={t('Property')}
          onClick={() => {
            router.push(`/${store.organization.selected.name}/properties`);
          }}
        >
          <FigureCardContent nav>
            <Typography variant="h3">
              {store.dashboard.data.overview?.propertyCount}
            </Typography>
          </FigureCardContent>
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={3}>
        <DashboardCard title={t('Occupancy rate')}>
          <FigureCardContent>
            <NumberFormat
              value={store.dashboard.data.overview?.occupancyRate}
              style="percent"
              variant="h3"
            />
          </FigureCardContent>
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={3}>
        <DashboardCard title={t('Revenues')}>
          <FigureCardContent>
            <NumberFormat
              value={store.dashboard.data.overview?.totalYearRevenues}
              variant="h3"
            />
          </FigureCardContent>
        </DashboardCard>
      </Grid>
    </Grid>
  );
};

const MonthFigures = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const theme = useTheme();
  const formatNumber = useFormatNumber();

  const data = useMemo(() => {
    const currentRevenues = store.dashboard.currentRevenues;
    return [
      {
        name: 'paid',
        value: currentRevenues.paid,
        yearMonth: moment().format('YYYY.MM'),
        status: 'paid',
      },
      {
        name: 'notPaid',
        value: currentRevenues.notPaid,
        yearMonth: moment().format('YYYY.MM'),
        status: 'notpaid',
      },
    ];
  }, [store.dashboard.currentRevenues]);

  return (
    <>
      <Box mb={3}>
        <Typography variant="h5">
          {t('Rents of {{monthYear}}', {
            monthYear: moment().format('MMMM YYYY'),
          })}
        </Typography>
      </Box>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={5}>
          <Box mb={1}>
            <Typography variant="subtitle1">{t('Payments')}</Typography>
          </Box>
          <Paper>
            <Box pt={2} width="100%" height={296}>
              <ResponsiveContainer>
                <PieChart>
                  <Legend
                    verticalAlign="top"
                    formatter={(value) =>
                      value === 'paid' ? t('Rent paid') : t('Rent unpaid')
                    }
                  />
                  <Pie
                    data={data}
                    startAngle={180}
                    endAngle={0}
                    cy="70%"
                    paddingAngle={2}
                    dataKey="value"
                    innerRadius="55%"
                    cursor="pointer"
                    onClick={(data) => {
                      if (!data?.payload) {
                        return;
                      }
                      const {
                        payload: { yearMonth, status },
                      } = data;
                      router.push(
                        `/${store.organization.selected.name}/rents/${yearMonth}?status=${status}`
                      );
                    }}
                    label={({ value }) => (value ? formatNumber(value) : '')}
                    labelLine={false}
                  >
                    <Cell fill={theme.palette.success.dark} />
                    <Cell fill={theme.palette.warning.main} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={7}>
          <Box mb={1}>
            <Typography variant="subtitle1">
              {t('Top 5 unpaid rents')}
            </Typography>
          </Box>
          <Paper>
            <List style={{ minHeight: 296 }}>
              {store.dashboard.data.topUnpaid?.map(
                ({ tenant, balance, rent }) => (
                  <TenantListItem
                    key={nanoid()}
                    tenant={tenant}
                    balance={balance}
                    onClick={() => {
                      store.rent.setSelected(rent);
                      router.push(
                        `/${store.organization.selected.name}/payment/${tenant._id}/${rent.term}`
                      );
                    }}
                  />
                )
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

const YearFigures = () => {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const formatNumber = useFormatNumber();
  const theme = useTheme();

  const data = useMemo(() => {
    const now = moment();
    return store.dashboard.data.revenues?.reduce((acc, revenues) => {
      const revenuesMoment = moment(revenues.month, 'MMYYYY');
      const graphData = {
        ...revenues,
        name: revenuesMoment.format('MMM'),
        yearMonth: moment(revenues.month, 'MMYYYY').format('YYYY.MM'),
      };
      if (revenuesMoment.isSameOrBefore(now)) {
        acc.push(graphData);
      } else {
        acc.push({
          ...graphData,
          paid: null,
          notPaid: null,
        });
      }
      return acc;
    }, []);
  }, [store.dashboard.data.revenues]);

  const hasRevenues = useMemo(() => {
    return data.some((r) => r.notPaid !== 0 || r.paid !== 0);
  }, [data]);

  const onClick = useCallback(
    (data) => {
      if (
        !data?.activePayload?.[0]?.payload ||
        !store.organization.selected?.name
      ) {
        return;
      }
      const {
        activePayload: [
          {
            payload: { yearMonth },
          },
        ],
      } = data;
      store.rent.setPeriod(moment(yearMonth, 'YYYY.MM', true));
      router.push(`/${store.organization.selected.name}/rents/${yearMonth}`);
    },
    [store.organization.selected.name]
  );

  return (
    <Grid container>
      {hasRevenues ? (
        <>
          <Box mb={3}>
            <Typography variant="h5">
              {t('Rents of {{year}}', {
                year: moment().format('YYYY'),
              })}
            </Typography>
          </Box>
          <Grid item xs={12}>
            <Paper>
              <Box py={2} px={3} width="100%" height={380}>
                <ResponsiveContainer>
                  <BarChart data={data} stackOffset="sign" onClick={onClick}>
                    <Legend
                      verticalAlign="top"
                      height={40}
                      formatter={(value) =>
                        value === 'paid' ? t('Rent paid') : t('Rent unpaid')
                      }
                    />

                    <ReferenceLine y={0} stroke={theme.palette.grey[400]} />
                    <Bar
                      dataKey="paid"
                      fill={theme.palette.success.dark}
                      stackId="stack"
                      barSize={30}
                      cursor="pointer"
                      label={{
                        fill: theme.palette.success.dark,
                        position: 'top',
                        formatter: (value) =>
                          value ? formatNumber(value) : '',
                      }}
                    />
                    <Bar
                      dataKey="notPaid"
                      fill={theme.palette.warning.main}
                      stackId="stack"
                      cursor="pointer"
                      label={{
                        fill: theme.palette.warning.main,
                        position: 'top',
                        formatter: (value) =>
                          value ? formatNumber(value) : '',
                      }}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      orientation="top"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </>
      ) : null}
    </Grid>
  );
};

const Welcome = () => {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  return (
    <Typography component="h1" variant="h5">
      {t('Welcome {{firstName}}', {
        firstName: store.user.firstName,
        lastName: store.user.lastName,
      })}
    </Typography>
  );
};

const Dashboard = observer(() => {
  console.log('Dashboard functional component');
  const store = useContext(StoreContext);

  return (
    <Page>
      <Box my={5}>
        <Welcome />
      </Box>
      <Box mb={10}>
        <Shortcuts />
      </Box>
      {!!store.dashboard.data.overview && (
        <Box my={10}>
          <GeneralFigures />
        </Box>
      )}
      {!!store.dashboard.data.overview?.tenantCount && (
        <Box my={10}>
          <MonthFigures />
        </Box>
      )}
      {!!store.dashboard.data.overview && (
        <Box my={10}>
          <YearFigures />
        </Box>
      )}
    </Page>
  );
});

Dashboard.getInitialProps = async (context) => {
  console.log('Dashboard.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();

  const responses = await Promise.all([
    store.dashboard.fetch(),
    store.tenant.fetch(),
  ]);

  const errorStatusCode = responses.find(({ status }) => status !== 200);

  if (errorStatusCode) {
    return { error: { statusCode: errorStatusCode } };
  }

  return {
    initialState: {
      store: toJS(store),
    },
  };
};

export default withAuthentication(Dashboard);
