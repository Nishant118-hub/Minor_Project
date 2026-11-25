import mongoose from 'mongoose';

const interactionLogSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhishingCampaign', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: { type: String, enum: ['SENT', 'OPENED', 'LINK_CLICKED', 'CREDENTIAL_SUBMITTED', 'REPORTED', 'CLASSIFIED'], required: true, index: true },
    classification: { type: String, enum: ['SUSPICIOUS', 'LEGITIMATE'], default: null },
    category: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    responseTime: { type: Number, min: 0, default: null },
    // Credential values are deliberately not represented in this schema.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: false }
);

interactionLogSchema.index({ campaignId: 1, userId: 1, eventType: 1, timestamp: -1 });
interactionLogSchema.index({ userId: 1, timestamp: -1 });
interactionLogSchema.index({ campaignId: 1, userId: 1, eventType: 1 }, { unique: true });

export default mongoose.model('InteractionLog', interactionLogSchema);
