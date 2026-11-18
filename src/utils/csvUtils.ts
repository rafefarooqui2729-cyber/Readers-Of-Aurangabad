/**
 * CSV Encoding and Export Utilities
 *
 * Implements defensive cell encoding with CSV formula injection (CWE-1236) protection.
 * Neutralizes values that spreadsheet software (Excel, Google Sheets, LibreOffice Calc)
 * could evaluate as executable formulas or commands.
 */

// Formula prefix triggers: =, +, -, @, or whitespace/control character followed by formula triggers
// eslint-disable-next-line no-control-regex -- Control characters are intentionally checked to prevent spreadsheet formula injection.
const FORMULA_INJECTION_PATTERN = /^[\s\u0000-\u001F]*[=+\-@\t\r]/;
/**
 * Encodes a single cell value for CSV output:
 * - Converts value to string safely.
 * - Neutralizes formula injection by prepending a single quote (`'`) if the value
 *   starts with `=`, `+`, `-`, `@`, or control/whitespace characters followed by these.
 * - Doubles all embedded quotation marks (`"` -> `""`).
 * - Encloses every cell in double quotes (`"..."`).
 * - Preserves commas, newlines, and unicode characters safely.
 */
export function encodeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // If the string starts with a formula trigger (even with leading whitespace/control characters),
  // neutralize it by prepending a single quote prefix so spreadsheets treat it as literal text.
  if (FORMULA_INJECTION_PATTERN.test(str)) {
    str = "'" + str;
  }

  // Escape embedded double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  // Enclose every cell in double quotes
  return `"${escaped}"`;
}

/**
 * Generates valid CSV string content from headers and data rows.
 * Includes UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 text correctly.
 */
export function generateCsvContent(
  headers: string[],
  rows: unknown[][]
): string {
  const headerLine = headers.map(encodeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(encodeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Downloads a generated CSV file in the browser and ensures the temporary object URL
 * is safely revoked after the download is initiated.
 */
export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: unknown[][]
): void {
  const csvContent = generateCsvContent(headers, rows);
  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL safely after browser triggers download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
