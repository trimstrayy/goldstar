import { useEffect, useId, useState } from 'react'
import { Camera, Clipboard, LoaderCircle, ScanLine, X } from 'lucide-react'
import { safeError } from '../../lib/utils'
import { Button, inputClass } from '../ui/atoms'

export function CouponScanner({ onDecoded, onClose }: { onDecoded: (value: string) => void; onClose: () => void }) {
  const id = `coupon-scanner-${useId().replace(/:/g, '')}`
  const [value, setValue] = useState('')
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState('')
  useEffect(() => {
    let reader: { start: (...args: any[]) => Promise<unknown>; stop: () => Promise<unknown> } | null = null
    let disposed = false
    const start = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (disposed) return
        const instance = new Html5Qrcode(id)
        reader = instance
        await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } }, (decoded: string) => { onDecoded(decoded); reader?.stop().catch(() => undefined) }, () => undefined)
        if (!disposed) setCameraLoading(false)
      } catch (error) {
        if (!disposed) { setCameraLoading(false); setCameraError(safeError(error)) }
      }
    }
    void start()
    return () => { disposed = true; reader?.stop().catch(() => undefined) }
  }, [id, onDecoded])
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-gold">Coupon redemption</p><h2 className="font-display text-2xl">Scan a birthday QR</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-sand" aria-label="Close scanner"><X size={18} /></button></div><div id={id} className="min-h-56 overflow-hidden rounded-2xl bg-ink" />{cameraLoading && <p className="flex items-center justify-center gap-2 text-xs text-graphite"><LoaderCircle size={14} className="animate-spin" /> Starting camera…</p>}{cameraError && <p className="rounded-xl bg-gold/10 p-3 text-xs leading-5 text-[#0E4C92]">Camera unavailable here: {cameraError}. Use the code field below with a scanner gun or copied QR result.</p>}<div className="rounded-2xl border border-line p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clipboard size={15} className="text-gold" /> Paste or type a coupon code</div><div className="flex gap-2"><input autoFocus className={inputClass} value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') onDecoded(value) }} placeholder="goldstar://coupon?code=GS…" /><Button variant="secondary" onClick={() => onDecoded(value)} disabled={!value.trim()}><ScanLine size={16} /> Use code</Button></div></div></div>
}
