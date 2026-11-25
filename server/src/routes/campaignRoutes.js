import { Router } from 'express';
import { createCampaign, deleteCampaign, getCampaign, launchCampaign, listCampaigns, listTemplates, testCampaign, updateCampaign } from '../controllers/campaignController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/templates', listTemplates);
router.get('/', listCampaigns);
router.post('/', createCampaign);
router.get('/:id', getCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/launch', launchCampaign);
router.post('/:id/test', testCampaign);

export default router;
