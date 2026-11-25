import { Router } from 'express';
import { assignTraining, listTrainingAssignments } from '../controllers/trainingAssignmentController.js';
import { createTraining, deleteTraining, getTraining, listTraining, updateTraining } from '../controllers/trainingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/assignments', authorize('ADMIN', 'EMPLOYEE'), listTrainingAssignments);
router.post('/assignments', authorize('ADMIN'), assignTraining);
router.get('/', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), listTraining);
router.post('/', authorize('ADMIN'), createTraining);
router.get('/:id', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getTraining);
router.put('/:id', authorize('ADMIN'), updateTraining);
router.delete('/:id', authorize('ADMIN'), deleteTraining);
export default router;
