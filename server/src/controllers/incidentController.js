import IncidentReport from '../models/IncidentReport.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';

export const reportIncident = asyncHandler(async (request, response) => {
  const { incidentType, subject, senderOrSource, description, urgencyCues, hasClickedOrInteracted } = request.body;

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    throw new AppError('Subject is required.', 400);
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    throw new AppError('Description is required.', 400);
  }

  const pointsAwarded = 15;
  const incident = await IncidentReport.create({
    reporter: request.user._id,
    department: request.user.department,
    incidentType: incidentType || 'SUSPICIOUS_EMAIL',
    subject: subject.trim(),
    senderOrSource: (senderOrSource || '').trim(),
    description: description.trim(),
    urgencyCues: Boolean(urgencyCues),
    hasClickedOrInteracted: Boolean(hasClickedOrInteracted),
    status: 'NEW',
    severity: hasClickedOrInteracted ? 'HIGH' : 'MEDIUM',
    adminFeedback: 'Thanks for reporting! Our Security Operations Center is investigating. Quick reporting protects the entire organization.',
    pointsAwarded
  });

  // Award gamification points to the vigilant employee
  const user = await User.findById(request.user._id);
  if (user) {
    user.points = (user.points || 0) + pointsAwarded;
    if (user.points >= 150) {
      user.level = 'Guardian';
    } else if (user.points >= 50) {
      user.level = 'Defender';
    }
    await user.save();
  }

  response.status(201).json({
    success: true,
    incident,
    feedback: {
      title: 'Incident Reported Successfully!',
      message: 'Thanks, it was a real threat! You protected the company.',
      pointsAwarded,
      nextStep: hasClickedOrInteracted
        ? 'Since you interacted with the message, immediately follow the Incident Response Checklist steps below.'
        : 'No immediate action required on your device. The SOC team will handle domain blocking.'
    }
  });
});

export const listIncidents = asyncHandler(async (request, response) => {
  const query = {};
  if (request.user.role === 'EMPLOYEE') {
    query.reporter = request.user._id;
  } else if (request.user.role === 'MANAGER' && request.user.department) {
    query.department = request.user.department;
  }

  const incidents = await IncidentReport.find(query)
    .populate('reporter', 'name email department')
    .sort({ createdAt: -1 });

  response.json({
    success: true,
    count: incidents.length,
    incidents
  });
});

export const updateIncidentStatus = asyncHandler(async (request, response) => {
  const id = requireObjectId(request.params.id, 'Incident id');
  const { status, severity, adminFeedback } = request.body;

  const incident = await IncidentReport.findById(id);
  if (!incident) throw new AppError('Incident not found.', 404);

  if (status) incident.status = status;
  if (severity) incident.severity = severity;
  if (adminFeedback) incident.adminFeedback = adminFeedback;

  await incident.save();

  response.json({
    success: true,
    incident
  });
});

export const getIncidentChecklist = (_request, response) => {
  const checklist = [
    {
      step: 1,
      title: 'Disconnect from the Network',
      description: 'Turn off Wi-Fi or unplug your ethernet cable immediately to stop lateral movement or malware exfiltration.',
      urgency: 'IMMEDIATE'
    },
    {
      step: 2,
      title: 'Do NOT Power Off or Delete Messages',
      description: 'Leave the device on without network so memory and audit logs are preserved for the forensic analyst.',
      urgency: 'IMPORTANT'
    },
    {
      step: 3,
      title: 'Change Account Passwords from a Clean Device',
      description: 'Use a secondary, uncompromised device (like your phone) to change your corporate SSO and email passwords.',
      urgency: 'IMPORTANT'
    },
    {
      step: 4,
      title: 'Notify Security Hotline / SOC',
      description: 'Call the internal emergency security hotline (+91-800-SEC-CORP) or alert your team manager.',
      urgency: 'HIGH'
    },
    {
      step: 5,
      title: 'Check Financial & UPI Activity (If Applicable)',
      description: 'If you scanned a UPI QR code or entered payment details, immediately lock the payment app and alert your bank.',
      urgency: 'HIGH'
    }
  ];

  response.json({
    success: true,
    checklist
  });
};
