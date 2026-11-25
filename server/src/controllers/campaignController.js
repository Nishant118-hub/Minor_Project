import PhishingCampaign from '../models/PhishingCampaign.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { getCampaignTemplate, listCampaignTemplates } from '../services/campaignTemplates.js';
import { activateCampaign } from '../services/campaignActivationService.js';
import { validateCampaignCreate, validateCampaignUpdate } from '../validators/campaignValidator.js';

async function validateParticipants(userIds) {
  for (const userId of userIds) requireObjectId(userId, 'Target user id');
  const participants = await User.find({
    _id: { $in: userIds },
    isActive: true,
    isSimulationParticipant: true,
    role: 'EMPLOYEE'
  }).select('_id');
  if (participants.length !== userIds.length) {
    throw new AppError('Every target must be an active, registered internal simulation participant.', 400);
  }
}

function applyTemplate(data) {
  const template = getCampaignTemplate(data.template);
  return {
    ...data,
    category: template.category,
    subject: template.subject,
    senderDisplayName: template.senderDisplayName,
    body: template.body,
    expectedClassification: template.expectedClassification,
    explanation: template.explanation,
    difficulty: data.difficulty || template.difficulty,
    simulationMode: true,
    simulationUrl: ''
  };
}

async function findCampaign(id) {
  const campaign = await PhishingCampaign.findById(requireObjectId(id, 'Campaign id'));
  if (!campaign) throw new AppError('Campaign not found.', 404);
  return campaign;
}

export const listTemplates = (_request, response) => {
  response.json({ success: true, templates: listCampaignTemplates() });
};

export const listCampaigns = asyncHandler(async (_request, response) => {
  const campaigns = await PhishingCampaign.find()
    .populate('createdBy', 'name email')
    .populate('targetUsers', 'name email department')
    .sort({ createdAt: -1 });
  response.json({ success: true, count: campaigns.length, campaigns });
});

export const getCampaign = asyncHandler(async (request, response) => {
  const campaign = await PhishingCampaign.findById(requireObjectId(request.params.id, 'Campaign id'))
    .populate('createdBy', 'name email')
    .populate('targetUsers', 'name email department');
  if (!campaign) throw new AppError('Campaign not found.', 404);
  response.json({ success: true, campaign });
});

export const createCampaign = asyncHandler(async (request, response) => {
  const data = validateCampaignCreate(request.body);
  await validateParticipants(data.targetUsers);
  const campaign = await PhishingCampaign.create({
    ...applyTemplate(data),
    status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
    createdBy: request.user._id
  });
  response.status(201).json({ success: true, campaign });
});

export const updateCampaign = asyncHandler(async (request, response) => {
  const campaign = await findCampaign(request.params.id);
  if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
    throw new AppError('Only draft or scheduled campaigns may be changed.', 409);
  }

  const data = validateCampaignUpdate(request.body);
  if (data.targetUsers) await validateParticipants(data.targetUsers);
  const values = data.template ? applyTemplate(data) : data;
  Object.assign(campaign, values);
  campaign.status = campaign.scheduledAt ? 'SCHEDULED' : 'DRAFT';
  await campaign.save();
  response.json({ success: true, campaign });
});

export const deleteCampaign = asyncHandler(async (request, response) => {
  const campaign = await findCampaign(request.params.id);
  if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
    throw new AppError('Only draft or scheduled campaigns may be deleted.', 409);
  }
  await campaign.deleteOne();
  response.status(204).send();
});

export const testCampaign = asyncHandler(async (request, response) => {
  const campaign = await findCampaign(request.params.id);
  response.json({
    success: true,
    message: 'Template preview generated. No email was sent and no external address was contacted.',
    preview: {
      simulationMode: true,
      template: campaign.template,
      subject: campaign.subject,
      senderDisplayName: campaign.senderDisplayName,
      body: campaign.body
    }
  });
});

export const launchCampaign = asyncHandler(async (request, response) => {
  const campaign = await findCampaign(request.params.id);
  if (campaign.status === 'SCHEDULED' && campaign.scheduledAt > new Date()) {
    throw new AppError('This simulation will activate automatically at its scheduled time.', 409);
  }
  const activatedCampaign = await activateCampaign(campaign);
  if (!activatedCampaign) throw new AppError('This campaign has already been launched or cannot be launched.', 409);
  response.json({
    success: true,
    message: activatedCampaign.emailNotifications.status === 'disabled'
      ? 'Campaign activated as an internal, in-app-only simulation. Email notices are disabled.'
      : 'Campaign activated in-app. Email delivery results are included.',
    emailNotifications: activatedCampaign.emailNotifications,
    campaign: activatedCampaign.campaign
  });
});
