import mongoose from 'mongoose';

const trainingAssignmentSchema = new mongoose.Schema(
  {
    trainingModule: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    availableAt: { type: Date, required: true },
    dueAt: { type: Date, default: null }
  },
  { timestamps: true }
);

trainingAssignmentSchema.index({ trainingModule: 1, employee: 1, availableAt: 1 }, { unique: true });
trainingAssignmentSchema.index({ employee: 1, availableAt: 1, dueAt: 1 });

export default mongoose.model('TrainingAssignment', trainingAssignmentSchema);
