import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const meetupStatusUrl = pathToFileURL(path.join(root, 'src', 'utils', 'meetupStatus.ts')).href;
const calendarUrl = pathToFileURL(path.join(root, 'src', 'utils', 'calendar.ts')).href;

const meetupStatus = await import(meetupStatusUrl);
const calendar = await import(calendarUrl);

const { parseMeetupDate, getMeetupStartMs, isMeetupUpcoming } = meetupStatus;
const { generateGoogleCalendarUrl } = calendar;

test('parseMeetupDate rejects February 31 as an impossible calendar date', () => {
  assert.throws(
    () => parseMeetupDate('February 31, 2026', '8:30 AM – 11:00 AM IST'),
    /Invalid meetup date/,
  );
});

test('parseMeetupDate accepts February 29 in a leap year and rejects it in a non-leap year', () => {
  const leap = parseMeetupDate('2024-02-29', '8:30 AM IST');
  assert.ok(Number.isFinite(new Date(leap).getTime()));

  assert.throws(
    () => parseMeetupDate('2025-02-29', '8:30 AM IST'),
    /Invalid meetup date/,
  );
});

test('parseMeetupDate rejects April 31 as an impossible calendar date', () => {
  assert.throws(
    () => parseMeetupDate('April 31, 2026', '8:30 AM IST'),
    /Invalid meetup date/,
  );
});

test('parseMeetupDate accepts valid November 15, 2026 and November 29, 2026 meetup dates', () => {
  const nov15 = parseMeetupDate('Sunday, November 15, 2026', '8:30 AM – 11:00 AM IST');
  const nov29 = parseMeetupDate('Sunday, November 29, 2026', '8:30 AM – 11:00 AM IST');

  assert.equal(new Date(nov15).toISOString(), nov15);
  assert.equal(new Date(nov29).toISOString(), nov29);
  assert.ok(new Date(nov29).getTime() > new Date(nov15).getTime());
});

test('parseMeetupDate rejects missing and malformed dates', () => {
  assert.throws(() => parseMeetupDate('', '8:30 AM IST'), /cannot be empty/);
  assert.throws(() => parseMeetupDate('not-a-date', '8:30 AM IST'), /Invalid meetup date format/);
  assert.throws(() => parseMeetupDate('2026/11/15', '8:30 AM IST'), /Invalid meetup date format/);
});

test('parseMeetupDate preserves valid explicit timezone timestamps and rejects impossible explicit ISO dates', () => {
  const validExplicit = '2026-11-15T08:30:00+05:30';
  assert.equal(parseMeetupDate(validExplicit), new Date(validExplicit).toISOString());

  assert.throws(
    () => parseMeetupDate('2026-02-31T10:00:00+05:30'),
    /Invalid meetup date/,
  );
});

test('getMeetupStartMs and isMeetupUpcoming fail closed for missing or malformed meetup dates', () => {
  const missingDateMeetup = { date: '', time: '8:30 AM IST' };
  const malformedDateMeetup = { date: 'February 31, 2026', time: '8:30 AM IST' };

  assert.equal(Number.isFinite(getMeetupStartMs(missingDateMeetup)), false);
  assert.equal(Number.isFinite(getMeetupStartMs(malformedDateMeetup)), false);
  assert.equal(isMeetupUpcoming(missingDateMeetup, Date.parse('2026-11-19T00:00:00Z')), false);
  assert.equal(isMeetupUpcoming(malformedDateMeetup, Date.parse('2026-11-19T00:00:00Z')), false);
});

test('generateGoogleCalendarUrl preserves correct output for valid meetups', () => {
  const url = generateGoogleCalendarUrl({
    title: 'Silence, Sunlight & Stories',
    edition: 'Chapter 14',
    date: 'Sunday, November 15, 2026',
    time: '8:30 AM – 11:00 AM IST',
    venue: 'Siddharth Garden Grounds',
    address: 'Aurangabad',
    summary: 'Quiet morning reading.',
  });

  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
  assert.match(url, /dates=20261115T030000Z\/20261115T053000Z/);
  assert.match(url, /Chapter%2014/);
});

test('generateGoogleCalendarUrl rejects invalid or missing dates without using a misleading fallback', () => {
  const baseMeetup = {
    title: 'Test Meetup',
    date: '',
    time: '8:30 AM IST',
    venue: 'Test Venue',
  };

  assert.throws(
    () => generateGoogleCalendarUrl(baseMeetup),
    /Calendar link unavailable|meetup date/i,
  );
  assert.throws(
    () => generateGoogleCalendarUrl({ ...baseMeetup, date: 'February 31, 2026' }),
    /Calendar link unavailable|Invalid meetup date/i,
  );
  assert.throws(
    () => generateGoogleCalendarUrl({ ...baseMeetup, date: 'not-a-date' }),
    /Calendar link unavailable|Invalid meetup date/i,
  );
});
