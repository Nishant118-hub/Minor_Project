import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    incidentType: {
      type: String,
      enum: ['SUSPICIOUS_EMAIL', 'SMISHING_SMS', 'VISHING_CALL', 'UPI_FRAUD', 'QR_CODE_PHISH', 'LOST_DEVICE', 'CREDENTIAL_LEAK', 'OTHER'],
      default: 'SUSPICIOUS_EMAIL',
      required: true
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    senderOrSource: { type: String, trim: true, maxlength: 200, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    urgencyCues: { type: Boolean, default: false },
    hasClickedOrInteracted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['NEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
      default: 'NEW',
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    adminFeedback: {
      type: String,
      default: 'Thanks! Your prompt report has been logged with the Security Operations Center. Real-time reporting reduces corporate risk significantly.'
    },
    pointsAwarded: { type: Number, default: 15 }
  },
  { timestamps: true }
);

incidentReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('IncidentReport', incidentReportSchema);
