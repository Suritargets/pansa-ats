/**
 * csv.ts
 * WAT:    Minimale CSV-serialisatie voor exports (payroll, algemeen).
 */

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvValue).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsvValue).join(','))
  return lines.join('\r\n')
}
