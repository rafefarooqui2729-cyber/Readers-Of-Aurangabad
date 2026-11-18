import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const navigation = await import(
  pathToFileURL(path.join(root, 'src', 'utils', 'announcementNavigation.ts')).href
);
const read = (...segments) => readFileSync(path.join(root, ...segments), 'utf8');

const announcements = [
  {
    id: 'announcement-older',
    title: 'Older update',
    content: 'Older content',
    isPublished: true,
    publishedAt: '2026-11-10T00:00:00.000Z',
    createdAt: '2026-11-10T00:00:00.000Z',
  },
  {
    id: 'announcement-latest',
    title: 'Latest update',
    content: 'Latest content',
    isPublished: true,
    publishedAt: '2026-11-16T00:00:00.000Z',
    createdAt: '2026-11-16T00:00:00.000Z',
  },
  {
    id: 'announcement-draft',
    title: 'Draft',
    content: 'Draft content',
    isPublished: false,
    publishedAt: '2026-11-16T00:00:00.000Z',
    createdAt: '2026-11-16T00:00:00.000Z',
  },
  {
    id: 'announcement-expired',
    title: 'Expired',
    content: 'Expired content',
    isPublished: true,
    publishedAt: '2026-11-10T00:00:00.000Z',
    expiresAt: '2026-11-15T00:00:00.000Z',
    createdAt: '2026-11-10T00:00:00.000Z',
  },
];

test('announcement navigation URLs survive refresh and identify the requested announcement', () => {
  const destination = navigation.buildAnnouncementNavigationUrl(
    'http://localhost:5173/#community',
    'announcement-older'
  );
  assert.equal(destination, '/?announcement=announcement-older');
  assert.equal(
    navigation.getAnnouncementNavigationId(new URL(destination, 'http://localhost:5173').search),
    'announcement-older'
  );
  assert.equal(navigation.getAnnouncementNavigationId(''), null);
});

test('multiple announcement IDs select their own active announcement', () => {
  assert.equal(
    navigation.findActiveAnnouncementById(announcements, 'announcement-older', Date.parse('2026-11-17')).title,
    'Older update'
  );
  assert.equal(
    navigation.findActiveAnnouncementById(announcements, 'announcement-latest', Date.parse('2026-11-17')).title,
    'Latest update'
  );
  assert.equal(
    navigation.findActiveAnnouncementById(announcements, 'announcement-draft', Date.parse('2026-11-17')),
    null
  );
  assert.equal(
    navigation.findActiveAnnouncementById(announcements, 'announcement-expired', Date.parse('2026-11-17')),
    null
  );
  assert.equal(
    navigation.findActiveAnnouncementById(announcements, 'deleted-announcement', Date.parse('2026-11-17')),
    null
  );
});

test('scrolling targets only the requested announcement and missing targets do not fall through', () => {
  const originalDocument = globalThis.document;
  const requestedTarget = {
    options: null,
    scrollIntoView(options) {
      this.options = options;
    },
  };
  const requestedIds = [];
  globalThis.document = {
    getElementById(id) {
      requestedIds.push(id);
      return id === 'community-announcement-announcement-older' ? requestedTarget : null;
    },
  };

  try {
    assert.equal(navigation.scrollToAnnouncement('announcement-older', false), true);
    assert.deepEqual(requestedIds, ['community-announcement-announcement-older']);
    assert.deepEqual(requestedTarget.options, { behavior: 'smooth', block: 'center' });
    assert.equal(navigation.scrollToAnnouncement('deleted-announcement', false), false);
    assert.deepEqual(requestedIds, [
      'community-announcement-announcement-older',
      'community-announcement-deleted-announcement',
    ]);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('notification clicks keep read handling and route announcement IDs before generic action URLs', () => {
  const notificationCenter = read('src', 'components', 'MemberNotificationCenter.tsx');
  const clickHandler = notificationCenter.slice(
    notificationCenter.indexOf('const handleClick = async'),
    notificationCenter.indexOf('return (', notificationCenter.indexOf('const handleClick = async'))
  );

  assert.match(clickHandler, /if \(!n\.readAt\) await onMarkRead\(n\.id\)/);
  assert.ok(clickHandler.indexOf('await onMarkRead(n.id)') < clickHandler.indexOf('onNavigateToAnnouncement(n.announcementId)'));
  assert.ok(clickHandler.indexOf('onNavigateToAnnouncement(n.announcementId)') < clickHandler.indexOf('if (n.actionUrl)'));
  assert.match(read('src', 'components', 'Navbar.tsx'), /onNavigateToAnnouncement=\{navigateToAnnouncement\}/);
});

test('homepage waits for page and announcement data, shows the matched card, and scrolls to its stable ID', () => {
  const homePage = read('src', 'pages', 'HomePage.tsx');
  const spotlight = read('src', 'components', 'UpcomingEventSpotlight.tsx');
  const appContext = read('src', 'context', 'AppContext.tsx');

  assert.match(homePage, /if \(!announcementNavigationId \|\| dbLoading \|\| isPageLoading\) return/);
  assert.match(homePage, /announcement=\{announcementToShow\}/);
  assert.match(homePage, /scrollToAnnouncement\(target\.id/);
  assert.match(spotlight, /announcementTargetDomId\(announcement\.id\)/);
  assert.match(appContext, /performNavigation\('home', true\)/);
  assert.match(appContext, /getAnnouncementNavigationId\(window\.location\.search\)/);
});
