import mongoose from 'mongoose';

const riskScoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    riskTier: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true, index: true },
    features: {
      clickRate: { type: Number, default: 0, min: 0, max: 1 },
      reportRate: { type: Number, default: 0, min: 0, max: 1 },
      credentialSubmissionRate: { type: Number, default: 0, min: 0, max: 1 },
      averageResponseTime: { type: Number, default: 0, min: 0 },
      averageQuizScore: { type: Number, default: 0, min: 0, max: 100 },
      trainingCompletionRate: { type: Number, default: 0, min: 0, max: 1 },
      phishingAttempts: { type: Number, default: 0, min: 0 },
      successfulReports: { type: Number, default: 0, min: 0 },
      simulationClassifications: { type: Number, default: 0, min: 0 },
      simulationClassificationAccuracy: { type: Number, default: 0, min: 0, max: 1 },
      department: { type: String, default: '' },
      seniority: { type: String, default: '' }
    },
    weakAreas: [{ type: String, trim: true }],
    recommendations: [{ type: mongoose.Schema.Types.Mixed }],
    calculatedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

riskScoreSchema.index({ userId: 1, calculatedAt: -1 });

export default mongoose.model('RiskScore', riskScoreSchema);
