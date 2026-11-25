import { useEffect, useState } from 'react';
import { getManagerDashboard } from '../services/dashboardService';

function downloadCsv(filename, headers, rows) {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const content = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ManagerReportsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getManagerDashboard()
      .then(setDashboard)
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load team reports.'));
  }, []);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;
  if (!dashboard) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading team reports…</div>;

  const { metrics, charts } = dashboard;
  const exportReport = () => downloadCsv(
    'team-awareness-report.csv',
    ['Employee', 'Risk tier', 'Risk score'],
    charts.teamRisk.map((item) => [item.name, item.riskTier, item.score])
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Team reporting</p>
          <h1 className="mt-2 text-3xl font-bold">Department awareness report</h1>
          <p className="mt-2 text-slate-400">Use the latest team risk and training signals to target follow-up.</p>
        </div>
        <button type="button" onClick={exportReport} className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Download CSV</button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Team members</p><p className="mt-2 text-3xl font-bold text-cyan-400">{metrics.totalEmployees}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Assessed</p><p className="mt-2 text-3xl font-bold text-violet-400">{metrics.assessedEmployees}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">High risk</p><p className="mt-2 text-3xl font-bold text-rose-400">{metrics.highRiskEmployees}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Training completion</p><p className="mt-2 text-3xl font-bold text-emerald-400">{metrics.trainingCompletion}%</p></article>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-5"><h2 className="text-lg font-semibold">Priority follow-up list</h2><p className="mt-1 text-sm text-slate-400">Employees with the highest current risk scores appear first.</p></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Risk tier</th><th className="px-4 py-3">Risk score</th><th className="px-4 py-3">Suggested action</th></tr></thead>
            <tbody>
              {charts.teamRisk.map((item) => (
                <tr key={item.name} className="border-t border-slate-800"><td className="px-4 py-3 font-medium">{item.name}</td><td className={`px-4 py-3 font-medium ${item.riskTier === 'HIGH' ? 'text-rose-300' : item.riskTier === 'MEDIUM' ? 'text-amber-300' : 'text-emerald-300'}`}>{item.riskTier}</td><td className="px-4 py-3 text-slate-300">{item.score}</td><td className="px-4 py-3 text-slate-300">{item.riskTier === 'HIGH' ? 'Assign priority training' : item.riskTier === 'MEDIUM' ? 'Recommend refresher module' : 'Maintain learning cadence'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
