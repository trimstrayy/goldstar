import { format, formatDistanceToNow } from 'date-fns'
import { enIN } from 'date-fns/locale'

export const KATHMANDU_TZ = 'Asia/Kathmandu'
export const todayKathmandu = () => new Intl.DateTimeFormat('en-CA', { timeZone: KATHMANDU_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const formatCurrency = (value: number | null | undefined) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0)}`
export const formatNumber = (value: number | null | undefined) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0)
export const formatDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('en-GB', { timeZone: KATHMANDU_TZ, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—'
export const formatDateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('en-GB', { timeZone: KATHMANDU_TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—'
export const formatISODate = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: KATHMANDU_TZ }).format(value)
export const relativeDate = (value: string | null | undefined) => value ? formatDistanceToNow(new Date(value), { addSuffix: true, locale: enIN }) : '—'
export const formatInputDate = (value: string | null | undefined) => value ? format(new Date(`${value}T00:00:00`), 'yyyy-MM-dd') : ''
export const cls = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')
export const safeError = (error: unknown) => { if (error instanceof Error && error.message) return error.message; if (typeof error === 'string' && error.trim()) return error; if (error && typeof error === 'object') { const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }; const message = typeof value.message === 'string' ? value.message : ''; const details = typeof value.details === 'string' ? value.details : ''; const hint = typeof value.hint === 'string' ? value.hint : ''; const code = typeof value.code === 'string' ? ` [${value.code}]` : ''; return [message, details, hint].filter(Boolean).join(' · ') + code || 'Something went wrong. Please try again.' } return 'Something went wrong. Please try again.' }
export const normalizePhone = (value: string) => value.replace(/\s+/g, '').replace(/^\+977/, '').replace(/^977/, '')
export const isValidNepaliPhone = (value: string) => /^9\d{9}$/.test(normalizePhone(value))
export const csvDownload = (filename: string, rows: Array<Record<string, unknown>>) => {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const body = rows.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(',')).join('\n')
  const blob = new Blob([[headers.join(','), body].filter(Boolean).join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url)
}
export const renderTemplate = (body: string, values: Record<string, string | number | null | undefined>) => body.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(values[key] ?? ''))
