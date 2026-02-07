import { MatDateFormats } from '@angular/material/core';

export const JP_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'YYYY年M月D日',
    monthYearLabel: 'YYYY年 M月',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY年 M月',
  },
};
