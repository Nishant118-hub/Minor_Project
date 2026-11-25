import AppError from '../utils/AppError.js';

function text(value, field, required, maxLength) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new AppError(`${field} must be a non-empty string up to ${maxLength} characters.`, 400);
  }
  return value.trim();
}

export function validateDepartmentCreate(payload = {}) {
  const name = text(payload.name, 'Name', true, 100);
  const description = payload.description === undefined ? '' : text(payload.description, 'Description', false, 500);
  return { name, description, manager: payload.manager || null };
}

export function validateDepartmentUpdate(payload = {}) {
  const values = {};
  if (payload.name !== undefined) values.name = text(payload.name, 'Name', false, 100);
  if (payload.description !== undefined) values.description = text(payload.description, 'Description', false, 500);
  if (payload.manager !== undefined) values.manager = payload.manager || null;
  if (!Object.keys(values).length) throw new AppError('Provide at least one valid field to update.', 400);
  return values;
}
