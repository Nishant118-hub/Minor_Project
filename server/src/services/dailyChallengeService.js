import DailyChallengeCompletion from '../models/DailyChallengeCompletion.js';
import User from '../models/User.js';

const challengesPool = [
  {
    id: 'dc-1',
    title: 'Spot the Phish: Courier Tracking SMS',
    attackType: 'SMS',
    timeLimitSeconds: 60,
    difficulty: 'BEGINNER',
    sender: 'DTDC-Delivery (+91-98401-XXXXX)',
    content: 'Your package could not be delivered due to an incorrect house number. Pay Rs. 10 redelivery fee and update your address in 24 hrs to prevent parcel return: http://dtdc-express-rebook.top/in',
    question: 'Is this message suspicious or safe?',
    options: [
      { text: 'Safe: DTDC frequently requires a small address correction fee.', isCorrect: false },
      { text: 'Suspicious: Sent from a private number with a suspicious .top domain asking for money.', isCorrect: true },
      { text: 'Safe: 24-hour deadline confirms it is genuine delivery protocol.', isCorrect: false }
    ],
    explanation: 'Couriers do not use .top domains or request unverified card fees via SMS from private 10-digit mobile numbers.',
    redFlags: ['Sent from ordinary mobile number', 'Suspicious .top domain', 'Demands fee via web link']
  },
  {
    id: 'dc-2',
    title: 'Spot the Phish: IT Helpdesk MFA Request',
    attackType: 'VOICE',
    timeLimitSeconds: 60,
    difficulty: 'INTERMEDIATE',
    sender: 'Caller ID: "Internal IT Support"',
    content: '"Hi, this is Greg from IT. We are upgrading server certs and sent an MFA push to your phone. Please hit Approve so you don\'t get locked out of your email."',
    question: 'What is the correct action to take?',
    options: [
      { text: 'Approve the push immediately so you do not lose system access.', isCorrect: false },
      { text: 'Deny the MFA push and immediately report the unsolicited call to security.', isCorrect: true },
      { text: 'Ask Greg to read your password first to prove he is from IT.', isCorrect: false }
    ],
    explanation: 'Legitimate IT support will never ask you to approve an unsolicited MFA push prompt or share two-factor codes over a phone call.',
    redFlags: ['Unsolicited call asking for MFA approval', 'Threat of account lockout', 'Bypassing ticket protocol']
  },
  {
    id: 'dc-3',
    title: 'Spot the Phish: UPI Cashback QR Code',
    attackType: 'UPI',
    timeLimitSeconds: 60,
    difficulty: 'BEGINNER',
    sender: 'PhonePe Rewards <cashback-team@promotions-club.in>',
    content: 'You won Rs. 2,500 Diwali Cashback! Scan this QR code and type your 6-digit UPI PIN to accept the cash directly into your savings account.',
    question: 'Why is this request dangerous?',
    options: [
      { text: 'UPI PIN is only used for sending money or debiting your account, NEVER receiving.', isCorrect: true },
      { text: 'Diwali is too far away for cashback campaigns.', isCorrect: false },
      { text: 'Cashback must always be claimed in Google Pay, not PhonePe.', isCorrect: false }
    ],
    explanation: 'Entering your UPI PIN ALWAYS debits money from your account. You NEVER need to enter a PIN to receive or credit money.',
    redFlags: ['Asking for UPI PIN to receive money', 'External promotional domain', 'Unsolicited cash reward']
  },
  {
    id: 'dc-4',
    title: 'Spot the Phish: CEO Urgent Wire / Gift Cards',
    attackType: 'EMAIL',
    timeLimitSeconds: 60,
    difficulty: 'BEGINNER',
    sender: 'Chief Executive Officer <ceo.corporate.exec@gmail.com>',
    content: 'I am tied up in executive negotiations. Purchase 4 Apple gift cards ($250 each) for our client delegation and email the scratch-off PIN codes directly to this Gmail. Do not call as my phone is on silent.',
    question: 'What is the primary indicator that this is a scam?',
    options: [
      { text: 'CEOs usually prefer Amazon gift cards instead of Apple.', isCorrect: false },
      { text: 'Executive authority combined with a Gmail address, gift card request, and instruction not to call.', isCorrect: true },
      { text: 'Client gifts must be approved by Marketing first.', isCorrect: false }
    ],
    explanation: 'CEO gift card fraud uses manufactured urgency, personal email addresses, and communication blackouts to steal untraceable gift card PINs.',
    redFlags: ['Personal @gmail.com address for executive', 'Gift card request', 'Instruction: "do not call"']
  },
  {
    id: 'dc-5',
    title: 'Spot the Phish: Corporate Facilities Mailroom',
    attackType: 'EMAIL',
    timeLimitSeconds: 60,
    difficulty: 'INTERMEDIATE',
    sender: 'Facilities & Mailroom <mailroom@cyber.local>',
    content: 'A postal package has arrived for you at the 2nd floor reception desk. Please bring your employee ID badge to pick it up between 9 AM and 5 PM. No online links or fees are involved.',
    question: 'How should you classify this notification?',
    options: [
      { text: 'Legitimate: Sent from internal domain with no links, passwords, or payments requested.', isCorrect: true },
      { text: 'Suspicious: Mailrooms never notify employees about incoming deliveries.', isCorrect: false },
      { text: 'Suspicious: Bringing your badge is a physical credential risk.', isCorrect: false }
    ],
    explanation: 'This is a genuine internal communication sent from the authorized @cyber.local domain with zero deceptive cues or credential demands.',
    redFlags: []
  }
];

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function getTodayChallengeForUser(userId) {
  const today = getTodayDateString();
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const challenge = challengesPool[dayOfYear % challengesPool.length];

  const completion = await DailyChallengeCompletion.findOne({ userId, dateString: today });
  const user = await User.findById(userId).select('streak points level isSecurityChampion');

  return {
    today,
    challenge: {
      id: challenge.id,
      title: challenge.title,
      attackType: challenge.attackType,
      timeLimitSeconds: challenge.timeLimitSeconds,
      difficulty: challenge.difficulty,
      sender: challenge.sender,
      content: challenge.content,
      question: challenge.question,
      options: challenge.options.map((opt) => opt.text)
    },
    alreadyCompleted: Boolean(completion),
    completionResult: completion
      ? {
        selectedOption: completion.selectedOption,
        isCorrect: completion.isCorrect,
        pointsEarned: completion.pointsEarned,
        explanation: challenge.explanation,
        redFlags: challenge.redFlags
      }
      : null,
    streak: user?.streak || { current: 0, highest: 0, lastCompletedDate: null },
    points: user?.points || 0,
    level: user?.level || 'Rookie',
    isSecurityChampion: user?.isSecurityChampion || false
  };
}

