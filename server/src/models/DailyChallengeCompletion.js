import mongoose from 'mongoose';

const dailyChallengeCompletionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dateString: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    challengeId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 }
  },
  { timestamps: true }
);

dailyChallengeCompletionSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export default mongoose.model('DailyChallengeCompletion', dailyChallengeCompletionSchema);
