import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getCurrentUser, login, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getCurrentUser);
router.get('/profile', authenticate, getCurrentUser);

export default router;
