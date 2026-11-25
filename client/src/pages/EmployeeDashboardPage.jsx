import { useEffect, useState } from 'react';
import { getEmployeeDashboard } from '../services/dashboardService';

function StatCard({ label, value, accent = 'text-cyan-400' }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </article>
  );
}

export default function EmployeeDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getEmployeeDashboard().then(setDashboard).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load employee dashboard.'));
  }, []);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;
  if (!dashboard) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading your awareness overview…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Your dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Personal security overview</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Risk tier" value={dashboard.riskTier} accent={dashboard.riskTier === 'HIGH' ? 'text-rose-400' : dashboard.riskTier === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'} />
        <StatCard label="Risk score" value={dashboard.score} accent="text-cyan-400" />
        <StatCard label="Training progress" value={`${dashboard.trainingProgress}%`} accent="text-emerald-400" />
        <StatCard label="Recommendations" value={dashboard.recommendations.length} accent="text-violet-400" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Current focus</h2>
          <ul className="space-y-3 text-slate-300">
            {dashboard.recommendations.map((item) => (
              <li key={item.moduleId || item.title} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-medium text-cyan-300">{item.title}</p>
                <p className="mt-1 text-sm">{item.reason}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Learning status</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-sm text-slate-400">Completed modules</p>
              <p className="text-2xl font-bold text-emerald-400">{dashboard.completedModules}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-400">Average quiz score</p>
              <p className="text-2xl font-bold text-amber-400">{dashboard.averageQuizScore}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-400">Safe reporting rate</p>
              <p className="text-2xl font-bold text-violet-400">{dashboard.reportRate}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
