import AppError from '../utils/AppError.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SECURITY_ANALYST'];
const seniorityLevels = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];

function optionalText(value, field, maxLength) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new AppError(`${field} must be a non-empty string up to ${maxLength} characters.`, 400);
  }
  return value.trim();
}

function validateFields(payload, { requireNameAndEmail = false, allowPassword = false } = {}) {
  const values = {};
  if (requireNameAndEmail || payload.name !== undefined) values.name = optionalText(payload.name, 'Name', 100);
  if (requireNameAndEmail || payload.email !== undefined) {
    const email = optionalText(payload.email, 'Email', 254)?.toLowerCase();
    if (!emailPattern.test(email)) throw new AppError('Please provide a valid email address.', 400);
    values.email = email;
  }
  if (requireNameAndEmail && !values.name) throw new AppError('Name is required.', 400);
  if (requireNameAndEmail && !values.email) throw new AppError('Email is required.', 400);
  if (payload.designation !== undefined) values.designation = optionalText(payload.designation, 'Designation', 100);
  if (payload.seniority !== undefined) {
    if (!seniorityLevels.includes(payload.seniority)) throw new AppError('Seniority is invalid.', 400);
    values.seniority = payload.seniority;
  }
  if (payload.department !== undefined) values.department = payload.department || null;
  if (payload.role !== undefined) {
    if (!roles.includes(payload.role)) throw new AppError('Role is invalid.', 400);
    values.role = payload.role;
  }
  if (payload.isSimulationParticipant !== undefined) {
    if (typeof payload.isSimulationParticipant !== 'boolean') {
      throw new AppError('isSimulationParticipant must be true or false.', 400);
    }
    values.isSimulationParticipant = payload.isSimulationParticipant;
  }
  if (allowPassword && payload.password !== undefined) {
    if (typeof payload.password !== 'string' || payload.password.length < 8 || payload.password.length > 128) {
      throw new AppError('Password must be between 8 and 128 characters.', 400);
    }
    values.password = payload.password;
  }
  return values;
}

export function validateUserCreate(payload = {}) {
  const values = validateFields(payload, { requireNameAndEmail: true, allowPassword: true });
  if (!values.password) throw new AppError('Password is required.', 400);
  return values;
}

export function validateUserUpdate(payload = {}) {
  const values = validateFields(payload, { allowPassword: true });
  if (!Object.keys(values).length) throw new AppError('Provide at least one valid field to update.', 400);
  return values;
}

export function validateStatus(payload = {}) {
  if (typeof payload.isActive !== 'boolean') throw new AppError('isActive must be true or false.', 400);
  return payload.isActive;
}
