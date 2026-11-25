import { useEffect, useState } from 'react';
import { getManagerDashboard } from '../services/dashboardService';
import api from '../services/api';

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
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getManagerDashboard(),
      api.get('/analytics/department-intelligence')
    ])
      .then(([dash, intelRes]) => {
        setDashboard(dash);
        setIntel(intelRes.data);
      })
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
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Team reporting & Heatmap</p>
          <h1 className="mt-2 text-3xl font-bold">Department Awareness Performance</h1>
          <p className="mt-2 text-slate-400">Use team risk indicators, threat category matrices, and training signals to target follow-up.</p>
        </div>
        <button type="button" onClick={exportReport} className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Download CSV
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Team members</p>
          <p className="mt-2 text-3xl font-bold text-cyan-400">{metrics.totalEmployees}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Assessed</p>
          <p className="mt-2 text-3xl font-bold text-violet-400">{metrics.assessedEmployees}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">High risk</p>
          <p className="mt-2 text-3xl font-bold text-rose-400">{metrics.highRiskEmployees}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Training completion</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{metrics.trainingCompletion}%</p>
        </article>
      </section>

      {/* BEFORE / AFTER TRAINING IMPACT REPORT */}
      {intel?.beforeAfterReport && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-100">{intel.beforeAfterReport.headline}</h2>
            <p className="text-xs text-slate-400">Behavioral improvements following employee participation.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {intel.beforeAfterReport.metrics.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">{item.metric}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 line-through">{item.before}</span>
                  <span className="text-lg font-black text-emerald-400">{item.after}</span>
                </div>
                <p className="text-xs font-bold text-cyan-300">{item.change}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DEPARTMENT HEATMAP */}
      {intel?.heatmap && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Department Threat Vulnerability Heatmap</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Credential Harvest</th>
                  <th className="px-4 py-3 text-center">Fake Invoices</th>
                  <th className="px-4 py-3 text-center">SMS Phishing</th>
                  <th className="px-4 py-3 text-center">UPI Scams</th>
                  <th className="px-4 py-3 text-center">Executive Fraud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {intel.heatmap.map((dept) => (
                  <tr key={dept.departmentId}>
                    <td className="px-4 py-3 font-semibold text-slate-200">{dept.departmentName}</td>
                    {dept.categories.slice(0, 5).map((cat) => {
                      const colorClass =
                        cat.riskLevel === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : cat.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                      return (
                        <td key={cat.key} className="px-3 py-3 text-center">
                          <div className={`mx-auto w-20 rounded border py-1 px-2 text-xs font-bold ${colorClass}`}>
                            {cat.vulnerabilityRate}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Priority Follow-Up List */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-5">
          <h2 className="text-lg font-semibold">Priority Follow-up List</h2>
          <p className="mt-1 text-sm text-slate-400">Team members with higher current risk scores.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {charts.teamRisk.map((item) => (
                <tr key={item.name} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-100">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.riskTier === 'HIGH' ? 'bg-rose-950/60 text-rose-300' :
                      item.riskTier === 'MEDIUM' ? 'bg-amber-950/60 text-amber-300' : 'bg-emerald-950/60 text-emerald-300'
                    }`}>
                      {item.riskTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-cyan-300">{item.score}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {item.riskTier === 'HIGH' ? 'Assign Password & Link Verification Modules' : 'Standard Quarterly Refresh'}
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
