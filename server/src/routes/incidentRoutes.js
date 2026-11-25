import { Router } from 'express';
import { getIncidentChecklist, listIncidents, reportIncident, updateIncidentStatus } from '../controllers/incidentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/checklist', getIncidentChecklist);
router.get('/', listIncidents);
router.post('/report', reportIncident);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER', 'SECURITY_ANALYST'), updateIncidentStatus);

export default router;
