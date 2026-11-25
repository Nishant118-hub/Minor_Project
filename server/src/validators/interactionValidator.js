import AppError from '../utils/AppError.js';

const events = ['OPENED', 'LINK_CLICKED', 'CREDENTIAL_SUBMITTED', 'REPORTED'];
const classifications = ['SUSPICIOUS', 'LEGITIMATE'];

export function validateInteraction(payload = {}) {
  if (!events.includes(payload.eventType)) {
    throw new AppError('eventType must be OPENED, LINK_CLICKED, CREDENTIAL_SUBMITTED, or REPORTED.', 400);
  }
  if (payload.eventType === 'CREDENTIAL_SUBMITTED' && payload.credentialSubmitted !== true) {
    throw new AppError('credentialSubmitted must be true for a simulated credential submission event.', 400);
  }
  // Credential-like input is intentionally excluded from the returned object.
  return { eventType: payload.eventType };
}

export function validateSimulationClassification(payload = {}) {
  if (!classifications.includes(payload.classification)) {
    throw new AppError('classification must be SUSPICIOUS or LEGITIMATE.', 400);
  }
  return payload.classification;
}