export async function submitDailyChallenge(userId, { challengeId, selectedOption, timeSpentSeconds = 15 }) {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const challenge = challengesPool.find((c) => c.id === challengeId) || challengesPool[0];
  const isCorrect = challenge.options[selectedOption]?.isCorrect || false;

  let completion = await DailyChallengeCompletion.findOne({ userId, dateString: today });
  if (completion) {
    return {
      alreadyCompleted: true,
      isCorrect: completion.isCorrect,
      pointsEarned: completion.pointsEarned,
      explanation: challenge.explanation,
      redFlags: challenge.redFlags
    };
  }

  const pointsEarned = isCorrect ? 15 : 5; // Participation points even if missed
  completion = await DailyChallengeCompletion.create({
    userId,
    dateString: today,
    challengeId,
    selectedOption,
    isCorrect,
    timeSpentSeconds,
    pointsEarned
  });

  const user = await User.findById(userId);
  if (user) {
    user.points = (user.points || 0) + pointsEarned;

    const streak = user.streak || { current: 0, highest: 0, lastCompletedDate: null };
    if (streak.lastCompletedDate === yesterday) {
      streak.current += 1;
    } else if (streak.lastCompletedDate === today) {
      // Same day, leave current as is
    } else {
      streak.current = 1;
    }

    if (streak.current > (streak.highest || 0)) {
      streak.highest = streak.current;
    }
    streak.lastCompletedDate = today;
    user.streak = streak;

    // Check level progression:
    // Rookie (0-50 pts) -> Defender (51-150 pts) -> Guardian (151+ pts)
    if (user.points >= 150) {
      user.level = 'Guardian';
    } else if (user.points >= 50) {
      user.level = 'Defender';
    } else {
      user.level = 'Rookie';
    }

    // Security champion condition
    if (user.points >= 120 && isCorrect) {
      user.isSecurityChampion = true;
    }

    await user.save();
  }

  return {
    isCorrect,
    pointsEarned,
    explanation: challenge.explanation,
    redFlags: challenge.redFlags,
    streak: user.streak,
    totalPoints: user.points,
    level: user.level,
    isSecurityChampion: user.isSecurityChampion
  };
}
