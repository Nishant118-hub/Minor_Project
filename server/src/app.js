import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import dailyChallengeRoutes from './routes/dailyChallengeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, skipSuccessfulRequests: true }));

app.get('/health', (_request, response) => {
  response.json({ service: 'server', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/courses', trainingRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/daily-challenge', dailyChallengeRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
