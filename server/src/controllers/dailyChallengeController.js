import { getTodayChallengeForUser, submitDailyChallenge } from '../services/dailyChallengeService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const getDailyChallenge = asyncHandler(async (request, response) => {
  const data = await getTodayChallengeForUser(request.user._id);
  response.json({ success: true, ...data });
});

export const submitChallenge = asyncHandler(async (request, response) => {
  const { challengeId, selectedOption, timeSpentSeconds } = request.body;
  if (selectedOption === undefined || typeof selectedOption !== 'number') {
    throw new AppError('selectedOption index is required.', 400);
  }
  const result = await submitDailyChallenge(request.user._id, {
    challengeId: challengeId || 'dc-1',
    selectedOption,
    timeSpentSeconds: timeSpentSeconds || 15
  });
  response.json({ success: true, ...result });
});

export const getSecurityNewsFeed = (_request, response) => {
  const news = [
    {
      id: 'news-1',
      title: 'Threat of the Week: Deepfake Audio Impersonating Managing Directors',
      date: 'This Week',
      tag: 'Critical Threat',
      category: 'AI & Vishing',
      summary: 'Attackers are harvesting corporate executives’ webinars to synthesize voice clips and order urgent weekend wires before market close. Always verify verbal instructions through verified in-person contacts.'
    },
    {
      id: 'news-2',
      title: 'Scam Alert: Fake Electricity Bill Disconnection SMS in India',
      date: 'Recent',
      tag: 'Trending Scam',
      category: 'Smishing',
      summary: 'SMS notices threatening power cut-off within 2 hours are circulating. Victims are instructed to download an APK or call a private number. Power discoms never ask for payments via APK files.'
    },
    {
      id: 'news-3',
      title: 'Advisory: UPI Collect Request "Enter PIN to Receive Cashback"',
      date: 'Recent',
      tag: 'Financial Fraud',
      category: 'UPI Scam',
      summary: 'Remember the golden rule of UPI: You never enter your PIN to receive funds. Entering a UPI PIN always deducts money from your bank account.'
    }
  ];

  response.json({ success: true, news });
};
