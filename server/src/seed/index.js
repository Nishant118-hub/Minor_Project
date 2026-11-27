import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';
import InteractionLog from '../models/InteractionLog.js';
import PhishingCampaign from '../models/PhishingCampaign.js';
import QuizResult from '../models/QuizResult.js';
import RiskScore from '../models/RiskScore.js';
import TrainingModule from '../models/TrainingModule.js';
import { connectDatabase } from '../config/db.js';
import { getCampaignTemplate } from '../services/campaignTemplates.js';
import { calculateAndStoreRiskProfile } from '../services/riskProfileService.js';
import { ensureBootstrapAdmin } from '../services/bootstrapAdminService.js';

dotenv.config();

async function seedDepartments() {
  const departments = [
    { name: 'Security Operations', description: 'Security operations and incident readiness.' },
    { name: 'Engineering', description: 'Product engineering and platform support.' },
    { name: 'Human Resources', description: 'People operations and internal staff readiness.' }
  ];

  const created = await Promise.all(
    departments.map(async (department) => {
      const existing = await Department.findOne({ name: department.name });
      if (existing) return existing;
      return Department.create(department);
    })
  );

  return created;
}

async function seedUsers(departments) {
  const [securityOps, engineering, hr] = departments;
  const admin = await ensureBootstrapAdmin();

  const users = [
    { name: 'Security Analyst', email: 'analyst@cyber.local', password: 'Analyst@123', role: 'SECURITY_ANALYST', department: securityOps._id },
    { name: 'Security Manager', email: 'manager@cyber.local', password: 'Manager@123', role: 'MANAGER', department: securityOps._id },
    { name: 'Engineering Manager', email: 'eng.manager@cyber.local', password: 'Manager@123', role: 'MANAGER', department: engineering._id },
    { name: 'HR Manager', email: 'hr.manager@cyber.local', password: 'Manager@123', role: 'MANAGER', department: hr._id },
    { name: 'Ava Johnson', email: 'ava@cyber.local', password: 'Employee@123', role: 'EMPLOYEE', department: securityOps._id, isSimulationParticipant: true, points: 65, level: 'Defender' },
    { name: 'Noah Smith', email: 'noah@cyber.local', password: 'Employee@123', role: 'EMPLOYEE', department: engineering._id, isSimulationParticipant: true, points: 130, level: 'Defender', isSecurityChampion: true },
    { name: 'Mia Brown', email: 'mia@cyber.local', password: 'Employee@123', role: 'EMPLOYEE', department: hr._id, isSimulationParticipant: true, points: 165, level: 'Guardian', isSecurityChampion: true },
    { name: 'Ethan Wilson', email: 'ethan@cyber.local', password: 'Employee@123', role: 'EMPLOYEE', department: engineering._id, isSimulationParticipant: true, points: 40, level: 'Rookie' },
    { name: 'Zoe Patel', email: 'zoe@cyber.local', password: 'Employee@123', role: 'EMPLOYEE', department: hr._id, isSimulationParticipant: true, points: 30, level: 'Rookie' }
  ];

  const demoUsers = await Promise.all(
    users.map(async (user) => {
      const existing = await User.findOne({ email: user.email });
      if (existing) return existing;
      return User.create(user);
    })
  );
  const createdUsers = [admin, ...demoUsers];

  const managers = createdUsers.filter((user) => user.role === 'MANAGER');

  for (const manager of managers) {
    const department = departments.find((item) => String(item._id) === String(manager.department));
    if (department) {
      const employeeCount = await User.countDocuments({ department: department._id, role: 'EMPLOYEE' });
      await Department.findByIdAndUpdate(department._id, { manager: manager._id, employeeCount });
    }
  }

  if (admin) {
    await Department.updateMany({}, { $set: { manager: null } });
    for (const manager of managers) {
      const department = departments.find((item) => String(item._id) === String(manager.department));
      if (department) {
        await Department.findByIdAndUpdate(department._id, { manager: manager._id });
      }
    }
  }

  return createdUsers;
}

