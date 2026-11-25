export function analyzeMessage({ subject = '', body = '', sender = '' }) {
  const text = `${subject} ${body} ${sender}`.toLowerCase();
  const redFlags = [];
  let score = 5; // Base low baseline

  // 1. Lookalike domain and sender inspection
  const senderLower = sender.toLowerCase();
  const suspiciousTlds = ['.xyz', '.top', '.tk', '.biz', '.info', '.click', '.live', '.cc', '.buzz'];
  const hasSuspiciousTld = suspiciousTlds.some((tld) => senderLower.includes(tld));
  if (hasSuspiciousTld) {
    redFlags.push({
      type: 'Suspicious TLD Domain',
      severity: 'HIGH',
      phrase: sender,
      description: 'The sender email address uses an unusual or low-reputation top-level domain frequently associated with spam and phishing campaigns.'
    });
    score += 30;
  }

  // Typosquatting / Lookalike brand checks
  const lookalikePatterns = [
    { brand: 'Microsoft', regex: /micr[o0]s[o0]ft|office365-login|outlook-verify/i },
    { brand: 'Google', regex: /g[o0][o0]gle-verify|gmail-support|workspace-login/i },
    { brand: 'PayPal', regex: /paypa[l1]-|secure-paypal|paypal-update/i },
    { brand: 'Amazon', regex: /amaz[o0]n-orders|prime-renewal/i },
    { brand: 'Bank / Financial', regex: /sbi-kyc|hdfc-verify|icici-rewards|axis-kyc/i }
  ];

  for (const { brand, regex } of lookalikePatterns) {
    if (regex.test(text) && !senderLower.endsWith('.google.com') && !senderLower.endsWith('.microsoft.com') && !senderLower.endsWith('.paypal.com') && !senderLower.endsWith('.amazon.com')) {
      redFlags.push({
        type: `Lookalike Brand Mimicking (${brand})`,
        severity: 'HIGH',
        phrase: brand,
        description: `The message references or mimics official ${brand} notifications from an unverified external source.`
      });
      score += 25;
      break;
    }
  }

  // Executive pretending with free webmail
  if ((text.includes('ceo') || text.includes('director') || text.includes('executive') || text.includes('president')) && (senderLower.includes('@gmail.com') || senderLower.includes('@yahoo.com') || senderLower.includes('@hotmail.com'))) {
    redFlags.push({
      type: 'Free Webmail Executive Impersonation',
      severity: 'HIGH',
      phrase: sender,
      description: 'An executive title is combined with a public consumer email provider (like Gmail or Yahoo) instead of the corporate domain.'
    });
    score += 35;
  }

  // 2. High urgency / Panic / Coercion words
  const urgencyKeywords = [
    { word: 'immediately', weight: 15 },
    { word: 'within 24 hours', weight: 20 },
    { word: 'within 15 minutes', weight: 25 },
    { word: 'account suspended', weight: 25 },
    { word: 'urgent action required', weight: 20 },
    { word: 'final notice', weight: 20 },
    { word: 'do not call', weight: 25 },
    { word: 'keep this confidential', weight: 15 },
    { word: 'compromised', weight: 15 }
  ];

  for (const { word, weight } of urgencyKeywords) {
    if (text.includes(word)) {
      redFlags.push({
        type: 'Urgency & Pressure Tactics',
        severity: weight >= 20 ? 'HIGH' : 'MEDIUM',
        phrase: word,
        description: `Creates an artificial sense of urgency or secrecy ("${word}") to pressure you into acting before verifying.`
      });
      score += weight;
      if (redFlags.filter((f) => f.type === 'Urgency & Pressure Tactics').length >= 2) break;
    }
  }

  // 3. Financial, Gift Card, UPI, and Credential Requests
  const financialKeywords = [
    { word: 'gift card', weight: 30, desc: 'Requests for untraceable gift cards are almost universally fraudulent.' },
    { word: 'upi pin', weight: 35, desc: 'Entering a UPI PIN debits money from your bank account; a PIN is NEVER needed to receive money.' },
    { word: 'enter your password', weight: 30, desc: 'Explicitly requests password entry via message link.' },
    { word: 'wire transfer', weight: 20, desc: 'Pressures for immediate wire or remittance transfer.' },
    { word: 'verify your sso', weight: 25, desc: 'Prompts you to re-authenticate single sign-on credentials outside internal portals.' },
    { word: 'update kyc', weight: 25, desc: 'Classic bank KYC scam asking to click a link to avoid account deactivation.' },
    { word: 'otp', weight: 20, desc: 'Requests one-time passwords or 2FA codes.' }
  ];

  for (const { word, weight, desc } of financialKeywords) {
    if (text.includes(word)) {
      redFlags.push({
        type: 'Suspicious Financial/Credential Request',
        severity: 'HIGH',
        phrase: word,
        description: desc
      });
      score += weight;
    }
  }

  // 4. Link & URL anomalies
  const urlMatches = (body.match(/https?:\/\/[^\s"'<>]+/gi) || []);
  for (const url of urlMatches) {
    if (url.includes('.tk') || url.includes('.xyz') || url.includes('.top') || url.includes('bit.ly') || url.includes('tinyurl')) {
      redFlags.push({
        type: 'Unverified / Obfuscated Link Target',
        severity: 'HIGH',
        phrase: url,
        description: 'The link points to a suspicious top-level domain or URL shortener that masks the real destination.'
      });
      score += 25;
      break;
    }
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  let riskLevel = 'SAFE';
  if (normalizedScore >= 60) {
    riskLevel = 'HIGH_RISK';
  } else if (normalizedScore >= 30) {
    riskLevel = 'SUSPICIOUS';
  }

  let summary = '';
  let recommendedAction = '';
  if (riskLevel === 'HIGH_RISK') {
    summary = `High probability of a phishing or social engineering scam (${redFlags.length} major red flags identified).`;
    recommendedAction = 'Do NOT click links, do NOT enter credentials or UPI PINs, and do NOT reply. Report this immediately using the Incident Report button.';
  } else if (riskLevel === 'SUSPICIOUS') {
    summary = `Potential security warnings detected (${redFlags.length} flags). Proceed with extreme caution.`;
    recommendedAction = 'Verify the authenticity of this request through a known, independent channel (e.g. call the sender on their verified phone number or visit the official internal portal).';
  } else {
    summary = 'No strong phishing indicators or malicious patterns were detected in this message.';
    recommendedAction = 'Message appears routine. Always remain vigilant with attachments and password requests.';
  }

  return {
    riskScore: normalizedScore,
    riskLevel,
    redFlags,
    summary,
    recommendedAction,
    analyzedAt: new Date().toISOString()
  };
}
