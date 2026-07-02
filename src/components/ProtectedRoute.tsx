import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogoMark } from './Logo'

/** Gates a route behind authentication. Shows a splash while auth resolves. */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cloud">
        <div className="animate-float">
          <LogoMark size={56} />
        </div>
        <p className="text-sm font-semibold text-navy-400">Loading your daybook…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
