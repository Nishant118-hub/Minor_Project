import { useEffect, useState } from 'react';
import api from '../services/api';

const defaults = {
  environment: 'VR',
  authenticationConfidence: 0.8,
  biometricDrift: 0.1,
  sessionMinutes: 30,
  deepfakeConfidence: 0.1,
  packetAnomalyScore: 0.1,
  deviceRiskScore: 0.1,
  twinIntegrityScore: 1,
  contractRiskScore: 0.1,
  nftSimilarityScore: 0.1,
  walletAnomalyScore: 0.1,
  federatedRoundVariance: 0.1,
  participantTrustScore: 0.9
};

const sliderFields = [
  ['authenticationConfidence', 'Authentication confidence'],
  ['biometricDrift', 'Biometric drift'],
  ['deepfakeConfidence', 'Deepfake/impersonation confidence'],
  ['packetAnomalyScore', 'Network anomaly score'],
  ['deviceRiskScore', 'XR device risk'],
  ['twinIntegrityScore', 'Digital-twin integrity'],
  ['contractRiskScore', 'Smart-contract risk'],
  ['nftSimilarityScore', 'NFT plagiarism similarity'],
  ['walletAnomalyScore', 'Wallet anomaly'],
  ['federatedRoundVariance', 'Federated update variance'],
  ['participantTrustScore', 'Federated participant trust']
];

const statusStyles = {
  SECURE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  WATCH: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  CRITICAL: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
};

export default function MetaverseSecurityPage() {
  const [values, setValues] = useState(defaults);
  const [overview, setOverview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/metaverse/overview').then(({ data }) => setOverview(data)).catch((requestError) => {
      setError(requestError.response?.data?.message || 'Unable to load metaverse overview.');
    });
  }, []);

  const updateValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/metaverse/analyze', values);
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to run metaverse analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Metaverse security laboratory</p>
        <h1 className="mt-2 text-3xl font-bold">AI defense assessment</h1>
        <p className="mt-2 max-w-4xl text-slate-400">
          Test explainable safeguards for XR/VR/AR environments, identity, digital twins, intrusion telemetry, Web3 assets, federated learning, and three attack scenarios.
        </p>
      </section>

      {error && <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}

      {overview && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overview.topics.map((topic) => (
            <div key={topic} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">{topic}</div>
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">XR telemetry inputs</h2>
              <p className="mt-1 text-xs text-slate-400">No biometric media or wallet credentials are collected.</p>
            </div>
            <label className="text-sm text-slate-400">
              Environment
              <select
                value={values.environment}
                onChange={(event) => updateValue('environment', event.target.value)}
                className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              >
                {['VR', 'AR', 'XR', 'MR'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {sliderFields.map(([name, label]) => (
              <label key={name} className="text-sm text-slate-300">
                <span className="flex justify-between"><span>{label}</span><span className="text-cyan-300">{Number(values[name]).toFixed(2)}</span></span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={values[name]}
                  onChange={(event) => updateValue(name, Number(event.target.value))}
                  className="mt-2 w-full accent-cyan-400"
                />
              </label>
            ))}
            <label className="text-sm text-slate-300 md:col-span-2">
              Session duration: <strong className="text-cyan-300">{values.sessionMinutes} min</strong>
              <input type="range" min="0" max="1440" step="15" value={values.sessionMinutes} onChange={(event) => updateValue('sessionMinutes', Number(event.target.value))} className="mt-2 w-full accent-cyan-400" />
            </label>
          </div>
          <button type="button" onClick={analyze} disabled={loading} className="mt-6 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
            {loading ? 'Analyzing…' : 'Run metaverse assessment'}
          </button>
        </div>

        {result && (
          <aside className={`h-fit rounded-xl border p-5 ${statusStyles[result.overallStatus]}`}>
            <p className="text-xs font-bold uppercase tracking-widest">Overall risk</p>
            <p className="mt-3 text-5xl font-black">{result.overallRisk}</p>
            <p className="mt-2 text-lg font-bold">{result.overallStatus}</p>
            <p className="mt-3 text-xs opacity-80">Source: {result.source}</p>
          </aside>
        )}
      </section>

      {result && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.findings.map((finding) => (
              <article key={finding.topic} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{finding.topic}</h2>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyles[finding.status]}`}>{finding.status}</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-cyan-300">{finding.riskScore}</p>
                <p className="mt-2 text-sm text-slate-400">{finding.summary}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-500">{finding.evidence.map((item) => <li key={item}>• {item}</li>)}</ul>
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">Mitigations</p>
                  <p className="mt-1 text-xs text-slate-300">{finding.mitigations.join(' · ')}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold">Metaverse attack scenarios</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {result.attackScenarios.map((scenario) => (
                <article key={scenario.name} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <h3 className="font-semibold text-violet-300">{scenario.name}</h3>
                  <p className="mt-2 text-xs text-slate-400"><strong className="text-slate-300">Trigger:</strong> {scenario.trigger}</p>
                  <p className="mt-2 text-xs text-slate-400"><strong className="text-slate-300">Response:</strong> {scenario.response}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {overview?.disclaimer && <p className="text-xs text-slate-500">{overview.disclaimer}</p>}
    </div>
  );
}
