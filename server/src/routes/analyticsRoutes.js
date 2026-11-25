import { Router } from 'express';
import { getAdminDashboard, getManagerDashboard } from '../controllers/dashboardController.js';
import { getQuizResults } from '../controllers/quizController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { analyzeMessage } from '../services/messageAnalyzerService.js';
import { getDepartmentAnalytics } from '../services/departmentAnalyticsService.js';
import { getAdaptiveLearningPath } from '../services/adaptivePathService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', authorize('ADMIN', 'MANAGER', 'SECURITY_ANALYST'), (request, response, next) => (
  ['ADMIN', 'SECURITY_ANALYST'].includes(request.user.role)
    ? getAdminDashboard(request, response, next)
    : getManagerDashboard(request, response, next)
));

router.get('/performance', authorize('ADMIN', 'MANAGER', 'EMPLOYEE', 'SECURITY_ANALYST'), (request, response, next) => {
  request.params.userId = request.query.userId || String(request.user._id);
  return getQuizResults(request, response, next);
});

// AI & Heuristic Message Analyzer: paste an email/SMS/message to get red flags explained
router.post('/analyze-message', (request, response) => {
  const { subject = '', body = '', sender = '' } = request.body || {};
  const analysis = analyzeMessage({ subject, body, sender });
  response.json({ success: true, analysis });
});

// Department intelligence (Heatmap, Before/After report, Team challenges, Admin alerts)
router.get('/department-intelligence', authorize('ADMIN', 'MANAGER', 'SECURITY_ANALYST'), asyncHandler(async (_request, response) => {
  const data = await getDepartmentAnalytics();
  response.json({ success: true, ...data });
}));

// Department leaderboard (teamwork ranking by department, weekly & monthly views)
router.get('/leaderboard', asyncHandler(async (_request, response) => {
  const data = await getDepartmentAnalytics();
  response.json({
    success: true,
    leaderboard: data.leaderboard,
    teamChallenge: data.teamChallenge
  });
}));

// Adaptive learning path & explainable risk factors
router.get('/adaptive-path', asyncHandler(async (request, response) => {
  const targetUserId = request.query.userId && ['ADMIN', 'MANAGER', 'SECURITY_ANALYST'].includes(request.user.role)
    ? request.query.userId
    : request.user._id;
  const data = await getAdaptiveLearningPath(targetUserId);
  response.json({ success: true, ...data });
}));

export default router;
