import InteractionLog from '../models/InteractionLog.js';
import PhishingCampaign from '../models/PhishingCampaign.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireObjectId } from '../utils/objectId.js';
import { validateInteraction, validateSimulationClassification } from '../validators/interactionValidator.js';

async function updateCampaignStatistics(campaign) {
  const summary = await InteractionLog.aggregate([
    { $match: { campaignId: campaign._id } },
    { $group: { _id: '$eventType', count: { $sum: 1 }, averageResponseTime: { $avg: '$responseTime' } } }
  ]);
  const metric = Object.fromEntries(summary.map((item) => [item._id, item]));
  const sent = metric.SENT?.count || 0;
  const opened = metric.OPENED?.count || 0;
  const clicked = metric.LINK_CLICKED?.count || 0;
  const credentialSubmitted = metric.CREDENTIAL_SUBMITTED?.count || 0;
  const reported = metric.REPORTED?.count || 0;
  const classified = await InteractionLog.countDocuments({ campaignId: campaign._id, eventType: 'CLASSIFIED' });
  const correctlyClassified = await InteractionLog.countDocuments({
    campaignId: campaign._id,
    eventType: 'CLASSIFIED',
    classification: campaign.expectedClassification
  });
  const values = summary.map((item) => item.averageResponseTime).filter((value) => typeof value === 'number');
  campaign.statistics = {
    sent, opened, clicked, credentialSubmitted, reported, classified, correctlyClassified,
    classificationAccuracy: classified ? Number(((correctlyClassified / classified) * 100).toFixed(2)) : 0,
    clickRate: sent ? Number(((clicked / sent) * 100).toFixed(2)) : 0,
    reportRate: sent ? Number(((reported / sent) * 100).toFixed(2)) : 0,
    credentialSubmissionRate: sent ? Number(((credentialSubmitted / sent) * 100).toFixed(2)) : 0,
    averageResponseTime: values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0
  };
  await campaign.save();
}

async function managerUserIds(manager) {
  const employees = await User.find({ department: manager.department, role: 'EMPLOYEE' }).select('_id');
  return employees.map((employee) => employee._id);
}

export const recordInteraction = asyncHandler(async (request, response) => {
  const campaignId = requireObjectId(request.body?.campaignId, 'Campaign id');
  const { eventType } = validateInteraction(request.body);
  const campaign = await PhishingCampaign.findById(campaignId);
  if (!campaign || campaign.status !== 'ACTIVE' || !campaign.simulationMode) throw new AppError('This controlled simulation is not active.', 409);
  if (!campaign.targetUsers.some((id) => String(id) === String(request.user._id))) throw new AppError('You are not an authorized participant in this simulation.', 403);
  if (await InteractionLog.exists({ campaignId, userId: request.user._id, eventType })) throw new AppError('This simulation interaction has already been recorded.', 409);

  const timestamp = new Date();
  const responseTime = campaign.sentAt ? Math.max(0, Math.round((timestamp - campaign.sentAt) / 1000)) : null;
  const interaction = await InteractionLog.create({
    campaignId, userId: request.user._id, eventType, category: campaign.category, timestamp, responseTime,
    metadata: eventType === 'CREDENTIAL_SUBMITTED'
      ? { credentialSubmitted: true, credentialValueDiscarded: true }
      : { source: 'authorized_in_app_simulation' }
  });
  await updateCampaignStatistics(campaign);
  response.status(201).json({ success: true, interaction: { id: interaction.id, campaignId: interaction.campaignId, eventType: interaction.eventType, timestamp: interaction.timestamp, responseTime: interaction.responseTime } });
});

