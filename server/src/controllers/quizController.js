import QuizResult from '../models/QuizResult.js';
import TrainingAssignment from '../models/TrainingAssignment.js';
import TrainingModule from '../models/TrainingModule.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { awardQuizCompletion } from '../services/gamificationService.js';
import { calculateAndStoreRiskProfile } from '../services/riskProfileService.js';
import { validateQuizSubmission } from '../validators/trainingValidator.js';

function nextDifficulty(difficulty, passed) {
  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const index = levels.indexOf(difficulty);
  if (passed) return levels[Math.min(index + 1, levels.length - 1)];
  return levels[Math.max(index - 1, 0)];
}

export const submitQuiz = asyncHandler(async (request, response) => {
  const moduleId = requireObjectId(request.params.moduleId, 'Training module id');
  const hasAvailableAssignment = await TrainingAssignment.exists({
    employee: request.user._id,
    trainingModule: moduleId,
    availableAt: { $lte: new Date() }
  });
  if (!hasAvailableAssignment) throw new AppError('This training module has not been assigned to you or is not available yet.', 403);
  const module = await TrainingModule.findById(moduleId);
  if (!module || !module.isActive) throw new AppError('Training module not found.', 404);
  if (!module.quiz.length) throw new AppError('This module does not have a quiz.', 409);
  const answers = validateQuizSubmission(request.body);
  if (answers.size !== module.quiz.length) throw new AppError('Submit one answer for every quiz question.', 400);

  const correctAnswers = module.quiz.reduce((total, question, index) => total + Number(answers.get(index) === question.correctAnswer), 0);
  const score = Number(((correctAnswers / module.quiz.length) * 100).toFixed(2));
  const passed = score >= module.passingScore;
  const result = await QuizResult.create({ userId: request.user._id, trainingModuleId: module._id, score, totalQuestions: module.quiz.length, correctAnswers, difficulty: module.difficulty });

  const user = await User.findById(request.user._id);
  const progress = user.trainingProgress.find((item) => String(item.module) === String(module._id));
  const firstCompletion = passed && (!progress || progress.status !== 'COMPLETED');
  if (progress) {
    progress.status = passed ? 'COMPLETED' : 'IN_PROGRESS';
    progress.progressPercent = passed ? 100 : Math.max(progress.progressPercent, Math.round(score));
    if (passed) progress.completedAt = new Date();
  } else {
    user.trainingProgress.push({ module: module._id, status: passed ? 'COMPLETED' : 'IN_PROGRESS', progressPercent: passed ? 100 : Math.round(score), completedAt: passed ? new Date() : null });
  }
  const badges = await awardQuizCompletion(user, { firstCompletion, perfectScore: score === 100 });
  await user.save();
  await calculateAndStoreRiskProfile(user._id);

  response.status(201).json({
    success: true,
    result: { id: result.id, score, correctAnswers, totalQuestions: module.quiz.length, passed, completedAt: result.completedAt },
    review: module.quiz.map((question, index) => ({
      question: question.question,
      selectedAnswer: answers.get(index),
      correctAnswer: question.correctAnswer,
      isCorrect: answers.get(index) === question.correctAnswer,
      explanation: question.explanation
    })),
    adaptiveRecommendation: { difficulty: nextDifficulty(module.difficulty, passed), message: passed ? 'Great work. Your next module can be more challenging.' : 'Review the topic and continue with a foundational module.' },
    earnedBadges: badges,
    points: user.points
  });
});

export const getQuizResults = asyncHandler(async (request, response) => {
  const userId = requireObjectId(request.params.userId, 'User id');
  if (request.user.role === 'EMPLOYEE' && String(request.user._id) !== String(userId)) throw new AppError('You can view only your own quiz results.', 403);
  if (request.user.role === 'MANAGER') {
    const employee = await User.findById(userId);
    if (!employee || employee.role !== 'EMPLOYEE' || String(employee.department) !== String(request.user.department)) throw new AppError('You can view only your department employees.', 403);
  }
  const results = await QuizResult.find({ userId }).populate('trainingModuleId', 'title category difficulty').sort({ completedAt: -1 });
  response.json({ success: true, count: results.length, results });
});
