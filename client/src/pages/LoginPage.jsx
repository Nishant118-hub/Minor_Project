import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BinaryMatrixRain from '../components/BinaryMatrixRain';

const destinations = {
  ADMIN: '/admin/dashboard',
  SECURITY_ANALYST: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard'
};

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(location.state?.registered ? 'Account created. Sign in with your new credentials.' : '');

  if (user) return <Navigate to={destinations[user.role] || '/'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const signedInUser = await signIn({ email, password });
      navigate(location.state?.from?.pathname || destinations[signedInUser.role] || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-black text-slate-100 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden">
      {/* Falling Green Binary Matrix Rain Canvas */}
      <BinaryMatrixRain opacity={0.65} fontSize={16} />

      <section className="relative z-10 flex min-h-screen items-center justify-start p-6 sm:p-10 lg:px-12 xl:px-20">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-8 shadow-2xl shadow-emerald-950/40">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400 font-mono">SEC::AUTH_PORTAL</p>
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Sign In</h1>
            <p className="mt-2 text-sm text-slate-400">Use your approved internal cyber training credentials.</p>
          </div>
          {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
          {error && <p role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
          
          <label className="mb-4 block text-sm font-medium text-slate-300">
            Email Address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-slate-100 outline-none focus:border-cyan-400 transition-colors"
            />
          </label>
          <div className="mb-6">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">Password</label>
            <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950/80 transition-colors focus-within:border-cyan-400">
              <input
                id="login-password"
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-slate-100 outline-none"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                className="px-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 shadow-matrix"
          >
            {isSubmitting ? 'Verifying access…' : 'Authenticate & Enter'}
          </button>
          <p className="mt-6 text-center text-sm text-slate-400">
            New to the platform?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:underline">
              Create an employee account
            </Link>
          </p>
        </form>
      </section>

      <aside className="relative z-10 hidden min-h-screen items-center justify-center px-10 py-12 lg:flex xl:px-16">
        <div className="w-full max-w-2xl text-center space-y-6">
          <img
            src="/hacker-workstation.svg"
            alt="Cybersecurity terminal workspace"
            className="mx-auto w-4/5 drop-shadow-[0_24px_60px_rgba(0,255,102,0.15)] filter saturate-150"
          />
          <div className="mx-auto max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400 font-mono">01000011 01011001 01000010 01000101 01010010</p>
            <h2 className="mt-3 text-3xl font-extrabold text-white tracking-wide">Stay Alert. Stay Protected.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Interactive cyber threat simulation, real-time message analysis, and proactive employee defense.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
