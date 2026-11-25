import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const seniorityOptions = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];

export default function EmployeeProfilePage() {
  const { user, signOut } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    designation: user?.designation || '',
    seniority: user?.seniority || 'JUNIOR'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      designation: user?.designation || '',
      seniority: user?.seniority || 'JUNIOR'
    });
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.put(`/users/${user.id}`, {
        name: form.name,
        designation: form.designation,
        seniority: form.seniority
      });

      localStorage.setItem('cyber_awareness_user', JSON.stringify({ ...user, ...data.user }));
      setMessage('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Account</p>
        <h1 className="mt-2 text-3xl font-bold">Profile settings</h1>
      </section>

      {error && <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-4 text-emerald-200">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Personal details</h2>
          <div className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Full name</span>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500" />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Email</span>
              <input value={user.email} disabled className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-400 outline-none" />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Designation</span>
              <input name="designation" value={form.designation} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500" />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Seniority</span>
              <select name="seniority" value={form.seniority} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500">
                {seniorityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        <aside className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold">Account summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3"><span>Role</span><span className="font-medium text-cyan-300">{user.role}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3"><span>Department</span><span className="font-medium text-slate-100">{user.department ? 'Assigned' : 'Unassigned'}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3"><span>Points</span><span className="font-medium text-violet-300">{user.points || 0}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3"><span>Simulation consent</span><span className="font-medium text-emerald-300">{user.isSimulationParticipant ? 'Enabled' : 'Not enrolled'}</span></div>
          </div>

          <button type="button" onClick={signOut} className="mt-6 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Sign out</button>
        </aside>
      </div>
    </div>
  );
}
