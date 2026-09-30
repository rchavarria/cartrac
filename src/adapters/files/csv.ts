/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF/LF). */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

/** Guesses the delimiter from the header line (";" is common in spreadsheets with a Spanish locale). */
export function detectDelimiter(text: string): ',' | ';' {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  return header.split(';').length > header.split(',').length ? ';' : ',';
}

export function toCsvLine(values: readonly string[], delimiter = ','): string {
  return values
    .map((value) =>
      value.includes('"') || value.includes(delimiter) || /[\r\n]/.test(value)
        ? `"${value.replaceAll('"', '""')}"`
        : value,
    )
    .join(delimiter);
}
