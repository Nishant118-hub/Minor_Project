import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getAllParticipants, getCampaignTemplates, getCampaigns } from '../services/dashboardService';

export default function AdminCampaignsPage() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    template: 'FAKE_INVOICE',
    targetUsers: [],
    sendSimulationNotice: false,
    difficulty: 'BEGINNER',
    scheduledAt: ''
  });

  async function loadData() {
    try {
      const [templateData, campaignData, participantsData] = await Promise.all([
        getCampaignTemplates(),
        getCampaigns(),
        getAllParticipants()
      ]);
      setTemplates(templateData);
      setCampaigns(campaignData);
      setParticipants(participantsData);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load simulation data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(loadData, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const templateOptions = useMemo(() => templates.filter(Boolean), [templates]);

  function toggleUser(userId) {
    setForm((current) => {
      const selected = current.targetUsers.includes(userId)
        ? current.targetUsers.filter((id) => id !== userId)
        : [...current.targetUsers, userId];
      return { ...current, targetUsers: selected };
    });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (form.sendSimulationNotice) {
      const timing = form.scheduledAt ? 'when its scheduled time arrives' : 'when an admin launches it';
      if (!window.confirm(`Enable a clearly labeled exercise notice email to enrolled internal participants ${timing}?`)) return;
    }

    try {
      await api.post('/campaigns', {
        ...form,
        targetUsers: form.targetUsers,
        scheduledAt: form.scheduledAt || undefined
      });
      setForm({ name: '', description: '', template: 'FAKE_INVOICE', targetUsers: [], sendSimulationNotice: false, difficulty: 'BEGINNER', scheduledAt: '' });
      setNotice('Campaign created. The scenario activates in-app; a separate, clearly labeled exercise notice is sent only if you enabled it.');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create campaign.');
    }
  }

  async function handleLaunch(campaignId) {
    const campaign = campaigns.find((item) => item._id === campaignId);
    setError('');
    setNotice('');
    if (campaign?.sendSimulationNotice && !window.confirm(
      'Launch this in-app training scenario and send a clearly labeled exercise notice to its internal, enrolled participants?'
    )) return;
    try {
      const { data } = await api.post(`/campaigns/${campaignId}/launch`);
      setNotice(data.emailNotifications?.message || data.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to launch campaign.');
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading simulation campaigns…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Campaign management</p>
        <h1 className="mt-2 text-3xl font-bold">Safe phishing simulations</h1>
        <p className="mt-2 max-w-3xl text-slate-400">Scenarios remain in-app and use approved templates. You can optionally send a clearly labeled exercise notice to enrolled internal participants. AI supports defensive risk scoring and training recommendations; it does not write or send simulated phishing messages.</p>
      </section>

      {error && <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-emerald-200">{notice}</div>}

      <form onSubmit={handleCreate} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-200">
            Campaign name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" required />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Template
            <select value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              {templateOptions.map((template) => (
                <option key={template.template} value={template.template}>{template.template}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-200 md:col-span-2">
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" rows="3" />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Difficulty
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Scheduled date (optional)
            <input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-slate-200">Target users</p>
          <div className="grid max-h-56 gap-2 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 md:grid-cols-2">
            {participants.map((participant) => (
              <label key={participant._id} className="flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-sm text-slate-200">
                <input type="checkbox" checked={form.targetUsers.includes(participant._id)} onChange={() => toggleUser(participant._id)} />
                <span>{participant.name} · {participant.email}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-700 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.sendSimulationNotice}
            onChange={(event) => setForm({ ...form, sendSimulationNotice: event.target.checked })}
          />
          <span>
            Send a clearly labeled exercise notice email on launch
            <span className="mt-1 block text-xs text-slate-400">Only active, enrolled internal participants on the SMTP domain allowlist are eligible. No deceptive message or credential form is emailed.</span>
          </span>
        </label>

        <button className="mt-5 rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400">Create campaign</button>
      </form>

      <section className="space-y-4">
        {campaigns.map((campaign) => {
          const waitingForSchedule = campaign.status === 'SCHEDULED' && new Date(campaign.scheduledAt) > new Date();
          const canLaunch = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' && !waitingForSchedule;
          return (
          <article key={campaign._id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">{campaign.status}</p>
                <h2 className="mt-2 text-xl font-semibold">{campaign.name}</h2>
                {campaign.scheduledAt && <p className="mt-1 text-xs text-slate-400">Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}</p>}
              </div>
              <button onClick={() => handleLaunch(campaign._id)} disabled={!canLaunch} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                {waitingForSchedule ? 'Scheduled' : campaign.status === 'ACTIVE' ? 'Launched' : 'Launch now'}
              </button>
            </div>
            <p className="mt-3 text-slate-300">{campaign.description || 'Internal training simulation.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-slate-700 px-2 py-1">Template: {campaign.template}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">Targets: {campaign.targetUsers?.length || 0}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">In-app participants: {campaign.statistics?.sent || 0}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">Classified: {campaign.statistics?.classified || 0}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">Accuracy: {campaign.statistics?.classificationAccuracy || 0}%</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Exercise email notice: {campaign.emailNotifications?.status || 'disabled'}
              {campaign.sendSimulationNotice && campaign.emailNotifications && (
                <> · sent {campaign.emailNotifications.sent}, failed {campaign.emailNotifications.failed}, skipped {campaign.emailNotifications.skipped}</>
              )}
            </p>
          </article>
          );
        })}
      </section>
    </div>
  );
}
