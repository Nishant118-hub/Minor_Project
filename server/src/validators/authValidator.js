import AppError from '../utils/AppError.js';

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

  if (!emailPattern.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (role !== 'EMPLOYEE') {
    throw new AppError('Account type must be EMPLOYEE.', 400);
  }

  if (password.length > 128) {
    throw new AppError('Password must not exceed 128 characters.', 400);
  }

  return { name, email, password, role };
}

export function validateLogin(payload = {}) {
  const email = requireText(payload.email, 'Email').toLowerCase();
  const password = requireText(payload.password, 'Password');

  if (!emailPattern.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  return { email, password };
}
