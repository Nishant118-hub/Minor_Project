import TrainingModule from '../models/TrainingModule.js';
import TrainingAssignment from '../models/TrainingAssignment.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { validateTrainingCreate, validateTrainingUpdate } from '../validators/trainingValidator.js';
import { calculateAndStoreRiskProfile } from '../services/riskProfileService.js';

function safeModule(module) {
  const value = module.toObject ? module.toObject() : module;
  return { ...value, quiz: value.quiz.map(({ correctAnswer, ...question }) => question) };
}

async function requireAvailableAssignment(userId, moduleId) {
  const assignment = await TrainingAssignment.exists({
    employee: userId,
    trainingModule: moduleId,
    availableAt: { $lte: new Date() }
  });
  if (!assignment) throw new AppError('This training module has not been assigned to you or is not available yet.', 403);
}

export const listTraining = asyncHandler(async (request, response) => {
  const filter = request.user.role === 'ADMIN' ? {} : { isActive: true };
  if (request.user.role === 'EMPLOYEE') {
    const assignedModuleIds = await TrainingAssignment.distinct('trainingModule', {
      employee: request.user._id,
      availableAt: { $lte: new Date() }
    });
    filter._id = { $in: assignedModuleIds };
  }
  if (request.query.category) filter.category = request.query.category;
  if (request.query.difficulty) filter.difficulty = request.query.difficulty;
  const modules = await TrainingModule.find(filter).sort({ difficulty: 1, createdAt: -1 });
  response.json({ success: true, count: modules.length, modules: modules.map(safeModule) });
});

export const getTraining = asyncHandler(async (request, response) => {
  const moduleId = requireObjectId(request.params.id, 'Training module id');
  if (request.user.role === 'EMPLOYEE') await requireAvailableAssignment(request.user._id, moduleId);
  const module = await TrainingModule.findById(moduleId);
  if (!module || (request.user.role !== 'ADMIN' && !module.isActive)) throw new AppError('Training module not found.', 404);
  response.json({ success: true, module: safeModule(module) });
});

export const createTraining = asyncHandler(async (request, response) => {
  const module = await TrainingModule.create({ ...validateTrainingCreate(request.body), createdBy: request.user._id });
  response.status(201).json({ success: true, module: safeModule(module) });
});

export const updateTraining = asyncHandler(async (request, response) => {
  const module = await TrainingModule.findById(requireObjectId(request.params.id, 'Training module id'));
  if (!module) throw new AppError('Training module not found.', 404);
  Object.assign(module, validateTrainingUpdate(request.body));
  await module.save();
  response.json({ success: true, module: safeModule(module) });
});

export const deleteTraining = asyncHandler(async (request, response) => {
  const module = await TrainingModule.findById(requireObjectId(request.params.id, 'Training module id'));
  if (!module) throw new AppError('Training module not found.', 404);
  await module.deleteOne();
  response.status(204).send();
});

export const updateLearningProgress = asyncHandler(async (request, response) => {
  const moduleId = requireObjectId(request.body?.moduleId, 'Training module id');
  await requireAvailableAssignment(request.user._id, moduleId);
  const progressPercent = request.body?.progressPercent;
  if (!Number.isInteger(progressPercent) || progressPercent < 1 || progressPercent > 99) {
    throw new AppError('progressPercent must be an integer from 1 to 99; passing the module quiz completes it.', 400);
  }
  const module = await TrainingModule.findOne({ _id: moduleId, isActive: true }).select('_id');
  if (!module) throw new AppError('Training module not found.', 404);
  const user = await User.findById(request.user._id);
  const progress = user.trainingProgress.find((item) => String(item.module) === String(moduleId));
  if (progress?.status === 'COMPLETED') {
    return response.json({ success: true, progress: { module: moduleId, status: 'COMPLETED', progressPercent: 100 } });
  }
  if (progress) {
    progress.status = 'IN_PROGRESS';
    progress.progressPercent = Math.max(progress.progressPercent, progressPercent);
  } else {
    user.trainingProgress.push({ module: moduleId, status: 'IN_PROGRESS', progressPercent });
  }
  await user.save();
  await calculateAndStoreRiskProfile(user._id);
  const updatedProgress = user.trainingProgress.find((item) => String(item.module) === String(moduleId));
  response.json({ success: true, progress: updatedProgress });
});
