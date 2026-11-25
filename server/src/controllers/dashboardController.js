import Department from '../models/Department.js';
import PhishingCampaign from '../models/PhishingCampaign.js';
import RiskScore from '../models/RiskScore.js';
import TrainingModule from '../models/TrainingModule.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function toId(value) {
  return value ? String(value) : '';
}

export const getManagerDashboard = asyncHandler(async (request, response) => {
  const departmentId = request.user.department;
  const employees = await User.find({ department: departmentId, role: 'EMPLOYEE' }).select('name isActive trainingProgress');
  const [moduleCount, latestRiskScores, riskTrend] = await Promise.all([
    TrainingModule.countDocuments({ isActive: true }),
    RiskScore.aggregate([
      {
        $match: { userId: { $in: employees.map((employee) => employee._id) } }
      },
      { $sort: { calculatedAt: -1 } },
      { $group: { _id: '$userId', score: { $first: '$score' }, riskTier: { $first: '$riskTier' } } }
    ]),
    RiskScore.aggregate([
      {
        $match: { userId: { $in: employees.map((employee) => employee._id) } }
      },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$calculatedAt' } }, averageScore: { $avg: '$score' } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
      { $sort: { _id: 1 } }
    ])
  ]);

  const activeEmployees = employees.filter((employee) => employee.isActive);
  const latestRiskByUser = new Map(latestRiskScores.map((item) => [toId(item._id), item]));
  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  latestRiskScores.forEach((item) => {
    distribution[item.riskTier] = (distribution[item.riskTier] || 0) + 1;
  });

  const completedAssignments = employees.reduce(
    (total, employee) => total + employee.trainingProgress.filter((item) => item.status === 'COMPLETED').length,
    0
  );
  const trainingCompletion = employees.length && moduleCount
    ? Number(((completedAssignments / (employees.length * moduleCount)) * 100).toFixed(2))
    : 0;

  const teamRisk = employees
    .map((employee) => {
      const latestRisk = latestRiskByUser.get(toId(employee._id));
      return {
        name: employee.name,
        score: latestRisk?.score ?? 0,
        riskTier: latestRisk?.riskTier || 'LOW'
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  response.json({
    success: true,
    metrics: {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      assessedEmployees: latestRiskScores.length,
      highRiskEmployees: distribution.HIGH,
      mediumRiskEmployees: distribution.MEDIUM,
      lowRiskEmployees: distribution.LOW,
      trainingCompletion,
      averageScore: latestRiskScores.length
        ? Number((latestRiskScores.reduce((total, item) => total + item.score, 0) / latestRiskScores.length).toFixed(2))
        : 0
    },
    charts: {
      riskDistribution: Object.entries(distribution).map(([name, value]) => ({ name, value })),
      riskTrend: riskTrend.map((item) => ({ date: item._id, averageScore: Number(item.averageScore.toFixed(2)) })),
      teamRisk
    }
  });
});

export const getAdminDashboard = asyncHandler(async (_request, response) => {
  const [employees, departments, moduleCount, campaigns, latestRiskScores, riskTrend] = await Promise.all([
    User.find({ role: 'EMPLOYEE' }).select('department isActive trainingProgress'),
    Department.find().select('name'),
    TrainingModule.countDocuments({ isActive: true }),
    PhishingCampaign.find().select('name sentAt status statistics').sort({ sentAt: -1 }),
    RiskScore.aggregate([
      { $sort: { calculatedAt: -1 } },
      { $group: { _id: '$userId', score: { $first: '$score' }, riskTier: { $first: '$riskTier' } } }
    ]),
    RiskScore.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$calculatedAt' } }, averageScore: { $avg: '$score' } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
      { $sort: { _id: 1 } }
    ])
  ]);

  const activeEmployees = employees.filter((employee) => employee.isActive);
  const latestRiskByUser = new Map(latestRiskScores.map((item) => [toId(item._id), item]));
  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  latestRiskScores.forEach((item) => { distribution[item.riskTier] = (distribution[item.riskTier] || 0) + 1; });
  const completedAssignments = employees.reduce(
    (total, employee) => total + employee.trainingProgress.filter((item) => item.status === 'COMPLETED').length,
    0
  );
  const trainingCompletion = employees.length && moduleCount
    ? Number(((completedAssignments / (employees.length * moduleCount)) * 100).toFixed(2))
    : 0;

  const departmentComparison = departments.map((department) => {
    const departmentEmployees = employees.filter((employee) => toId(employee.department) === toId(department._id));
    const assessedScores = departmentEmployees.map((employee) => latestRiskByUser.get(toId(employee._id))?.score).filter(Number.isFinite);
    return {
      department: department.name,
      employees: departmentEmployees.length,
      averageRisk: assessedScores.length ? Number((assessedScores.reduce((sum, score) => sum + score, 0) / assessedScores.length).toFixed(2)) : 0
    };
  });
  const campaignPerformance = campaigns
    .filter((campaign) => campaign.statistics.sent > 0)
    .slice(0, 8)
    .reverse()
    .map((campaign) => ({
      campaign: campaign.name,
      clickRate: campaign.statistics.clickRate,
      reportRate: campaign.statistics.reportRate,
      sentAt: campaign.sentAt
    }));

  response.json({
    success: true,
    metrics: {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      assessedEmployees: latestRiskScores.length,
      highRiskEmployees: distribution.HIGH,
      mediumRiskEmployees: distribution.MEDIUM,
      lowRiskEmployees: distribution.LOW,
      trainingCompletion,
      campaigns: campaigns.length,
      averageClickRate: campaigns.length ? Number((campaigns.reduce((sum, item) => sum + item.statistics.clickRate, 0) / campaigns.length).toFixed(2)) : 0,
      averageReportRate: campaigns.length ? Number((campaigns.reduce((sum, item) => sum + item.statistics.reportRate, 0) / campaigns.length).toFixed(2)) : 0
    },
    charts: {
      riskDistribution: Object.entries(distribution).map(([name, value]) => ({ name, value })),
      departmentComparison,
      campaignPerformance,
      trainingCompletion: [
        { name: 'Completed', value: trainingCompletion },
        { name: 'Remaining', value: Number((100 - trainingCompletion).toFixed(2)) }
      ],
      riskTrend: riskTrend.map((item) => ({ date: item._id, averageScore: Number(item.averageScore.toFixed(2)) }))
    }
  });
});
