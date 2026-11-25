import Department from '../models/Department.js';
import TrainingAssignment from '../models/TrainingAssignment.js';
import TrainingModule from '../models/TrainingModule.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateTrainingAssignment } from '../validators/trainingAssignmentValidator.js';
import { sendTrainingAssignmentNotifications } from '../services/trainingNotificationService.js';

function assignmentStatus(assignment, progress, now) {
  if (assignment.availableAt > now) return 'SCHEDULED';
  if (progress?.status === 'COMPLETED') return 'COMPLETED';
  if (assignment.dueAt && assignment.dueAt < now) return 'OVERDUE';
  if (progress?.status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

export const listTrainingAssignments = asyncHandler(async (request, response) => {
  const filter = request.user.role === 'EMPLOYEE' ? { employee: request.user._id } : {};
  const records = await TrainingAssignment.find(filter)
    .populate('trainingModule', 'title description category difficulty contentType duration passingScore isActive quiz')
    .populate({
      path: 'employee',
      select: 'name email department points badges trainingProgress',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'badges', select: 'name' }
      ]
    })
    .sort({ availableAt: 1, createdAt: -1 });
  const now = new Date();
  const assignments = records
    .filter((record) => record.trainingModule?.isActive && record.employee)
    .map((record) => {
      const progress = record.employee.trainingProgress.find(
        (item) => String(item.module) === String(record.trainingModule._id)
      );
      return {
        id: record.id,
        trainingModule: {
          id: record.trainingModule.id,
          title: record.trainingModule.title,
          description: record.trainingModule.description,
          category: record.trainingModule.category,
          difficulty: record.trainingModule.difficulty,
          contentType: record.trainingModule.contentType,
          duration: record.trainingModule.duration,
          passingScore: record.trainingModule.passingScore,
          quizQuestionCount: record.trainingModule.quiz.length
        },
        employee: request.user.role === 'ADMIN'
          ? {
            id: record.employee.id,
            name: record.employee.name,
            email: record.employee.email,
            department: record.employee.department?.name || 'Unassigned',
            points: record.employee.points,
            badges: record.employee.badges.map((badge) => badge.name)
          }
          : undefined,
        availableAt: record.availableAt,
        dueAt: record.dueAt,
        progressPercent: progress?.progressPercent || 0,
        completedAt: progress?.completedAt || null,
        status: assignmentStatus(record, progress, now)
      };
    });

  response.json({ success: true, count: assignments.length, assignments });
});

export const assignTraining = asyncHandler(async (request, response) => {
  const data = validateTrainingAssignment(request.body);
  const module = await TrainingModule.findOne({ _id: data.trainingModuleId, isActive: true }).select('_id title');
  if (!module) throw new AppError('Active training module not found.', 404);

  let employeeFilter = { role: 'EMPLOYEE', isActive: true };
  if (data.targetType === 'DEPARTMENTS') {
    const departments = await Department.find({ _id: { $in: data.targetIds } }).select('_id');
    if (departments.length !== data.targetIds.length) throw new AppError('One or more departments were not found.', 404);
    employeeFilter.department = { $in: data.targetIds };
  } else if (data.targetType === 'EMPLOYEES') {
    employeeFilter._id = { $in: data.targetIds };
  }

  const employees = await User.find(employeeFilter).select('_id name email');
  if (!employees.length) throw new AppError('No active employees match the selected targets.', 400);
  if (data.targetType === 'EMPLOYEES' && employees.length !== data.targetIds.length) {
    throw new AppError('Every selected target must be an active employee.', 400);
  }

  const operations = employees.map((employee) => ({
    updateOne: {
      filter: {
        trainingModule: module._id,
        employee: employee._id,
        availableAt: data.availableAt
      },
      update: {
        $set: { dueAt: data.dueAt, assignedBy: request.user._id }
      },
      upsert: true
    }
  }));
  const writeResult = await TrainingAssignment.bulkWrite(operations);
  const newlyAssigned = employees.filter((_employee, index) => (
    Object.prototype.hasOwnProperty.call(writeResult.upsertedIds || {}, index)
  ));
  const emailNotifications = await sendTrainingAssignmentNotifications(
    newlyAssigned,
    module,
    data
  );
  response.status(201).json({
    success: true,
    assignedCount: employees.length,
    newAssignmentCount: newlyAssigned.length,
    emailNotifications,
    trainingModuleId: String(module._id),
    availableAt: data.availableAt,
    dueAt: data.dueAt
  });
});
