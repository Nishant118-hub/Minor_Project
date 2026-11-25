import { Router } from 'express';
import { createUser, deleteUser, getUser, listUsers, updateUser, updateUserStatus } from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('ADMIN', 'MANAGER'), listUsers);
router.post('/', authorize('ADMIN'), createUser);
router.get('/:id', authorize('ADMIN', 'MANAGER'), getUser);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);
router.patch('/:id/status', authorize('ADMIN'), updateUserStatus);

export default router;
