import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getDepartments } from '../services/dashboardService';

const initialForm = { name: '', description: '', manager: '' };

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const managerOptions = useMemo(() => managers.filter((user) => user.role === 'MANAGER'), [managers]);

  async function loadData() {
    try {
      const [departmentList, userList] = await Promise.all([
        getDepartments(),
        api.get('/users')
      ]);
      setDepartments(departmentList);
      setManagers(userList.data.users || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load department data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setEditingId('');
    setForm(initialForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEdit(department) {
    setEditingId(department._id);
    setForm({
      name: department.name,
      description: department.description || '',
      manager: department.manager?._id || department.manager || ''
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        manager: form.manager || undefined
      };

      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
      } else {
        await api.post('/departments', payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save department.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(department) {
    if (!window.confirm(`Delete ${department.name}?`)) return;

    try {
      await api.delete(`/departments/${department._id}`);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete department.');
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading departments…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Structure</p>
        <h1 className="mt-2 text-3xl font-bold">Department management</h1>
      </section>

      {error && <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{editingId ? 'Update department' : 'Create department'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Cancel edit</button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Department name</span>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Assigned manager</span>
            <select name="manager" value={form.manager} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500">
              <option value="">Unassigned</option>
              {managerOptions.map((user) => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block space-y-2 text-sm">
          <span className="text-slate-300">Description</span>
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500" />
        </label>

        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={saving} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving…' : editingId ? 'Update department' : 'Create department'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/80 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Manager</th>
                <th className="px-4 py-3 font-semibold">Employees</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department._id} className="border-t border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{department.name}</div>
                    <div className="text-xs text-slate-400">{department.description || 'No description provided.'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{department.manager?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-slate-300">{department.employeeCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(department)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">Edit</button>
                      <button type="button" onClick={() => handleDelete(department)} className="rounded-lg border border-rose-700/40 px-2 py-1 text-xs text-rose-200 hover:bg-rose-950/40">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
