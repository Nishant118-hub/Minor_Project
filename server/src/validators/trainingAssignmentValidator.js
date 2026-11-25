import AppError from '../utils/AppError.js';
import { requireObjectId } from '../utils/objectId.js';

const targetTypes = ['ALL', 'DEPARTMENTS', 'EMPLOYEES'];

function parseDate(value, field, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(`${field} must be a valid date.`, 400);
  return date;
}

export function validateTrainingAssignment(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError('Assignment details must be an object.', 400);
  }
  const trainingModuleId = requireObjectId(payload.trainingModuleId, 'Training module id');
  if (!targetTypes.includes(payload.targetType)) {
    throw new AppError('targetType must be ALL, DEPARTMENTS, or EMPLOYEES.', 400);
  }

  const targetIds = payload.targetIds ?? [];
  if (!Array.isArray(targetIds)) throw new AppError('targetIds must be an array.', 400);
  const uniqueTargetIds = [...new Set(targetIds.map((id) => requireObjectId(id, 'Target id')))];
  if (payload.targetType !== 'ALL' && uniqueTargetIds.length === 0) {
    throw new AppError('Select at least one target.', 400);
  }
  if (payload.targetType === 'ALL' && uniqueTargetIds.length > 0) {
    throw new AppError('targetIds must be empty when targetType is ALL.', 400);
  }

  const availableAt = parseDate(payload.availableAt, 'availableAt', new Date());
  const dueAt = parseDate(payload.dueAt, 'dueAt', null);
  if (dueAt && dueAt < availableAt) throw new AppError('dueAt must be on or after availableAt.', 400);

  return { trainingModuleId, targetType: payload.targetType, targetIds: uniqueTargetIds, availableAt, dueAt };
}
