import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    options: [{ type: String, required: true, trim: true, maxlength: 250 }],
    correctAnswer: { type: Number, required: true, min: 0 },
    explanation: { type: String, trim: true, maxlength: 1000, default: '' }
  },
  { _id: false }
);

const trainingModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER', index: true },
    contentType: { type: String, enum: ['ARTICLE', 'VIDEO', 'INTERACTIVE'], required: true },
    contentUrl: { type: String, trim: true, default: '' },
    duration: { type: Number, required: true, min: 1 },
    quiz: { type: [questionSchema], default: [] },
    tags: [{ type: String, trim: true, lowercase: true }],
    passingScore: { type: Number, min: 0, max: 100, default: 70 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

trainingModuleSchema.index({ category: 1, difficulty: 1, isActive: 1 });

export default mongoose.model('TrainingModule', trainingModuleSchema);
