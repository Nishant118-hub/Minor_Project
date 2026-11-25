import { useEffect, useState } from 'react';
import api from '../services/api';

const badgeCatalog = [
  {
    name: 'First Training Completed',
    icon: '🏅',
    description: 'Complete and pass your first assigned security-awareness module.',
    match: (user) => user.trainingProgress?.some((item) => item.status === 'COMPLETED')
  },
  {
    name: 'Quiz Master',
    icon: '🎯',
    description: 'Score 100% on a training quiz.',
    match: (_user, results) => results.some((result) => result.score === 100)
  },
  {
    name: 'Daily Streak Keeper',
    icon: '🔥',
    description: 'Complete daily 60-second challenges 3 days in a row.',
    match: (user) => (user.streak?.current || 0) >= 3 || (user.streak?.highest || 0) >= 3
  },
  {
    name: 'Vigilant Reporter',
    icon: '🚨',
    description: 'Report suspicious emails or potential compromises to SOC.',
    match: (user) => (user.points || 0) >= 15
  },
  {
    name: 'Security Champion',
    icon: '⭐',
    description: 'Attain top rank in your department and achieve Guardian level status.',
    match: (user) => Boolean(user.isSecurityChampion) || (user.points || 0) >= 120
  }
];

export default function EmployeeBadgesPage() {
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [userResponse, resultsResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/assessments/results')
        ]);
        setUser(userResponse.data.user);
        setResults(resultsResponse.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load your badges.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading your badges…</div>;
  if (error) return <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;
  if (!user) return null;

  const points = user.points || 0;
  const level = user.level || 'Rookie';
  const earnedBadges = badgeCatalog.filter((badge) => badge.match(user, results));

  // Level Progression Calculation
  const nextLevel = level === 'Rookie' ? 'Defender' : level === 'Defender' ? 'Guardian' : 'Guardian (Max Rank)';
  const currentLevelMin = level === 'Rookie' ? 0 : level === 'Defender' ? 50 : 150;
  const nextLevelTarget = level === 'Rookie' ? 50 : level === 'Defender' ? 150 : 150;
  const progressPercent = level === 'Guardian' ? 100 : Math.min(100, Math.round(((points - currentLevelMin) / (nextLevelTarget - currentLevelMin)) * 100));

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Milestones & Rank Progression</p>
        <h1 className="mt-1 text-3xl font-bold">Security Levels & Achievement Badges</h1>
        <p className="mt-1 text-sm text-slate-400">Level up your cybersecurity skills from Rookie to Defender to Guardian.</p>
      </section>

      {/* LEVEL PROGRESSION BAR */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Current Level</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-300">{level}</span>
              {user.isSecurityChampion && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  ⭐ Security Champion
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Total Security Points</span>
            <p className="text-2xl font-black text-emerald-400">{points} pts</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Progress to <strong>{nextLevel}</strong></span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Rookie (0 pts)</span>
            <span>Defender (50 pts)</span>
            <span>Guardian (150+ pts)</span>
          </div>
        </div>
      </section>

      {/* SECURITY CHAMPION FEED (IF CHAMPION) */}
      {(user.isSecurityChampion || level === 'Guardian') && (
        <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h2 className="text-base font-bold text-amber-300">Security Champion Program Perks</h2>
          </div>
          <p className="text-xs text-slate-300">
            As a designated Security Champion, your prompt reporting and high quiz accuracy protect your entire department. Here is your weekly peer advisory tip to share:
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-200 leading-relaxed font-mono">
            "Team Tip: Remind teammates that vendor invoices requesting altered bank account numbers must always be verified via voice on an established, trusted phone number—never the number listed inside the invoice."
          </div>
        </section>
      )}

      {/* BADGES GRID */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Badge Showcase ({earnedBadges.length}/{badgeCatalog.length} Unlocked)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badgeCatalog.map((badge) => {
            const earned = badge.match(user, results);
            return (
              <article
                key={badge.name}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  earned ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-950/20' : 'border-slate-800 bg-slate-900/60 opacity-60'
                }`}
              >
                <div>
                  <div className="text-3xl">{badge.icon}</div>
                  <h3 className={`mt-3 text-base font-bold ${earned ? 'text-emerald-200' : 'text-slate-300'}`}>
                    {badge.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{badge.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
                  <span className={earned ? 'text-emerald-400' : 'text-slate-500'}>
                    {earned ? '✓ UNLOCKED' : '🔒 LOCKED'}
                  </span>
                  <span className="text-slate-400">Badge</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
