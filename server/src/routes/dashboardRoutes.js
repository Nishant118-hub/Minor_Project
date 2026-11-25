import { Router } from 'express';
import { getAdminDashboard, getManagerDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/admin', authorize('ADMIN', 'SECURITY_ANALYST'), getAdminDashboard);
router.get('/manager', authorize('MANAGER'), getManagerDashboard);
export default router;
