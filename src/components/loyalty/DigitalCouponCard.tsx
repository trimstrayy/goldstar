import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, CheckCircle2, Copy, Gift, QrCode } from 'lucide-react'
import type { BirthdayCoupon } from '../../types/db'
import { createCouponPayload } from '../../lib/coupons'
import { formatDate, cls } from '../../lib/utils'
import { Badge, Button } from '../ui/atoms'

type CouponWithCustomer = BirthdayCoupon & { customers?: { full_name?: string; phone?: string } | null }

export function DigitalCouponCard({ coupon, onMessage, onCopy }: { coupon: CouponWithCustomer; onMessage?: () => void; onCopy?: (code: string) => void }) {
  const active = coupon.status === 'issued'
  const payload = createCouponPayload(coupon)
  return <article className={cls('overflow-hidden rounded-2xl border bg-white shadow-soft dark:bg-[#1a1a1a]', active ? 'border-gold/60' : 'border-line opacity-75')}>
    <div className="flex items-start justify-between gap-4 bg-ink p-5 text-paper"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-gold">Goldstar birthday reward</p><h3 className="font-display text-2xl">{coupon.discount_pct}% off</h3><p className="mt-1 text-xs text-white/60">{coupon.customers?.full_name || 'Customer'} · {coupon.customers?.phone || 'No phone'}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-ink"><Gift size={19} /></div></div>
    <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex items-center gap-2"><code className="rounded-lg bg-sand px-3 py-2 text-sm font-bold tracking-[.12em]">{coupon.coupon_code}</code><button onClick={() => onCopy?.(coupon.coupon_code)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-graphite hover:border-gold" aria-label="Copy coupon code"><Copy size={15} /></button></div><div className="mt-4 flex flex-wrap gap-2"><Badge tone={active ? 'green' : coupon.status === 'redeemed' ? 'blue' : 'neutral'}>{coupon.status}</Badge><span className="inline-flex items-center gap-1 text-xs text-graphite"><CalendarDays size={13} /> Valid {formatDate(coupon.valid_on)}</span></div><p className="mt-4 text-xs leading-5 text-graphite">Scan this code at the counter. The discount is verified and applied by Supabase; the QR never contains a secret.</p></div><div className="flex flex-col items-center gap-2"><div className="rounded-xl border border-line bg-white p-2"><QRCodeSVG value={payload} size={142} includeMargin bgColor="#FFFFFF" fgColor="#0D0D0D" /></div><div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.12em] text-graphite"><QrCode size={12} /> Scan to redeem</div></div></div>
    {onMessage && <div className="flex items-center justify-between border-t border-line bg-paper/60 px-5 py-3 dark:bg-[#202020]"><span className="text-xs text-graphite">Need a warmer touch?</span><Button size="sm" variant="outline" onClick={onMessage}><CheckCircle2 size={14} /> Edit message</Button></div>}
  </article>
}
