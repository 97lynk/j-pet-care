import { MatDateFormats } from '@angular/material/core';

export const JP_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput:  'yyyy年M月d日'
  },
  display: {
    dateInput: 'yyyy年M月d日',
    monthLabel: 'M月',
    monthYearLabel: 'yyyy年 M月',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'yyyy年 M月',
  },
};
