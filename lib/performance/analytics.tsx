'use client';

/**
 * Web Vitals 分析组件
 */

import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from './monitoring';

export function Analytics() {
  useReportWebVitals((metric) => {
    reportWebVitals(metric);
  });

  return null;
}
