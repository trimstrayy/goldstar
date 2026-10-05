export type CouponQrPayload = {
  code: string
  valid_on?: string
  discount?: number
}

export const createCouponPayload = (coupon: { coupon_code: string; valid_on?: string | null; discount_pct?: number | null }) => {
  const params = new URLSearchParams({ code: coupon.coupon_code })
  return `goldstar://coupon?${params.toString()}`
}

export const parseCouponPayload = (raw: string): CouponQrPayload | null => {
  const value = raw.trim()
  if (!value) return null
  try {
    const url = new URL(value.replace(/^goldstar:\/\//, 'https://goldstar.local/'))
    const code = url.searchParams.get('code') || url.searchParams.get('coupon_code')
    if (!code) return null
    const payload: CouponQrPayload = { code }
    const validOn = url.searchParams.get('valid_on')
    const discountRaw = url.searchParams.get('discount')
    const discount = discountRaw ? Number(discountRaw) : NaN
    if (validOn) payload.valid_on = validOn
    if (Number.isFinite(discount)) payload.discount = discount
    return payload
  } catch {
    try {
      const parsed = JSON.parse(value) as Partial<CouponQrPayload>
      if (!parsed.code) return null
      const payload: CouponQrPayload = { code: String(parsed.code) }
      if (parsed.valid_on) payload.valid_on = String(parsed.valid_on)
      if (typeof parsed.discount === 'number' && Number.isFinite(parsed.discount)) payload.discount = parsed.discount
      return payload
    } catch {
      return { code: value }
    }
  }
}
