const templates = {
  FAKE_INVOICE: {
    category: 'fake_invoice',
    senderDisplayName: 'Accounts Payable Training',
    subject: 'Training simulation: invoice review required',
    body: 'This is a controlled security-awareness simulation. Review the simulated invoice notification and decide whether to report it.',
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Unexpected invoice requests should be verified in the official procurement system. Do not follow message links or open attachments.',
    difficulty: 'BEGINNER'
  },
  URGENT_CEO_REQUEST: {
    category: 'urgent_ceo_request',
    senderDisplayName: 'Executive Request Training',
    subject: 'Training simulation: urgent executive request',
    body: 'This is a controlled security-awareness simulation. Assess the urgency cues and use the report option if appropriate.',
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Urgency and pressure to bypass normal approval are warning signs. Confirm executive requests through a known, separate channel.',
    difficulty: 'INTERMEDIATE'
  },
  PASSWORD_RESET: {
    category: 'password_reset',
    senderDisplayName: 'Account Security Training',
    subject: 'Training simulation: password reset notice',
    body: 'This is a controlled security-awareness simulation. No password is requested or retained by this platform.',
    expectedClassification: 'SUSPICIOUS',
    explanation: "Unexpected reset notices should be checked by navigating to the organization's known account portal, not by using a message link.",
    difficulty: 'BEGINNER'
  },
  DELIVERY_NOTIFICATION: {
    category: 'delivery_notification',
    senderDisplayName: 'Delivery Alert Training',
    subject: 'Training simulation: package delivery notice',
    body: 'This is a controlled security-awareness simulation. Verify the context before interacting with a simulated delivery notice.',
    expectedClassification: 'LEGITIMATE',
    explanation: 'This routine delivery update does not request credentials, payment, or urgent action. Check expected notices through your usual delivery channel.',
    difficulty: 'INTERMEDIATE'
  },
  ACCOUNT_VERIFICATION: {
    category: 'credential_harvest',
    senderDisplayName: 'Account Verification Training',
    subject: 'Training simulation: account verification alert',
    body: 'This is a controlled security-awareness simulation. Never enter real credentials; simulated credential input is discarded.',
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Unexpected account-verification requests are suspicious. Never enter credentials from a message prompt; report it and verify independently.',
    difficulty: 'ADVANCED'
  }
};

export const templateNames = Object.keys(templates);

export function getCampaignTemplate(templateName) {
  return templates[templateName] || null;
}

export function listCampaignTemplates() {
  return Object.entries(templates).map(([key, value]) => ({ template: key, ...value }));
}
