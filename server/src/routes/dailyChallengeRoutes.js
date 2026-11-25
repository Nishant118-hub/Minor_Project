import { Router } from 'express';
import { getDailyChallenge, getSecurityNewsFeed, submitChallenge } from '../controllers/dailyChallengeController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/today', getDailyChallenge);
router.post('/submit', submitChallenge);
router.get('/news', getSecurityNewsFeed);

export default router;
