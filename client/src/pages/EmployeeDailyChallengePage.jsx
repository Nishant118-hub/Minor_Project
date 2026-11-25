import { useEffect, useState } from 'react';
import api from '../services/api';

export default function EmployeeDailyChallengePage() {
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [challengeRes, newsRes] = await Promise.all([
          api.get('/daily-challenge/today'),
          api.get('/daily-challenge/news')
        ]);
        setData(challengeRes.data);
        setNews(newsRes.data.news || []);
        if (challengeRes.data.alreadyCompleted) {
          setResult(challengeRes.data.completionResult);
        } else {
          setTimerActive(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load daily challenge.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (selectedOption === null) return;
    setSubmitting(true);
    setTimerActive(false);
    try {
      const timeSpent = Math.max(1, 60 - timeLeft);
      const res = await api.post('/daily-challenge/submit', {
        challengeId: data.challenge.id,
        selectedOption,
        timeSpentSeconds: timeSpent
      });
      setResult(res.data);
      if (res.data.streak) {
        setData((prev) => ({
          ...prev,
          alreadyCompleted: true,
          streak: res.data.streak,
          points: res.data.totalPoints,
          level: res.data.level
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit challenge answer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading daily 60-second challenge…</div>;
  if (!data) return null;

  const challenge = data.challenge;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Micro-Learning & Retention</p>
          <h1 className="mt-1 text-3xl font-bold">Daily Challenge: Spot the Phish</h1>
          <p className="mt-1 text-sm text-slate-400">One quick 60-second scenario every day to build long-term retention and security intuition.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center">
            <p className="text-xs text-amber-300 font-semibold uppercase">Daily Streak</p>
            <p className="text-2xl font-black text-amber-400">{data.streak?.current || 0} <span className="text-xs font-normal text-slate-400">days</span></p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase">Best Streak</p>
            <p className="text-2xl font-black text-cyan-400">{data.streak?.highest || 0} <span className="text-xs font-normal text-slate-400">days</span></p>
          </div>
        </div>
      </header>

      {error && <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-300">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Challenge Card */}
        <div className="lg:col-span-8 space-y-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                  {challenge.attackType} Attack
                </span>
                <span className="text-xs text-slate-400">Difficulty: {challenge.difficulty}</span>
              </div>
              {!result && (
                <div className={`flex items-center gap-1.5 text-sm font-bold font-mono px-3 py-1 rounded-full ${
                  timeLeft <= 10 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-cyan-300'
                }`}>
                  <span>⏱️</span> {timeLeft}s remaining
                </div>
              )}
            </div>

            {/* Scenario Presentation Box */}
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sender / Channel: <strong className="text-slate-200">{challenge.sender}</strong></span>
                <span>Category: <strong className="text-slate-200">{challenge.attackType}</strong></span>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-sm font-mono whitespace-pre-wrap text-slate-200 leading-relaxed">
                {challenge.content}
              </div>
            </div>

            {/* Question */}
            <div>
              <h2 className="text-base font-semibold text-slate-100">{challenge.question}</h2>

              {/* Options */}
              <div className="mt-3 space-y-2.5">
                {challenge.options.map((optionText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={Boolean(result)}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-start gap-3 ${
                      selectedOption === idx
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                    } ${Boolean(result) ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-600 text-xs font-semibold mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{optionText}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action or Result Breakdown */}
            {!result ? (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={selectedOption === null || submitting}
                  className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Checking…' : 'Submit My Answer'}
                </button>
              </div>
            ) : (
              <div className={`rounded-xl border p-5 ${
                result.isCorrect ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-bold ${result.isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {result.isCorrect ? 'Correct Classification!' : 'Learning Opportunity'}
                  </h3>
                  <span className="rounded bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-cyan-300">
                    +{result.pointsEarned || 15} points
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">{result.explanation}</p>

                {result.redFlags && result.redFlags.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Key Red Flags to Remember:</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {result.redFlags.map((flag, idx) => (
                        <li key={idx}><strong className="text-slate-100">{flag}</strong></li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-4 text-xs text-slate-400">Great job participating today! Come back tomorrow to keep your streak alive.</p>
              </div>
            )}
          </article>
        </div>

        {/* Threat of the Week & News Feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">Security News & Threat Feed</h3>
            <p className="mt-1 text-xs text-slate-400">Current real-world scams and trending threats in India and globally.</p>

            <div className="mt-4 space-y-3">
              {news.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                      {item.tag}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
