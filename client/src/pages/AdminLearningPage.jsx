import { useEffect, useState } from 'react';
import api from '../services/api';

function localDateTimeValue(date = new Date()) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function statusStyle(status) {
  if (status === 'COMPLETED') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'OVERDUE') return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  if (status === 'SCHEDULED') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-slate-700 bg-slate-800 text-slate-200';
}

function emptyQuestion() {
  return { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
}

function emptyModuleForm() {
  return {
    title: '',
    description: '',
    category: '',
    difficulty: 'BEGINNER',
    contentType: 'ARTICLE',
    contentUrl: '',
    duration: 15,
    passingScore: 70,
    tags: '',
    quiz: [emptyQuestion()]
  };
}

export default function AdminLearningPage() {
  const [modules, setModules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [simulationProgress, setSimulationProgress] = useState([]);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [form, setForm] = useState({
    trainingModuleId: '',
    targetType: 'ALL',
    targetIds: [],
    availableAt: localDateTimeValue(),
    dueAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingModule, setCreatingModule] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notificationWarning, setNotificationWarning] = useState('');

  async function loadData() {
    try {
      const [moduleResponse, userResponse, departmentResponse, assignmentResponse, campaignResponse, interactionResponse] = await Promise.all([
        api.get('/training'),
        api.get('/users?role=EMPLOYEE&isActive=true'),
        api.get('/departments'),
        api.get('/training/assignments'),
        api.get('/campaigns'),
        api.get('/interactions')
      ]);
      const activeModules = (moduleResponse.data.modules || []).filter((module) => module.isActive);
      setModules(activeModules);
      setEmployees((userResponse.data.users || []).filter((employee) => employee.role === 'EMPLOYEE' && employee.isActive));
      setDepartments(departmentResponse.data.departments || []);
      setAssignments(assignmentResponse.data.assignments || []);
      const classifications = new Map();
      (interactionResponse.data.interactions || [])
        .filter((interaction) => interaction.eventType === 'CLASSIFIED')
        .forEach((interaction) => {
          const campaignId = interaction.campaignId?._id || interaction.campaignId;
          const employeeId = interaction.userId?._id || interaction.userId;
          classifications.set(`${campaignId}:${employeeId}`, interaction.classification);
        });
      setSimulationProgress((campaignResponse.data.campaigns || []).flatMap((campaign) => (
        (campaign.targetUsers || []).map((employee) => {
          const classification = classifications.get(`${campaign._id}:${employee._id}`);
          return {
            id: `${campaign._id}:${employee._id}`,
            campaign: campaign.name,
            employee: employee.name,
            email: employee.email,
            status: classification ? 'COMPLETED' : campaign.status === 'ACTIVE' ? 'AWAITING RESPONSE' : campaign.status,
            classification: classification || '',
            isCorrect: classification ? classification === campaign.expectedClassification : null
          };
        })
      )));
      setForm((current) => ({
        ...current,
        trainingModuleId: current.trainingModuleId || activeModules[0]?._id || ''
      }));
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load learning assignments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(loadData, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  function toggleTarget(targetId) {
    setForm((current) => ({
      ...current,
      targetIds: current.targetIds.includes(targetId)
        ? current.targetIds.filter((id) => id !== targetId)
        : [...current.targetIds, targetId]
    }));
  }

  function updateQuestion(questionIndex, field, value) {
    setModuleForm((current) => ({
      ...current,
      quiz: current.quiz.map((question, index) => (
        index === questionIndex ? { ...question, [field]: value } : question
      ))
    }));
  }

  function updateQuestionOption(questionIndex, optionIndex, value) {
    setModuleForm((current) => ({
      ...current,
      quiz: current.quiz.map((question, index) => (
        index === questionIndex
          ? { ...question, options: question.options.map((option, itemIndex) => itemIndex === optionIndex ? value : option) }
          : question
      ))
    }));
  }

  async function createModule(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (moduleForm.quiz.some((question) => (
      !question.question.trim() || question.options.some((option) => !option.trim())
    ))) {
      setError('Complete each quiz question and all four answer options before creating the module.');
      return;
    }

    setCreatingModule(true);
    try {
      const payload = {
        ...moduleForm,
        duration: Number(moduleForm.duration),
        passingScore: Number(moduleForm.passingScore),
        tags: moduleForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        quiz: moduleForm.quiz.map((question) => ({
          ...question,
          correctAnswer: Number(question.correctAnswer)
        }))
      };
      const { data } = await api.post('/training', payload);
      setModules((current) => [data.module, ...current.filter((module) => module._id !== data.module._id)]);
      setForm((current) => ({ ...current, trainingModuleId: data.module._id }));
      setModuleForm(emptyModuleForm());
      setNotice(`Module “${data.module.title}” created. Schedule it below to make it available to employees.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create the training module.');
    } finally {
      setCreatingModule(false);
    }
  }

  async function scheduleTraining(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setNotificationWarning('');
    setSubmitting(true);
    try {
      const targetIds = form.targetType === 'ALL' ? [] : form.targetIds;
      const { data } = await api.post('/training/assignments', {
        trainingModuleId: form.trainingModuleId,
        targetType: form.targetType,
        targetIds,
        availableAt: new Date(form.availableAt).toISOString(),
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null
      });
      const newAssignmentCount = data.newAssignmentCount ?? data.assignedCount;
      const emailNotifications = data.emailNotifications;
      const emailSummary = emailNotifications?.status === 'sent'
        ? ` Sent ${emailNotifications.sent} email notification${emailNotifications.sent === 1 ? '' : 's'}.`
        : '';
      setNotice(`Training assigned to ${data.assignedCount} employee${data.assignedCount === 1 ? '' : 's'} (${newAssignmentCount} new assignment${newAssignmentCount === 1 ? '' : 's'}).${emailSummary}`);
      if (emailNotifications && emailNotifications.status !== 'sent') {
        setNotificationWarning(
          emailNotifications.status === 'not_configured' || emailNotifications.status === 'configuration_error'
            ? `No training emails were sent. ${emailNotifications.message} Configure the SMTP settings and internal recipient-domain allowlist in server/.env.`
            : `${emailNotifications.message} Sent: ${emailNotifications.sent}; failed: ${emailNotifications.failed}; skipped: ${emailNotifications.skipped}.`
        );
      }
      setForm((current) => ({ ...current, targetIds: [], availableAt: localDateTimeValue(), dueAt: '' }));
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to schedule training.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading learning assignments…</div>;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Admin learning</p>
        <h1 className="mt-2 text-3xl font-bold">Create and schedule training</h1>
        <p className="mt-2 max-w-3xl text-slate-400">Create a learning module with a quiz, then assign it to employees, a department, or everyone. Employees see it on their Training page after it is available.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-emerald-200">{notice}</div>}
      {notificationWarning && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">{notificationWarning}</div>}

      <form onSubmit={createModule} className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <h2 className="text-lg font-semibold">Create a training module</h2>
          <p className="mt-1 text-sm text-slate-400">Add lesson details and quiz questions. New modules are not shown to employees until assigned.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium md:col-span-2">
            Module title
            <input required maxLength={200} value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium md:col-span-2">
            Lesson content / description
            <textarea required maxLength={2000} rows={4} value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Category
            <input required maxLength={100} value={moduleForm.category} onChange={(event) => setModuleForm({ ...moduleForm, category: event.target.value })} placeholder="e.g. Phishing Awareness" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Tags (comma-separated)
            <input value={moduleForm.tags} onChange={(event) => setModuleForm({ ...moduleForm, tags: event.target.value })} placeholder="phishing, verification" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Difficulty
            <select value={moduleForm.difficulty} onChange={(event) => setModuleForm({ ...moduleForm, difficulty: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Content type
            <select value={moduleForm.contentType} onChange={(event) => setModuleForm({ ...moduleForm, contentType: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="ARTICLE">Article</option>
              <option value="VIDEO">Video</option>
              <option value="INTERACTIVE">Interactive</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Duration (minutes)
            <input required type="number" min="1" max="480" value={moduleForm.duration} onChange={(event) => setModuleForm({ ...moduleForm, duration: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Passing score (%)
            <input required type="number" min="0" max="100" value={moduleForm.passingScore} onChange={(event) => setModuleForm({ ...moduleForm, passingScore: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          {moduleForm.contentType === 'VIDEO' && (
            <label className="block text-sm font-medium md:col-span-2">
              Video URL
              <input type="url" maxLength={2000} value={moduleForm.contentUrl} onChange={(event) => setModuleForm({ ...moduleForm, contentUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Quiz questions</h3>
            <button type="button" disabled={moduleForm.quiz.length >= 30} onClick={() => setModuleForm((current) => ({ ...current, quiz: [...current.quiz, emptyQuestion()] }))} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
              Add question
            </button>
          </div>
          {moduleForm.quiz.map((question, questionIndex) => (
            <fieldset key={questionIndex} className="space-y-3 rounded-lg border border-slate-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <legend className="font-medium">Question {questionIndex + 1}</legend>
                {moduleForm.quiz.length > 1 && (
                  <button type="button" onClick={() => setModuleForm((current) => ({ ...current, quiz: current.quiz.filter((_, index) => index !== questionIndex) }))} className="text-sm text-rose-300 hover:text-rose-200">
                    Remove
                  </button>
                )}
              </div>
              <label className="block text-sm">
                Question
                <input required maxLength={500} value={question.question} onChange={(event) => updateQuestion(questionIndex, 'question', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="block text-sm">
                    <span className="mb-1 flex items-center gap-2">
                      <input type="radio" name={`correct-answer-${questionIndex}`} checked={question.correctAnswer === optionIndex} onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)} />
                      Option {optionIndex + 1} {question.correctAnswer === optionIndex && <span className="text-xs text-emerald-300">(correct)</span>}
                    </span>
                    <input required maxLength={250} value={option} onChange={(event) => updateQuestionOption(questionIndex, optionIndex, event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  </label>
                ))}
              </div>
              <label className="block text-sm">
                Answer explanation (optional)
                <textarea maxLength={1000} rows={2} value={question.explanation} onChange={(event) => updateQuestion(questionIndex, 'explanation', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
            </fieldset>
          ))}
        </section>
        <button disabled={creatingModule} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
          {creatingModule ? 'Creating module…' : 'Create module'}
        </button>
      </form>

      <form onSubmit={scheduleTraining} className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Learning module
            <select required value={form.trainingModuleId} onChange={(event) => setForm({ ...form, trainingModuleId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">Select a module</option>
              {modules.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Assign to
            <select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value, targetIds: [] })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="ALL">All active employees</option>
              <option value="DEPARTMENTS">Selected departments</option>
              <option value="EMPLOYEES">Selected employees</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Available from
            <input required type="datetime-local" value={form.availableAt} onChange={(event) => setForm({ ...form, availableAt: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Due date (optional)
            <input type="datetime-local" min={form.availableAt} value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
        </div>

        {form.targetType !== 'ALL' && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              {form.targetType === 'DEPARTMENTS' ? 'Departments' : 'Employees'}
            </legend>
            <div className="grid max-h-56 gap-2 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 md:grid-cols-2">
              {form.targetType === 'DEPARTMENTS' ? departments.map((department) => (
                <label key={department._id} className="flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-sm">
                  <input type="checkbox" checked={form.targetIds.includes(department._id)} onChange={() => toggleTarget(department._id)} />
                  <span>{department.name}</span>
                </label>
              )) : employees.map((employee) => (
                <label key={employee._id} className="flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-sm">
                  <input type="checkbox" checked={form.targetIds.includes(employee._id)} onChange={() => toggleTarget(employee._id)} />
                  <span>{employee.name} · {employee.email}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <button disabled={submitting || !modules.length} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Scheduling…' : 'Schedule training'}
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold">Employee assignment progress</h2>
        </div>
        {assignments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Badges / points</th></tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">{assignment.employee?.name}</p>
                      <p className="text-xs text-slate-400">{assignment.employee?.department} · {assignment.employee?.email}</p>
                    </td>
                    <td className="px-4 py-3">{assignment.trainingModule.title}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${statusStyle(assignment.status)}`}>{assignment.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3">{assignment.progressPercent}%</td>
                    <td className="px-4 py-3 text-slate-300">{assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : 'No due date'}</td>
                    <td className="px-4 py-3 text-slate-300">{assignment.employee?.badges?.length ? assignment.employee.badges.join(', ') : 'No badges'} · {assignment.employee?.points || 0} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-5 text-sm text-slate-400">No training assignments yet. Schedule a module to start tracking progress.</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold">Employee simulation progress</h2>
        </div>
        {simulationProgress.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Simulation</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Classification</th><th className="px-4 py-3">Result</th></tr>
              </thead>
              <tbody>
                {simulationProgress.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800">
                    <td className="px-4 py-3"><p className="font-medium">{item.employee}</p><p className="text-xs text-slate-400">{item.email}</p></td>
                    <td className="px-4 py-3">{item.campaign}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${statusStyle(item.status)}`}>{item.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3">{item.classification || '—'}</td>
                    <td className="px-4 py-3">{item.isCorrect === null ? '—' : item.isCorrect ? 'Correct' : 'Review needed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-5 text-sm text-slate-400">No simulation participants to track yet.</p>}
      </section>
    </div>
  );
}
