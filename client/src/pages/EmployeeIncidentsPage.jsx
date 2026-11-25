import { useEffect, useState } from 'react';
import api from '../services/api';

export default function EmployeeIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'checklist' | 'history'

  const [form, setForm] = useState({
    incidentType: 'SUSPICIOUS_EMAIL',
    subject: '',
    senderOrSource: '',
    description: '',
    urgencyCues: false,
    hasClickedOrInteracted: false
  });

  async function loadData() {
    try {
      const [incRes, chkRes] = await Promise.all([
        api.get('/incidents'),
        api.get('/incidents/checklist')
      ]);
      setIncidents(incRes.data.incidents || []);
      setChecklist(chkRes.data.checklist || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incident reporting data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Please provide a subject line and description of the event.');
      return;
    }
    setSubmitting(true);
    setError('');
    setFeedback(null);
    try {
      const { data } = await api.post('/incidents/report', form);
      setFeedback(data.feedback);
      setForm({
        incidentType: 'SUSPICIOUS_EMAIL',
        subject: '',
        senderOrSource: '',
        description: '',
        urgencyCues: false,
        hasClickedOrInteracted: false
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit incident report.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading incident reporting center…</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Security Operations Center (SOC)</p>
          <h1 className="mt-1 text-3xl font-bold">Incident Reporting & Response</h1>
          <p className="mt-1 text-sm text-slate-400">Report suspicious communications or potential account compromises immediately to protect your colleagues.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'report' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🚨 Report New Incident
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'checklist' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📋 Immediate Response Checklist
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📑 My Reported Incidents ({incidents.length})
        </button>
      </div>

      {error && <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-300">{error}</div>}

      {/* Positive Feedback Loop Banner */}
      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-emerald-400">{feedback.title}</h3>
            <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
              +{feedback.pointsAwarded} Security Points
            </span>
          </div>
          <p className="text-sm text-slate-100">{feedback.message}</p>
          <div className="mt-2 rounded-lg bg-slate-900/80 p-3 text-xs text-slate-300 border border-slate-800">
            <strong>Next Step:</strong> {feedback.nextStep}
          </div>
        </div>
      )}

      {/* Tab 1: Reporting Form */}
      {activeTab === 'report' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form onSubmit={handleSubmit} className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Report a Threat or Compromise</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Incident Type</label>
                <select
                  value={form.incidentType}
                  onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="SUSPICIOUS_EMAIL">Suspicious Email / Phishing</option>
                  <option value="SMISHING_SMS">SMS Phishing (Smishing)</option>
                  <option value="UPI_FRAUD">UPI / QR Payment Scam</option>
                  <option value="VISHING_CALL">Voice Phone Call (Vishing)</option>
                  <option value="QR_CODE_PHISH">QR Code Quishing</option>
                  <option value="CREDENTIAL_LEAK">Possible Credential Leak</option>
                  <option value="LOST_DEVICE">Lost or Stolen Device</option>
                  <option value="OTHER">Other Security Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sender Email / Caller / Origin</label>
                <input
                  type="text"
                  value={form.senderOrSource}
                  onChange={(e) => setForm({ ...form, senderOrSource: e.target.value })}
                  placeholder="e.g. unknown@corp-vendor.xyz or +91-98721"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                </input>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subject / Headline *</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Received unsolicited SMS asking for electricity bill payment via APK"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Detailed Description *</label>
              <textarea
                rows={5}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what happened: what did the message ask for, did you click any links, or did you disclose any information?"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.urgencyCues}
                  onChange={(e) => setForm({ ...form, urgencyCues: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span>The message used high urgency, deadlines, or threats of account suspension.</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasClickedOrInteracted}
                  onChange={(e) => setForm({ ...form, hasClickedOrInteracted: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                />
                <span><strong>I clicked a link, scanned a QR, or entered credentials/PIN before realizing.</strong> (Triggers immediate priority SOC escalation)</span>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-rose-500/20"
              >
                {submitting ? 'Submitting to SOC…' : '🚨 Submit Security Report'}
              </button>
            </div>
          </form>

          {/* Side Info Box */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">Why Reporting Matters</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                When one employee reports an active attack, our security team blocks the sender domain and malicious URLs across the entire company within minutes.
              </p>
              <div className="mt-4 rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Incident Report Reward:</span>
                  <span className="font-bold text-emerald-400">+15 pts</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>False Alarm Penalty:</span>
                  <span className="font-bold text-cyan-400">None! (Reporting is always encouraged)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-100">Emergency Incident Response Checklist</h2>
            <p className="text-xs text-slate-400">Step-by-step guidance on what to do right now if you clicked something suspicious or lost a device.</p>
          </div>

          <div className="grid gap-3 pt-2">
            {checklist.map((item) => (
              <div key={item.step} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-start gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-sm">
                  {item.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
                    <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                      {item.urgency}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Your Past Reports</h2>

          {incidents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">You have not filed any incident tickets yet.</div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc._id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-cyan-400">{inc.incidentType.replace('_', ' ')}</span>
                      <span className="text-xs text-slate-500">·</span>
                      <time className="text-xs text-slate-400">{new Date(inc.createdAt).toLocaleString()}</time>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      inc.status === 'RESOLVED' || inc.status === 'CLOSED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : inc.status === 'INVESTIGATING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-200 text-sm">{inc.subject}</h3>
                  <p className="text-xs text-slate-400">{inc.description}</p>

                  {inc.adminFeedback && (
                    <div className="mt-2 rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-emerald-300/90">
                      <strong>SOC Response:</strong> {inc.adminFeedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
