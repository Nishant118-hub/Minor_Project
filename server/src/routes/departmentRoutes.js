import { Router } from 'express';
import { createDepartment, deleteDepartment, getDepartment, listDepartments, updateDepartment } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('ADMIN', 'MANAGER'), listDepartments);
router.post('/', authorize('ADMIN'), createDepartment);
router.get('/:id', authorize('ADMIN', 'MANAGER'), getDepartment);
router.put('/:id', authorize('ADMIN'), updateDepartment);
router.delete('/:id', authorize('ADMIN'), deleteDepartment);

export default router;
