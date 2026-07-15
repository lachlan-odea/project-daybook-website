import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Info, Sparkles, Wrench, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeAnnouncements,
  subscribeDismissals,
  dismissAnnouncement,
  type Announcement,
  type AnnouncementType,
  type Dismissals,
} from '../lib/announcements'

const TYPE_META: Record<AnnouncementType, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50' },
  update: { icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50' },
  maintenance: { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
}

function whenLabel(a: Announcement) {
  const d = a.createdAt?.toDate?.()
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''
}

export default function NotificationsBell() {
  const { user } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Dismissals>({})
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => subscribeAnnouncements(setItems), [])
  useEffect(() => {
    if (!user) return
    return subscribeDismissals(user.uid, setDismissed)
  }, [user])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = useMemo(() => items.filter((a) => a.active), [items])
  const unreadCount = active.filter((a) => a.id && !dismissed[a.id]).length

  const dismiss = (id?: string) => {
    if (!user || !id) return
    dismissAnnouncement(user.uid, id)
  }
  const dismissAll = () => {
    active.forEach((a) => a.id && !dismissed[a.id] && dismiss(a.id))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy-500 hover:bg-navy-50"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-bold text-navy-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={dismissAll} className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto border-t border-navy-100">
            {active.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={22} className="mx-auto text-navy-200" />
                <p className="mt-2 text-sm text-navy-400">You’re all caught up.</p>
              </div>
            ) : (
              active.map((a) => {
                const meta = TYPE_META[a.type] ?? TYPE_META.info
                const Icon = meta.icon
                const isUnread = a.id ? !dismissed[a.id] : false
                return (
                  <div
                    key={a.id}
                    className={`flex gap-3 border-b border-navy-50 px-4 py-3 ${isUnread ? 'bg-teal-50/40' : ''}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-navy-900">{a.title}</p>
                        <span className="shrink-0 text-[11px] text-navy-300">{whenLabel(a)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-navy-600">{a.body}</p>
                      {isUnread && (
                        <button
                          onClick={() => dismiss(a.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                        >
                          <Check size={12} /> Mark as read
                        </button>
                      )}
                    </div>
                    {isUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
