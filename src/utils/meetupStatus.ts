import type { Meetup } from '../types';

const IST_OFFSET = '+05:30';

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

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

const hasExplicitTimezone = (value: string): boolean => /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);

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

const parseDateParts = (dateStr: string): DateParts | null => {
  const trimmed = dateStr.trim().replace(/^[A-Za-z]+,\s*/, '');

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

  return null;
};

const parseStartTime = (timeStr?: string): { hour: number; minute: number } => {
  if (!timeStr) return { hour: 0, minute: 0 };

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { hour: 0, minute: 0 };

  let hour = Number(match[1]) % 12;
  if (/pm/i.test(match[3])) hour += 12;

  return { hour, minute: Number(match[2]) };
};

/**
 * Parses meetup date labels into an explicit Asia/Kolkata ISO timestamp.
 * Explicitly timezone-aware ISO strings are preserved. Invalid or empty dates
 * throw so callers never invent a current-date fallback.
 */
export const parseMeetupDate = (dateStr: string, timeStr?: string): string => {
  if (!dateStr || !dateStr.trim()) {
    throw new Error('Meetup date cannot be empty.');
  }

  const trimmed = dateStr.trim();
  if (hasExplicitTimezone(trimmed)) {
    const direct = new Date(trimmed);
    if (!Number.isFinite(direct.getTime())) {
      throw new Error(`Invalid meetup date: "${dateStr}".`);
    }

    // Fail closed for impossible calendar dates in explicit ISO timestamps
    // (e.g. 2026-02-31T10:00:00+05:30) rather than allowing JS rollover.
    const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/);
    if (isoDateMatch) {
      const year = Number(isoDateMatch[1]);
      const month = Number(isoDateMatch[2]);
      const day = Number(isoDateMatch[3]);
      if (!isValidCalendarDate(year, month, day)) {
        throw new Error(`Invalid meetup date: "${dateStr}".`);
      }
    }

    return direct.toISOString();
  }

  const parts = parseDateParts(trimmed);
  if (!parts) {
    throw new Error(`Invalid meetup date format: "${dateStr}". Please provide a valid date format.`);
  }

  const { year, month, day } = parts;
  if (!isValidCalendarDate(year, month, day)) {
    throw new Error(`Invalid meetup date: "${dateStr}".`);
  }

  const { hour, minute } = parseStartTime(timeStr);
  if (hour > 23 || minute > 59) {
    throw new Error(`Invalid meetup time: "${timeStr ?? ''}".`);
  }

  const localIso = `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${IST_OFFSET}`;
  const parsed = new Date(localIso);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`Invalid meetup date: "${dateStr}".`);
  }

  return parsed.toISOString();
};

export const getMeetupStartMs = (meetup: Pick<Meetup, 'date' | 'startsAt' | 'time'> | null | undefined): number => {
  if (!meetup) return NaN;

  if (meetup.startsAt && meetup.startsAt.trim()) {
    const startsAtMs = new Date(meetup.startsAt).getTime();
    return Number.isFinite(startsAtMs) ? startsAtMs : NaN;
  }

  if (!meetup.date) return NaN;

  try {
    return new Date(parseMeetupDate(meetup.date, meetup.time)).getTime();
  } catch {
    return NaN;
  }
};

/**
 * Derives upcoming status from the actual start time, not from a manually
 * maintained boolean. Invalid dates, published flags and admin status all
 * fail closed.
 */
export const isMeetupUpcoming = (
  meetup: Pick<Meetup, 'date' | 'startsAt' | 'time' | 'isPublished' | 'isCompleted' | 'registrationStatus'> | null | undefined,
  now: number = Date.now(),
): boolean => {
  if (!meetup) return false;
  if (meetup.isPublished === false || meetup.isCompleted || meetup.registrationStatus === 'cancelled') return false;

  const startMs = getMeetupStartMs(meetup);
  return Number.isFinite(startMs) && startMs >= now;
};

/** Adds a canonical startsAt and recomputes isUpcoming for stored/fallback records. */
export const normalizeMeetup = (meetup: Meetup): Meetup => {
  const startsAt = meetup.startsAt || (() => {
    try {
      return meetup.date ? parseMeetupDate(meetup.date, meetup.time) : undefined;
    } catch {
      return undefined;
    }
  })();

  const normalized: Meetup = { ...meetup, startsAt };
  return { ...normalized, isUpcoming: isMeetupUpcoming(normalized) };
};