async function seedTrainingModules(createdBy) {
  const moduleDefinitions = [
    {
      title: 'Phishing Basics',
      description: 'Learn how phishing scams try to steal credentials or trigger unsafe actions.',
      category: 'Phishing Awareness',
      difficulty: 'BEGINNER',
      contentType: 'ARTICLE',
      duration: 15,
      passingScore: 70,
      isActive: true,
      createdBy,
      quiz: [
        {
          question: 'What is the strongest first step when you receive a suspicious email?',
          options: ['Reply immediately', 'Verify the request through a trusted channel', 'Open any attachment', 'Click the link to be safe'],
          correctAnswer: 1,
          explanation: 'Always verify requests through a trusted channel instead of acting on urgency cues.'
        },
        {
          question: 'What should you do if a message asks for credentials?',
          options: ['Enter them to check', 'Report and verify through the official site', 'Forward it to all staff', 'Delete it without reporting'],
          correctAnswer: 1,
          explanation: 'Never enter credentials into unverified requests; report and verify through official channels.'
        },
        {
          question: 'Which detail is a common warning sign in an unexpected email?',
          options: ['A familiar greeting', 'Pressure to act immediately', 'A routine team update', 'A message you expected'],
          correctAnswer: 1,
          explanation: 'Urgency is often used to discourage careful verification.'
        }
      ]
    },
    {
      title: 'Safe Password Hygiene',
      description: 'Understand healthy password practices and how to handle resets safely.',
      category: 'Password Security',
      difficulty: 'INTERMEDIATE',
      contentType: 'VIDEO',
      duration: 20,
      passingScore: 75,
      isActive: true,
      createdBy,
      quiz: [
        {
          question: 'Which of these is a good password practice?',
          options: ['Reuse one password everywhere', 'Use a manager password for all accounts', 'Create unique passwords with a password manager', 'Write passwords on sticky notes'],
          correctAnswer: 2,
          explanation: 'Unique passwords and a password manager reduce the blast radius of account compromise.'
        },
        {
          question: 'When you receive a password reset email, what should you do?',
          options: ['Click the link in the email', 'Open the official site yourself and verify', 'Give the password to a teammate', 'Ask the sender to confirm by chat link'],
          correctAnswer: 1,
          explanation: 'Visit the verified official site instead of using a link embedded in the message.'
        },
        {
          question: 'What does multi-factor authentication add?',
          options: ['A second independent proof of identity', 'A shared team password', 'A replacement for software updates', 'A way to skip account recovery checks'],
          correctAnswer: 0,
          explanation: 'A separate factor makes a stolen password less useful on its own.'
        }
      ]
    },
    {
      title: 'Reporting Suspicious Activity',
      description: 'Understand why quick reporting can reduce organizational risk and improve response time.',
      category: 'Incident Reporting',
      difficulty: 'ADVANCED',
      contentType: 'INTERACTIVE',
      duration: 25,
      passingScore: 80,
      isActive: true,
      createdBy,
      quiz: [
        {
          question: 'What is the main benefit of reporting suspicious messages quickly?',
          options: ['It prevents the message from being seen again', 'It helps the team contain risk early', 'It guarantees the sender is blocked instantly', 'It removes all user risk'],
          correctAnswer: 1,
          explanation: 'Rapid reporting gives the security team a chance to contain threats before they spread.'
        },
        {
          question: 'The best path after seeing a suspicious message is to:',
          options: ['Share it with all coworkers', 'Open it in the browser to inspect it', 'Report it through the official process and avoid interaction', 'Delete the message and forget it'],
          correctAnswer: 2,
          explanation: 'Reporting through the official process and avoiding interaction is the safest action.'
        },
        {
          question: 'What information should be included in an incident report?',
          options: ['Your account password', 'The message or event and when it occurred', 'A guess about who caused it', 'A public social media post'],
          correctAnswer: 1,
          explanation: 'Useful facts and timing help responders investigate without exposing secrets.'
        }
      ]
    },
    {
      title: 'Malware and Attachment Safety',
      description: 'Recognize risky files and reduce malware exposure on work devices.',
      category: 'Malware Awareness', difficulty: 'BEGINNER', contentType: 'ARTICLE', duration: 15, passingScore: 70, isActive: true, createdBy,
      quiz: [
        { question: 'An unexpected attachment arrives from an unknown sender. What is safest?', options: ['Open it in preview', 'Verify the sender through a trusted channel and report it', 'Forward it to a colleague', 'Rename it first'], correctAnswer: 1, explanation: 'Unexpected files should be verified before opening; suspicious messages should be reported.' },
        { question: 'Why should work devices receive security updates?', options: ['They close known security weaknesses', 'They make every email trustworthy', 'They remove the need for backups', 'They prevent all human error'], correctAnswer: 0, explanation: 'Updates often fix vulnerabilities that malware could otherwise exploit.' },
        { question: 'What should you do if endpoint protection raises an alert?', options: ['Disable protection', 'Follow the approved IT reporting process', 'Download another scanner from an ad', 'Ignore it if the device still works'], correctAnswer: 1, explanation: 'Use the organization’s incident process and do not disable protective controls.' }
      ]
    },
    {
      title: 'Social Engineering and Verification',
      description: 'Spot manipulation tactics and verify unusual requests independently.',
      category: 'Social Engineering', difficulty: 'INTERMEDIATE', contentType: 'INTERACTIVE', duration: 20, passingScore: 75, isActive: true, createdBy,
      quiz: [
        { question: 'A caller requests a one-time sign-in code to fix your account. What should you do?', options: ['Share it if they know your name', 'Never share the code and contact IT using a known channel', 'Send a screenshot instead', 'Ask them to call again later'], correctAnswer: 1, explanation: 'One-time codes are authentication secrets and should never be shared.' },
        { question: 'A request to bypass normal approval arrives from a senior colleague. What is the best response?', options: ['Comply because of their title', 'Verify through a separate trusted channel', 'Forward it to the whole company', 'Use a personal account'], correctAnswer: 1, explanation: 'Authority and urgency can be used to manipulate; independent verification is appropriate.' },
        { question: 'Which is an example of pretexting?', options: ['A scheduled software update', 'A fabricated identity or story used to obtain information', 'A public security notice', 'A routine meeting reminder'], correctAnswer: 1, explanation: 'Pretexting uses a made-up scenario or identity to influence a target.' }
      ]
    },
    {
      title: 'Data Protection Essentials',
      description: 'Handle sensitive information according to access and sharing policies.',
      category: 'Data Protection', difficulty: 'BEGINNER', contentType: 'ARTICLE', duration: 18, passingScore: 70, isActive: true, createdBy,
      quiz: [
        { question: 'Before sharing a sensitive file, what should you verify?', options: ['Recipient identity and authorization', 'That the filename is short', 'That a public link is convenient', 'That the file is unencrypted'], correctAnswer: 0, explanation: 'Confirm both the recipient and their need and authorization to access the information.' },
        { question: 'What is the safest default for access to sensitive information?', options: ['Give access to everyone', 'Grant only the access needed for the task', 'Use a shared public link', 'Email copies to personal accounts'], correctAnswer: 1, explanation: 'Least privilege limits exposure if an account or file is misused.' },
        { question: 'You sent a document to the wrong recipient. What should you do?', options: ['Wait to see if they notice', 'Report it promptly using the approved incident channel', 'Delete your sent message only', 'Send more context'], correctAnswer: 1, explanation: 'Prompt reporting enables the organization to assess and contain accidental disclosure.' }
      ]
    },
    {
      title: 'Safe Internet Browsing',
      description: 'Use trusted sites and avoid unsafe downloads and deceptive browser prompts.',
      category: 'Safe Browsing', difficulty: 'BEGINNER', contentType: 'VIDEO', duration: 16, passingScore: 70, isActive: true, createdBy,
      quiz: [
        { question: 'A webpage prompts you to install an unexpected browser extension. What should you do?', options: ['Install to continue', 'Close the prompt and check with IT if needed', 'Disable browser protections', 'Use a personal device instead'], correctAnswer: 1, explanation: 'Unapproved extensions can access sensitive browsing data; use approved software only.' },
        { question: 'How should you reach a sensitive work service?', options: ['Use a saved or independently verified official address', 'Follow any sponsored search result', 'Use a link from an unknown message', 'Accept every certificate warning'], correctAnswer: 0, explanation: 'Use a known address and heed browser security warnings.' },
        { question: 'What should you do when a browser warns that a connection is unsafe?', options: ['Proceed and enter work credentials', 'Stop and report or verify the issue', 'Disable the warning', 'Switch to an unknown network'], correctAnswer: 1, explanation: 'Do not bypass security warnings on services that handle work information.' }
      ]
    },
    {
      title: 'Multi-Factor Authentication',
      description: 'Protect accounts with strong authentication and safe recovery habits.',
      category: 'Password Security', difficulty: 'INTERMEDIATE', contentType: 'INTERACTIVE', duration: 14, passingScore: 75, isActive: true, createdBy,
      quiz: [
        { question: 'You receive an MFA prompt you did not initiate. What should you do?', options: ['Approve it to stop notifications', 'Deny it and report the unexpected prompt', 'Share the prompt with a coworker', 'Turn off MFA'], correctAnswer: 1, explanation: 'Unexpected prompts can signal a sign-in attempt; deny and report them.' },
        { question: 'Where should account recovery codes be stored?', options: ['In a public team document', 'In an approved secure location', 'In an email draft', 'On a shared workstation'], correctAnswer: 1, explanation: 'Recovery codes are sensitive and should be protected like authentication secrets.' },
        { question: 'What is the best response to repeated MFA prompts?', options: ['Approve one', 'Deny them and contact the security team', 'Send a code to the requester', 'Reuse an old password'], correctAnswer: 1, explanation: 'Repeated unexpected prompts should be treated as suspicious and reported.' }
      ]
    },
    {
      title: 'Remote Work Security',
      description: 'Protect devices and work data while traveling or working away from the office.',
      category: 'Data Protection', difficulty: 'INTERMEDIATE', contentType: 'ARTICLE', duration: 19, passingScore: 75, isActive: true, createdBy,
      quiz: [
        { question: 'What is a safer choice for sensitive work on public Wi-Fi?', options: ['Use the approved secure connection method', 'Disable device encryption', 'Share files over open nearby sharing', 'Use any available hotspot'], correctAnswer: 0, explanation: 'Follow organization-approved network protections when working remotely.' },
        { question: 'How should a work laptop be handled in a public place?', options: ['Leave it unattended briefly', 'Keep it secured and within your control', 'Lend it to a stranger', 'Disable its screen lock'], correctAnswer: 1, explanation: 'Physical access can expose data even when online protections are strong.' },
        { question: 'A family member needs to use your work device. What should you do?', options: ['Share your account', 'Keep the device and account for authorized work use only', 'Create a shared password', 'Leave your session open'], correctAnswer: 1, explanation: 'Work devices and accounts should only be used by authorized people.' }
      ]
    }
  ];

  const createdModules = await Promise.all(
    moduleDefinitions.map(async (module) => {
      const { createdBy: moduleCreator, ...moduleFields } = module;
      return TrainingModule.findOneAndUpdate(
        { title: module.title },
        { $set: moduleFields, $setOnInsert: { createdBy: moduleCreator } },
        { new: true, upsert: true }
      );
    })
  );

  return createdModules;
}

