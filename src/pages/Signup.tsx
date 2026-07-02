import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import SocialAuthButtons from '../components/SocialAuthButtons'
import { authErrorMessage, useAuth } from '../context/AuthContext'
import { firebaseConfigured } from '../lib/firebase'

export default function Signup() {
  const { signUpWithEmail, signInWithGoogle, signInWithMicrosoft } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pwOk = password.length >= 6

  const run = async (fn: () => Promise<void>) => {
    if (!firebaseConfigured) {
      setError('Firebase isn’t configured yet. Add your project credentials to enable sign-up.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await fn()
      navigate('/app', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start turning lessons into evidence — free, no card required.">
      <SocialAuthButtons
        action="Sign up"
        disabled={busy}
        onGoogle={() => run(signInWithGoogle)}
        onMicrosoft={() => run(signInWithMicrosoft)}
      />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-navy-100" />
        <span className="text-xs font-semibold uppercase tracking-wider text-navy-400">or</span>
        <span className="h-px flex-1 bg-navy-100" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(() => signUpWithEmail(name, email, password))
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-navy-800">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Mitchell"
            className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-navy-800">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 pr-11 text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password.length > 0 && (
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${pwOk ? 'text-teal-600' : 'text-navy-400'}`}>
              <Check size={13} strokeWidth={3} /> At least 6 characters
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={busy || !pwOk} className="btn-primary w-full text-base disabled:cursor-not-allowed">
          {busy ? <Loader2 size={18} className="animate-spin" /> : 'Create account'}
        </button>

        <p className="text-center text-xs leading-relaxed text-navy-400">
          By creating an account you agree to our{' '}
          <a href="#" className="font-semibold text-navy-500 hover:text-navy-700">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="font-semibold text-navy-500 hover:text-navy-700">
            Privacy Policy
          </a>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-navy-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
