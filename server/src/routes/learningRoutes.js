import { Router } from 'express';
import { updateLearningProgress } from '../controllers/trainingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.post('/progress', authorize('EMPLOYEE'), updateLearningProgress);
export default router;