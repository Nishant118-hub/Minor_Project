import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getEmployeeDashboard } from '../services/dashboardService';
import api from '../services/api';

function StatCard({ label, value, accent = 'text-cyan-400', subtext = '' }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </article>
  );
}

export default function EmployeeDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [adaptiveData, setAdaptiveData] = useState(null);
  const [branchingChoice, setBranchingChoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getEmployeeDashboard(),
      api.get('/analytics/adaptive-path')
    ])
      .then(([dash, adaptRes]) => {
        setDashboard(dash);
        setAdaptiveData(adaptRes.data);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load employee dashboard.'));
  }, []);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;
  if (!dashboard) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading your awareness overview…</div>;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Personal Security Profile</p>
          <h1 className="mt-1 text-3xl font-bold">Awareness & Risk Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Track your risk posture, explainable contributing factors, and adaptive learning roadmap.</p>
        </div>
        <div className="flex gap-2">
          <NavLink
            to="/employee/daily-challenge"
            className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            ⚡ Daily 60s Challenge
          </NavLink>
          <NavLink
            to="/employee/analyzer"
            className="rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
          >
            🔍 Message Analyzer
          </NavLink>
        </div>
      </section>

      {/* Top Metrics Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Risk tier"
          value={dashboard.riskTier}
          accent={dashboard.riskTier === 'HIGH' ? 'text-rose-400' : dashboard.riskTier === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}
          subtext="Calculated via AI behavioral engine"
        />
        <StatCard label="Risk score" value={dashboard.score} accent="text-cyan-400" subtext="Lower score indicates safer habits" />
        <StatCard label="Training progress" value={`${dashboard.trainingProgress}%`} accent="text-emerald-400" subtext={`${dashboard.completedModules} modules completed`} />
        <StatCard label="Safe reporting rate" value={`${dashboard.reportRate}%`} accent="text-violet-400" subtext="Simulation threats flagged" />
      </section>

      {/* EXPLAINABLE RISK BREAKDOWN ("What raised your score") */}
      {adaptiveData?.contributingFactors && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Transparent AI Analytics</span>
            <h2 className="text-xl font-bold text-slate-100 mt-1">Explainable Risk Factors: What Influenced Your Score?</h2>
            <p className="text-xs text-slate-400">We explain every factor that raised or protected your posture to foster trust and clear learning.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {adaptiveData.contributingFactors.map((factor, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 space-y-2 ${
                  factor.impact === 'HIGH_RISK'
                    ? 'border-rose-500/30 bg-rose-500/10'
                    : factor.impact === 'MODERATE_RISK'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : factor.impact === 'PROTECTIVE'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    factor.impact === 'HIGH_RISK' ? 'text-rose-300' :
                    factor.impact === 'MODERATE_RISK' ? 'text-amber-300' :
                    factor.impact === 'PROTECTIVE' ? 'text-emerald-300' : 'text-slate-300'
                  }`}>
                    {factor.pointsDelta}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{factor.impact.replace('_', ' ')}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-200">{factor.factor}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ADAPTIVE LEARNING PATH */}
      {adaptiveData?.adaptivePath && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Personalized Curriculum</span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">Your Adaptive Learning Path</h2>
              <p className="text-xs text-slate-400">Auto-sequenced by your behavioral weak areas and simulation classifications.</p>
            </div>
            <NavLink to="/employee/training" className="text-xs font-semibold text-cyan-400 hover:underline">
              View All Training Modules →
            </NavLink>
          </div>

          <div className="space-y-3">
            {adaptiveData.adaptivePath.slice(0, 3).map((mod, idx) => (
              <div
                key={mod.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-200">{mod.title}</h3>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 uppercase">
                        {mod.category}
                      </span>
                    </div>
                    <p className="text-xs text-amber-300/90 mt-0.5">{mod.priorityReason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">⏱️ {mod.duration} mins</span>
                  <NavLink
                    to="/employee/training"
                    className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                  >
                    {mod.isCompleted ? 'Review Lesson' : 'Start Lesson'}
                  </NavLink>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SCENARIO-BASED BRANCHING INTERACTIVE LESSON */}
      {adaptiveData?.branchingScenario && (
        <section className="rounded-2xl border border-violet-500/30 bg-slate-900 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="rounded bg-violet-500/20 border border-violet-500/40 px-2.5 py-0.5 text-xs font-bold text-violet-300 uppercase tracking-wider">
              Branching Scenario Dilemma
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-2">{adaptiveData.branchingScenario.title}</h2>
            <p className="text-xs text-slate-400">Threat category: {adaptiveData.branchingScenario.threatCategory}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-200 leading-relaxed font-serif">
              "{adaptiveData.branchingScenario.initialPrompt.narrative}"
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3">
              {adaptiveData.branchingScenario.initialPrompt.question}
            </h3>

            <div className="space-y-2.5">
              {adaptiveData.branchingScenario.initialPrompt.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBranchingChoice(opt)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all ${
                    branchingChoice?.id === opt.id
                      ? 'border-violet-400 bg-violet-950/40 text-violet-100'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {branchingChoice && (
              <div className={`mt-4 rounded-xl border p-4 ${
                branchingChoice.outcome === 'SUCCESS'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : branchingChoice.outcome === 'PARTIAL'
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-rose-500/30 bg-rose-500/10'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${
                    branchingChoice.outcome === 'SUCCESS' ? 'text-emerald-400' :
                    branchingChoice.outcome === 'PARTIAL' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {branchingChoice.outcome === 'SUCCESS' ? '🛡️ Safe Decision!' : '⚠️ Risk Realized'}
                  </span>
                  <span className="text-xs font-bold text-cyan-300">+{branchingChoice.pointsEarned} pts</span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-200 leading-relaxed">{branchingChoice.consequence}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
