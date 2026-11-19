import type { MeetupItem } from '../content/types';

const MONTH_NUMBERS: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number): number => {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
};

const isValidCalendarDate = (year: number, month: number, day: number): boolean =>
  Number.isInteger(year)
  && Number.isInteger(month)
  && Number.isInteger(day)
  && month >= 1
  && month <= 12
  && day >= 1
  && day <= daysInMonth(year, month);

const parseDateParts = (dateStr: string): { year: number; month: number; day: number } => {
  const trimmed = dateStr.trim().replace(/^[A-Za-z]+,\s*/, '');
  if (!trimmed) throw new Error('Meetup date cannot be empty.');

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }

  const monthNameMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthNameMatch) {
    const month = MONTH_NUMBERS[monthNameMatch[1].toLowerCase()];
    if (month) {
      return {
        year: Number(monthNameMatch[3]),
        month: Number(month),
        day: Number(monthNameMatch[2]),
      };
    }
  }

  const dayFirstMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dayFirstMatch) {
    const month = MONTH_NUMBERS[dayFirstMatch[2].toLowerCase()];
    if (month) {
      return {
        year: Number(dayFirstMatch[3]),
        month: Number(month),
        day: Number(dayFirstMatch[1]),
      };
    }
  }

  throw new Error(`Invalid meetup date format: "${dateStr}".`);
};

/**
 * Generates an Add to Google Calendar link from a MeetupItem.
 * Throws for invalid dates so callers cannot generate misleading events.
 */
export function generateGoogleCalendarUrl(meetup: MeetupItem): string {
  if (!meetup?.date || !meetup.date.trim()) {
    throw new Error('Calendar link unavailable: meetup date is missing or invalid.');
  }

  const title = `${meetup.edition ? `${meetup.edition} — ` : ''}${meetup.title} | Readers of Aurangabad`;
  const location = `${meetup.venue}${meetup.address ? `, ${meetup.address}` : ''}, Aurangabad, Maharashtra`;
  const details = `${meetup.summary || 'A silent reading hour, book reflection, and chai with fellow readers in Aurangabad.'}\n\nBook: ${meetup.bookTitle || 'Open Reading'}${meetup.bookAuthor ? ` by ${meetup.bookAuthor}` : ''}\nCommunity: Readers of Aurangabad (MH20)`;

  const { year, month, day } = parseDateParts(meetup.date);
  if (!isValidCalendarDate(year, month, day)) {
    throw new Error(`Calendar link unavailable: invalid meetup date "${meetup.date}".`);
  }

  // Default event window: 8:30 AM to 11:00 AM IST (03:00Z to 05:30Z)
  const dateToken = `${pad(year, 4)}${pad(month)}${pad(day)}`;
  const startTime = `${dateToken}T030000Z`;
  const endTime = `${dateToken}T053000Z`;

  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  return `${base}&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}
