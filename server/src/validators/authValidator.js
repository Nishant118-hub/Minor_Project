import AppError from '../utils/AppError.js';
import { createHash, timingSafeEqual } from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registrationDefaults(role) {
  return {
    isActive: true,
    isSimulationParticipant: role === 'EMPLOYEE'
  };
}

function requireText(value, field, minLength = 1) {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new AppError(`${field} is required.`, 400);
  }
  return value.trim();
}

export function validateRegistration(payload = {}) {
  const name = requireText(payload.name, 'Name', 2);
  const email = requireText(payload.email, 'Email').toLowerCase();
  const password = requireText(payload.password, 'Password', 8);
  const role = payload.role === undefined ? 'EMPLOYEE' : payload.role;
  const adminInviteCode = payload.adminInviteCode;

  if (!emailPattern.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (!['EMPLOYEE', 'ADMIN'].includes(role)) {
    throw new AppError('Account type must be EMPLOYEE or ADMIN.', 400);
  }

  if (password.length > 128) {
    throw new AppError('Password must not exceed 128 characters.', 400);
  }

  if (role === 'ADMIN' && (typeof adminInviteCode !== 'string' || !adminInviteCode.trim())) {
    throw new AppError('An admin invite code is required for this account type.', 400);
  }

  return { name, email, password, role, adminInviteCode };
}

export function validateAdminInviteCode(providedCode, configuredCode) {
  if (!configuredCode || configuredCode.length < 32) {
    throw new AppError('Admin registration is not configured correctly. Contact your system administrator.', 503);
  }

  if (typeof providedCode !== 'string' || !providedCode) {
    throw new AppError('A valid admin invite code is required.', 403);
  }

  const providedHash = createHash('sha256').update(providedCode).digest();
  const configuredHash = createHash('sha256').update(configuredCode).digest();
  if (!timingSafeEqual(providedHash, configuredHash)) {
    throw new AppError('A valid admin invite code is required.', 403);
  }
}

export function validateLogin(payload = {}) {
  const email = requireText(payload.email, 'Email').toLowerCase();
  const password = requireText(payload.password, 'Password');

  if (!emailPattern.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  return { email, password };
}
