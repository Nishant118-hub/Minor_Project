import AppError from '../utils/AppError.js';
import { templateNames } from '../services/campaignTemplates.js';

const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

function text(value, field, required, maxLength) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new AppError(`${field} must be a non-empty string up to ${maxLength} characters.`, 400);
  }
  return value.trim();
}

function validateTargets(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1000) {
    throw new AppError('targetUsers must contain between 1 and 1000 registered simulation participants.', 400);
  }
  const uniqueTargets = [...new Set(value.map(String))];
  if (uniqueTargets.length !== value.length) throw new AppError('targetUsers must not contain duplicate users.', 400);
  return uniqueTargets;
}

function validateTemplate(value) {
  if (!templateNames.includes(value)) throw new AppError('Select a valid predefined simulation template.', 400);
  return value;
}

function validateScheduledAt(value) {
  if (value === undefined || value === null || value === '') return null;
  const scheduledAt = new Date(value);
  if (Number.isNaN(scheduledAt.getTime())) throw new AppError('scheduledAt must be a valid date.', 400);
  return scheduledAt;
}

export function validateCampaignCreate(payload = {}) {
  if (payload.difficulty !== undefined && !difficulties.includes(payload.difficulty)) {
    throw new AppError('Difficulty is invalid.', 400);
  }
  if (payload.sendSimulationNotice !== undefined && typeof payload.sendSimulationNotice !== 'boolean') {
    throw new AppError('sendSimulationNotice must be true or false.', 400);
  }
  return {
    name: text(payload.name, 'Name', true, 150),
    description: payload.description === undefined ? '' : text(payload.description, 'Description', false, 1000),
    template: validateTemplate(payload.template),
    targetUsers: validateTargets(payload.targetUsers),
    sendSimulationNotice: payload.sendSimulationNotice === true,
    difficulty: payload.difficulty,
    scheduledAt: validateScheduledAt(payload.scheduledAt)
  };
}

export function validateCampaignUpdate(payload = {}) {
  const data = {};
  if (payload.name !== undefined) data.name = text(payload.name, 'Name', false, 150);
  if (payload.description !== undefined) data.description = text(payload.description, 'Description', false, 1000);
  if (payload.template !== undefined) data.template = validateTemplate(payload.template);
  if (payload.targetUsers !== undefined) data.targetUsers = validateTargets(payload.targetUsers);
  if (payload.sendSimulationNotice !== undefined) {
    if (typeof payload.sendSimulationNotice !== 'boolean') {
      throw new AppError('sendSimulationNotice must be true or false.', 400);
    }
    data.sendSimulationNotice = payload.sendSimulationNotice;
  }
  if (payload.difficulty !== undefined) {
    if (!difficulties.includes(payload.difficulty)) throw new AppError('Difficulty is invalid.', 400);
    data.difficulty = payload.difficulty;
  }
  if (payload.scheduledAt !== undefined) data.scheduledAt = validateScheduledAt(payload.scheduledAt);
  if (!Object.keys(data).length) throw new AppError('Provide at least one valid campaign field to update.', 400);
  return data;
}
