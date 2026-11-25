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

  const completedModules = user.trainingProgress?.filter((item) => item.status === 'COMPLETED').length || 0;
  const earnedBadges = badgeCatalog.filter((badge) => badge.match(user, results));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Milestones</p>
        <h1 className="mt-2 text-3xl font-bold">Your achievement badges</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Earned badges</p>
          <p className="mt-2 text-3xl font-bold text-cyan-400">{earnedBadges.length}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Completed modules</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{completedModules}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Points</p>
          <p className="mt-2 text-3xl font-bold text-violet-400">{user.points || 0}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {badgeCatalog.map((badge) => {
          const earned = badge.match(user, results);
          return (
            <article key={badge.name} className={`rounded-xl border p-5 ${earned ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'}`}>
              <div className="text-3xl">{badge.icon}</div>
              <h2 className={`mt-4 text-lg font-semibold ${earned ? 'text-emerald-200' : 'text-slate-100'}`}>{badge.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{badge.description}</p>
              <div className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {earned ? 'Earned' : 'Locked'}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
