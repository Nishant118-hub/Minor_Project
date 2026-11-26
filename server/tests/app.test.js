import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import { registrationDefaults, validateAdminInviteCode, validateRegistration } from '../src/validators/authValidator.js';
import { validateInteraction, validateSimulationClassification } from '../src/validators/interactionValidator.js';
import { sendTrainingAssignmentNotifications } from '../src/services/trainingNotificationService.js';
import { sendSimulationCampaignNotifications } from '../src/services/trainingNotificationService.js';
import { validateTrainingAssignment } from '../src/validators/trainingAssignmentValidator.js';
import { validateTrainingCreate } from '../src/validators/trainingValidator.js';
import { validateCampaignCreate } from '../src/validators/campaignValidator.js';

test('health endpoint reports the server status', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { service: 'server', status: 'ok', database: 'unavailable' });
});

test('readiness endpoint reports database availability', async () => {
  const response = await request(app).get('/ready');

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { service: 'server', status: 'not_ready', database: 'unavailable' });
});

test('protected auth endpoint rejects requests without a bearer token', async () => {
  const response = await request(app).get('/api/auth/me');

  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Authentication is required.');
});

test('metaverse overview and analysis require authentication', async () => {
  const overview = await request(app).get('/api/metaverse/overview');
  const analysis = await request(app).post('/api/metaverse/analyze').send({});

  assert.equal(overview.status, 401);
  assert.equal(analysis.status, 401);
});

test('registration accepts employee by default and validates requested account types', () => {
  const employee = validateRegistration({
    name: 'Example User',
    email: 'employee@example.com',
    password: 'a-secure-password'
  });
  assert.equal(employee.role, 'EMPLOYEE');
  assert.deepEqual(registrationDefaults(employee.role), {
    isActive: true,
    isSimulationParticipant: true
  });
  assert.throws(() => validateRegistration({
    name: 'Example User',
    email: 'employee@example.com',
    password: 'a-secure-password',
    role: 'MANAGER'
  }), /Account type must be/);
  assert.throws(() => validateRegistration({
    name: 'Example User',
    email: 'admin@example.com',
    password: 'a-secure-password',
    role: 'ADMIN'
  }), /admin invite code is required/);
});

test('admin registration requires the configured invite code', () => {
  const configuredCode = 'a-private-admin-invite-code-with-at-least-32-characters';
  assert.throws(() => validateAdminInviteCode('wrong', configuredCode), /valid admin invite code/);
  assert.throws(() => validateAdminInviteCode(configuredCode, undefined), /not configured correctly/);
  assert.doesNotThrow(() => validateAdminInviteCode(configuredCode, configuredCode));
});

test('simulation classification accepts only safe answer values', () => {
  assert.equal(validateSimulationClassification({ classification: 'SUSPICIOUS' }), 'SUSPICIOUS');
  assert.equal(validateSimulationClassification({ classification: 'LEGITIMATE' }), 'LEGITIMATE');
  assert.equal(validateSimulationClassification({ classification: 'SUSPICIOUS', password: 'ignored' }), 'SUSPICIOUS');
  assert.throws(() => validateSimulationClassification({ classification: 'CREDENTIAL_SUBMITTED' }), /classification must be/);
});

test('simulation reports record only the report event type', () => {
  assert.deepEqual(validateInteraction({
    eventType: 'REPORTED',
    messageContents: 'discard this value',
    password: 'discard this value'
  }), { eventType: 'REPORTED' });
});

test('resource aliases require authentication', async () => {
  for (const path of [
    '/api/auth/profile',
    '/api/employees',
    '/api/courses',
    '/api/learning/progress',
    '/api/training/assignments',
    '/api/assessments',
    '/api/simulations',
    '/api/analytics/dashboard'
  ]) {
    const response = await request(app).get(path);
    assert.equal(response.status, 401, `${path} should require authentication`);
  }
});

test('only authenticated administrators can create training assignments', async () => {
  const response = await request(app)
    .post('/api/training/assignments')
    .send({});

  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Authentication is required.');
});

test('training assignment dates and target selection are validated', () => {
  const trainingModuleId = '507f1f77bcf86cd799439011';
  assert.throws(() => validateTrainingAssignment({
    trainingModuleId,
    targetType: 'EMPLOYEES',
    targetIds: [],
    availableAt: '2026-11-25T10:00:00.000Z'
  }), /Select at least one target/);

  assert.throws(() => validateTrainingAssignment({
    trainingModuleId,
    targetType: 'ALL',
    targetIds: [],
    availableAt: '2026-11-25T10:00:00.000Z',
    dueAt: '2026-11-24T10:00:00.000Z'
  }), /dueAt must be on or after availableAt/);
});

test('training module creation validates quiz answer and lesson URL fields', () => {
  const module = validateTrainingCreate({
    title: 'Phishing awareness',
    description: 'Learn to verify suspicious messages.',
    category: 'Phishing',
    contentType: 'VIDEO',
    contentUrl: 'https://example.com/lesson',
    duration: 10,
    quiz: [{
      question: 'What should you do?',
      options: ['Verify through a trusted channel', 'Click immediately'],
      correctAnswer: 0
    }]
  });

  assert.equal(module.quiz[0].correctAnswer, 0);
  assert.equal(module.contentUrl, 'https://example.com/lesson');
  assert.throws(() => validateTrainingCreate({
    title: 'Invalid URL lesson',
    description: 'Description',
    category: 'Phishing',
    contentType: 'VIDEO',
    contentUrl: 'javascript:alert(1)',
    duration: 10
  }), /valid HTTP or HTTPS URL/);
});

