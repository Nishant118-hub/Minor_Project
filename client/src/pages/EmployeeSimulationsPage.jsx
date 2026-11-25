import { useEffect, useState } from 'react';
import api from '../services/api';

export default function EmployeeSimulationsPage() {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'pa'

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
    setNotice('');
    try {
      const { data } = await api.post(`/interactions/${simulationId}/respond`, { classification });
      setSimulations((current) =>
        current.map((simulation) =>
          simulation.id === simulationId
            ? {
                ...simulation,
                classification: data.result.classification,
                isCorrect: data.result.isCorrect,
                explanation: data.result.explanation,
                redFlags: data.result.redFlags || []
              }
            : simulation
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit your classification.');
    } finally {
      setSubmittingId('');
    }
  }

  async function reportSimulation(simulationId) {
    setSubmittingId(simulationId);
    setError('');
    setNotice('');
    try {
      await api.post('/interactions', { campaignId: simulationId, eventType: 'REPORTED' });
      setSimulations((current) =>
        current.map((simulation) => (
          simulation.id === simulationId ? { ...simulation, reported: true } : simulation
        ))
      );
      setNotice('Simulation report recorded for training review. No message contents or credentials were submitted.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to report this simulation.');
    } finally {
      setSubmittingId('');
    }
  }

  function getLocalizedContent(simulation) {
    if (language === 'hi' && simulation.translations?.hi) {
      return {
        subject: simulation.translations.hi.subject || simulation.subject,
        body: simulation.translations.hi.body || simulation.body,
        explanation: simulation.translations.hi.explanation || simulation.explanation
      };
    }
    if (language === 'pa' && simulation.translations?.pa) {
      return {
        subject: simulation.translations.pa.subject || simulation.subject,
        body: simulation.translations.pa.body || simulation.body,
        explanation: simulation.translations.pa.explanation || simulation.explanation
      };
    }
    return {
      subject: simulation.subject,
      body: simulation.body,
      explanation: simulation.explanation
    };
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading simulations…</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Interactive Cyber Range</p>
          <h1 className="mt-1 text-3xl font-bold">Threat Simulation Lab</h1>
          <p className="mt-1 text-sm max-w-2xl text-slate-400">
            Inspect simulated phishing emails, SMS texts, UPI collect prompts, QR scans, and voice transcripts. Decide whether each one is suspicious or legitimate.
          </p>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-1">
          <span className="px-2 text-xs text-slate-400">Language:</span>
          <button
            onClick={() => setLanguage('en')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              language === 'en' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              language === 'hi' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            हिन्दी (Hindi)
          </button>
          <button
            onClick={() => setLanguage('pa')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              language === 'pa' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            ਪੰਜਾਬੀ (Punjabi)
          </button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4 text-emerald-200">{notice}</div>}

      {simulations.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">No active simulations</h2>
          <p className="mt-2 text-sm">There are no in-app scenarios assigned to your account right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {simulations.map((simulation) => {
            const localized = getLocalizedContent(simulation);
            const attackType = simulation.attackType || 'EMAIL';
            const isCompleted = Boolean(simulation.classification);

            return (
              <article key={simulation.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg">
                {/* Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/40 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                      {attackType} ATTACK
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {simulation.category?.replaceAll('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">Difficulty: {simulation.difficulty || 'BEGINNER'}</span>
                  </div>
                  <time className="text-xs text-slate-400" dateTime={simulation.sentAt || undefined}>
                    {simulation.sentAt ? new Date(simulation.sentAt).toLocaleString() : 'Assigned simulation'}
                  </time>
                </div>

                <div className="p-5 space-y-4">
                  {/* Realistic Mockup Container */}
                  {attackType === 'SMS' ? (
                    // Smartphone SMS Mockup
                    <div className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-400">
                        <span>SMS Message</span>
                        <span className="font-semibold text-cyan-400">{simulation.senderDisplayName}</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-800 p-3.5 text-sm text-slate-100 shadow">
                          <p className="whitespace-pre-wrap leading-relaxed">{localized.body}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 pl-1">Delivered via SMS</span>
                      </div>
                    </div>
                  ) : attackType === 'UPI' ? (
                    // UPI Collect Modal Mockup
                    <div className="mx-auto max-w-md rounded-2xl border border-violet-500/30 bg-slate-950 p-5 shadow-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">UPI Payment Prompt</span>
                        <span className="text-xs text-slate-400">BHIM / PhonePe / GPay</span>
                      </div>
                      <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-3.5 text-center">
                        <p className="text-xs text-slate-400">Incoming Reward Claim</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">₹ 4,850.00</p>
                      </div>
                      <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {localized.body}
                      </div>
                    </div>
                  ) : attackType === 'VOICE' ? (
                    // Voice Call Transcript Mockup
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold" aria-hidden="true">TEL</div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Inbound Voice Call Audio Record</p>
                          <p className="text-sm font-bold text-slate-200">{simulation.senderDisplayName}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {localized.body}
                      </div>
                    </div>
                  ) : attackType === 'QR' ? (
                    // QR Code Scanner Mockup
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                        <span>Optical QR Scanner</span>
                        <span>{simulation.senderDisplayName}</span>
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                        {localized.body}
                      </div>
                    </div>
                  ) : (
                    // Default: Realistic Email Client Mockup
                    <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-inner">
                      <div className="border-b border-slate-800 bg-slate-900/60 p-4 space-y-2">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-semibold text-slate-400">FROM:</span>
                          <span className="font-mono text-slate-200">{simulation.senderDisplayName}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-semibold text-slate-400">SUBJECT:</span>
                          <span className="font-semibold text-slate-100">{localized.subject}</span>
                        </div>
                      </div>
                      <div className="p-5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {localized.body}
                      </div>
                    </div>
                  )}

                  {/* Red-Flag Highlighting & Results Screen */}
                  {isCompleted ? (
                    <div className={`rounded-xl border p-5 space-y-4 ${
                      simulation.isCorrect ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className={`text-base font-bold ${simulation.isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {simulation.isCorrect ? 'Correct Classification!' : 'Review this scenario'}
                          </p>
                          <p className="text-xs text-slate-300 mt-0.5">
                            You marked this message <strong>{simulation.classification}</strong>.
                          </p>
                        </div>
                        {simulation.isCorrect && (
                          <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                            +10 Points Earned
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed">{localized.explanation}</p>

                      {/* Visual Red-Flag Highlighting */}
                      {simulation.redFlags && simulation.redFlags.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80">
                          <p className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-2">
                            Red Flags Identified in this Message:
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {simulation.redFlags.map((flag, idx) => (
                              <div key={idx} className="rounded-lg border border-rose-500/30 bg-slate-900/90 p-2.5">
                                <p className="text-xs font-bold text-rose-300">{flag.flag}</p>
                                <p className="text-xs text-slate-300 mt-1">{flag.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Classification Action Controls */
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                      <p className="text-sm text-slate-300">How would you classify this message?</p>
                      <div className="flex items-center gap-3">
                        <button
                          disabled={submittingId === simulation.id}
                          onClick={() => classify(simulation.id, 'LEGITIMATE')}
                          className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                        >
                          Mark as Legitimate
                        </button>
                        <button
                          disabled={submittingId === simulation.id}
                          onClick={() => classify(simulation.id, 'SUSPICIOUS')}
                          className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20"
                        >
                          Mark as Suspicious
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                    <p className="text-sm text-slate-400">
                      {simulation.reported ? 'Reported for training review.' : 'Think this scenario should be reviewed?'}
                    </p>
                    {!simulation.reported && (
                      <button
                        disabled={submittingId === simulation.id}
                        onClick={() => reportSimulation(simulation.id)}
                        className="rounded-lg border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                      >
                        {submittingId === simulation.id ? 'Reporting…' : 'Report this simulation'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
