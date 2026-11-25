import InteractionLog from '../models/InteractionLog.js';
import PhishingCampaign from '../models/PhishingCampaign.js';
import QuizResult from '../models/QuizResult.js';
import TrainingModule from '../models/TrainingModule.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const riskyEvents = new Set(['LINK_CLICKED', 'CREDENTIAL_SUBMITTED']);
const safeRate = (numerator, denominator) => (denominator ? Number((numerator / denominator).toFixed(4)) : 0);

export async function buildEmployeeFeatures(userId) {
  const user = await User.findById(userId).populate('department', 'name');
  if (!user) throw new AppError('User not found.', 404);
  const [logs, quizSummary, totalModules] = await Promise.all([
    InteractionLog.find({ userId }).select('eventType category responseTime classification campaignId'),
    QuizResult.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, averageQuizScore: { $avg: '$score' } } }]),
    TrainingModule.countDocuments({ isActive: true })
  ]);
  const sent = logs.filter((log) => log.eventType === 'SENT');
  const clicked = logs.filter((log) => log.eventType === 'LINK_CLICKED');
  const reported = logs.filter((log) => log.eventType === 'REPORTED');
  const credentialSubmitted = logs.filter((log) => log.eventType === 'CREDENTIAL_SUBMITTED');
  const classifiedLogs = logs.filter((log) => log.eventType === 'CLASSIFIED');
  const campaignIds = [...new Set(classifiedLogs.map((log) => String(log.campaignId)))];
  const campaigns = campaignIds.length
    ? await PhishingCampaign.find({ _id: { $in: campaignIds } }).select('_id category expectedClassification').lean()
    : [];
  const campaignById = new Map(campaigns.map((campaign) => [String(campaign._id), campaign]));
  const responseTimes = logs.map((log) => log.responseTime).filter((value) => typeof value === 'number' && value >= 0);
  const categoryOutcomes = {};
  let correctClassifications = 0;
  let measuredClassifications = 0;
  for (const log of logs) {
    if (riskyEvents.has(log.eventType)) {
      const outcome = categoryOutcomes[log.category] || { clicks: 0, credentialSubmissions: 0, misclassifications: 0 };
      if (log.eventType === 'LINK_CLICKED') outcome.clicks += 1;
      if (log.eventType === 'CREDENTIAL_SUBMITTED') outcome.credentialSubmissions += 1;
      categoryOutcomes[log.category] = outcome;
      continue;
    }

    if (log.eventType !== 'CLASSIFIED') continue;
    const campaign = campaignById.get(String(log.campaignId));
    if (!campaign) continue;
    measuredClassifications += 1;
    if (log.classification === campaign.expectedClassification) {
      correctClassifications += 1;
    } else {
      const outcome = categoryOutcomes[campaign.category] || { clicks: 0, credentialSubmissions: 0, misclassifications: 0 };
      outcome.misclassifications += 1;
      categoryOutcomes[campaign.category] = outcome;
    }
  }
  const completedModules = user.trainingProgress.filter((item) => item.status === 'COMPLETED').length;
  return {
    click_rate: safeRate(clicked.length, sent.length),
    report_rate: safeRate(reported.length, sent.length),
    credential_submission_rate: safeRate(credentialSubmitted.length, sent.length),
    average_response_time: responseTimes.length ? Number((responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length).toFixed(2)) : 0,
    average_quiz_score: quizSummary[0] ? Number(quizSummary[0].averageQuizScore.toFixed(2)) : 0,
    training_completion_rate: safeRate(completedModules, totalModules),
    phishing_attempts: sent.length,
    successful_reports: reported.length,
    simulation_classifications: measuredClassifications,
    simulation_classification_accuracy: safeRate(correctClassifications, measuredClassifications),
    department: user.department?.name || '',
    seniority: user.seniority,
    completed_module_ids: user.trainingProgress
      .filter((item) => item.status === 'COMPLETED')
      .map((item) => String(item.module)),
    category_outcomes: categoryOutcomes,
    weak_areas: Object.keys(categoryOutcomes)
  };
}
