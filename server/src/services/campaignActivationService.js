import InteractionLog from '../models/InteractionLog.js';
import PhishingCampaign from '../models/PhishingCampaign.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { sendSimulationCampaignNotifications } from './trainingNotificationService.js';

async function validateParticipants(campaign) {
  const participants = await User.find({
    _id: { $in: campaign.targetUsers },
    isActive: true,
    isSimulationParticipant: true,
    role: 'EMPLOYEE'
  }).select('_id name email role isActive isSimulationParticipant');
  if (participants.length !== campaign.targetUsers.length) {
    throw new AppError('Every target must be an active, registered internal simulation participant.', 400);
  }
  return participants;
}

export async function activateCampaign(campaign) {
  if (!['DRAFT', 'SCHEDULED'].includes(campaign.status) || !campaign.simulationMode) return null;
  const now = new Date();
  if (campaign.status === 'SCHEDULED' && (!campaign.scheduledAt || campaign.scheduledAt > now)) return null;

  const participants = await validateParticipants(campaign);
  if (participants.length) {
    await InteractionLog.bulkWrite(participants.map((participant) => ({
      updateOne: {
        filter: { campaignId: campaign._id, userId: participant._id, eventType: 'SENT' },
        update: {
          $setOnInsert: {
            campaignId: campaign._id,
            userId: participant._id,
            eventType: 'SENT',
            category: campaign.category,
            timestamp: now,
            metadata: { source: 'internal_sandbox_simulation', delivery: 'in_app_only' }
          }
        },
        upsert: true
      }
    })));
  }

  const statusFilter = { _id: campaign._id, status: campaign.status };
  if (campaign.status === 'SCHEDULED') statusFilter.scheduledAt = { $lte: now };
  const activatedCampaign = await PhishingCampaign.findOneAndUpdate(
    statusFilter,
    {
      $set: {
        status: 'ACTIVE',
        sentAt: now,
        'statistics.sent': participants.length
      }
    },
    { new: true }
  );
  if (!activatedCampaign) return null;

  const emailNotifications = activatedCampaign.sendSimulationNotice
    ? await sendSimulationCampaignNotifications(participants, activatedCampaign)
    : {
      status: 'disabled',
      sent: 0,
      failed: 0,
      skipped: participants.length,
      message: 'Email notices are disabled for this campaign.'
    };
  activatedCampaign.emailNotifications = {
    ...emailNotifications,
    attemptedAt: now
  };
  await activatedCampaign.save();
  return { campaign: activatedCampaign, emailNotifications };
}

export async function activateDueCampaigns() {
  const dueCampaigns = await PhishingCampaign.find({
    status: 'SCHEDULED',
    simulationMode: true,
    scheduledAt: { $lte: new Date() }
  });
  for (const campaign of dueCampaigns) {
    const activation = await activateCampaign(campaign);
    if (activation) {
      console.info('Scheduled simulation campaign activated.', {
        campaignId: String(campaign._id),
        emailStatus: activation.emailNotifications.status,
        sent: activation.emailNotifications.sent,
        failed: activation.emailNotifications.failed,
        skipped: activation.emailNotifications.skipped
      });
    }
  }
}
