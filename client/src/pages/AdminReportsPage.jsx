import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../services/dashboardService';

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

function Metric({ label, value, tone = 'text-cyan-400' }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </article>
  );
}

export default function AdminReportsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboard()
      .then(setDashboard)
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load organization reports.'));
  }, []);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;
  if (!dashboard) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading organization reports…</div>;

  const { metrics, charts } = dashboard;
  const exportReport = () => downloadCsv(
    'organization-awareness-report.csv',
    ['Report', 'Metric', 'Value'],
    [
      ['Overview', 'Total employees', metrics.totalEmployees],
      ['Overview', 'Active employees', metrics.activeEmployees],
      ['Overview', 'High risk employees', metrics.highRiskEmployees],
      ['Overview', 'Training completion', `${metrics.trainingCompletion}%`],
      ...charts.departmentComparison.map((item) => ['Department risk', item.department, item.averageRisk]),
      ...charts.campaignPerformance.map((item) => ['Campaign performance', item.campaign, `${item.clickRate}% click / ${item.reportRate}% report`])
    ]
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Organization reporting</p>
          <h1 className="mt-2 text-3xl font-bold">Awareness performance reports</h1>
          <p className="mt-2 text-slate-400">Review risk, training, and simulation outcomes in one operational view.</p>
        </div>
        <button type="button" onClick={exportReport} className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Download CSV</button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Employees" value={metrics.totalEmployees} />
        <Metric label="High risk" value={metrics.highRiskEmployees} tone="text-rose-400" />
        <Metric label="Training completion" value={`${metrics.trainingCompletion}%`} tone="text-emerald-400" />
        <Metric label="Average report rate" value={`${metrics.averageReportRate}%`} tone="text-violet-400" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Department risk report</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400"><tr><th className="px-3 py-2">Department</th><th className="px-3 py-2">Employees</th><th className="px-3 py-2">Average risk</th></tr></thead>
              <tbody>
                {charts.departmentComparison.map((item) => (
                  <tr key={item.department} className="border-t border-slate-800"><td className="px-3 py-3 font-medium">{item.department}</td><td className="px-3 py-3 text-slate-300">{item.employees}</td><td className="px-3 py-3 text-cyan-300">{item.averageRisk}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Campaign performance report</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400"><tr><th className="px-3 py-2">Campaign</th><th className="px-3 py-2">Click rate</th><th className="px-3 py-2">Report rate</th></tr></thead>
              <tbody>
                {charts.campaignPerformance.map((item) => (
                  <tr key={`${item.campaign}-${item.sentAt}`} className="border-t border-slate-800"><td className="px-3 py-3 font-medium">{item.campaign}</td><td className="px-3 py-3 text-rose-300">{item.clickRate}%</td><td className="px-3 py-3 text-emerald-300">{item.reportRate}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
