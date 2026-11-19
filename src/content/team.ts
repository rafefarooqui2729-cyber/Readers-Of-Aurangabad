import type { TeamMember } from './types';

// Only the founder is confirmed by project records (deployment guide,
// architecture docs, image manifest). Placeholder members are omitted.
export const teamMembers: TeamMember[] = [
  {
    id: 'team-founder',
    name: 'Abdul Rafe Farooqui',
    role: 'Founder',
    photoUrl: '/images/enhanced/community/founder-portrait.webp',
  },
];
