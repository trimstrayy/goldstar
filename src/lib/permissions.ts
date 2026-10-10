import type { Role } from '../types/db'
export const isManager = (role?: Role | null) => role === 'manager' || role === 'admin'
export const isAdmin = (role?: Role | null) => role === 'admin'
export const canSee = (role: Role | null | undefined, section: string) => {
  if (!role) return false
  if (['birthdays', 'messages', 'regular-lucky-draw', 'legacy-import', 'reports'].includes(section)) return isManager(role)
  if (['settings', 'staff', 'audit-log', 'setup'].includes(section)) return isAdmin(role)
  return true
}