export const listAvailableSimulations = asyncHandler(async (request, response) => {
  const campaigns = await PhishingCampaign.find({
    status: 'ACTIVE',
    simulationMode: true,
    targetUsers: request.user._id
  }).sort({ sentAt: -1 });
  const campaignIds = campaigns.map((campaign) => campaign._id);
  const responses = await InteractionLog.find({
    campaignId: { $in: campaignIds },
    userId: request.user._id,
    eventType: 'CLASSIFIED'
  }).select('campaignId classification');
  const responseByCampaign = new Map(responses.map((item) => [String(item.campaignId), item.classification]));

  response.json({
    success: true,
    simulations: campaigns.map((campaign) => {
      const classification = responseByCampaign.get(String(campaign._id)) || null;
      return {
        id: campaign.id,
        name: campaign.name,
        category: campaign.category,
        subject: campaign.subject,
        senderDisplayName: campaign.senderDisplayName,
        body: campaign.body,
        sentAt: campaign.sentAt,
        classification,
        isCorrect: classification ? classification === campaign.expectedClassification : null,
        explanation: classification ? campaign.explanation : null
      };
    })
  });
});

export const classifySimulation = asyncHandler(async (request, response) => {
  const campaignId = requireObjectId(request.params.campaignId, 'Campaign id');
  const classification = validateSimulationClassification(request.body);
  const campaign = await PhishingCampaign.findOne({
    _id: campaignId,
    status: 'ACTIVE',
    simulationMode: true,
    targetUsers: request.user._id
  });
  if (!campaign) throw new AppError('This controlled simulation is not available to your account.', 404);
  if (await InteractionLog.exists({ campaignId, userId: request.user._id, eventType: 'CLASSIFIED' })) {
    throw new AppError('You have already classified this simulation.', 409);
  }

  const timestamp = new Date();
  const responseTime = campaign.sentAt ? Math.max(0, Math.round((timestamp - campaign.sentAt) / 1000)) : null;
  await InteractionLog.create({
    campaignId,
    userId: request.user._id,
    eventType: 'CLASSIFIED',
    classification,
    category: campaign.category,
    timestamp,
    responseTime,
    metadata: { source: 'authorized_in_app_simulation' }
  });
  await updateCampaignStatistics(campaign);
  response.status(201).json({
    success: true,
    result: {
      classification,
      isCorrect: classification === campaign.expectedClassification,
      expectedClassification: campaign.expectedClassification,
      explanation: campaign.explanation
    }
  });
});

export const listInteractions = asyncHandler(async (request, response) => {
  const filter = {};
  if (request.user.role === 'EMPLOYEE') filter.userId = request.user._id;
  if (request.user.role === 'MANAGER') filter.userId = { $in: await managerUserIds(request.user) };
  const interactions = await InteractionLog.find(filter).populate('userId', 'name email department').populate('campaignId', 'name category').sort({ timestamp: -1 });
  response.json({ success: true, count: interactions.length, interactions });
});

export const getUserInteractions = asyncHandler(async (request, response) => {
  const userId = requireObjectId(request.params.userId, 'User id');
  if (request.user.role === 'EMPLOYEE' && String(request.user._id) !== String(userId)) throw new AppError('You can view only your own interactions.', 403);
  if (request.user.role === 'MANAGER') {
    const employee = await User.findById(userId);
    if (!employee || employee.role !== 'EMPLOYEE' || String(employee.department) !== String(request.user.department)) throw new AppError('You can view only employees in your assigned department.', 403);
  }
  const interactions = await InteractionLog.find({ userId }).populate('campaignId', 'name category').sort({ timestamp: -1 });
  response.json({ success: true, count: interactions.length, interactions });
});

export const getCampaignInteractions = asyncHandler(async (request, response) => {
  const campaignId = requireObjectId(request.params.campaignId, 'Campaign id');
  const filter = { campaignId };
  if (request.user.role === 'EMPLOYEE') filter.userId = request.user._id;
  if (request.user.role === 'MANAGER') filter.userId = { $in: await managerUserIds(request.user) };
  const interactions = await InteractionLog.find(filter).populate('userId', 'name email department').sort({ timestamp: -1 });
  response.json({ success: true, count: interactions.length, interactions });
});
