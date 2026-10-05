import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle, Search, Sparkles, type LucideIcon } from 'lucide-react'
import { cls } from '../../lib/utils'

export function Button({ className, variant = 'primary', size = 'md', loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  const variants = { primary: 'bg-ink text-paper hover:bg-ink/90 shadow-sm', secondary: 'bg-gold text-ink hover:bg-[#25266F]', ghost: 'bg-transparent text-graphite hover:bg-sand/60', danger: 'bg-ink text-paper hover:bg-ink/90', outline: 'border border-line bg-transparent text-ink hover:border-gold hover:bg-gold/5 dark:text-paper dark:border-[#000000]' }
  const sizes = { sm: 'h-9 px-3 text-xs', md: 'h-11 px-4 text-sm', lg: 'h-13 px-5 text-base' }
  return <button className={cls('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50', variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>{loading && <LoaderCircle size={16} className="animate-spin" />}{children}</button>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'green' | 'red' | 'blue' }) {
  const tones = { neutral: 'bg-sand text-graphite', gold: 'bg-gold/15 text-[#30318F]', green: 'bg-[#EEF0FF] text-[#30318F]', red: 'bg-black text-white', blue: 'bg-[#EEF0FF] text-[#30318F]' }
  return <span className={cls('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em]', tones[tone])}>{children}</span>
}

export function Panel({ children, className, title, eyebrow, action }: { children: ReactNode; className?: string; title?: string; eyebrow?: string; action?: ReactNode }) {
  return <section className={cls('surface rounded-2xl border border-line bg-white/80 p-5 shadow-soft dark:bg-[#000000]', className)}>{(title || eyebrow || action) && <div className="mb-5 flex items-start justify-between gap-3"><div>{eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-gold">{eyebrow}</p>}{title && <h2 className="font-display text-xl text-ink dark:text-paper">{title}</h2>}</div>{action}</div>}{children}</section>
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action }: { icon?: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/60 px-6 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold"><Icon size={22} /></div><h3 className="font-display text-lg text-ink dark:text-paper">{title}</h3><p className="mt-1 max-w-md text-sm text-graphite">{description}</p>{action && <div className="mt-4">{action}</div>}</div>
}

export function SkeletonRows({ count = 4 }: { count?: number }) { return <div className="space-y-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-sand/70 dark:bg-[#000000]" />)}</div> }

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-gold">{eyebrow}</p><h1 className="gold-rule font-display text-3xl leading-tight text-ink sm:text-4xl dark:text-paper">{title}</h1>{description && <p className="mt-4 max-w-2xl text-sm leading-6 text-graphite">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div> }

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) { return <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.08em] text-graphite">{label}</span>{children}{hint && !error && <span className="mt-1 block text-xs text-graphite">{hint}</span>}{error && <span className="mt-1 block text-xs text-black">{error}</span>}</label> }
export const inputClass = 'h-11 w-full rounded-xl border border-line bg-paper/70 px-3 text-sm text-ink placeholder:text-graphite/60 transition focus:border-gold dark:border-[#000000] dark:bg-[#000000] dark:text-paper'
export const textareaClass = 'w-full rounded-xl border border-line bg-paper/70 px-3 py-3 text-sm text-ink placeholder:text-graphite/60 transition focus:border-gold dark:border-[#000000] dark:bg-[#000000] dark:text-paper'

export function Toast({ message, tone = 'success', onClose }: { message: string | null; tone?: 'success' | 'error'; onClose: () => void }) { if (!message) return null; return <div role="status" className={cls('fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-soft', tone === 'error' ? 'bg-[#000000]' : 'bg-ink')}><span>{message}</span><button className="text-white/70 hover:text-white" onClick={onClose}>×</button></div> }
