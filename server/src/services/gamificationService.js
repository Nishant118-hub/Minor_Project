import Badge from '../models/Badge.js';

async function getOrCreateBadge(name, description, icon, criteria, points) {
  return Badge.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, description, icon, criteria, points } },
    { new: true, upsert: true }
  );
}

export async function awardQuizCompletion(user, { firstCompletion, perfectScore }) {
  const earnedBadges = [];
  if (firstCompletion) {
    user.points += 10;
    const badge = await getOrCreateBadge('First Training Completed', 'Completed a first security-awareness training module.', 'shield-check', { completedModules: 1 }, 10);
    if (!user.badges.some((id) => String(id) === String(badge._id))) {
      user.badges.push(badge._id);
      earnedBadges.push(badge.name);
    }
  }
  if (perfectScore) {
    const badge = await getOrCreateBadge('Quiz Master', 'Achieved a perfect score on a training quiz.', 'award', { quizScore: 100 }, 15);
    if (!user.badges.some((id) => String(id) === String(badge._id))) {
      user.badges.push(badge._id);
      user.points += 15;
      earnedBadges.push(badge.name);
    }
  }
  return earnedBadges;
}
