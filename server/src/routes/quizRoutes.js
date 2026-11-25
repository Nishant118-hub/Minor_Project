import { Router } from 'express';
import { getQuizResults, submitQuiz } from '../controllers/quizController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.post('/:moduleId/submit', authorize('EMPLOYEE'), submitQuiz);
router.get('/results/:userId', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getQuizResults);
export default router;
