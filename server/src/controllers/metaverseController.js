import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler.js';

const numericDefaults = {
  authenticationConfidence: 0.8,
  biometricDrift: 0.1,
  sessionMinutes: 30,
  deepfakeConfidence: 0.1,
  packetAnomalyScore: 0.1,
  deviceRiskScore: 0.1,
  twinIntegrityScore: 1,
  contractRiskScore: 0.1,
  nftSimilarityScore: 0.1,
  walletAnomalyScore: 0.1,
  federatedRoundVariance: 0.1,
  participantTrustScore: 0.9
};

function clamp(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

function fallbackAnalysis(body) {
  const values = {
    authenticationConfidence: clamp(body.authenticationConfidence, numericDefaults.authenticationConfidence),
    biometricDrift: clamp(body.biometricDrift, numericDefaults.biometricDrift),
    sessionMinutes: Math.min(1440, Math.max(0, Number(body.sessionMinutes) || 30)),
    deepfakeConfidence: clamp(body.deepfakeConfidence, numericDefaults.deepfakeConfidence),
    packetAnomalyScore: clamp(body.packetAnomalyScore, numericDefaults.packetAnomalyScore),
    deviceRiskScore: clamp(body.deviceRiskScore, numericDefaults.deviceRiskScore),
    twinIntegrityScore: clamp(body.twinIntegrityScore, numericDefaults.twinIntegrityScore),
    contractRiskScore: clamp(body.contractRiskScore, numericDefaults.contractRiskScore),
    nftSimilarityScore: clamp(body.nftSimilarityScore, numericDefaults.nftSimilarityScore),
    walletAnomalyScore: clamp(body.walletAnomalyScore, numericDefaults.walletAnomalyScore),
    federatedRoundVariance: clamp(body.federatedRoundVariance, numericDefaults.federatedRoundVariance),
    participantTrustScore: clamp(body.participantTrustScore, numericDefaults.participantTrustScore)
  };

  const makeFinding = (topic, score, summary, evidence, mitigations) => ({
    topic,
    status: score >= 70 ? 'CRITICAL' : score >= 45 ? 'WATCH' : 'SECURE',
    riskScore: score,
    summary,
    evidence,
    mitigations
  });
  const findings = [
    makeFinding('Biometric continuous authentication',
      Math.min(100, Math.round((1 - values.authenticationConfidence) * 55 + values.biometricDrift * 35 + (values.sessionMinutes > 480 ? 1 : 0))),
      'Session identity should be revalidated continuously after drift or risk events.',
      [`Authentication confidence: ${values.authenticationConfidence.toFixed(2)}`, `Biometric drift: ${values.biometricDrift.toFixed(2)}`],
      ['Step-up authentication', 'Multi-sensor biometrics', 'Session re-enrollment']),
    makeFinding('Deepfake and avatar impersonation', Math.round(values.deepfakeConfidence * 100),
      'Synthetic-media signals may indicate an impersonated avatar.',
      [`Deepfake confidence: ${values.deepfakeConfidence.toFixed(2)}`],
      ['Signed avatar credentials', 'Challenge-response liveness', 'Mutual verification']),
    makeFinding('Metaverse intrusion detection',
      Math.round(Math.max(values.packetAnomalyScore * 75, values.deviceRiskScore * 65)),
      'XR/network telemetry is evaluated for anomalous sessions and devices.',
      [`Packet anomaly: ${values.packetAnomalyScore.toFixed(2)}`, `Device risk: ${values.deviceRiskScore.toFixed(2)}`],
      ['XR runtime isolation', 'Behavior baselines', 'Real-time egress controls']),
    makeFinding('Digital-twin integrity', Math.round((1 - values.twinIntegrityScore) * 100),
      'Twin state integrity is evaluated against expected sensor and snapshot consensus.',
      [`Integrity score: ${values.twinIntegrityScore.toFixed(2)}`],
      ['Signed snapshots', 'Sensor consensus', 'Immutable audit trail']),
    makeFinding('NFT, wallet, and smart-contract security',
      Math.round(Math.max(values.contractRiskScore * 70, values.nftSimilarityScore * 65, values.walletAnomalyScore * 80)),
      'Content, contract, and wallet signals are evaluated for fraud and plagiarism.',
      [`Contract risk: ${values.contractRiskScore.toFixed(2)}`, `NFT similarity: ${values.nftSimilarityScore.toFixed(2)}`, `Wallet anomaly: ${values.walletAnomalyScore.toFixed(2)}`],
      ['Contract verification', 'Transaction allowlists', 'Perceptual hashing']),
    makeFinding('Federated edge learning',
      Math.round(values.federatedRoundVariance * 65 + (1 - values.participantTrustScore) * 35),
      'Edge update variance and participant trust are evaluated for poisoning risk.',
      [`Update variance: ${values.federatedRoundVariance.toFixed(2)}`, `Participant trust: ${values.participantTrustScore.toFixed(2)}`],
      ['Differential privacy', 'Robust aggregation', 'Signed updates'])
  ];
  const overallRisk = Math.round(findings.reduce((sum, item) => sum + item.riskScore, 0) / findings.length);
  return {
    overallRisk,
    overallStatus: overallRisk >= 70 ? 'CRITICAL' : overallRisk >= 45 ? 'WATCH' : 'SECURE',
    findings,
    attackScenarios: [
      { name: 'Digital-twin data-integrity attack', trigger: 'Conflicting sensor state or manipulated snapshots', response: 'Quarantine the update and require signed reconciliation.' },
      { name: 'Avatar impersonation with deepfake and MiTM', trigger: 'Low identity confidence or synthetic media', response: 'Suspend privileged avatar actions and reverify identity.' },
      { name: 'NFT or cryptocurrency transaction phishing', trigger: 'Wallet anomaly or malicious contract', response: 'Block signing and require allowlisted-domain confirmation.' }
    ],
    source: 'SERVER_FALLBACK'
  };
}

export const getMetaverseOverview = (_request, response) => {
  response.json({
    success: true,
    topics: [
      'XR/VR/AR environment',
      'Digital-twin integrity',
      'Biometric continuous avatar authentication',
      'Deepfake and avatar impersonation',
      'Metaverse intrusion detection',
      'Blockchain, smart contracts, NFTs, and wallets',
      'Federated and edge learning',
      'Metaverse attack scenarios'
    ],
    disclaimer: 'Demonstration safeguards only. Production deployment requires certified identity, IDS, blockchain, XR, and privacy controls.'
  });
};

export const analyzeMetaverse = asyncHandler(async (request, response) => {
  const environment = ['VR', 'AR', 'XR', 'MR'].includes(String(request.body.environment || '').toUpperCase())
    ? String(request.body.environment).toUpperCase()
    : 'VR';
  const payload = { ...numericDefaults, ...request.body, environment };
  try {
    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/analyze-metaverse`,
      payload,
      { timeout: 5000 }
    );
    response.json({ success: true, ...data, source: 'AI_SERVICE' });
  } catch (error) {
    console.warn(`Metaverse AI fallback used: ${error.message}`);
    response.json({ success: true, ...fallbackAnalysis(payload) });
  }
});
