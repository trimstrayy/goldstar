import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share2 } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { createCouponPayload } from '../../lib/coupons'
import { formatDate } from '../../lib/utils'
import { Button } from '../ui/atoms'

type ShareCoupon = {
  coupon_code: string
  discount_pct?: number | null
  valid_on?: string | null
  customers?: { full_name?: string | null; phone?: string | null } | null
}

type ShareCouponCardProps = {
  coupon: ShareCoupon
  message?: string
  shopName?: string
  onToast?: (state: { message: string; tone: 'success' | 'error' }) => void
  size?: 'sm' | 'md'
}

const FALLBACK_MESSAGE = 'Happy birthday, {{name}}! Congratulations on your Goldstar gift — you have earned a {{discount}}% birthday reward.'

function cleanMessage(message: string, coupon: ShareCoupon, shopName: string) {
  return message
    .replace(/{{name}}/g, coupon.customers?.full_name || 'there')
    .replace(/{{discount}}/g, String(coupon.discount_pct || 0))
    .replace(/{{code}}/g, coupon.coupon_code)
    .replace(/{{date}}/g, coupon.valid_on ? formatDate(coupon.valid_on) : 'today')
    .replace(/{{shop}}/g, shopName)
}

export function ShareCouponCard({ coupon, message, shopName = 'Goldstar Banepa', onToast, size = 'sm' }: ShareCouponCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const customerName = coupon.customers?.full_name || 'Goldstar guest'
  const greeting = cleanMessage(message?.trim() || FALLBACK_MESSAGE, coupon, shopName)
  const shareText = `${greeting}\n\nCongratulations on your gift from ${shopName}!\nCoupon: ${coupon.discount_pct || 0}% off\nCode: ${coupon.coupon_code}\nValid: ${coupon.valid_on ? formatDate(coupon.valid_on) : 'today'}\nShow the QR code at the Goldstar counter to redeem.`

  const share = async () => {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#FFFFFF' })
      if (!blob) throw new Error('The coupon card could not be prepared.')
      const file = new File([blob], `goldstar-birthday-${coupon.coupon_code}.png`, { type: 'image/png' })
      const shareData = { title: `${shopName} birthday reward`, text: shareText, files: [file] }
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share(shareData)
        onToast?.({ message: 'Goldstar coupon card shared.', tone: 'success' })
      } else if (navigator.share) {
        await navigator.share({ title: shareData.title, text: shareText })
        onToast?.({ message: 'Coupon details shared. Download the card for the QR image.', tone: 'success' })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
        await navigator.clipboard?.writeText(shareText)
        onToast?.({ message: 'Coupon card downloaded and sharing text copied.', tone: 'success' })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      onToast?.({ message: error instanceof Error ? error.message : 'Unable to share the coupon card.', tone: 'error' })
    } finally {
      setSharing(false)
    }
  }

  return <>
    <Button size={size} variant="secondary" loading={sharing} onClick={share}><Share2 size={14} /> Share card</Button>
    <div ref={cardRef} aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] w-[720px] bg-white p-12 text-black">
      <div className="border-[3px] border-[#0E4C92] p-8">
        <div className="flex items-center justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-4">
            <img src="/goldstar-logo.png" alt="Goldstar" className="h-16 w-auto object-contain" />
            <div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#0E4C92]">Birthday reward</p><p className="mt-1 text-sm font-semibold">{shopName}</p></div>
          </div>
          <div className="rounded-full bg-[#0E4C92] px-5 py-3 text-2xl font-bold text-white">{coupon.discount_pct || 0}% OFF</div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-8 py-8">
          <div>
            <p className="text-4xl font-bold">Happy birthday, {customerName}!</p>
            <p className="mt-5 text-xl leading-8">{greeting}</p>
            <p className="mt-5 text-lg font-bold">Congratulations on your Goldstar gift.</p>
            <div className="mt-8 border-y-2 border-black py-5 text-lg"><p><span className="font-bold">Coupon code:</span> {coupon.coupon_code}</p><p className="mt-2"><span className="font-bold">Valid on:</span> {coupon.valid_on ? formatDate(coupon.valid_on) : 'Today'}</p></div>
          </div>
          <div className="flex flex-col items-center gap-4"><div className="border-2 border-black bg-white p-3"><QRCodeSVG value={createCouponPayload(coupon)} size={190} includeMargin bgColor="#FFFFFF" fgColor="#000000" /></div><p className="text-center text-xs font-bold uppercase tracking-[.16em]">Scan to redeem</p></div>
        </div>
        <div className="border-t-2 border-black pt-5 text-sm font-semibold">Present this card at the Goldstar counter. Your discount is verified securely at redemption.</div>
      </div>
    </div>
  </>
}
