import api from './api';

export async function getAdminDashboard() {
  const { data } = await api.get('/dashboard/admin');
  return data;
}

export async function getManagerDashboard() {
  const { data } = await api.get('/dashboard/manager');
  return data;
}

export async function getManagerTeam() {
  const { data } = await api.get('/users');
  return data.users;
}

export async function getEmployeeDashboard() {
  const { data: user } = await api.get('/auth/me');
  const currentUser = user.user;
  const [riskResponse, recommendationsResponse] = await Promise.all([
    api.get(`/risk/${currentUser.id}`),
    api.get(`/recommendations/${currentUser.id}`)
  ]);

  const riskScore = riskResponse.data.riskScore || {};
  const recommendations = recommendationsResponse.data.recommendations || [];
  const completedModules = (currentUser.trainingProgress || []).filter((item) => item.status === 'COMPLETED').length;
  const progressValues = (currentUser.trainingProgress || []).map((item) => Number(item.progressPercent || 0));

  return {
    riskTier: riskScore.riskTier || 'LOW',
    score: riskScore.score || 0,
    trainingProgress: progressValues.length ? Math.round(progressValues.reduce((total, value) => total + value, 0) / progressValues.length) : 0,
    recommendations,
    completedModules,
    averageQuizScore: riskScore.features?.averageQuizScore || 0,
    reportRate: Math.round((riskScore.features?.reportRate || 0) * 100)
  };
}

export async function getCampaignTemplates() {
  const { data } = await api.get('/campaigns/templates');
  return data.templates || [];
}

export async function getCampaigns() {
  const { data } = await api.get('/campaigns');
  return data.campaigns || [];
}

export async function getAllParticipants() {
  const { data } = await api.get('/users');
  return (data.users || []).filter((userItem) => userItem.role === 'EMPLOYEE' && userItem.isActive && userItem.isSimulationParticipant);
}

export async function getUsers() {
  const { data } = await api.get('/users');
  return data.users || [];
}

export async function getDepartments() {
  const { data } = await api.get('/departments');
  return data.departments || [];
}
