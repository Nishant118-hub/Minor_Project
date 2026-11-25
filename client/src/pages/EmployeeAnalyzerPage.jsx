import { useState } from 'react';
import api from '../services/api';

const sampleEmails = [
  {
    name: 'Sample 1: Fake Invoice (.xyz domain + urgency)',
    sender: 'billing@corp-vendor-portal.xyz',
    subject: 'URGENT: Outstanding Vendor Invoice #INV-88291 Due Immediately',
    body: 'Hello Team,\n\nPlease find attached updated quarterly vendor services invoice #INV-88291 totaling $14,850.00.\n\nDue to a banking transition, our remittance account details have changed. Kindly update your records immediately and transfer payment within 24 hours to avoid suspension:\n\nhttps://secure-vendor-portal.xyz/invoices/INV-88291?auth=temp\n\nAccounts Payable Dept.'
  },
  {
    name: 'Sample 2: UPI Cashback Scam (Enter PIN to receive)',
    sender: 'PhonePe Rewards <rewards-cashback@phonepe-rewards.biz>',
    subject: 'UPI Reward: Cashback of Rs. 4,850 Approved - Enter UPI PIN to Receive',
    body: 'Congratulations! You have received a festive corporate reward cashback of Rs. 4,850.\n\nClick the link below or scan the attached QR code and enter your 6-digit UPI PIN into Google Pay / PhonePe to deposit the funds immediately:\n\nupi://pay?pa=corporate.rewards@okaxis&pn=FestiveCashback&am=4850'
  },
  {
    name: 'Sample 3: CEO Gift Cards (Gmail address + Do Not Call)',
    sender: 'Chief Executive Officer <ceo.internal-updates@gmail.com>',
    subject: 'CONFIDENTIAL: Immediate Assistance Required - Do Not Call',
    body: 'Hi, I am in an all-day investor meeting and cannot take calls. I need you to urgently purchase 5 Apple gift cards ($500 each) for client appreciation. Email the scratch-off PIN codes directly to this Gmail. Keep this confidential until the board meeting tonight.'
  },
  {
    name: 'Sample 4: Genuine Internal Mailroom Notice',
    sender: 'Facilities & Mailroom <mailroom@cyber.local>',
    subject: 'Package received at 2nd floor reception desk',
    body: 'Hi there,\n\nA postal delivery addressed to you arrived this morning at the 2nd floor mail desk. You can pick it up during standard office hours by showing your employee badge. No online action or fee required.'
  }
];

export default function EmployeeAnalyzerPage() {
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function loadSample(sample) {
    setSender(sample.sender);
    setSubject(sample.subject);
    setBody(sample.body);
    setResult(null);
  }

  async function handleAnalyze(e) {
    e?.preventDefault();
    if (!body.trim() && !subject.trim()) {
      setError('Please provide at least a subject or message content to analyze.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const { data } = await api.post('/analytics/analyze-message', {
        sender: sender.trim(),
        subject: subject.trim(),
        body: body.trim()
      });
      setResult(data.analysis);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze message.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">AI Threat Intelligence</p>
        <h1 className="mt-2 text-3xl font-bold">Message & Email Analyzer</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Paste any suspicious email, SMS, or Slack message. Our heuristic & AI detector examines sender domains, typosquatting, urgency cues, UPI collect scams, and link mismatches in real time.
        </p>
      </header>

      {/* Quick Sample Demonstrator */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Test Samples for Demo:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sampleEmails.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(sample)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Input Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleAnalyze} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Message Details</h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sender Email / Display Name</label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. IT Helpdesk <admin@sso-login-identity.com>"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. URGENT: Verify your single sign-on credentials"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Message Body / SMS Content</label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the message content, email body, or SMS text here..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {error && <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-sm text-rose-300">{error}</div>}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => { setSender(''); setSubject(''); setBody(''); setResult(null); }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear Fields
              </button>
              <button
                type="submit"
                disabled={analyzing}
                className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {analyzing ? 'Analyzing with AI…' : 'Scan & Explain Red Flags'}
              </button>
            </div>
          </form>
        </div>

        {/* Analysis Output */}
        <div className="lg:col-span-5">
          {result ? (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment</p>
                  <p className={`mt-1 text-2xl font-bold ${
                    result.riskLevel === 'HIGH_RISK' ? 'text-rose-400' :
                    result.riskLevel === 'SUSPICIOUS' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {result.riskLevel.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className={`text-3xl font-black ${
                    result.riskScore >= 60 ? 'text-rose-400' :
                    result.riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {result.riskScore}<span className="text-base text-slate-500">/100</span>
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diagnostic Summary</p>
                <p className="mt-1 text-sm text-slate-200">{result.summary}</p>
              </div>

              {/* Red Flags List */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Detected Red Flags ({result.redFlags.length})
                </p>
                {result.redFlags.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No overt phishing patterns detected.</p>
                ) : (
                  <div className="space-y-2.5">
                    {result.redFlags.map((flag, idx) => (
                      <div key={idx} className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300">{flag.type}</span>
                          <span className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                            {flag.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{flag.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Recommended Next Step</p>
                <p className="mt-1 text-sm text-slate-200">{result.recommendedAction}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
              <p className="font-medium text-slate-300">No message scanned yet</p>
              <p className="mt-1 text-xs max-w-xs text-slate-500">
                Type or paste a message on the left or select a sample email to see instant red-flag extraction and risk rating.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
