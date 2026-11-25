import Department from '../models/Department.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { validateDepartmentCreate, validateDepartmentUpdate } from '../validators/departmentValidator.js';

async function validateManager(managerId) {
  if (!managerId) return;
  requireObjectId(managerId, 'Manager id');
  const manager = await User.findById(managerId);
  if (!manager || manager.role !== 'MANAGER' || !manager.isActive) throw new AppError('Manager must reference an active manager account.', 400);
}

async function findAccessibleDepartment(request, id) {
  const department = await Department.findById(requireObjectId(id, 'Department id')).populate('manager', 'name email');
  if (!department) throw new AppError('Department not found.', 404);
  const isAssignedManager = String(department.manager?._id || department.manager) === String(request.user._id) || String(request.user.department) === String(department._id);
  if (request.user.role === 'MANAGER' && !isAssignedManager) throw new AppError('You can access only your assigned department.', 403);
  return department;
}

export const listDepartments = asyncHandler(async (request, response) => {
  const filter = request.user.role === 'ADMIN'
    ? {}
    : { $or: [{ _id: request.user.department }, { manager: request.user._id }] };
  const departments = await Department.find(filter).populate('manager', 'name email').sort({ name: 1 });
  response.json({ success: true, count: departments.length, departments });
});

export const getDepartment = asyncHandler(async (request, response) => {
  const department = await findAccessibleDepartment(request, request.params.id);
  response.json({ success: true, department });
});

export const createDepartment = asyncHandler(async (request, response) => {
  const data = validateDepartmentCreate(request.body);
  await validateManager(data.manager);
  const department = await Department.create(data);
  response.status(201).json({ success: true, department });
});

export const updateDepartment = asyncHandler(async (request, response) => {
  const department = await Department.findById(requireObjectId(request.params.id, 'Department id'));
  if (!department) throw new AppError('Department not found.', 404);
  const data = validateDepartmentUpdate(request.body);
  await validateManager(data.manager);
  Object.assign(department, data);
  await department.save();
  response.json({ success: true, department });
});

export const deleteDepartment = asyncHandler(async (request, response) => {
  const department = await Department.findById(requireObjectId(request.params.id, 'Department id'));
  if (!department) throw new AppError('Department not found.', 404);
  const assignedUsers = await User.exists({ department: department._id });
  if (assignedUsers) throw new AppError('Move or remove department users before deleting this department.', 409);

  await department.deleteOne();
  response.status(204).send();
});
