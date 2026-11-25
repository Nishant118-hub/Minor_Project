import Department from '../models/Department.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { validateStatus, validateUserCreate, validateUserUpdate } from '../validators/userValidator.js';

async function recalculateEmployeeCount(departmentId) {
  if (!departmentId) return;
  const employeeCount = await User.countDocuments({ department: departmentId });
  await Department.findByIdAndUpdate(departmentId, { employeeCount });
}

async function requireDepartment(departmentId) {
  if (!departmentId) return;
  requireObjectId(departmentId, 'Department id');
  if (!(await Department.exists({ _id: departmentId }))) throw new AppError('Department not found.', 404);
}

async function findUserForManager(request, userId) {
  const target = await User.findById(userId);
  if (!target) throw new AppError('User not found.', 404);
  if (request.user.role === 'MANAGER' && (target.role !== 'EMPLOYEE' || String(target.department) !== String(request.user.department))) {
    throw new AppError('You can access only employees in your assigned department.', 403);
  }
  return target;
}

export const listUsers = asyncHandler(async (request, response) => {
  const filter = {};
  if (request.user.role === 'MANAGER') {
    filter.department = request.user.department;
    filter.role = 'EMPLOYEE';
  }
  if (request.query.department && request.user.role === 'ADMIN') filter.department = requireObjectId(request.query.department, 'Department filter');
  if (request.query.role && request.user.role === 'ADMIN') filter.role = request.query.role;
  if (request.query.isActive !== undefined && request.user.role === 'ADMIN') filter.isActive = request.query.isActive === 'true';

  const users = await User.find(filter).populate('department', 'name').sort({ createdAt: -1 });
  response.json({ success: true, count: users.length, users });
});

export const getUser = asyncHandler(async (request, response) => {
  const user = await findUserForManager(request, requireObjectId(request.params.id, 'User id'));
  await user.populate('department', 'name');
  response.json({ success: true, user });
});

export const createUser = asyncHandler(async (request, response) => {
  const data = validateUserCreate(request.body);
  await requireDepartment(data.department);
  const existingUser = await User.exists({ email: data.email });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create(data);
  await recalculateEmployeeCount(user.department);
  const safeUser = user.toObject();
  delete safeUser.password;
  response.status(201).json({ success: true, user: safeUser });
});

export const updateUser = asyncHandler(async (request, response) => {
  const user = await findUserForManager(request, requireObjectId(request.params.id, 'User id'));
  const data = validateUserUpdate(request.body);

  if (request.user.role !== 'ADMIN' && ['role', 'department', 'password', 'isSimulationParticipant'].some((field) => data[field] !== undefined)) {
    throw new AppError('Managers cannot change roles, departments, passwords, or simulation consent.', 403);
  }
  if (data.department !== undefined) await requireDepartment(data.department);
  if (data.email && data.email !== user.email && (await User.exists({ email: data.email }))) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const previousDepartment = user.department;
  Object.assign(user, data);
  await user.save();
  await Promise.all([recalculateEmployeeCount(previousDepartment), recalculateEmployeeCount(user.department)]);
  response.json({ success: true, user });
});

export const deleteUser = asyncHandler(async (request, response) => {
  const user = await User.findById(requireObjectId(request.params.id, 'User id'));
  if (!user) throw new AppError('User not found.', 404);
  if (String(user._id) === String(request.user._id)) throw new AppError('You cannot delete your own account.', 400);

  await user.deleteOne();
  await recalculateEmployeeCount(user.department);
  response.status(204).send();
});

export const updateUserStatus = asyncHandler(async (request, response) => {
  const user = await User.findById(requireObjectId(request.params.id, 'User id'));
  if (!user) throw new AppError('User not found.', 404);
  const isActive = validateStatus(request.body);
  if (String(user._id) === String(request.user._id) && !isActive) throw new AppError('You cannot deactivate your own account.', 400);

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });
  response.json({ success: true, user });
});
