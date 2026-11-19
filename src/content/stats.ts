import type { StatItem } from './types';

// Only figures that can be traced to records in this repository belong here.
// Unverified counts and placeholder rows are intentionally omitted.
export const communityStats: StatItem[] = [
  {
    id: 'stat-chapters',
    value: '14',
    suffix: '+',
    label: 'Chapters in the reading circle',
  },
  {
    id: 'stat-languages',
    value: '4',
    label: 'Languages shared in the circle',
  },
];
