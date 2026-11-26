import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { analyzeMetaverse, getMetaverseOverview } from '../controllers/metaverseController.js';

const router = Router();

router.use(authenticate);
router.get('/overview', getMetaverseOverview);
router.post('/analyze', authorize('ADMIN', 'SECURITY_ANALYST', 'EMPLOYEE'), analyzeMetaverse);

export default router;
