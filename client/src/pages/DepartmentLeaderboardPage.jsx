import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DepartmentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [teamChallenge, setTeamChallenge] = useState(null);
  const [view, setView] = useState('monthly'); // 'weekly' | 'monthly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const { data } = await api.get('/analytics/leaderboard');
        setLeaderboard(data.leaderboard || []);
        setTeamChallenge(data.teamChallenge || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load department leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading department standings…</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Collaborative Gamification</p>
          <h1 className="mt-1 text-3xl font-bold">Department Security Standings</h1>
          <p className="mt-1 text-sm text-slate-400">Teamwork-focused rankings across departments to encourage collective awareness without public shaming.</p>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          <button
            onClick={() => setView('weekly')}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'weekly' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            Weekly Sprint
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'monthly' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            Monthly Cumulative
          </button>
        </div>
      </header>

      {error && <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-300">{error}</div>}

      {/* Team Challenge Banner */}
      {teamChallenge && (
        <article className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                ⚔️ Monthly Team Challenge
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-100">{teamChallenge.title}</h2>
              <p className="mt-1 text-xs text-slate-300">{teamChallenge.description}</p>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-2 text-center">
              <p className="text-[11px] text-slate-400">Goal Target</p>
              <p className="text-xl font-black text-cyan-400">{teamChallenge.targetCount} Reports</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {teamChallenge.challengers?.map((challenger, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-200">{challenger.name}</span>
                  <span className="font-bold text-cyan-300">{challenger.reportedCount} reported</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                    style={{ width: `${challenger.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-right">{challenger.progressPercent}% of target</p>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-200">Department Rankings ({view === 'weekly' ? 'This Week' : 'This Month'})</h2>
          <span className="text-xs text-slate-400">Sorted by team performance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Employees</th>
                <th className="px-5 py-3.5">Safe Report Rate</th>
                <th className="px-5 py-3.5">Avg Points / Member</th>
                <th className="px-5 py-3.5 text-right">{view === 'weekly' ? 'Weekly Sprint' : 'Total Score'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaderboard.map((dept, idx) => (
                <tr key={dept.departmentId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-bold">
                    {idx === 0 ? (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-400/20 text-amber-400 text-sm">🥇</span>
                    ) : idx === 1 ? (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-400/20 text-slate-300 text-sm">🥈</span>
                    ) : idx === 2 ? (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-700/20 text-amber-600 text-sm">🥉</span>
                    ) : (
                      <span className="pl-2 font-mono text-slate-500">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-100">{dept.departmentName}</td>
                  <td className="px-5 py-4 text-slate-400">{dept.employeeCount} active</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${dept.reportRatePercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{dept.reportRatePercent}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-cyan-300">{dept.avgPoints} pts</td>
                  <td className="px-5 py-4 text-right font-black text-slate-100 text-base">
                    {view === 'weekly' ? dept.weeklyPoints : dept.totalPoints} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