test('training assignment notices stay disabled until SMTP and an internal domain are configured', async () => {
  let transportCreated = false;
  const result = await sendTrainingAssignmentNotifications(
    [{ name: 'Employee', email: 'person@internal.example' }],
    { title: 'Security basics' },
    { availableAt: new Date(), dueAt: null },
    { env: {}, createTransport: () => { transportCreated = true; } }
  );

  assert.equal(result.status, 'not_configured');
  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 1);
  assert.equal(transportCreated, false);
});

test('training assignment notices send only to explicitly allowed domains', async () => {
  const sentMessages = [];
  const result = await sendTrainingAssignmentNotifications(
    [
      { name: '<Employee>', email: 'person@internal.example' },
      { name: 'External', email: 'person@outside.example' }
    ],
    { title: 'Security basics' },
    { availableAt: new Date('2026-11-25T10:00:00.000Z'), dueAt: null },
    {
      env: {
        SMTP_HOST: 'smtp.internal.example',
        SMTP_PORT: '587',
        SMTP_USER: 'training@internal.example',
        SMTP_PASS: 'test-only',
        SMTP_ALLOWED_RECIPIENT_DOMAINS: 'internal.example',
        APP_BASE_URL: 'https://training.internal.example'
      },
      createTransport: (options) => {
        assert.equal(options.requireTLS, true);
        return { sendMail: async (message) => sentMessages.push(message) };
      }
    }
  );

  assert.equal(result.status, 'partial');
  assert.equal(result.sent, 1);
  assert.equal(result.skipped, 1);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, 'person@internal.example');
  assert.match(sentMessages[0].html, /&lt;Employee&gt;/);
  assert.match(sentMessages[0].text, /Training assignment/);
  assert.match(sentMessages[0].text, /https:\/\/training\.internal\.example\/employee\/training/);
});

test('campaign exercise notices are opt-in and validate recipient and template inputs', () => {
  const campaign = validateCampaignCreate({
    name: 'Quarterly awareness',
    template: 'FAKE_INVOICE',
    targetUsers: ['507f1f77bcf86cd799439011']
  });
  assert.equal(campaign.sendSimulationNotice, false);
  assert.throws(() => validateCampaignCreate({
    name: 'Invalid notice setting',
    template: 'FAKE_INVOICE',
    targetUsers: ['507f1f77bcf86cd799439011'],
    sendSimulationNotice: 'yes'
  }), /sendSimulationNotice must be true or false/);
});

test('campaign email notices are transparent and limited to enrolled allowlisted recipients', async () => {
  const sentMessages = [];
  const result = await sendSimulationCampaignNotifications(
    [
      { name: '<Employee>', email: 'person@internal.example', role: 'EMPLOYEE', isActive: true, isSimulationParticipant: true },
      { name: 'External', email: 'person@outside.example', role: 'EMPLOYEE', isActive: true, isSimulationParticipant: true }
    ],
    { name: 'Awareness exercise' },
    {
      env: {
        SMTP_HOST: 'smtp.internal.example',
        SMTP_PORT: '587',
        SMTP_USER: 'training@internal.example',
        SMTP_PASS: 'test-only',
        SMTP_ALLOWED_RECIPIENT_DOMAINS: 'internal.example',
        APP_BASE_URL: 'https://training.internal.example'
      },
      createTransport: (options) => {
        assert.equal(options.requireTLS, true);
        return { sendMail: async (message) => sentMessages.push(message) };
      }
    }
  );

  assert.equal(result.status, 'partial');
  assert.equal(result.sent, 1);
  assert.equal(result.skipped, 1);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, 'person@internal.example');
  assert.match(sentMessages[0].subject, /Controlled security-awareness exercise/);
  assert.match(sentMessages[0].text, /not a phishing email/);
  assert.match(sentMessages[0].text, /will never ask for or collect your password/);
  assert.match(sentMessages[0].text, /https:\/\/training\.internal\.example\/employee\/simulations/);
  assert.match(sentMessages[0].html, /&lt;Employee&gt;/);
});

test('campaign email notices do not send without SMTP configuration', async () => {
  let transportCreated = false;
  const result = await sendSimulationCampaignNotifications(
    [{ name: 'Employee', email: 'person@internal.example', role: 'EMPLOYEE', isActive: true, isSimulationParticipant: true }],
    { name: 'Awareness exercise' },
    { env: {}, createTransport: () => { transportCreated = true; } }
  );

  assert.equal(result.status, 'not_configured');
  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 1);
  assert.equal(transportCreated, false);
});

test('campaign email notices reject unenrolled recipients and cap delivery batches', async () => {
  const env = {
    SMTP_HOST: 'smtp.internal.example',
    SMTP_PORT: '587',
    SMTP_USER: 'training@internal.example',
    SMTP_PASS: 'test-only',
    SMTP_ALLOWED_RECIPIENT_DOMAINS: 'internal.example'
  };
  let transportCreated = false;
  const unauthorized = await sendSimulationCampaignNotifications(
    [{ name: 'External', email: 'person@internal.example', role: 'EMPLOYEE', isActive: true, isSimulationParticipant: false }],
    { name: 'Awareness exercise' },
    { env, createTransport: () => { transportCreated = true; } }
  );
  assert.equal(unauthorized.status, 'unauthorized_recipients');
  assert.equal(transportCreated, false);

  const recipients = Array.from({ length: 101 }, (_, index) => ({
    name: `Employee ${index}`,
    email: `person${index}@internal.example`,
    role: 'EMPLOYEE',
    isActive: true,
    isSimulationParticipant: true
  }));
  const overLimit = await sendSimulationCampaignNotifications(
    recipients,
    { name: 'Awareness exercise' },
    { env, createTransport: () => { transportCreated = true; } }
  );
  assert.equal(overLimit.status, 'recipient_limit_exceeded');
  assert.equal(overLimit.skipped, 101);
  assert.equal(transportCreated, false);
});
