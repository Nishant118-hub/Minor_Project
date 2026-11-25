import { Router } from 'express';
import { createCampaign, launchCampaign, listCampaigns } from '../controllers/campaignController.js';
import { classifySimulation, listAvailableSimulations } from '../controllers/interactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'EMPLOYEE'), (request, response, next) => (
  request.user.role === 'ADMIN'
    ? listCampaigns(request, response, next)
    : listAvailableSimulations(request, response, next)
));
router.post('/', authorize('ADMIN'), createCampaign);
router.post('/:id/launch', authorize('ADMIN'), launchCampaign);
router.post('/:id/respond', authorize('EMPLOYEE'), (request, response, next) => {
  request.params.campaignId = request.params.id;
  return classifySimulation(request, response, next);
});
export default router;