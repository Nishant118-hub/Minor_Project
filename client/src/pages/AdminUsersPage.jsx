import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getDepartments, getUsers } from '../services/dashboardService';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  department: '',
  designation: '',
  seniority: 'JUNIOR',
  isActive: true,
  isSimulationParticipant: false
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const managers = useMemo(() => departments.filter((department) => department.manager), [departments]);

  async function loadData() {
    try {
      const [userList, departmentList] = await Promise.all([getUsers(), getDepartments()]);
      setUsers(userList);
      setDepartments(departmentList);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load user directory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setEditingId('');
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        department: form.department || undefined
      };

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user) {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department?._id || user.department || '',
      designation: user.designation || '',
      seniority: user.seniority || 'JUNIOR',
      isActive: user.isActive,
      isSimulationParticipant: Boolean(user.isSimulationParticipant)
    });
  }

  async function toggleStatus(user) {
    try {
      await api.patch(`/users/${user._id}/status`, { isActive: !user.isActive });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user status.');
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading user directory…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">People</p>
        <h1 className="mt-2 text-3xl font-bold">User management</h1>
      </section>

      {error && <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{editingId ? 'Update user' : 'Create user'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Cancel edit</button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Name</span>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 transition focus:border-cyan-500" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Email</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 transition focus:border-cyan-500" />
          </label>
          {!editingId && (
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Password</span>
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 transition focus:border-cyan-500" />
            </label>
          )}
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Role</span>
            <select name="role" value={form.role} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500">
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Department</span>
            <select name="department" value={form.department} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500">
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>{department.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Designation</span>
            <input name="designation" value={form.designation} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 transition focus:border-cyan-500" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Seniority</span>
            <select name="seniority" value={form.seniority} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500">
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead</option>
              <option value="EXECUTIVE">Executive</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm text-slate-300">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            Active account
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm text-slate-300">
            <input type="checkbox" name="isSimulationParticipant" checked={form.isSimulationParticipant} onChange={handleChange} />
            Simulation participant
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={saving} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving…' : editingId ? 'Update user' : 'Create user'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/80 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 text-slate-300">{user.role}</td>
                  <td className="px-4 py-3 text-slate-300">{user.department?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${user.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(user)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">Edit</button>
                      <button type="button" onClick={() => toggleStatus(user)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">{user.isActive ? 'Disable' : 'Enable'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {managers.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Available managers</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {managers.map((department) => (
              <span key={department._id} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">{department.manager?.name || 'Manager'} • {department.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
