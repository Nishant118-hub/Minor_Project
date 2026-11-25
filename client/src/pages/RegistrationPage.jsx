import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/authService';

export default function RegistrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    adminInviteCode: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === 'ADMIN' ? { adminInviteCode: form.adminInviteCode } : {})
      });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account. Check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Secure learning</p>
          <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Choose the account type you need to get started.</p>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-medium">Account type</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['EMPLOYEE', 'Employee'],
              ['ADMIN', 'Admin']
            ].map(([role, label]) => (
              <label key={role} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-colors ${form.role === role ? 'border-cyan-400 bg-emerald-950/30 text-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={form.role === role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.role === 'ADMIN' && (
          <div className="mb-4">
            <label className="block text-sm font-medium">
              Admin invite code
              <input
                required
                name="adminInviteCode"
                type="password"
                autoComplete="off"
                value={form.adminInviteCode}
                onChange={updateField}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition-colors focus:border-cyan-400"
              />
            </label>
            <p className="mt-1 text-xs text-slate-400">Admin registration requires a code from your system administrator.</p>
          </div>
        )}

        <label className="mb-4 block text-sm font-medium">
          Full name
          <input required name="name" autoComplete="name" minLength={2} maxLength={100} value={form.name} onChange={updateField} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition-colors focus:border-cyan-400" />
        </label>
        <label className="mb-4 block text-sm font-medium">
          Work email
          <input required name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition-colors focus:border-cyan-400" />
        </label>
        <div className="mb-4">
          <label htmlFor="registration-password" className="block text-sm font-medium">Password</label>
          <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 transition-colors focus-within:border-cyan-400">
            <input id="registration-password" required name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} value={form.password} onChange={updateField} className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none" />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="px-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className="mb-6">
          <label htmlFor="registration-confirm-password" className="block text-sm font-medium">Confirm password</label>
          <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 transition-colors focus-within:border-cyan-400">
            <input id="registration-confirm-password" required name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} value={form.confirmPassword} onChange={updateField} className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none" />
            <button type="button" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((visible) => !visible)} className="px-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button disabled={isSubmitting} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Creating account…' : `Create ${form.role === 'ADMIN' ? 'admin' : 'employee'} account`}
        </button>
        <p className="mt-6 text-center text-sm text-slate-400">Already registered? <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link></p>
      </form>
    </main>
  );
}