import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trainingModuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule', required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    totalQuestions: { type: Number, required: true, min: 1 },
    correctAnswers: { type: Number, required: true, min: 0 },
    difficulty: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], required: true },
    completedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

quizResultSchema.index({ userId: 1, trainingModuleId: 1, completedAt: -1 });

export default mongoose.model('QuizResult', quizResultSchema);
