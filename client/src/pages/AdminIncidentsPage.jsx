import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [feedbackUpdate, setFeedbackUpdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadIncidents() {
    try {
      const { data } = await api.get('/incidents');
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incident reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  function handleSelect(inc) {
    setSelectedIncident(inc);
    setStatusUpdate(inc.status);
    setFeedbackUpdate(inc.adminFeedback || 'Thanks! The reported threat has been verified and blocked corporate-wide.');
  }

  async function handleSaveStatus(e) {
    e.preventDefault();
    if (!selectedIncident) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/incidents/${selectedIncident._id}/status`, {
        status: statusUpdate,
        adminFeedback: feedbackUpdate
      });
      setSelectedIncident(data.incident);
      loadIncidents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update incident status.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === 'ALL' ? incidents : incidents.filter((i) => i.status === filter);

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading SOC incident queue…</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Security Operations Center</p>
          <h1 className="mt-1 text-3xl font-bold">Employee Incident Review Queue</h1>
          <p className="mt-1 text-sm text-slate-400">Review real threat submissions, analyze reported indicators, and deliver positive feedback to staff.</p>
        </div>

        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          {['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === st ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </header>

      {error && <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-300">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Incident List */}
        <div className="lg:col-span-7 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No incidents matching this filter.
            </div>
          ) : (
            filtered.map((inc) => (
              <div
                key={inc._id}
                onClick={() => handleSelect(inc)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedIncident?._id === inc._id
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                      {inc.incidentType.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      Reported by: <strong className="text-slate-200">{inc.reporter?.name || 'Employee'}</strong>
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    inc.status === 'RESOLVED' || inc.status === 'CLOSED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : inc.status === 'INVESTIGATING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {inc.status}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-100">{inc.subject}</h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{inc.description}</p>

                {inc.hasClickedOrInteracted && (
                  <div className="mt-2 text-[11px] font-semibold text-rose-400">
                    Employee reported interacting or clicking link/PIN before reporting.
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected Incident Detail / SOC Actions */}
        <div className="lg:col-span-5">
          {selectedIncident ? (
            <form onSubmit={handleSaveStatus} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Ticket Details</span>
                <h2 className="text-lg font-bold text-slate-100 mt-1">{selectedIncident.subject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reported: {new Date(selectedIncident.createdAt).toLocaleString()} by {selectedIncident.reporter?.name} ({selectedIncident.reporter?.email})
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Reported Sender / Origin:</span>
                  <p className="font-mono text-slate-200 mt-0.5">{selectedIncident.senderOrSource || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Incident Description:</span>
                  <p className="text-slate-200 mt-0.5 whitespace-pre-wrap leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {selectedIncident.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Update Status</label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Feedback Message to Employee (Positive Reinforcement)
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackUpdate}
                    onChange={(e) => setFeedbackUpdate(e.target.value)}
                    placeholder="e.g. Thanks, it was a real phish, you protected the company!"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Update Ticket & Notify'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
              <p className="font-medium text-slate-300">Select an incident to review</p>
              <p className="mt-1 text-xs max-w-xs text-slate-500">
                Click any ticket on the left to inspect evidence, update ticket status, and provide feedback to the reporter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
