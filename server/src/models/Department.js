import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    employeeCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

departmentSchema.index({ manager: 1 });

export default mongoose.model('Department', departmentSchema);
