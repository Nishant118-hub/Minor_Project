import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    icon: { type: String, trim: true, default: 'shield' },
    criteria: { type: mongoose.Schema.Types.Mixed, required: true },
    points: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Badge', badgeSchema);
