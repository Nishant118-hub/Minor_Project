import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createToken } from '../utils/token.js';
import { registrationDefaults, validateLogin, validateRegistration } from '../validators/authValidator.js';

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    seniority: user.seniority,
    isActive: user.isActive,
    points: user.points || 0,
    level: user.level || 'Rookie',
    streak: user.streak || { current: 0, highest: 0, lastCompletedDate: null },
    isSecurityChampion: user.isSecurityChampion || false,
    badges: user.badges,
    trainingProgress: user.trainingProgress || [],
    isSimulationParticipant: user.isSimulationParticipant,
    lastLoginAt: user.lastLoginAt
  };
}

export const register = asyncHandler(async (request, response) => {
  const { name, email, password, role } = validateRegistration(request.body);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    ...registrationDefaults(role)
  });
  const token = createToken(user._id);

  response.status(201).json({ success: true, token, user: userResponse(user) });
});

export const login = asyncHandler(async (request, response) => {
  const { email, password } = validateLogin(request.body);
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = createToken(user._id);
  response.status(200).json({ success: true, token, user: userResponse(user) });
});

export const getCurrentUser = asyncHandler(async (request, response) => {
  response.status(200).json({ success: true, user: userResponse(request.user) });
});
