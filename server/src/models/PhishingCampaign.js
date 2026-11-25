import mongoose from 'mongoose';

const statisticsSchema = new mongoose.Schema(
  {
    sent: { type: Number, default: 0, min: 0 },
    opened: { type: Number, default: 0, min: 0 },
    clicked: { type: Number, default: 0, min: 0 },
    credentialSubmitted: { type: Number, default: 0, min: 0 },
    reported: { type: Number, default: 0, min: 0 },
    classified: { type: Number, default: 0, min: 0 },
    correctlyClassified: { type: Number, default: 0, min: 0 },
    classificationAccuracy: { type: Number, default: 0, min: 0, max: 100 },
    clickRate: { type: Number, default: 0, min: 0, max: 100 },
    reportRate: { type: Number, default: 0, min: 0, max: 100 },
    credentialSubmissionRate: { type: Number, default: 0, min: 0, max: 100 },
    averageResponseTime: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const emailNotificationsSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'disabled',
        'not_configured',
        'configuration_error',
        'no_eligible_recipients',
        'recipient_limit_exceeded',
        'unauthorized_recipients',
        'sent',
        'partial',
        'failed'
      ],
      default: 'disabled'
    },
    sent: { type: Number, default: 0, min: 0 },
    failed: { type: Number, default: 0, min: 0 },
    skipped: { type: Number, default: 0, min: 0 },
    attemptedAt: { type: Date, default: null }
  },
  { _id: false }
);

const phishingCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: {
      type: String,
      enum: ['credential_harvest', 'urgent_ceo_request', 'fake_invoice', 'password_reset', 'delivery_notification', 'general_phishing'],
      required: true,
      index: true
    },
    template: { type: String, required: true, enum: ['FAKE_INVOICE', 'URGENT_CEO_REQUEST', 'PASSWORD_RESET', 'DELIVERY_NOTIFICATION', 'ACCOUNT_VERIFICATION'] },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    senderDisplayName: { type: String, required: true, trim: true, maxlength: 100 },
    body: { type: String, required: true, maxlength: 10000 },
    expectedClassification: { type: String, enum: ['SUSPICIOUS', 'LEGITIMATE'], default: 'SUSPICIOUS' },
    explanation: { type: String, trim: true, maxlength: 1000, default: '' },
    difficulty: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
    simulationMode: { type: Boolean, required: true, default: true, immutable: true },
    sendSimulationNotice: { type: Boolean, default: false },
    emailNotifications: { type: emailNotificationsSchema, default: () => ({}) },
    simulationUrl: { type: String, trim: true, default: '' },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'DRAFT', index: true },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    statistics: { type: statisticsSchema, default: () => ({}) }
  },
  { timestamps: true }
);

phishingCampaignSchema.index({ status: 1, scheduledAt: 1 });
phishingCampaignSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('PhishingCampaign', phishingCampaignSchema);
