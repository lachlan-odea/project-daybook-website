import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  History,
  BarChart3,
  LogOut,
  Sparkles,
  Waves,
  Plus,
  Search,
  Bell,
} from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Mic, label: 'Record Lesson' },
  { icon: BookOpen, label: 'Programs' },
  { icon: History, label: 'History' },
  { icon: BarChart3, label: 'Data & Reports' },
]

const timetable = [
  { p: 'P1', t: '9:05', s: 'Year 9 Science', c: 'Forces & Motion', on: true },
  { p: 'P2', t: '10:00', s: 'Year 7 English', c: 'Persuasive writing', on: false },
  { p: 'P4', t: '12:30', s: 'Year 10 Maths', c: 'Quadratics', on: false },
  { p: 'P5', t: '1:25', s: 'Year 8 Science', c: 'The particle model', on: false },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Teacher'
  const firstName = displayName.split(' ')[0]
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-cloud">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-navy-100 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-navy-100 px-6">
          <LogoMark size={34} />
          <span className="flex items-baseline text-lg font-extrabold tracking-tight">
            <span className="text-navy-800">Project</span>
            <span className="ml-1 text-teal-500">Daybook</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                item.active ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-navy-100 p-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-600 hover:bg-navy-50"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-100 bg-white/80 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <LogoMark size={30} />
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-navy-100 bg-cloud px-3 py-2 text-sm text-navy-400 sm:flex sm:w-80">
            <Search size={16} />
            <span>Search lessons, students, outcomes…</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy-500 hover:bg-navy-50">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-navy-50"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                    {initials}
                  </span>
                )}
                <span className="hidden text-sm font-semibold text-navy-800 sm:block">{firstName}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-navy-100 bg-white p-2 shadow-card">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-navy-900">{displayName}</p>
                    <p className="truncate text-xs text-navy-400">{user?.email}</p>
                  </div>
                  <div className="my-1 h-px bg-navy-100" />
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-50"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
                Thursday, 2 July
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
                Good morning, {firstName} 👋
              </h1>
            </div>
            <button className="btn-primary text-sm">
              <Mic size={17} /> Record a lesson
            </button>
          </div>

          {/* Setup banner */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="font-bold text-navy-900">You’re signed in — welcome aboard!</p>
                <p className="text-sm text-navy-500">
                  Upload your first teaching program so Curriculum Intelligence can start matching your lessons.
                </p>
              </div>
            </div>
            <button className="btn-navy shrink-0 text-sm">
              <Plus size={16} /> Upload a program
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Timetable */}
            <div className="lg:col-span-2">
              <div className="card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-400">Today’s timetable</h2>
                <div className="space-y-2">
                  {timetable.map((row) => (
                    <div
                      key={row.p}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                        row.on ? 'bg-navy-800 text-white' : 'bg-cloud text-navy-700'
                      }`}
                    >
                      <span className={`text-xs font-bold ${row.on ? 'text-teal-300' : 'text-navy-400'}`}>
                        {row.p} · {row.t}
                      </span>
                      <span className="text-sm font-semibold">{row.s}</span>
                      <span className={`ml-auto text-xs ${row.on ? 'text-navy-200' : 'text-navy-400'}`}>{row.c}</span>
                      {row.on && (
                        <span className="flex items-center gap-1 rounded-full bg-teal-400 px-2 py-0.5 text-[10px] font-bold text-navy-950">
                          <Waves size={10} /> Now
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested next */}
            <div className="space-y-6">
              <div className="card p-5">
                <div className="flex items-center gap-2 text-sky-600">
                  <Sparkles size={16} />
                  <h2 className="text-sm font-bold text-navy-800">Suggested next</h2>
                </div>
                <p className="mt-2 text-sm text-navy-500">
                  Momentum &amp; collisions — builds on today’s Forces &amp; Motion lesson.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">SC4-1</span>
                  <span className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy-600">Prac</span>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-bold text-navy-800">This week</h2>
                <div className="mt-3 space-y-3">
                  {[
                    { l: 'Lessons recorded', v: '0' },
                    { l: 'Evidence items', v: '0' },
                    { l: 'Programs uploaded', v: '0' },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center justify-between">
                      <span className="text-sm text-navy-500">{s.l}</span>
                      <span className="text-sm font-bold text-navy-900">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-navy-400">
            This is your app home. The full recording, programs, history and reports features connect here next.
          </p>
          <p className="mt-2 text-center text-xs text-navy-400">
            <Link to="/" className="font-semibold text-teal-600 hover:text-teal-700">
              ← Back to website
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}
