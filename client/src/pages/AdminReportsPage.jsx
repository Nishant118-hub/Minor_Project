import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../services/dashboardService';
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
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getAdminDashboard(),
      api.get('/analytics/department-intelligence')
    ])
      .then(([dash, intelRes]) => {
        setDashboard(dash);
        setIntel(intelRes.data);
      })
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
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Executive & Operations Reporting</p>
          <h1 className="mt-2 text-3xl font-bold">Threat Heatmap & Impact Analysis</h1>
          <p className="mt-2 text-slate-400">Demonstrating measurable reduction in human cyber risk and departmental vulnerability hotspots.</p>
        </div>
        <button type="button" onClick={exportReport} className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Download CSV
        </button>
      </section>

      {/* Admin Alerts */}
      {intel?.alerts && intel.alerts.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Active Security Alerts ({intel.alerts.length})</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {intel.alerts.map((alert, idx) => (
              <div key={idx} className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-xs text-slate-200 flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Overview Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Employees" value={metrics.totalEmployees} />
        <Metric label="High Risk Posture" value={metrics.highRiskEmployees} tone="text-rose-400" />
        <Metric label="Training Completion" value={`${metrics.trainingCompletion}%`} tone="text-emerald-400" />
        <Metric label="Average Report Rate" value={`${metrics.averageReportRate}%`} tone="text-violet-400" />
      </section>

      {/* BEFORE / AFTER TRAINING IMPACT REPORT */}
      {intel?.beforeAfterReport && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Measurable ROI
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-100">{intel.beforeAfterReport.headline}</h2>
              <p className="text-xs text-slate-400">Demonstrating behavior change before and after awareness campaigns.</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
              Statistically Significant
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {intel.beforeAfterReport.metrics.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">{item.metric}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 line-through">Before: {item.before}</span>
                  <span className="text-xl font-black text-emerald-400">After: {item.after}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="font-bold text-cyan-300">{item.change}</span>
                  <span className="text-[10px] text-slate-400">{item.positive ? 'Favorable trend' : ''}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight pt-1">{item.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DEPARTMENT THREAT CATEGORY HEATMAP */}
      {intel?.heatmap && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Threat Matrix</p>
              <h2 className="text-xl font-bold text-slate-100">Department Vulnerability Heatmap</h2>
              <p className="text-xs text-slate-400">Identify threat vectors where specific departments demonstrate elevated risk.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500"></span> Low Risk</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500"></span> Moderate</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-500/20 border border-rose-500"></span> Vulnerable</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Credential Harvest</th>
                  <th className="px-4 py-3 text-center">Fake Invoices / BEC</th>
                  <th className="px-4 py-3 text-center">SMS Phishing</th>
                  <th className="px-4 py-3 text-center">UPI & Payment Scams</th>
                  <th className="px-4 py-3 text-center">Executive Fraud</th>
                  <th className="px-4 py-3 text-center">Voice Phishing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {intel.heatmap.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-800/40">
                    <td className="px-4 py-4 font-bold text-slate-200">
                      <div>{dept.departmentName}</div>
                      <span className="text-[11px] font-normal text-slate-500">{dept.employeeCount} staff</span>
                    </td>
                    {dept.categories.map((cat) => {
                      const colorClass =
                        cat.riskLevel === 'HIGH'
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : cat.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';

                      return (
                        <td key={cat.key} className="px-3 py-3 text-center">
                          <div className={`mx-auto w-24 rounded-lg border py-1.5 px-2 text-xs font-bold ${colorClass}`}>
                            {cat.vulnerabilityRate}%
                            <span className="block text-[10px] font-normal opacity-80">{cat.riskLevel}</span>
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

      {/* Campaign Performance & Risk Reports */}
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Department Overall Risk Ranking</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr><th className="px-3 py-2">Department</th><th className="px-3 py-2">Employees</th><th className="px-3 py-2">Average Risk</th></tr>
              </thead>
              <tbody>
                {charts.departmentComparison.map((item) => (
                  <tr key={item.department} className="border-t border-slate-800">
                    <td className="px-3 py-3 font-medium">{item.department}</td>
                    <td className="px-3 py-3 text-slate-300">{item.employees}</td>
                    <td className="px-3 py-3 text-cyan-300 font-bold">{item.averageRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Campaign Historical Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr><th className="px-3 py-2">Campaign</th><th className="px-3 py-2">Click rate</th><th className="px-3 py-2">Report rate</th></tr>
              </thead>
              <tbody>
                {charts.campaignPerformance.map((item) => (
                  <tr key={`${item.campaign}-${item.sentAt}`} className="border-t border-slate-800">
                    <td className="px-3 py-3 font-medium">{item.campaign}</td>
                    <td className="px-3 py-3 text-rose-300">{item.clickRate}%</td>
                    <td className="px-3 py-3 text-emerald-300">{item.reportRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
