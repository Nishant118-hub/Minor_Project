import RiskScore from '../models/RiskScore.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { calculateAndStoreRiskProfile } from '../services/riskProfileService.js';

async function assertRecommendationAccess(request, userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  if (request.user.role === 'EMPLOYEE' && String(request.user._id) !== String(userId)) throw new AppError('You can view only your own recommendations.', 403);
  if (request.user.role === 'MANAGER' && (user.role !== 'EMPLOYEE' || String(user.department) !== String(request.user.department))) {
    throw new AppError('You can view only employees in your assigned department.', 403);
  }
  return user;
}

export const getRecommendations = asyncHandler(async (request, response) => {
  const userId = requireObjectId(request.params.userId, 'User id');
  const user = await assertRecommendationAccess(request, userId);
  let riskScore = await RiskScore.findOne({ userId }).sort({ calculatedAt: -1 });
  let source = null;
  if (!riskScore) {
    const calculation = await calculateAndStoreRiskProfile(userId);
    riskScore = calculation.riskScore;
    source = calculation.source;
  } else {
    const completedModuleIds = new Set(user.trainingProgress
      .filter((item) => item.status === 'COMPLETED')
      .map((item) => String(item.module)));
    const recommendsCompletedModule = riskScore.recommendations.some((item) => completedModuleIds.has(String(item.moduleId)));
    if (recommendsCompletedModule) {
      const calculation = await calculateAndStoreRiskProfile(userId);
      riskScore = calculation.riskScore;
      source = calculation.source;
    }
  }
  response.json({ success: true, riskTier: riskScore.riskTier, recommendations: riskScore.recommendations, calculatedAt: riskScore.calculatedAt, source });
});
