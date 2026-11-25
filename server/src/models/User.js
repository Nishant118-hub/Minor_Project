import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const trainingProgressSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule', required: true },
    status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], default: 'NOT_STARTED' },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    completedAt: { type: Date, default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    designation: { type: String, trim: true, maxlength: 100, default: '' },
    seniority: { type: String, enum: ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'], default: 'JUNIOR' },
    isActive: { type: Boolean, default: true, index: true },
    // Explicit consent gate for the internal training simulation program.
    isSimulationParticipant: { type: Boolean, default: false, index: true },
    trainingProgress: { type: [trainingProgressSchema], default: [] },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    points: { type: Number, default: 0, min: 0 },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ department: 1, role: 1, isActive: 1 });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
