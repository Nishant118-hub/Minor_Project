import RiskScore from '../models/RiskScore.js';
import TrainingModule from '../models/TrainingModule.js';
import InteractionLog from '../models/InteractionLog.js';
import User from '../models/User.js';

export async function getAdaptiveLearningPath(userId) {
  const [user, latestRisk, modules, interactions] = await Promise.all([
    User.findById(userId).populate('trainingProgress.module'),
    RiskScore.findOne({ userId }).sort({ calculatedAt: -1 }),
    TrainingModule.find({ isActive: true }).select('title description category difficulty duration passingScore'),
    InteractionLog.find({ userId }).sort({ timestamp: -1 })
  ]);

  const riskTier = latestRisk?.riskTier || 'LOW';
  const riskScore = latestRisk?.score ?? 20;
  const weakAreas = latestRisk?.weakAreas || [];

  // Generate explainable contributing factors
  const contributingFactors = [];

  const clickedCount = interactions.filter((i) => i.eventType === 'LINK_CLICKED').length;
  const reportedCount = interactions.filter((i) => i.eventType === 'REPORTED').length;
  const credentialSubmitted = interactions.filter((i) => i.eventType === 'CREDENTIAL_SUBMITTED').length;
  const classificationMisses = interactions.filter((i) => i.eventType === 'CLASSIFIED' && i.classification === 'LEGITIMATE' && i.category !== 'delivery_notification').length;

  if (credentialSubmitted > 0) {
    contributingFactors.push({
      impact: 'HIGH_RISK',
      pointsDelta: '+35 pts',
      factor: 'Simulated Credential Submission',
      description: 'You submitted credentials in a controlled phishing simulation, demonstrating vulnerability to credential harvesting.'
    });
  }

  if (clickedCount > 0) {
    contributingFactors.push({
      impact: 'MODERATE_RISK',
      pointsDelta: `+${clickedCount * 15} pts`,
      factor: 'Unverified Link Clicked',
      description: `Clicked on ${clickedCount} unverified simulation link(s) before performing out-of-band validation.`
    });
  }

  if (classificationMisses > 0) {
    contributingFactors.push({
      impact: 'MODERATE_RISK',
      pointsDelta: `+${classificationMisses * 10} pts`,
      factor: 'Deceptive Message Classified as Legitimate',
      description: 'Marked malicious simulation messages as "Legitimate" during in-app awareness exercises.'
    });
  }

  if (reportedCount > 0) {
    contributingFactors.push({
      impact: 'PROTECTIVE',
      pointsDelta: `-${reportedCount * 12} pts`,
      factor: 'Proactive Phishing Reporting',
      description: `Safely reported ${reportedCount} suspicious communication(s), shielding organizational peers.`
    });
  }

  if (contributingFactors.length === 0) {
    contributingFactors.push({
      impact: 'NEUTRAL',
      pointsDelta: '0 pts',
      factor: 'Baseline Profile Established',
      description: 'Your risk score reflects your current training completion and introductory simulation results.'
    });
  }

  // Prioritize modules adaptively based on weak areas
  const completedModuleIds = new Set(
    (user?.trainingProgress || [])
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => String(p.module?._id || p.module))
  );

  const prioritizedPath = modules.map((mod) => {
    const isCompleted = completedModuleIds.has(String(mod._id));
    let priorityWeight = 1;
    let priorityReason = 'Standard curriculum training.';

    const catLower = mod.category.toLowerCase();
    const isWeakInPhishing = weakAreas.some((w) => w.toLowerCase().includes('phishing') || w.toLowerCase().includes('link'));
    const isWeakInPassword = weakAreas.some((w) => w.toLowerCase().includes('password') || w.toLowerCase().includes('credential'));

    if (isWeakInPassword && (catLower.includes('password') || catLower.includes('credential'))) {
      priorityWeight = 3;
      priorityReason = 'Recommended First: Your profile shows weakness in credential protection and password hygiene.';
    } else if (isWeakInPhishing && (catLower.includes('phish') || catLower.includes('incident'))) {
      priorityWeight = 3;
      priorityReason = 'Recommended First: Direct recommendation to reinforce link inspection and sender verification.';
    } else if (riskTier === 'HIGH' && mod.difficulty === 'BEGINNER') {
      priorityWeight = 2;
      priorityReason = 'Foundational reinforcement for high-risk posture.';
    }

    return {
      id: mod._id,
      title: mod.title,
      description: mod.description,
      category: mod.category,
      difficulty: mod.difficulty,
      duration: mod.duration,
      isCompleted,
      priorityWeight: isCompleted ? 0 : priorityWeight,
      priorityReason
    };
  }).sort((a, b) => b.priorityWeight - a.priorityWeight);

  // Scenario-based branching interactive lesson
  const branchingScenario = {
    id: 'branching-ceo-giftcard',
    title: 'Interactive Dilemma: The CEO’s Urgent Weekend Request',
    threatCategory: 'Executive Impersonation (CEO Fraud)',
    initialPrompt: {
      narrative: 'It is Friday at 6:45 PM. You receive an email from "Rajan Verma <ceo.updates.corporate@gmail.com>" with the subject line "CONFIDENTIAL - NEED 5 APPLE GIFT CARDS ASAP". He writes: "I am in an investor dinner and cannot take phone calls. Buy 5 Apple cards ($200 each) and email me the PIN codes. Keep this between us."',
      question: 'What is your immediate next move?',
      options: [
        {
          id: 'opt-1',
          text: 'Rely on the CEO’s authority: buy the cards quickly and email the codes before Monday.',
          outcome: 'FAILURE',
          consequence: 'Company funds lost ($1,000)! The attacker was a scammer using a public Gmail account. Never use personal accounts or gift cards for corporate expenses.',
          pointsEarned: 0
        },
        {
          id: 'opt-2',
          text: 'Reply to the Gmail asking for his corporate employee ID number.',
          outcome: 'PARTIAL',
          consequence: 'Caution: The attacker will simply forge an ID number or escalate emotional pressure. Never negotiate or reply to suspicious email addresses.',
          pointsEarned: 5
        },
        {
          id: 'opt-3',
          text: 'Check the sender domain, recognize the Gmail spoofing and gift card red flags, and report the email to the Incident Center.',
          outcome: 'SUCCESS',
          consequence: 'Spot on! You prevented a business email compromise (BEC). Security was notified and blocked the attacker domain-wide.',
          pointsEarned: 25
        }
      ]
    }
  };

  return {
    riskScore,
    riskTier,
    contributingFactors,
    adaptivePath: prioritizedPath,
    branchingScenario
  };
}
