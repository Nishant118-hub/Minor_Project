import { useEffect, useState } from 'react';
import { getManagerTeam } from '../services/dashboardService';

function Badge({ tone, text }) {
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${tone}`}>{text}</span>;
}

export default function ManagerTeamPage() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManagerTeam()
      .then((list) => setEmployees(list))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load team members.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading team roster…</div>;
  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">My team</p>
        <h1 className="mt-2 text-3xl font-bold">Employee overview</h1>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/80 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Department</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium">{employee.name}</td>
                  <td className="px-4 py-3 text-slate-300">{employee.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone="border-cyan-500/30 bg-cyan-500/10 text-cyan-300" text={employee.role} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={employee.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'} text={employee.isActive ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{employee.department?.name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
