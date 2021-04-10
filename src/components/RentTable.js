import moment from 'moment';
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { withTranslation } from 'next-i18next';
import { StoreContext } from '../store';
import { NumberFormat } from '../utils/numberformat';
import { Box, Button, Checkbox, Chip, CircularProgress, Grid, Paper, Toolbar, Tooltip, Typography, useTheme } from '@material-ui/core';
import SearchFilterBar from './SearchFilterBar';
import DownloadLink from './DownloadLink';
import { autorun } from 'mobx';
import RequestError from './RequestError';

const TableToolbar = memo(withTranslation()(({ t, selected = [], onSend = () => { } }) => {
  const [sendingEmail, setSendingEmail] = useState({
    rentcall: '',
    rentcall_reminder: '',
    rentcall_last_reminder: '',
    invoice: ''
  });

  const onClick = useCallback(async docName => {
    setSendingEmail({
      rentcall: document === 'rentcall' ? 'sending' : 'disabled',
      rentcall_reminder: document === 'rentcall_reminder' ? 'sending' : 'disabled',
      rentcall_last_reminder: document === 'rentcall_last_reminder' ? 'sending' : 'disabled',
      invoice: document === 'invoice' ? 'sending' : 'disabled'
    });

    await onSend(docName);

    setSendingEmail({
      rentcall: '',
      rentcall_reminder: '',
      rentcall_last_reminder: '',
      invoice: ''
    });
  }, [onSend]);

  return (
    <Toolbar>
      <Grid container spacing={1} alignItems="center">
        {selected.length === 0 ? (
          <Grid item>
            <Typography variant="h6" component="div">
              {t('Rents')}
            </Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={3}>
              <Typography color="inherit" variant="subtitle1" component="div" noWrap>
                {t('{{count}} selected', { count: selected.length })}
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <Grid container spacing={1} alignItems="center" justify="flex-end">
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.rentcall !== ''}
                    endIcon={sendingEmail.rentcall === 'sending' ? <CircularProgress color="inherit" size={20} /> : null}
                    onClick={() => onClick('rentcall')}
                  >
                    Send first notice
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.rentcall_reminder !== ''}
                    endIcon={sendingEmail.rentcall_reminder === 'sending' ? <CircularProgress color="inherit" size={20} /> : null}
                    onClick={() => onClick('rentcall_reminder')}
                  >
                    Send second notice
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.rentcall_last_reminder !== ''}
                    endIcon={sendingEmail.rentcall_last_reminder === 'sending' ? <CircularProgress color="inherit" size={20} /> : null}
                    onClick={() => onClick('rentcall_last_reminder')}
                  >
                    Send last notice
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={sendingEmail.invoice !== ''}
                    endIcon={sendingEmail.invoice === 'sending' ? <CircularProgress color="inherit" size={20} /> : null}
                    onClick={() => onClick('invoice')}
                  >
                    Send receipt
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Toolbar>
  );
}));

