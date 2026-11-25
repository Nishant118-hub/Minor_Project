import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/recommendations/${user.id}`);
        setRecommendations(data.recommendations || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load recommendations.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading recommendations…</div>;
  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-5 text-rose-200">{error}</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Recommendations</p>
        <h1 className="mt-2 text-3xl font-bold">Personalized training plan</h1>
      </section>

      <section className="space-y-4">
        {recommendations.length ? recommendations.map((item, index) => (
          <article key={`${item.moduleId || item.title}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Priority {item.priority || index + 1}</p>
                <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-200">{item.priority || 'Medium'}</span>
            </div>
            <p className="mt-3 text-slate-300">{item.reason}</p>
          </article>
        )) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300">No personalized recommendations are available yet.</div>
        )}
      </section>
    </div>
  );
}
