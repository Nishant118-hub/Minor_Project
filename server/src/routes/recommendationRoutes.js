import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/:userId', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getRecommendations);
export default router;