async function seedAssessmentResults(employees, modules) {
  const scores = [60, 75, 85, 90, 70];
  for (const [index, employee] of employees.entries()) {
    const module = modules[index % modules.length];
    const score = scores[index % scores.length];
    const totalQuestions = module.quiz.length;
    const correctAnswers = Math.round((score / 100) * totalQuestions);
    await QuizResult.updateOne(
      { userId: employee._id, trainingModuleId: module._id },
      {
        $setOnInsert: {
          userId: employee._id,
          trainingModuleId: module._id,
          score: Number(((correctAnswers / totalQuestions) * 100).toFixed(2)),
          totalQuestions,
          correctAnswers,
          difficulty: module.difficulty,
          completedAt: new Date(Date.now() - (index + 1) * 86400000)
        }
      },
      { upsert: true }
    );
  }
}

async function seedSimulations(admin, employees) {
  const scenarios = [
    { name: 'Invoice review request', template: 'FAKE_INVOICE' },
    { name: 'Urgent executive request', template: 'URGENT_CEO_REQUEST' },
    { name: 'Unexpected password reset', template: 'PASSWORD_RESET' },
    { name: 'Routine delivery update', template: 'DELIVERY_NOTIFICATION' },
    { name: 'Account verification notice', template: 'ACCOUNT_VERIFICATION' },
    { name: 'Courier postal hold notice', template: 'SMISHING_COURIER' },
    { name: 'UPI festive reward cashback', template: 'UPI_PAYMENT_FRAUD' },
    { name: 'IT emergency VPN MFA push', template: 'VISHING_IT_SUPPORT' },
    { name: 'Cafeteria discount QR scan', template: 'QR_CODE_PHISHING' },
    { name: 'Executive voice memo transfer', template: 'DEEPFAKE_VOICE_SCAM' }
  ];

  for (const [index, scenario] of scenarios.entries()) {
    let campaign = await PhishingCampaign.findOne({ name: scenario.name });
    if (campaign) continue;
    const template = getCampaignTemplate(scenario.template);
    const sentAt = new Date(Date.now() - (index + 1) * 3600000);
    campaign = await PhishingCampaign.create({
      ...scenario,
      ...template,
      name: scenario.name,
      description: 'Consent-based, in-app-only awareness exercise. No email is sent and no external links are used.',
      simulationMode: true,
      simulationUrl: '',
      targetUsers: employees.map((employee) => employee._id),
      status: 'ACTIVE',
      sentAt,
      createdBy: admin._id,
      statistics: { sent: employees.length }
    });
    await InteractionLog.insertMany(employees.map((employee) => ({
      campaignId: campaign._id,
      userId: employee._id,
      eventType: 'SENT',
      category: campaign.category,
      timestamp: sentAt,
      metadata: { source: 'internal_sandbox_simulation', delivery: 'in_app_only' }
    })));
  }
}

async function seedRiskAssessments(employees) {
  for (const employee of employees) {
    if (await RiskScore.exists({ userId: employee._id })) continue;
    await calculateAndStoreRiskProfile(employee._id);
  }
}

async function main() {
  try {
    await connectDatabase();
    const departments = await seedDepartments();
    const users = await seedUsers(departments);
    const admin = users.find((user) => user.role === 'ADMIN');
    if (!admin) {
      throw new Error('Admin user was not created.');
    }
    const modules = await seedTrainingModules(admin._id);
    const employees = users.filter((user) => user.role === 'EMPLOYEE');
    await seedAssessmentResults(employees, modules);
    await seedSimulations(admin, employees);
    await seedRiskAssessments(employees);
    console.log('Seed data complete.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

main();
