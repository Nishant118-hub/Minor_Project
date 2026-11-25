import { Router } from 'express';
import { getAdminDashboard, getManagerDashboard } from '../controllers/dashboardController.js';
import { getQuizResults } from '../controllers/quizController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/dashboard', authorize('ADMIN', 'MANAGER'), (request, response, next) => (
  request.user.role === 'ADMIN'
    ? getAdminDashboard(request, response, next)
    : getManagerDashboard(request, response, next)
));
router.get('/performance', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), (request, response, next) => {
  request.params.userId = request.query.userId || String(request.user._id);
  return getQuizResults(request, response, next);
});
export default router;