const RentTable = withTranslation()(({ t }) => {
  const store = useContext(StoreContext);
  const [rents, setRents] = useState(store.rent.items);
  const [filteredRents, setFilteredRents] = useState(rents);
  const [selected, setSelected] = useState([]);
  const [filterSearchText, setFilterSearchText] = useState({ searchText: '', filter: '' });
  const [error, setError] = useState('');
  const theme = useTheme();

  useEffect(() => autorun(() => setRents(store.rent.items)), []);

  useEffect(() => {
    setFilteredRents(rents
      .filter(({ status }) => {
        if (!filterSearchText.filter) {
          return true;
        }
        if (status === filterSearchText.filter) {
          return true;
        }
        return false;
      })
      .filter(({ occupant: { name } }) => {
        if (filterSearchText.searchText) {
          return name.toLowerCase().indexOf(filterSearchText.searchText.toLowerCase()) !== -1;
        }
        return true;
      })
    )
  }, [rents, filterSearchText]);

  const onSelectAllClick = useCallback((event) => {
    if (event.target.checked) {
      setSelected(filteredRents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
        if (hasContactEmails) {
          return [
            ...acc,
            _id
          ];
        }
        return acc;
      }, []));
      return;
    }
    setSelected([]);
  }, [filteredRents]);

  const onSelectClick = useCallback((event, id) => {
    if (event.target.checked) {
      setSelected((selected) => [
        ...selected,
        id
      ]);
      return;
    }
    setSelected((selected) => selected.filter(selectedId => selectedId !== id));
  }, []);

  const onSend = useCallback(async docName => {
    setError('');

    const sendStatus = await store.rent.sendEmail({
      document: docName,
      tenantIds: selected,
      year: store.rent._period.year(),
      month: store.rent._period.month() + 1
    });
    if (sendStatus !== 200) {
      // TODO check error code to show a more detail error message
      return setError(t('Email service cannot send emails.'));
    }

    const response = await store.rent.fetch();
    if (response.status !== 200) {
      // TODO check error code to show a more detail error message
      return setError(t('Cannot fetch rents from server'));
    }

    setSelected([]);
  }, [selected]);

  const selectableRentNum = useMemo(() => filteredRents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
    if (hasContactEmails) {
      acc.push(_id);
    }
    return acc;
  }, []).length, [filteredRents]);

  const filters = useMemo(() => [
    { id: '', label: t('All') },
    { id: 'notpaid', label: t('Not paid') },
    { id: 'partiallypaid', label: t('Partially paid') },
    { id: 'paid', label: t('Paid') },
  ], []);

  return (
    <>
      <RequestError error={error} />
      <Box pt={2} pb={1} width={600}>
        <SearchFilterBar
          filters={filters}
          onSearch={useCallback((filter, searchText) => setFilterSearchText({ filter, searchText }), [])}
        />
      </Box>
      <Paper variant="outlined" square>
        <TableToolbar selected={selected} onSend={onSend} />
        <Table stickyHeader aria-label="rent table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  indeterminate={selected.length > 0 && selected.length < selectableRentNum}
                  checked={filteredRents.length > 0 && selected.length === selectableRentNum}
                  onChange={onSelectAllClick}
                  inputProps={{ 'aria-label': 'select all rents' }}
                />
              </TableCell>
              <TableCell><Typography>{t('Tenant')}</Typography></TableCell>
              <TableCell align="right"><Typography>{t('Rent due')}</Typography></TableCell>
              <TableCell align="center"><Typography>{t('Status')}</Typography></TableCell>
              <TableCell align="center"><Typography>{t('First notice')}</Typography></TableCell>
              <TableCell align="center"><Typography>{t('Second notice')}</Typography></TableCell>
              <TableCell align="center"><Typography>{t('Last notice')}</Typography></TableCell>
              <TableCell align="center"><Typography>{t('Receipt')}</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRents.map(rent => {
              const isItemSelected = selected.includes(rent._id);
              const contactEmails = rent.occupant.contactEmails.join(', ');
              return (
                <TableRow hover selected={isItemSelected} size="small" key={rent._id}>
                  <TableCell padding="checkbox">
                    {rent.occupant.hasContactEmails ? (
                      <Checkbox
                        color="default"
                        checked={isItemSelected}
                        onChange={event => onSelectClick(event, rent._id)}
                        inputProps={{ 'aria-labelledby': rent.occupant.name }}
                      />
                    ) : (
                      <Tooltip title={t('No emails available for this tenant')}>
                        <span>
                          <Checkbox
                            onChange={event => onSelectClick(event, rent._id)}
                            inputProps={{ 'aria-labelledby': rent.occupant.name }}
                            disabled
                          />
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography noWrap>{rent.occupant.name}</Typography>
                    <Typography variant="caption" noWrap>{contactEmails}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <NumberFormat variant="body1" value={rent.totalToPay > 0 ? rent.totalToPay : 0} />
                  </TableCell>
                  <TableCell align="center">
                    {['paid', 'partialypaid'].includes(rent.status) ? (
                      <Chip
                        label={rent.status === 'paid' ? t('Paid') : t('Partially paid')}
                        color="primary"
                        style={{
                          backgroundColor: rent.status === 'paid' ? theme.palette.success.main : theme.palette.warning.main,
                          width: 100
                        }}
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={t('Not paid')}
                        color="primary"
                        style={{
                          backgroundColor: theme.palette.error.main,
                          width: 100
                        }}
                        size="small"
                      />
                    )
                    }
                  </TableCell>
                  <TableCell align="center">
                    {(rent.emailStatus && rent.emailStatus.status.rentcall) ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', { datetime: moment(rent.emailStatus.last.rentcall.sentDate).format('LLLL') })}
                        url={`/rentcall/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t('first notice')}.pdf`}
                        withIcon
                      />
                    ) : null
                    }
                  </TableCell>
                  <TableCell align="center">
                    {(rent.emailStatus && rent.emailStatus.status.rentcall_reminder) ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', { datetime: moment(rent.emailStatus.last.rentcall_reminder.sentDate).format('LLLL') })}
                        url={`/rentcall_reminder/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t('second notice')}.pdf`}
                        withIcon
                      />
                    ) : null
                    }
                  </TableCell>
                  <TableCell align="center">
                    {(rent.emailStatus && rent.emailStatus.status.rentcall_last_reminder) ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', { datetime: moment(rent.emailStatus.last.rentcall_last_reminder.sentDate).format('LLLL') })}
                        url={`/rentcall_last_reminder/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t('last notice')}.pdf`}
                        withIcon
                      />
                    ) : null
                    }
                  </TableCell>
                  <TableCell align="center">
                    {(rent.emailStatus && rent.emailStatus.status.invoice) ? (
                      <DownloadLink
                        tooltipText={t('sent on {{datetime}}', { datetime: moment(rent.emailStatus.last.invoice.sentDate).format('LLLL') })}
                        url={`/invoice/${rent.occupant._id}/${rent.term}`}
                        documentName={`${rent.occupant.name}-${t('invoice')}.pdf`}
                        withIcon
                      />
                    ) : null
                    }
                  </TableCell>
                </TableRow>
              )
            }
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
});

export default RentTable;
