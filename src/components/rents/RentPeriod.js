import moment from 'moment';
import { memo, useMemo } from 'react';

import { Typography } from '@material-ui/core';
import { withTranslation } from '../../utils/i18n';

export const getPeriod = (t, term, frequency) => {
  const termMoment = moment(term, 'YYYYMMDDHH');
  switch (frequency) {
    case 'years':
      return termMoment.format('YYYY');
    case 'months':
      return t('{{month}} {{year}}', {
        month: termMoment.format('MMMM'),
        year: termMoment.format('YYYY'),
      });
    case 'weeks':
      return t('{{month}} {{startDay}} to {{endDay}}', {
        month: termMoment.format('MMM'),
        startDay: termMoment.startOf('week').format('Do'),
        endDay: termMoment.endOf('week').format('Do'),
      });
    case 'days':
      return termMoment.format('L');
    default:
      return '';
  }
};

const RentPeriod = withTranslation()(({ t, term, frequency }) => {
  const period = useMemo(() => getPeriod(t, term, frequency), []);

  return <Typography>{period}</Typography>;
});

export default memo(RentPeriod);
