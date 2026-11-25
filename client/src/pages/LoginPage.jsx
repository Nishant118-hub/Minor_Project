import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const destinations = { ADMIN: '/admin/dashboard', MANAGER: '/manager/dashboard', EMPLOYEE: '/employee/dashboard' };

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Secure learning</p><h1 className="mt-2 text-3xl font-bold">Sign in</h1><p className="mt-2 text-sm text-slate-400">Use your approved internal training account.</p></div>
        {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
        <label className="mb-4 block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label>
        <label className="mb-6 block text-sm font-medium">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label>
        <button disabled={isSubmitting} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
        <p className="mt-6 text-center text-sm text-slate-400">New to the platform? <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">Create an employee account</Link></p>
      </form>
    </main>
  );
}
