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

const BLUE = '#0E4C92'
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
      const logo = cardRef.current.querySelector('img')
      if (logo && !logo.complete) await logo.decode().catch(() => undefined)
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        style: { transform: 'none', opacity: '1', visibility: 'visible' },
      })
      if (!blob || blob.size < 1000) throw new Error('The coupon card image was empty. Please try again.')
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
        document.body.appendChild(link)
        link.click()
        link.remove()
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
    <div ref={cardRef} aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, width: 720, padding: 48, background: '#FFFFFF', color: '#000000', zIndex: -1, pointerEvents: 'none', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ border: `3px solid ${BLUE}`, padding: 32, background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/goldstar-logo.png" alt="Goldstar" style={{ display: 'block', width: 180, height: 72, objectFit: 'contain' }} />
            <div><p style={{ margin: 0, color: BLUE, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Birthday reward</p><p style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 700 }}>{shopName}</p></div>
          </div>
          <div style={{ borderRadius: 999, background: BLUE, color: '#FFFFFF', padding: '14px 20px', fontSize: 26, fontWeight: 700, whiteSpace: 'nowrap' }}>{coupon.discount_pct || 0}% OFF</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 32, padding: '32px 0' }}>
          <div>
            <p style={{ margin: 0, fontSize: 34, lineHeight: 1.15, fontWeight: 700 }}>Happy birthday, {customerName}!</p>
            <p style={{ margin: '20px 0 0', fontSize: 20, lineHeight: 1.55 }}>{greeting}</p>
            <p style={{ margin: '20px 0 0', fontSize: 18, lineHeight: 1.4, fontWeight: 700 }}>Congratulations on your Goldstar gift.</p>
            <div style={{ marginTop: 32, borderTop: '2px solid #000000', borderBottom: '2px solid #000000', padding: '18px 0', fontSize: 18, lineHeight: 1.5 }}><p style={{ margin: 0 }}><strong>Coupon code:</strong> {coupon.coupon_code}</p><p style={{ margin: '8px 0 0' }}><strong>Valid on:</strong> {coupon.valid_on ? formatDate(coupon.valid_on) : 'Today'}</p></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}><div style={{ border: '2px solid #000000', background: '#FFFFFF', padding: 12 }}><QRCodeSVG value={createCouponPayload(coupon)} size={190} includeMargin bgColor="#FFFFFF" fgColor="#000000" /></div><p style={{ margin: 0, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Scan to redeem</p></div>
        </div>
        <div style={{ borderTop: '2px solid #000000', paddingTop: 18, fontSize: 14, lineHeight: 1.5, fontWeight: 700 }}>Present this card at the Goldstar counter. Your discount is verified securely at redemption.</div>
      </div>
    </div>
  </>
}
