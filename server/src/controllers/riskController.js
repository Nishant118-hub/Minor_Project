import RiskScore from '../models/RiskScore.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { calculateAndStoreRiskProfile } from '../services/riskProfileService.js';

async function assertRiskAccess(request, userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  if (request.user.role === 'EMPLOYEE' && String(request.user._id) !== String(userId)) throw new AppError('You can view only your own risk profile.', 403);
  if (request.user.role === 'MANAGER' && (user.role !== 'EMPLOYEE' || String(user.department) !== String(request.user.department))) {
    throw new AppError('You can view only employees in your assigned department.', 403);
  }
  return user;
}

export const getRiskScore = asyncHandler(async (request, response) => {
  const userId = requireObjectId(request.params.userId, 'User id');
  await assertRiskAccess(request, userId);
  const riskScore = await RiskScore.findOne({ userId }).sort({ calculatedAt: -1 });
  response.json({ success: true, riskScore });
});

export const calculateRiskScore = asyncHandler(async (request, response) => {
  const userId = requireObjectId(request.params.userId, 'User id');
  await assertRiskAccess(request, userId);
  const { riskScore, source } = await calculateAndStoreRiskProfile(userId);
  response.status(201).json({ success: true, riskScore, source });
});

export const getOrganizationRisk = asyncHandler(async (request, response) => {
  const userFilter = request.user.role === 'MANAGER'
    ? { department: request.user.department, role: 'EMPLOYEE' }
    : { role: 'EMPLOYEE' };
  const users = await User.find(userFilter).select('_id');
  const userIds = users.map((user) => user._id);
  const latestScores = await RiskScore.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $sort: { calculatedAt: -1 } },
    { $group: { _id: '$userId', score: { $first: '$score' }, riskTier: { $first: '$riskTier' }, calculatedAt: { $first: '$calculatedAt' } } }
  ]);
  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  latestScores.forEach((item) => { distribution[item.riskTier] += 1; });
  const averageScore = latestScores.length
    ? Number((latestScores.reduce((total, item) => total + item.score, 0) / latestScores.length).toFixed(2))
    : 0;
  response.json({ success: true, assessedEmployees: latestScores.length, averageScore, distribution, scores: latestScores });
});
