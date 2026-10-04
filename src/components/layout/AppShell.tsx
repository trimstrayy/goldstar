import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { Bell, ChevronDown, Command, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, ShoppingBag, Sparkles, Sun, Users, X } from 'lucide-react'
import type { Role } from '../../types/db'
import { Button } from '../ui/atoms'
import { canSee, isAdmin, isManager } from '../../lib/permissions'
import { cls } from '../../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' },
  { to: '/customers', label: 'Customers', icon: Users, section: 'customers' },
  { to: '/new-sale', label: 'New sale', icon: ShoppingBag, section: 'sales', accent: true },
  { to: '/sales', label: 'Sales', icon: ShoppingBag, section: 'sales' },
  { to: '/birthdays', label: 'Birthdays', icon: Sparkles, section: 'birthdays' },
  { to: '/messages', label: 'Messages', icon: Bell, section: 'messages' },
  { to: '/legacy-import', label: 'Legacy import', icon: Command, section: 'legacy-import' },
  { to: '/reports', label: 'Reports', icon: Command, section: 'reports' },
  { to: '/settings', label: 'Settings', icon: Settings, section: 'settings' },
  { to: '/staff', label: 'Staff', icon: Users, section: 'staff' },
  { to: '/audit-log', label: 'Audit log', icon: Command, section: 'audit-log' },
  { to: '/setup', label: 'Setup / health', icon: Settings, section: 'setup' }
]

export function AppShell({ children, role, name, onSignOut, onToggleDark }: { children?: ReactNode; role: Role; name: string; onSignOut: () => void; onToggleDark: () => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation(); const navigate = useNavigate()
  const visible = nav.filter(item => canSee(role, item.section))
  const title = nav.find(item => item.to === location.pathname)?.label || (location.pathname.startsWith('/customers/') ? 'Customer profile' : location.pathname.startsWith('/sales/') ? 'Sale detail' : 'Goldstar Banepa')
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); if (search.trim()) navigate(`/customers?search=${encodeURIComponent(search.trim())}`) }
  return <div className="min-h-screen bg-paper text-ink dark:bg-[#121212] dark:text-paper">
    <aside className={cls('fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-[#0D0D0D] px-5 py-6 text-white transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between px-2"><NavLink to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold text-ink shadow-gold"><Sparkles size={20} fill="currentColor" /></span><span><span className="block font-display text-lg">Goldstar</span><span className="block text-[10px] uppercase tracking-[.18em] text-white/55">Banepa loyalty</span></span></NavLink><button onClick={() => setOpen(false)} className="text-white/60 lg:hidden"><X size={20} /></button></div>
      <div className="mt-10 flex-1 space-y-1">{visible.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => cls('group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition', isActive ? 'bg-gold text-ink' : item.accent ? 'bg-white/10 text-white hover:bg-white/15' : 'text-white/65 hover:bg-white/10 hover:text-white')}><Icon size={17} /><span>{item.label}</span>{item.accent && <span className="ml-auto h-2 w-2 rounded-full bg-gold" />}</NavLink> })}</div>
      <div className="border-t border-white/10 pt-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gold font-bold text-ink">{name.slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-[10px] uppercase tracking-[.12em] text-white/45">{role}</p></div></div><button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={16} /> Sign out</button></div>
    </aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur dark:border-[#2c2c2c] dark:bg-[#121212]/90"><div className="flex h-20 items-center gap-4 px-4 sm:px-7"><button className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden dark:border-[#3b3b3b]" onClick={() => setOpen(true)}><Menu size={18} /></button><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Goldstar Banepa / {role}</p><h2 className="truncate font-display text-xl">{title}</h2></div><form onSubmit={submitSearch} className="hidden w-full max-w-xs items-center gap-2 rounded-xl border border-line bg-white px-3 dark:border-[#3b3b3b] dark:bg-[#1d1d1d] md:flex"><Search size={16} className="text-graphite" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers /" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-graphite" /><kbd className="rounded bg-sand px-1.5 py-0.5 text-[10px] text-graphite">/</kbd></form><button onClick={onToggleDark} className="grid h-10 w-10 place-items-center rounded-xl border border-line dark:border-[#3b3b3b]" aria-label="Toggle dark mode"><Sun size={16} className="hidden dark:block" /><Moon size={16} className="dark:hidden" /></button><button className="relative grid h-10 w-10 place-items-center rounded-xl border border-line dark:border-[#3b3b3b]"><Bell size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" /></button></div></header><main className="px-4 py-7 pb-24 sm:px-7 lg:pb-10">{children || <Outlet />}</main></div>
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-paper/95 px-2 py-2 backdrop-blur lg:hidden dark:border-[#2c2c2c] dark:bg-[#121212]/95">{visible.slice(0,5).map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} className={({ isActive }) => cls('flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px]', isActive ? 'text-gold' : 'text-graphite')}><Icon size={18} /><span>{item.label}</span></NavLink> })}</nav>
  </div>
}
