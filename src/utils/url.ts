const containsControlCharacters = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
};

/**
 * Allows only explicit http(s) URLs for external navigation.
 * Protocol-relative URLs, backslashes, control characters and non-http schemes
 * are rejected so admin/data-driven values cannot become unexpected sinks.
 */
export const isSafeExternalUrl = (value?: string | null): boolean => {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed || containsControlCharacters(trimmed)) return false;
  if (trimmed.startsWith('//') || trimmed.includes('\\')) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

/**
 * Allows http(s), mailto, tel, root-relative and in-page hrefs.
 * Used by the generic Button component to fail closed on unsafe values.
 */
export const isSafeHref = (value?: string | null): boolean => {
  if (!value) return false;

  const trimmed = value.trim();
  if (isSafeExternalUrl(trimmed)) return true;
  if (!trimmed || containsControlCharacters(trimmed)) return false;
  if (/^(mailto|tel):/i.test(trimmed)) return true;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  return trimmed.startsWith('#');
};

export const safeExternalHref = (value?: string | null): string | undefined =>
  isSafeExternalUrl(value) ? value!.trim() : undefined;

/**
 * Resolves the usable registration destination for a meetup. Only explicit
 * http(s) URLs qualify; empty, unverified or unsafe values return undefined so
 * callers can show an "unavailable / ask on WhatsApp" state instead of a link.
 */
export const getSafeRegistrationUrl = (meetup: {
  registrationUrl?: string | null;
  rsvpLink?: string | null;
}): string | undefined =>
  safeExternalHref(meetup.registrationUrl) ?? safeExternalHref(meetup.rsvpLink);

const INTERNAL_ROUTE_SLUG = /^[a-z][a-z0-9-]*$/i;

/**
 * Announcement action URLs may be either a safe http(s) URL or an internal
 * page-route slug (e.g. `gatherings`). Rejects schemes, protocol-relative and
 * path/traversal values so a data-driven value cannot become an unsafe sink.
 */
export const isSafeActionUrl = (value?: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (isSafeExternalUrl(trimmed)) return true;
  return INTERNAL_ROUTE_SLUG.test(trimmed);
};
