import { Router } from 'express';
import { classifySimulation, getCampaignInteractions, getUserInteractions, listAvailableSimulations, listInteractions, recordInteraction } from '../controllers/interactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.post('/', authorize('EMPLOYEE'), recordInteraction);
router.get('/available', authorize('EMPLOYEE'), listAvailableSimulations);
router.post('/:campaignId/respond', authorize('EMPLOYEE'), classifySimulation);
router.get('/', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), listInteractions);
router.get('/user/:userId', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getUserInteractions);
router.get('/campaign/:campaignId', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getCampaignInteractions);
export default router;
