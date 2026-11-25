import { useEffect, useState } from 'react';
import api from '../services/api';

export default function EmployeeSimulationsPage() {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadSimulations() {
      try {
        const { data } = await api.get('/interactions/available');
        if (active) setSimulations(data.simulations || []);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to load simulations.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSimulations();
    const intervalId = window.setInterval(loadSimulations, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function classify(simulationId, classification) {
    setSubmittingId(simulationId);
    setError('');
    try {
      const { data } = await api.post(`/interactions/${simulationId}/respond`, { classification });
      setSimulations((current) => current.map((simulation) => (
        simulation.id === simulationId
          ? { ...simulation, classification: data.result.classification, isCorrect: data.result.isCorrect, explanation: data.result.explanation }
          : simulation
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit your classification.');
    } finally {
      setSubmittingId('');
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading simulations…</div>;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Awareness practice</p>
        <h1 className="mt-2 text-3xl font-bold">Message simulations</h1>
        <p className="mt-2 max-w-2xl text-slate-400">Review controlled messages and decide whether each one is suspicious or legitimate. This activity stays inside the training platform.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}

      {simulations.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">No active simulations</h2>
          <p className="mt-2 text-sm">There are no in-app scenarios assigned to your account right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {simulations.map((simulation) => (
            <article key={simulation.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">{simulation.category.replaceAll('_', ' ')}</p>
                  <h2 className="mt-1 text-lg font-semibold">{simulation.name}</h2>
                </div>
                <time className="text-xs text-slate-400" dateTime={simulation.sentAt || undefined}>
                  {simulation.sentAt ? new Date(simulation.sentAt).toLocaleString() : 'Assigned simulation'}
                </time>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400">FROM</p>
                  <p className="mt-1 font-medium">{simulation.senderDisplayName}</p>
                  <p className="mt-4 text-xs text-slate-400">SUBJECT</p>
                  <p className="mt-1 font-medium">{simulation.subject}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{simulation.body}</p>
                </div>

                {simulation.classification ? (
                  <div className={`rounded-lg border p-4 ${simulation.isCorrect ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
                    <p className="font-semibold">{simulation.isCorrect ? 'Correct classification' : 'Review this one'}</p>
                    <p className="mt-1 text-sm text-slate-200">You marked this message {simulation.classification.toLowerCase()}. {simulation.explanation}</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="mr-auto text-sm text-slate-300">How would you classify this message?</p>
                    <button disabled={submittingId === simulation.id} onClick={() => classify(simulation.id, 'LEGITIMATE')} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50">Legitimate</button>
                    <button disabled={submittingId === simulation.id} onClick={() => classify(simulation.id, 'SUSPICIOUS')} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">Suspicious</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}