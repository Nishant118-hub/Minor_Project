import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: { type: String, required: true, trim: true, maxlength: 100, index: true },
    resource: { type: String, required: true, trim: true, maxlength: 100, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
    ipAddress: { type: String, trim: true, maxlength: 64, default: '' }
  },
  { timestamps: false }
);

auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
