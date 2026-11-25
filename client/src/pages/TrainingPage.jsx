import { useEffect, useState } from 'react';
import api from '../services/api';

const difficultyStyles = {
  BEGINNER: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  INTERMEDIATE: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  ADVANCED: 'border-rose-500/30 bg-rose-500/10 text-rose-200'
};

function ModuleCard({ assignment, onSelect, opening }) {
  const { trainingModule: module } = assignment;
  const progress = assignment.progressPercent || 0;
  const status = assignment.status || 'NOT_STARTED';
  const isScheduled = status === 'SCHEDULED';

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">{module.category}</p>
          <h3 className="mt-2 text-xl font-semibold">{module.title}</h3>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs ${difficultyStyles[module.difficulty] || 'border-slate-700 text-slate-300'}`}>{module.difficulty}</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{module.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-slate-700 px-2 py-1">{module.contentType}</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">{module.duration} min</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">{module.quizQuestionCount} questions</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">Available {new Date(assignment.availableAt).toLocaleDateString()}</span>
        {assignment.dueAt && <span className="rounded-full border border-slate-700 px-2 py-1">Due {new Date(assignment.dueAt).toLocaleDateString()}</span>}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-300">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">Status: {status.replace('_', ' ')}</span>
        <button disabled={isScheduled || opening} onClick={() => onSelect(assignment)} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
          {opening ? 'Opening…' : isScheduled ? 'Not available yet' : 'Open module'}
        </button>
      </div>
    </article>
  );
}

export default function TrainingPage() {
  const [assignments, setAssignments] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openingId, setOpeningId] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [assignmentResponse, historyResponse] = await Promise.all([
          api.get('/training/assignments'),
          api.get('/assessments/results')
        ]);
        if (active) {
          setAssignments(assignmentResponse.data.assignments || []);
          setHistory(historyResponse.data.results || []);
          setError('');
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to load training modules.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const intervalId = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  function handleAnswerChange(questionIndex, answerIndex) {
    setAnswers((current) => ({ ...current, [questionIndex]: answerIndex }));
  }

  async function openModule(assignment) {
    setOpeningId(assignment.id);
    setError('');
    setAnswers({});
    setResult(null);
    try {
      const { data: moduleData } = await api.get(`/training/${assignment.trainingModule.id}`);
      const { data: progressData } = await api.post('/learning/progress', {
        moduleId: assignment.trainingModule.id,
        progressPercent: 25
      });
      setSelectedModule(moduleData.module);
      setAssignments((current) => current.map((item) => (
        item.id === assignment.id
          ? { ...item, status: progressData.progress.status, progressPercent: progressData.progress.progressPercent }
          : item
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save lesson progress.');
    } finally {
      setOpeningId('');
    }
  }

  async function submitQuiz() {
    if (!selectedModule) return;
    setSubmitting(true);
    setError('');
    setResult(null);
    if (selectedModule.quiz.some((_, index) => !Number.isInteger(answers[index]))) {
      setError('Answer every question before submitting the assessment.');
      setSubmitting(false);
      return;
    }
    try {
      const payload = { answers: selectedModule.quiz.map((_, index) => ({ questionIndex: index, answerIndex: answers[index] ?? -1 })) };
      const { data } = await api.post(`/quizzes/${selectedModule._id}/submit`, payload);
      setResult(data);
      setHistory((current) => [{
        ...data.result,
        trainingModuleId: { title: selectedModule.title, category: selectedModule.category }
      }, ...current]);
      const progressPercent = data.result.passed ? 100 : Math.round((data.result.correctAnswers / data.result.totalQuestions) * 100);
      setAssignments((current) => current.map((assignment) => (
        assignment.trainingModule.id === String(selectedModule._id)
          ? {
            ...assignment,
            status: data.result.passed ? 'COMPLETED' : assignment.status === 'OVERDUE' ? 'OVERDUE' : 'IN_PROGRESS',
            progressPercent
          }
          : assignment
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading training modules…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Training center</p>
        <h1 className="mt-2 text-3xl font-bold">Employee learning modules</h1>
      </section>

      {error && <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-rose-200">{error}</div>}

      {!selectedModule ? (
        <div className="space-y-6">
          {assignments.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {assignments.map((assignment) => (
                <ModuleCard key={assignment.id} assignment={assignment} onSelect={openModule} opening={openingId === assignment.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
              No training has been assigned to you yet. Your administrator will schedule modules here.
            </div>
          )}
          {history.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="font-semibold">Assessment history</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr><th className="px-5 py-3">Assessment</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Completed</th></tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((item, index) => (
                      <tr key={item._id || item.id || `${item.trainingModuleId?.title}-${index}`} className="border-t border-slate-800">
                        <td className="px-5 py-3">{item.trainingModuleId?.title || 'Assessment'}</td>
                        <td className="px-5 py-3">{item.score}%</td>
                        <td className="px-5 py-3 text-slate-400">{item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'Just now'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">{selectedModule.category}</p>
              <h2 className="mt-2 text-2xl font-bold">{selectedModule.title}</h2>
            </div>
            <button onClick={() => setSelectedModule(null)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Back to modules</button>
          </div>

          <p className="text-slate-300">{selectedModule.description}</p>

          {selectedModule.contentType === 'VIDEO' && selectedModule.contentUrl && (
            <a
              href={selectedModule.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-slate-800"
            >
              Open lesson video
            </a>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="mb-3 text-lg font-semibold">Quiz</h3>
            <div className="space-y-5">
              {selectedModule.quiz.map((question, index) => (
                <div key={`${selectedModule._id}-${index}`} className="rounded-lg border border-slate-800 p-4">
                  <p className="mb-3 font-medium">{index + 1}. {question.question}</p>
                  <div className="grid gap-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={`${question.question}-${optionIndex}`} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-2">
                        <input type="radio" name={`question-${index}`} checked={answers[index] === optionIndex} onChange={() => handleAnswerChange(index, optionIndex)} />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  {result?.review?.[index] && (
                    <div className={`mt-4 rounded-lg border p-3 text-sm ${result.review[index].isCorrect ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
                      <p className="font-semibold">{result.review[index].isCorrect ? 'Correct' : `Correct answer: ${question.options[result.review[index].correctAnswer]}`}</p>
                      <p className="mt-1">{result.review[index].explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-300">Passing score: {selectedModule.passingScore}%</div>
            <button disabled={submitting} onClick={submitQuiz} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit quiz'}</button>
          </div>

          {result && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
              <p className="text-lg font-semibold">Quiz complete</p>
              <p className="mt-2">Score: {result.result.score}% ({result.result.correctAnswers}/{result.result.totalQuestions})</p>
              <p className="mt-1">Status: {result.result.passed ? 'Passed' : 'Needs review'}</p>
              <p className="mt-2 text-sm">{result.adaptiveRecommendation.message}</p>
              {result.earnedBadges?.length > 0 && <p className="mt-2 text-sm font-semibold">Earned: {result.earnedBadges.join(', ')}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
