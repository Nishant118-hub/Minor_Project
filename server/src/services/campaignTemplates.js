const templates = {
  FAKE_INVOICE: {
    category: 'fake_invoice',
    attackType: 'EMAIL',
    senderDisplayName: 'Finance Desk <billing@corp-vendor-portal.xyz>',
    subject: 'URGENT: Outstanding Vendor Invoice #INV-88291 Due Immediately',
    body: `Hello Team,

Please find attached the updated quarterly vendor services invoice #INV-88291 totaling $14,850.00. 

Due to a banking transition, our remittance account details have changed. Kindly update your records immediately and transfer payment within 24 hours to avoid suspension of critical cloud services:

Review Invoice Online: https://secure-vendor-portal.xyz/invoices/INV-88291?auth=temp

Regards,
Accounts Payable Dept.`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Unexpected invoice requests with external domains (.xyz) and urgency demands must always be verified via internal procurement channels.',
    difficulty: 'BEGINNER',
    redFlags: [
      { flag: 'Suspicious Domain', description: 'Sender address uses an external unofficial domain (.xyz) instead of the authorized corporate vendor domain.', location: 'sender' },
      { flag: 'Extreme Urgency', description: 'Demands payment "within 24 hours to avoid suspension" to bypass standard accounting verification.', location: 'body' },
      { flag: 'Altered Banking Details', description: 'Claims banking details have suddenly changed, a hallmark tactic of Business Email Compromise (BEC).', location: 'body' },
      { flag: 'Unverified Link', description: 'Directs to an unverified third-party link rather than the internal ERP system.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'अति आवश्यक: विक्रेता चालान #INV-88291 तुरंत देय है',
        body: 'नमस्ते टीम,\n\nकृपया तिमाही सेवा चालान #INV-88291 ($14,850.00) देखें। बैंक खाता बदल गया है। निलंबन से बचने के लिए 24 घंटे के भीतर भुगतान करें।\n\nचालान देखें: https://secure-vendor-portal.xyz/invoices/INV-88291',
        explanation: 'अनपेक्षित विक्रेता चालान और बाहरी .xyz डोमेन हमेशा आंतरिक लेखा विभाग द्वारा सत्यापित होने चाहिए।'
      },
      pa: {
        subject: 'ਜ਼ਰੂਰੀ: ਵਿਕਰੇਤਾ ਇਨਵੌਇਸ #INV-88291 ਤੁਰੰਤ ਭੁਗਤਾਨ ਯੋਗ ਹੈ',
        body: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਟੀਮ,\n\nਕਿਰਪਾ ਕਰਕੇ ਇਨਵੌਇਸ #INV-88291 ਦੇਖੋ। ਬੈਂਕ ਖਾਤਾ ਬਦਲ ਗਿਆ ਹੈ। 24 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਭੁਗਤਾਨ ਕਰੋ।\n\nਲਿੰਕ: https://secure-vendor-portal.xyz/invoices/INV-88291',
        explanation: 'ਬਾਹਰੀ .xyz ਲਿੰਕ ਅਤੇ ਬੈਂਕ ਬਦਲਣ ਦੀਆਂ ਬੇਨਤੀਆਂ ਨੂੰ ਹਮੇਸ਼ਾ ਅੰਦਰੂਨੀ ਵਿਭਾਗ ਰਾਹੀਂ ਪੁਸ਼ਟੀ ਕਰੋ।'
      }
    }
  },
  URGENT_CEO_REQUEST: {
    category: 'urgent_ceo_request',
    attackType: 'EMAIL',
    senderDisplayName: 'Executive Office <ceo.internal-updates@gmail.com>',
    subject: 'CONFIDENTIAL: Immediate Assistance Required - Do Not Call',
    body: `Hi,

I am currently in an all-day confidential executive board review with our major investors and cannot take calls.

I need you to urgently process 5 electronic Apple Gift Cards ($500 each) for client appreciation rewards. Send the redemption codes directly to this email as soon as you purchase them.

Keep this between us until the board announcement tonight.

Thanks,
Chief Executive Officer`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Classic CEO Fraud: uses executive authority, secrecy ("do not call", "keep this between us"), and requests untraceable gift cards from a personal Gmail address.',
    difficulty: 'INTERMEDIATE',
    redFlags: [
      { flag: 'Free Webmail Sender', description: 'CEO supposedly emailing from a public @gmail.com address rather than the corporate domain.', location: 'sender' },
      { flag: 'Communication Blackout', description: 'Explicit instruction "do not call" designed to prevent out-of-band verification.', location: 'body' },
      { flag: 'Gift Card / Untraceable Value', description: 'Requesting gift cards or instant digital codes is almost exclusively associated with scams.', location: 'body' },
      { flag: 'Forced Secrecy', description: 'Telling employees to keep transactions secret from managers or team members.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'गोपनीय: तत्काल सहायता की आवश्यकता - कॉल न करें',
        body: 'नमस्ते,\n\nमैं बोर्ड मीटिंग में हूँ। क्लाइंट्स के लिए तुरंत 5 Apple गिफ्ट कार्ड खरीदें और कोड मुझे ईमेल करें। इसे गोपनीय रखें।\n\nधन्यवाद,\nमुख्य कार्यकारी अधिकारी (CEO)',
        explanation: 'सीईओ कभी भी सार्वजनिक जीमेल से तत्काल गिफ्ट कार्ड या कोड नहीं मांगते।'
      },
      pa: {
        subject: 'ਗੁਪਤ: ਤੁਰੰਤ ਮਦਦ ਚਾਹੀਦੀ ਹੈ - ਕਾਲ ਨਾ ਕਰੋ',
        body: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ,\n\nਮੈਂ ਬੋਰਡ ਮੀਟਿੰਗ ਵਿੱਚ ਹਾਂ। ਤੁਰੰਤ 5 ਗਿਫਟ ਕਾਰਡ ਖਰੀਦੋ ਅਤੇ ਕੋਡ ਮੈਨੂੰ ਭੇਜੋ।\n\nਧੰਨਵਾਦ,\nਸੀ.ਈ.ਓ.',
        explanation: 'ਸੀਈਓ ਕਦੇ ਵੀ ਜੀਮੇਲ ਤੋਂ ਗਿਫਟ ਕਾਰਡ ਮੰਗਣ ਲਈ ਈਮੇਲ ਨਹੀਂ ਕਰਦੇ।'
      }
    }
  },
  PASSWORD_RESET: {
    category: 'password_reset',
    attackType: 'EMAIL',
    senderDisplayName: 'IT Identity Support <admin@sso-login-identity.com>',
    subject: 'Security Alert: Your Single Sign-On (SSO) session expired',
    body: `Dear Employee,

Our security monitoring detected an unauthorized sign-in attempt to your corporate portal from an unrecognized IP address (Kyiv, Ukraine).

For your protection, your SSO password has been queued for immediate termination. You must re-authenticate and verify your password within 15 minutes to preserve system access:

Verify Identity & Restore Access: https://sso-login-identity.com/re-authenticate

IT Infrastructure & Security Team`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Fake credential-harvesting alert: uses fear of account breach and tight time limits (15 minutes) to direct users to an unapproved credential-stealing domain.',
    difficulty: 'BEGINNER',
    redFlags: [
      { flag: 'Lookalike Domain', description: 'Domain "sso-login-identity.com" resembles corporate single sign-on but is an attacker-controlled host.', location: 'sender' },
      { flag: 'Panic Inducement', description: 'Claims unauthorized sign-in from foreign country to trigger panic.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'सुरक्षा चेतावनी: आपका SSO सत्र समाप्त हो गया है',
        body: 'प्रिय कर्मचारी,\n\nआपके खाते में अज्ञात लॉगिन प्रयास देखा गया। 15 मिनट में अपना पासवर्ड पुनः सत्यापित करें:\n\nhttps://sso-login-identity.com/re-authenticate\n\nआईटी टीम',
        explanation: 'पासवर्ड रीसेट करने के लिए कभी भी ईमेल लिंक का उपयोग न करें; आधिकारिक पोर्टल पर सीधे जाएं।'
      },
      pa: {
        subject: 'ਸੁਰੱਖਿਆ ਚੇਤਾਵਨੀ: ਤੁਹਾਡਾ SSO ਲੌਗਇਨ ਖਤਮ ਹੋ ਗਿਆ ਹੈ',
        body: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ,\n\nਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਅਣਅਧਿਕਾਰਤ ਲੌਗਇਨ ਕੋਸ਼ਿਸ਼ ਦੇਖੀ ਗਈ ਹੈ। 15 ਮਿੰਟ ਵਿੱਚ ਪੁਸ਼ਟੀ ਕਰੋ:\n\nhttps://sso-login-identity.com/re-authenticate',
        explanation: 'ਹਮੇਸ਼ਾ ਅਧਿਕਾਰਤ ਪੋਰਟਲ ਤੇ ਸਿੱਧਾ ਜਾ ਕੇ ਪਾਸਵਰਡ ਜਾਂਚੋ।'
      }
    }
  },
  DELIVERY_NOTIFICATION: {
    category: 'delivery_notification',
    attackType: 'EMAIL',
    senderDisplayName: 'Corporate Mailroom <mailroom@cyber.local>',
    subject: 'Package received at 2nd floor reception desk',
    body: `Hi there,

A parcel addressed to you was received at the 2nd floor main reception desk this morning. 

You can pick it up during standard office hours (9:00 AM - 5:00 PM) by showing your employee badge. No online action, payment, or password confirmation is required.

Best regards,
Facilities & Mailroom Team`,
    expectedClassification: 'LEGITIMATE',
    explanation: 'Legitimate internal communication: sent from an authentic internal domain (@cyber.local), requests no credentials or payments, and instructs routine badge check in person.',
    difficulty: 'INTERMEDIATE',
    redFlags: [],
    translations: {
      hi: {
        subject: 'दूसरी मंजिल के रिसेप्शन डेस्क पर पार्सल प्राप्त हुआ',
        body: 'नमस्ते,\n\nआपके नाम का एक पार्सल रिसेप्शन पर प्राप्त हुआ है। कार्यालय समय के दौरान अपना आईडी कार्ड दिखाकर इसे प्राप्त करें। किसी लिंक या भुगतान की आवश्यकता नहीं है।',
        explanation: 'यह वैध आंतरिक संदेश है जो कोई क्रेडेंशियल या संवेदनशील जानकारी नहीं मांगता।'
      },
      pa: {
        subject: 'ਦਫਤਰ ਰਿਸੈਪਸ਼ਨ ਤੇ ਪਾਰਸਲ ਪਹੁੰਚਿਆ ਹੈ',
        body: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ,\n\nਤੁਹਾਡਾ ਪਾਰਸਲ ਰਿਸੈਪਸ਼ਨ ਤੇ ਉਪਲਬਧ ਹੈ। ਆਪਣਾ ਆਈਡੀ ਕਾਰਡ ਦਿਖਾ ਕੇ ਲੈ ਜਾਓ। ਕੋਈ ਲਿੰਕ ਜਾਂ ਪਾਸਵਰਡ ਨਹੀਂ ਮੰਗਿਆ ਗਿਆ।',
        explanation: 'ਇਹ ਇੱਕ ਸਹੀ ਅੰਦਰੂਨੀ ਸੂਚਨਾ ਹੈ।'
      }
    }
  },
  ACCOUNT_VERIFICATION: {
    category: 'credential_harvest',
    attackType: 'EMAIL',
    senderDisplayName: 'HR Benefits Portal <hr-benefits@internal-portal.info>',
    subject: 'Action Required: Confirm your employee health insurance enrollment',
    body: `Dear Colleague,

Annual healthcare benefits enrollment closes at midnight tonight. Our records show your dependent health coverage election form remains unconfirmed.

Failure to verify before the deadline will result in default enrollment cancellation for the upcoming fiscal year.

Confirm Your Coverage Selection Now: https://internal-portal.info/benefits/enroll

Human Resources Benefits Group`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Phishing attack mimicking internal HR benefits: uses an external domain (.info) and threatens cancellation of healthcare benefits to harvest login credentials.',
    difficulty: 'ADVANCED',
    redFlags: [
      { flag: 'Non-Corporate TLD', description: 'Domain ends in .info rather than the official corporate domain.', location: 'sender' },
      { flag: 'High Stakes Threat', description: 'Threatens loss of health insurance coverage if action is not taken before midnight.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'कार्रवाई आवश्यक: स्वास्थ्य बीमा नामांकन की पुष्टि करें',
        body: 'प्रिय साथी,\n\nस्वास्थ्य लाभ नामांकन आज रात समाप्त हो रहा है। रद्दीकरण से बचने के लिए तुरंत पुष्टि करें:\n\nhttps://internal-portal.info/benefits/enroll',
        explanation: 'एचआर लाभ के नाम पर बाहरी .info डोमेन से आने वाले लिंक फ़िशिंग हो सकते हैं।'
      },
      pa: {
        subject: 'ਕਾਰਵਾਈ ਦੀ ਲੋੜ: ਸਿਹਤ ਬੀਮਾ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
        body: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ,\n\nਸਿਹਤ ਬੀਮਾ ਫਾਰਮ ਅੱਜ ਰਾਤ ਤੱਕ ਪੂਰਾ ਕਰੋ:\n\nhttps://internal-portal.info/benefits/enroll',
        explanation: 'ਅਣਅਧਿਕਾਰਤ ਬਾਹਰੀ ਲਿੰਕਾਂ ਤੇ ਕਦੇ ਵੀ ਆਪਣੇ ਲੌਗਇਨ ਵੇਰਵੇ ਨਾ ਭਰੋ।'
      }
    }
  },
  SMISHING_COURIER: {
    category: 'smishing',
    attackType: 'SMS',
    senderDisplayName: 'IndiaPost Alerts (+91-98721-XXXXX)',
    subject: 'SMS Alert: Consignment #IN89210084 Held at Hub',
    body: `[IndiaPost Alert] Your consignment #IN89210084 cannot be delivered due to incomplete street address. Update your house number and pay re-delivery charge of Rs. 15 within 12 hours to avoid return: https://indiapost-parcel-kyc.top/update`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Smishing (SMS Phishing): Fraudulent text claiming held parcel to extract debit/credit card or banking details via an illegitimate .top web link.',
    difficulty: 'BEGINNER',
    redFlags: [
      { flag: 'Unofficial SMS Sender', description: 'Sent from an ordinary mobile number (+91-98721) instead of official postal shortcode (e.g. AD-INDPOST).', location: 'sender' },
      { flag: 'Fake Nominal Fee', description: 'Asking for tiny token fee (Rs. 15) to lure victims into entering bank card numbers and OTPs.', location: 'body' },
      { flag: 'Deceptive Top-Level Domain', description: 'Uses .top extension rather than the government portal indiapost.gov.in.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'एसएमएस अलर्ट: पार्सल रुका हुआ है',
        body: '[IndiaPost] पार्सल #IN89210084 पते की कमी के कारण रुका है। 15 रुपये का शुल्क देकर पता अपडेट करें: https://indiapost-parcel-kyc.top/update',
        explanation: 'डाक विभाग कभी भी व्यक्तिगत नंबरों से या .top वेबसाइट लिंक के माध्यम से भुगतान नहीं मांगता।'
      },
      pa: {
        subject: 'SMS ਅਲਰਟ: ਪਾਰਸਲ ਰੁਕਿਆ ਹੋਇਆ ਹੈ',
        body: '[IndiaPost] ਪਾਰਸਲ #IN89210084 ਲਈ 15 ਰੁਪਏ ਫੀਸ ਦੇ ਕੇ ਪਤਾ ਅੱਪਡੇਟ ਕਰੋ: https://indiapost-parcel-kyc.top/update',
        explanation: 'ਕਦੇ ਵੀ ਸ਼ੱਕੀ SMS ਲਿੰਕਾਂ ਰਾਹੀਂ ਬੈਂਕ ਵੇਰਵੇ ਨਾ ਦਿਓ।'
      }
    }
  },
  UPI_PAYMENT_FRAUD: {
    category: 'upi_fraud',
    attackType: 'UPI',
    senderDisplayName: 'PhonePe Rewards Desk (support@phonepe-rewards.biz)',
    subject: 'UPI Reward: Cashback of Rs. 4,850 Approved - Enter UPI PIN to Receive',
    body: `Congratulations! You have received a festive corporate reward cashback of Rs. 4,850.

Scan the attached QR code or click the UPI payment collect link and enter your 4-digit or 6-digit UPI PIN into your UPI app (Google Pay / PhonePe / Paytm) to deposit the funds into your bank account immediately.

Collect Reward: upi://pay?pa=corporate.rewards@okaxis&pn=FestiveCashback&am=4850`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Golden Rule of UPI: You NEVER enter your UPI PIN to receive money. Entering your PIN always deducts money from your account!',
    difficulty: 'BEGINNER',
    redFlags: [
      { flag: 'UPI PIN Scam', description: 'Claiming you need to enter your UPI PIN to RECEIVE funds. Entering your PIN ALWAYS debits your account.', location: 'body' },
      { flag: 'Unrealistic Cash Reward', description: 'Promises unexpected high cash prize to excite the user into hasty compliance.', location: 'body' },
      { flag: 'Fake Collect Request', description: 'Uses a UPI pay/collect request disguised as a deposit.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'यूपीआई इनाम: 4,850 रुपये का कैशबैक - प्राप्त करने के लिए पिन दर्ज करें',
        body: 'बधाई हो! आपको 4,850 रुपये का कैशबैक मिला है। पैसे प्राप्त करने के लिए अपना यूपीआई पिन दर्ज करें।',
        explanation: 'याद रखें: पैसे प्राप्त करने के लिए कभी भी यूपीआई पिन की आवश्यकता नहीं होती। पिन डालने से पैसे कटते हैं!'
      },
      pa: {
        subject: 'UPI ਇਨਾਮ: 4,850 ਰੁਪਏ ਕੈਸ਼ਬੈਕ - ਪੈਸੇ ਲੈਣ ਲਈ ਪਿਨ ਦਰਜ ਕਰੋ',
        body: 'ਵਧਾਈਆਂ! ਤੁਹਾਨੂੰ 4,850 ਰੁਪਏ ਮਿਲੇ ਹਨ। ਪੈਸੇ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ UPI PIN ਦਰਜ ਕਰੋ।',
        explanation: 'ਯਾਦ ਰੱਖੋ: ਪੈਸੇ ਲੈਣ ਲਈ ਕਦੇ ਵੀ UPI PIN ਦੀ ਲੋੜ ਨਹੀਂ ਹੁੰਦੀ!'
      }
    }
  },
  VISHING_IT_SUPPORT: {
    category: 'vishing',
    attackType: 'VOICE',
    senderDisplayName: 'Voice Script: "Corporate IT Help Desk" (+1-800-FAKE-IT)',
    subject: 'Inbound Call Simulation: Emergency VPN Security Certificate Update',
    body: `[Simulated Audio Transcript]
Caller: "Hello, this is Kevin from the Global IT Infrastructure Help Desk. We are pushing an emergency patch for the corporate GlobalProtect VPN due to a critical zero-day vulnerability. 

I just triggered an authentication push to your Authenticator app. Please press 'Approve' and read me the two-digit number displayed on your screen so I can verify your terminal connection before the network cut-off."`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Vishing (Voice Phishing / MFA Fatigue): Fraudsters call employees impersonating IT staff and ask them to approve MFA prompts or read 2FA codes.',
    difficulty: 'INTERMEDIATE',
    redFlags: [
      { flag: 'Requesting MFA Approval', description: 'Legitimate IT support will NEVER ask you to approve an unsolicited MFA push or divulge 2FA codes over the phone.', location: 'body' },
      { flag: 'Unsolicited Inbound Call', description: 'Unexpected call claiming to be internal IT without a prior scheduled support ticket.', location: 'sender' },
      { flag: 'Threat of Network Cut-Off', description: 'Using fear of losing access to bypass verification.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'वॉइस कॉल सिमुलेशन: आपातकालीन वीपीएन अपडेट',
        body: '[कॉल ट्रांसक्रिप्ट] "नमस्ते, मैं आईटी हेल्पडेस्क से हूँ। आपके फोन पर आए 2FA कोड को मुझे बताएं ताकि हम आपका वीपीएन अपडेट कर सकें।"',
        explanation: 'सच्ची आईटी टीम कभी भी फोन पर आपसे 2FA कोड या ओटीपी नहीं मांगती।'
      },
      pa: {
        subject: 'ਕਾਲ ਸਿਮੂਲੇਸ਼ਨ: ਜ਼ਰੂਰੀ VPN ਅੱਪਡੇਟ',
        body: '[ਕਾਲ ਰਿਕਾਰਡਿੰਗ] "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ IT ਡੈਸਕ ਤੋਂ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਫ਼ੋਨ ਦਾ 2FA OTP ਕੋਡ ਮੈਨੂੰ ਦੱਸੋ।"',
        explanation: 'ਕਦੇ ਵੀ ਫ਼ੋਨ ਤੇ ਕਿਸੇ ਨਾਲ OTP ਜਾਂ 2FA ਕੋਡ ਸਾਂਝਾ ਨਾ ਕਰੋ।'
      }
    }
  },
  QR_CODE_PHISHING: {
    category: 'qr_code_phishing',
    attackType: 'QR',
    senderDisplayName: 'Cafeteria Management <catering@office-amenities.net>',
    subject: 'New Smart Cafeteria Menu & 50% Employee Lunch Subsidy',
    body: `All Staff Notice:

Our office cafeteria has upgraded to a contactless ordering system! 

Scan the QR code printed below with your mobile phone camera to link your corporate identity, browse today's menu, and instantly claim your 50% employee lunch subsidy credit:

[ █▀▀▀▀▀█ ▄▄█ █▀▀▀▀▀█ ]  <- Simulated QR Code
[ █ ███ █ ▄▀█ █ ███ █ ]  Target URL: https://cafeteria-auth-login.tk/sso
[ █▀▀▀▀▀█ █ █ █▀▀▀▀▀█ ]

Please sign in using your corporate Google/Microsoft credentials to activate subsidized pricing.`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Quishing (QR Code Phishing): QR codes hide destination URLs from users and email scanners, directing them to lookalike login forms on their mobile devices.',
    difficulty: 'INTERMEDIATE',
    redFlags: [
      { flag: 'Hidden Target URL in QR', description: 'QR codes obscure destination addresses. The actual destination (.tk) is an unmanaged top-level domain.', location: 'body' },
      { flag: 'Corporate SSO for Cafeteria', description: 'Requesting corporate single sign-on credentials for an external cafeteria menu service.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'कैफेटेरिया 50% छूट: क्यूआर कोड स्कैन करें',
        body: 'कार्यालय कैफेटेरिया नोटिस:\n\n50% भोजन छूट पाने के लिए क्यूआर कोड स्कैन करें और कॉर्पोरेट क्रेडेंशियल से लॉगिन करें:\nhttps://cafeteria-auth-login.tk/sso',
        explanation: 'क्यूआर कोड के पीछे छिपे हुए फ़िशिंग लिंक मोबाइल फोन पर क्रेडेंशियल चुराते हैं।'
      },
      pa: {
        subject: 'ਕੈਫੇਟੇਰੀਆ 50% ਛੋਟ: QR ਕੋਡ ਸਕੈਨ ਕਰੋ',
        body: 'ਨੋਟਿਸ: 50% ਛੋਟ ਲਈ QR ਕੋਡ ਸਕੈਨ ਕਰੋ ਅਤੇ ਲੌਗਇਨ ਕਰੋ:\nhttps://cafeteria-auth-login.tk/sso',
        explanation: 'ਕਦੇ ਵੀ QR ਕੋਡ ਸਕੈਨ ਕਰਕੇ ਆਪਣੇ ਦਫਤਰ ਦੇ ਪਾਸਵਰਡ ਨਾ ਭਰੋ।'
      }
    }
  },
  DEEPFAKE_VOICE_SCAM: {
    category: 'deepfake_voice',
    attackType: 'AUDIO',
    senderDisplayName: 'Executive Voice Memo <exec-voicemail@audio-gateway.net>',
    subject: 'Voice Memo from Managing Director: Urgent Acquisition Escrow Deposit',
    body: `[AI-Synthesized Voice Audio Attached: memo_md_confidential.mp3]

Audio Transcript:
"Hi, it's Rajan here. I'm boarding the flight to Singapore for the strategic merger. Listen carefully: our legal partners require an emergency escrow retainer of Rs. 12,00,000 wired before markets close at 3 PM today, otherwise the exclusivity clause expires. I’ve texted the vendor account details. Authorize this immediately and we will do paperwork on Monday."`,
    expectedClassification: 'SUSPICIOUS',
    explanation: 'Deepfake Executive Impersonation: Attackers use voice cloning AI trained on public speeches or webinar clips to mimic executives demanding emergency wires.',
    difficulty: 'ADVANCED',
    redFlags: [
      { flag: 'Voice Clone Indicator', description: 'Audio-only instructions demanding irregular financial movement without multi-person signoff.', location: 'body' },
      { flag: 'Urgent Wire Before Market Close', description: 'Manufactured artificial deadline to bypass standard dual-control financial authorization protocols.', location: 'body' },
      { flag: 'Bypassing Policy', description: 'Explicit request to skip paperwork until next week.', location: 'body' }
    ],
    translations: {
      hi: {
        subject: 'प्रबंध निदेशक से वॉइस मेमो: तत्काल एस्क्रो जमा',
        body: '[एआई वॉयस रिकॉर्डिंग]\n"नमस्ते, मैं राजन बोल रहा हूँ। हमारी सिंगापुर डील के लिए तुरंत 12 लाख रुपये ट्रांसफर करें, कागजी कार्रवाई सोमवार को करेंगे।"',
        explanation: 'एआई वॉयस क्लोनिंग तकनीक से अधिकारियों की आवाज बनाई जा सकती है। हमेशा इन-पर्सन या मानक बैंकिंग प्रोटोकॉल से पुष्टि करें।'
      },
      pa: {
        subject: 'ਮੈਨੇਜਿੰਗ ਡਾਇਰੈਕਟਰ ਦਾ ਵਾਇਸ ਮੈਮੋ: ਜ਼ਰੂਰੀ ਫੰਡ ਟ੍ਰਾਂਸਫਰ',
        body: '[AI ਵਾਇਸ ਮੈਮੋ]\n"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਰਾਜਨ ਬੋਲ ਰਿਹਾ ਹਾਂ। ਤੁਰੰਤ 12 ਲੱਖ ਰੁਪਏ ਟ੍ਰਾਂਸਫਰ ਕਰੋ।"',
        explanation: 'AI ਦੁਆਰਾ ਆਵਾਜ਼ ਨਕਲ ਕਰਕੇ ਧੋਖਾਧੜੀ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ। ਵਿੱਤੀ ਲੈਣ-ਦੇਣ ਦੀ ਹਮੇਸ਼ਾ ਦੋਹਰੀ ਜਾਂਚ ਕਰੋ।'
      }
    }
  }
};

export const templateNames = Object.keys(templates);

export function getCampaignTemplate(templateName) {
  return templates[templateName] || null;
}

export function listCampaignTemplates() {
  return Object.entries(templates).map(([key, value]) => ({ template: key, ...value }));
}
