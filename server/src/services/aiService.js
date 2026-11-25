import axios from 'axios';
import TrainingModule from '../models/TrainingModule.js';

function createAiClient() {
  return axios.create({
    baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' }
  });
}

const clamp = (value) => Math.min(1, Math.max(0, value));

function fallbackRisk(features) {
  const clickRisk = clamp(features.click_rate) * 27.5;
  const credentialRisk = clamp(features.credential_submission_rate) * 27.5;
  const reportRisk = (1 - clamp(features.report_rate)) * 15;
  const quizRisk = (1 - clamp(features.average_quiz_score / 100)) * 10;
  const trainingRisk = (1 - clamp(features.training_completion_rate)) * 10;
  const classificationRisk = features.simulation_classifications > 0
    ? (1 - clamp(features.simulation_classification_accuracy)) * 5
    : 0;
  const rapidResponseRisk = features.phishing_attempts > 0 && features.average_response_time < 300 ? 5 : 0;
  const riskScore = Number((clickRisk + credentialRisk + reportRisk + quizRisk + trainingRisk + classificationRisk + rapidResponseRisk).toFixed(2));
  const weakAreas = [];
  if (features.credential_submission_rate > 0) weakAreas.push('Credential Safety');
  if (features.click_rate >= 0.15) weakAreas.push('Link Verification');
  if (features.phishing_attempts && features.report_rate < 0.3) weakAreas.push('How to Report Phishing');
  if (features.average_quiz_score < 70) weakAreas.push('Phishing Fundamentals');
  if (features.training_completion_rate < 0.7) weakAreas.push('Training Completion');
  if (features.simulation_classifications > 0 && features.simulation_classification_accuracy < 0.7) weakAreas.push('Simulation Classification');
  return {
    riskScore,
    riskTier: riskScore < 35 ? 'LOW' : riskScore < 65 ? 'MEDIUM' : 'HIGH',
    weakAreas: [...new Set([...weakAreas, ...features.weak_areas])],
    contributingFactors: { clickRisk, credentialRisk, reportRisk, quizRisk, trainingRisk, classificationRisk, rapidResponseRisk },
    model: 'SERVER_FALLBACK_RULE_BASED_V1'
  };
}

function validRiskResponse(data) {
  return data
    && typeof data.riskScore === 'number'
    && data.riskScore >= 0
    && data.riskScore <= 100
    && ['LOW', 'MEDIUM', 'HIGH'].includes(data.riskTier)
    && Array.isArray(data.weakAreas);
}

export async function predictRisk(features) {
  try {
    const useMlModel = process.env.AI_USE_ML_MODEL !== 'false';
    const { data } = await createAiClient().post('/predict-risk', features, { params: { use_ml_model: useMlModel } });
    if (!validRiskResponse(data)) throw new Error('AI service returned an invalid risk response.');
    return { ...data, source: 'AI_SERVICE' };
  } catch (error) {
    console.warn(`AI risk prediction fallback used: ${error.message}`);
    return { ...fallbackRisk(features), source: 'SERVER_FALLBACK' };
  }
}

function fallbackRecommendations(features, modules) {
  const terms = features.weak_areas.join(' ').toLowerCase();
  const selected = modules
    .filter((module) => {
      const content = `${module.title} ${module.category} ${(module.tags || []).join(' ')}`.toLowerCase();
      return !terms || terms.split(' ').some((term) => term.length > 3 && content.includes(term));
    })
    .slice(0, 3);
  const candidates = selected.length ? selected : modules.slice(0, 3);
  return candidates.map((module) => ({
    moduleId: String(module._id),
    title: module.title,
    reason: 'Recommended from your current awareness-training profile.',
    priority: 'MEDIUM'
  }));
}

function validRecommendations(data) {
  return data && Array.isArray(data.recommendations) && data.recommendations.every((item) => item.moduleId && item.title && item.reason && item.priority);
}

export async function getTrainingRecommendations(features) {
  const completedModuleIds = features.completed_module_ids || [];
  const modules = await TrainingModule.find({ isActive: true, _id: { $nin: completedModuleIds } }).select('title category difficulty tags').lean();
  const availableModules = modules.map((module) => ({
    moduleId: String(module._id),
    title: module.title,
    category: module.category,
    difficulty: module.difficulty,
    tags: module.tags
  }));
  try {
    const { data } = await createAiClient().post('/recommend-training', { features, available_modules: availableModules });
    if (!validRecommendations(data)) throw new Error('AI service returned invalid recommendations.');
    return { recommendations: data.recommendations, source: 'AI_SERVICE' };
  } catch (error) {
    console.warn(`AI recommendation fallback used: ${error.message}`);
    return { recommendations: fallbackRecommendations(features, modules), source: 'SERVER_FALLBACK' };
  }
}
