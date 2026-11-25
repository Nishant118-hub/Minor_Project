import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAdminDashboard } from '../services/dashboardService';

const riskColors = { LOW: '#66876a', MEDIUM: '#ab844f', HIGH: '#a65e55' };
const chartText = '#81715e';

function MetricCard({ label, value, accent = 'text-cyan-400' }) {
  return <article className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p></article>;
}

function ChartCard({ title, children }) {
  return <section className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="mb-5 text-lg font-semibold">{title}</h2><div className="h-72">{children}</div></section>;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboard().then(setDashboard).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load dashboard data.'));
  }, []);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;
  if (!dashboard) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading organization awareness metrics…</div>;

  const { metrics, charts } = dashboard;
  return (
    <div className="space-y-6">
      <section><p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Organization overview</p><h1 className="mt-2 text-3xl font-bold">Security awareness dashboard</h1><p className="mt-2 text-slate-400">Monitor training progress and controlled-simulation outcomes across your organization.</p></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total employees" value={metrics.totalEmployees} />
        <MetricCard label="Active employees" value={metrics.activeEmployees} />
        <MetricCard label="High risk" value={metrics.highRiskEmployees} accent="text-rose-400" />
        <MetricCard label="Training completion" value={`${metrics.trainingCompletion}%`} accent="text-emerald-400" />
        <MetricCard label="Campaigns" value={metrics.campaigns} accent="text-violet-400" />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Risk distribution"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={charts.riskDistribution} dataKey="value" nameKey="name" outerRadius={95} label>{charts.riskDistribution.map((entry) => <Cell key={entry.name} fill={riskColors[entry.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Department risk comparison"><ResponsiveContainer width="100%" height="100%"><BarChart data={charts.departmentComparison}><XAxis dataKey="department" tick={{ fill: chartText, fontSize: 12 }} /><YAxis tick={{ fill: chartText }} /><Tooltip /><Bar dataKey="averageRisk" name="Average risk" fill="#617d65" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Campaign click and report rates"><ResponsiveContainer width="100%" height="100%"><BarChart data={charts.campaignPerformance}><XAxis dataKey="campaign" hide /><YAxis tick={{ fill: chartText }} /><Tooltip /><Legend /><Bar dataKey="clickRate" name="Click rate %" fill="#a65e55" /><Bar dataKey="reportRate" name="Report rate %" fill="#66876a" /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Average risk score trend"><ResponsiveContainer width="100%" height="100%"><LineChart data={charts.riskTrend}><XAxis dataKey="date" tick={{ fill: chartText, fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fill: chartText }} /><Tooltip /><Line type="monotone" dataKey="averageScore" name="Average score" stroke="#526e57" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></ChartCard>
      </section>
      <section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Low risk employees" value={metrics.lowRiskEmployees} accent="text-emerald-400" /><MetricCard label="Average click rate" value={`${metrics.averageClickRate}%`} accent="text-rose-400" /><MetricCard label="Average report rate" value={`${metrics.averageReportRate}%`} accent="text-emerald-400" /></section>
    </div>
  );
}
