import RiskScore from '../models/RiskScore.js';
import { buildEmployeeFeatures } from './featureEngineeringService.js';
import { getTrainingRecommendations, predictRisk } from './aiService.js';

function riskFeatures(features) {
  return {
    clickRate: features.click_rate,
    reportRate: features.report_rate,
    credentialSubmissionRate: features.credential_submission_rate,
    averageResponseTime: features.average_response_time,
    averageQuizScore: features.average_quiz_score,
    trainingCompletionRate: features.training_completion_rate,
    phishingAttempts: features.phishing_attempts,
    successfulReports: features.successful_reports,
    simulationClassifications: features.simulation_classifications,
    simulationClassificationAccuracy: features.simulation_classification_accuracy,
    department: features.department,
    seniority: features.seniority
  };
}

export async function calculateAndStoreRiskProfile(userId) {
  const features = await buildEmployeeFeatures(userId);
  const [prediction, recommendationResult] = await Promise.all([
    predictRisk(features),
    getTrainingRecommendations(features)
  ]);
  const riskScore = await RiskScore.create({
    userId,
    score: prediction.riskScore,
    riskTier: prediction.riskTier,
    features: riskFeatures(features),
    weakAreas: prediction.weakAreas,
    recommendations: recommendationResult.recommendations,
    calculatedAt: new Date()
  });
  return {
    riskScore,
    source: { prediction: prediction.source, recommendations: recommendationResult.source }
  };
}
