import { Router } from 'express';
import { getQuizResults, submitQuiz } from '../controllers/quizController.js';
import { createTraining, getTraining, listTraining } from '../controllers/trainingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), listTraining);
router.post('/', authorize('ADMIN'), createTraining);
router.get('/results', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), (request, response, next) => {
  request.params.userId = request.query.userId || String(request.user._id);
  return getQuizResults(request, response, next);
});
router.get('/:id', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getTraining);
router.post('/:id/submit', authorize('EMPLOYEE'), (request, response, next) => {
  request.params.moduleId = request.params.id;
  return submitQuiz(request, response, next);
});

export default router;