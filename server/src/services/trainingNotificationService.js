import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function configuration(env, appPath) {
  const port = Number(env.SMTP_PORT);
  const allowedDomains = (env.SMTP_ALLOWED_RECIPIENT_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_PORT || !allowedDomains.length) {
    return { error: 'SMTP settings and an internal recipient-domain allowlist are required.' };
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: 'SMTP_PORT must be a valid port number.' };
  }

  let appUrl;
  try {
    appUrl = new URL(env.APP_BASE_URL || env.CLIENT_URL || 'http://localhost:5173');
  } catch {
    return { error: 'APP_BASE_URL must be a valid HTTP or HTTPS URL.' };
  }
  if (!['http:', 'https:'].includes(appUrl.protocol)) {
    return { error: 'APP_BASE_URL must be a valid HTTP or HTTPS URL.' };
  }

  return {
    port,
    allowedDomains: new Set(allowedDomains),
    appUrl: new URL(appPath, appUrl).toString(),
    from: env.SMTP_FROM || env.SMTP_USER
  };
}

function recipientDomain(email) {
  if (typeof email !== 'string') return '';
  const parts = email.trim().toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

async function deliverNotifications(recipients, {
  env,
  createTransport,
  appPath,
  messageForRecipient,
  recipientLimit
}) {
  const settings = configuration(env, appPath);
  if (settings.error) {
    return {
      status: env.SMTP_HOST || env.SMTP_USER || env.SMTP_PASS ? 'configuration_error' : 'not_configured',
      sent: 0,
      failed: 0,
      skipped: recipients.length,
      message: settings.error
    };
  }

  if (recipientLimit && recipients.length > recipientLimit) {
    return {
      status: 'recipient_limit_exceeded',
      sent: 0,
      failed: 0,
      skipped: recipients.length,
      message: `Email notices are limited to ${recipientLimit} internal recipients per campaign.`
    };
  }

  const eligibleRecipients = recipients.filter((recipient) => (
    settings.allowedDomains.has(recipientDomain(recipient.email))
  ));
  const skipped = recipients.length - eligibleRecipients.length;
  if (!eligibleRecipients.length) {
    return {
      status: 'no_eligible_recipients',
      sent: 0,
      failed: 0,
      skipped,
      message: 'No recipients matched the configured internal email-domain allowlist.'
    };
  }

  let transporter;
  try {
    transporter = createTransport({
      host: env.SMTP_HOST,
      port: settings.port,
      secure: settings.port === 465,
      requireTLS: settings.port !== 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
    });
  } catch {
    return {
      status: 'configuration_error',
      sent: 0,
      failed: eligibleRecipients.length,
      skipped,
      message: 'Unable to initialize the configured SMTP transport.'
    };
  }

  let sent = 0;
  let failed = 0;
  for (const recipient of eligibleRecipients) {
    try {
      await transporter.sendMail(messageForRecipient(recipient, settings));
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('Training notification email failed.', { code: error.code || 'SMTP_ERROR' });
    }
  }

  return {
    status: failed || skipped ? (sent ? 'partial' : failed ? 'failed' : 'no_eligible_recipients') : 'sent',
    sent,
    failed,
    skipped,
    message: 'Training notification delivery results.'
  };
}

export async function sendTrainingAssignmentNotifications(
  employees,
  trainingModule,
  assignment,
  { env = process.env, createTransport = nodemailer.createTransport } = {}
) {
  return deliverNotifications(employees, {
    env,
    createTransport,
    appPath: '/employee/training',
    messageForRecipient: (employee, settings) => {
      const safeName = escapeHtml(employee.name);
      const safeTitle = escapeHtml(trainingModule.title);
      const availableAt = new Date(assignment.availableAt).toLocaleString();
      const dueText = assignment.dueAt
        ? `<p>Due: ${escapeHtml(new Date(assignment.dueAt).toLocaleString())}</p>`
        : '';
      return {
        from: settings.from,
        to: employee.email,
        subject: `Training assigned: ${trainingModule.title}`,
        text: [
          'Cyber Awareness Platform — Training assignment',
          '',
          `Hello ${employee.name},`,
          '',
          `You have been assigned: ${trainingModule.title}.`,
          `Available: ${availableAt}.`,
          assignment.dueAt ? `Due: ${new Date(assignment.dueAt).toLocaleString()}.` : '',
          '',
          'Sign in to the training platform to review the lesson and complete its quiz:',
          settings.appUrl,
          '',
          'This is a training notification from your organization.'
        ].filter(Boolean).join('\n'),
        html: `<p>Cyber Awareness Platform — Training assignment</p><p>Hello ${safeName},</p><p>You have been assigned: <strong>${safeTitle}</strong>.</p><p>Available: ${escapeHtml(availableAt)}.</p>${dueText}<p><a href="${escapeHtml(settings.appUrl)}">Open the training platform</a> to review the lesson and complete its quiz.</p><p>This is a training notification from your organization.</p>`
      };
    }
  });
}

export async function sendSimulationCampaignNotifications(
  participants,
  campaign,
  { env = process.env, createTransport = nodemailer.createTransport } = {}
) {
  const validParticipants = participants.filter((participant) => (
    participant.role === 'EMPLOYEE'
    && participant.isActive
    && participant.isSimulationParticipant
  ));
  if (validParticipants.length !== participants.length) {
    return {
      status: 'unauthorized_recipients',
      sent: 0,
      failed: 0,
      skipped: participants.length,
      message: 'Email notices were not sent because every recipient must be an active internal simulation participant.'
    };
  }

  return deliverNotifications(validParticipants, {
    env,
    createTransport,
    appPath: '/employee/simulations',
    recipientLimit: 100,
    messageForRecipient: (participant, settings) => {
      const safeName = escapeHtml(participant.name);
      const safeCampaignName = escapeHtml(campaign.name);
      const campaignText = `A controlled awareness exercise, "${campaign.name}", is available in your training platform.`;
      const disclosure = 'This is a transparent training notice, not a phishing email. The platform will never ask for or collect your password.';
      return {
        from: settings.from,
        to: participant.email,
        subject: 'Controlled security-awareness exercise available',
        text: [
          'Cyber Awareness Platform — Controlled training exercise',
          '',
          `Hello ${participant.name},`,
          '',
          campaignText,
          disclosure,
          'Sign in and review the assigned scenario in the Simulations section:',
          settings.appUrl,
          '',
          'This message was sent by your organization for security-awareness training.'
        ].join('\n'),
        html: `<p>Cyber Awareness Platform — Controlled training exercise</p><p>Hello ${safeName},</p><p>A controlled awareness exercise, <strong>${safeCampaignName}</strong>, is available in your training platform.</p><p>${disclosure}</p><p><a href="${escapeHtml(settings.appUrl)}">Sign in and review the assigned scenario</a> in the Simulations section.</p><p>This message was sent by your organization for security-awareness training.</p>`
      };
    }
  });
}
