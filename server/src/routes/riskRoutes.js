import { Router } from 'express';
import { calculateRiskScore, getOrganizationRisk, getRiskScore } from '../controllers/riskController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/organization', authorize('ADMIN', 'MANAGER'), getOrganizationRisk);
router.get('/:userId', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getRiskScore);
router.post('/calculate/:userId', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), calculateRiskScore);
export default router;
