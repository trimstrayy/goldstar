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
    return code ? { code, valid_on: url.searchParams.get('valid_on') || undefined, discount: Number(url.searchParams.get('discount')) || undefined } : null
  } catch {
    try {
      const parsed = JSON.parse(value) as Partial<CouponQrPayload>
      return parsed.code ? { code: String(parsed.code), valid_on: parsed.valid_on, discount: parsed.discount } : null
    } catch {
      return { code: value }
    }
  }
}
