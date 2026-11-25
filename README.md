# Employee Cyber Awareness Platform

A full-stack cybersecurity awareness platform for internal employee training, safe phishing simulations, AI-assisted risk scoring, and personalized recommendations.

## Safety boundary

This project is designed for authorized, consent-based internal training only. It never generates or sends deceptive phishing emails, never collects real credentials, never sends email to domains outside the configured internal allowlist, and never stores sensitive credentials in telemetry.

## What is included

The codebase already contains the implementation for the major phases of the platform, including:

- Authentication and role-based access
- Admin, manager, and employee dashboard views
- User and department management
- Training modules and quizzes
- Admin-scheduled employee learning assignments with availability dates, optional due dates, and per-employee progress
- Training progress tracking and gamification
- Admin tracking for individual training assignments, badges, points, and simulation classifications
- AI risk prediction and recommendation service
- Safe phishing simulation APIs and telemetry
- MongoDB-backed backend with Express + JWT
- React frontend connected to the backend

## Architecture

```text
client/       React + Vite + Tailwind CSS frontend
server/       Express + MongoDB + JWT backend
ai-service/   FastAPI AI recommendation/risk microservice
```

## Prerequisites

- VS Code
- Node.js 20+
- Python 3.11+
- MongoDB running locally or via MongoDB Atlas
- Git

## 1) Open the project in VS Code

1. Open the workspace folder: `d:\Nishant\Minor Project`
2. Open a new terminal in VS Code.
3. Confirm Node and Python are installed:

```powershell
node -v
npm -v
python --version
```

## 2) Install dependencies

From the project root:

```powershell
npm install --prefix client
npm install --prefix server
```

Create environment files from the examples:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
Copy-Item ai-service/.env.example ai-service/.env
```

Then set the values in the `.env` files, for example:

- `server/.env`
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/cyber_awareness
  JWT_SECRET=replace_with_a_long_random_development_secret
  JWT_EXPIRES_IN=1d
  AI_SERVICE_URL=http://localhost:8000
  AI_USE_ML_MODEL=true
  CLIENT_URL=http://localhost:5173
  APP_BASE_URL=http://localhost:5173
  # Optional: at least 32 characters; keep private and share only with approved admins.
  ADMIN_REGISTRATION_CODE=
  # Optional: assignment notices only go to these comma-separated internal domains.
  SMTP_HOST=
  SMTP_PORT=587
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM=
  SMTP_ALLOWED_RECIPIENT_DOMAINS=
  ```

- `client/.env`
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```

- `ai-service/.env`
  ```env
  PORT=8000
  MODEL_PATH=models/risk_model.joblib
  ```

## 3) Start MongoDB

Make sure MongoDB is running locally before starting the backend.

Example local connection:

```env
MONGO_URI=mongodb://127.0.0.1:27017/cyber_awareness
```

## 4) Install Python dependencies

Create a virtual environment and install the AI service requirements:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 5) Run the application in separate terminals

### Terminal 1: backend

```powershell
cd server
npm run dev
```

### Terminal 2: frontend

```powershell
cd client
npm run dev
```

### Terminal 3: AI service

```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The `/train-model` endpoint remains available for development and tests with reproducible synthetic data. Synthetic artifacts are not used for employee risk predictions. To train the production model, prepare a local, privacy-safe CSV containing aggregate behavior features and security-team-reviewed `risk_tier` labels.

Use one row per independent employee/time-window profile, and avoid multiple correlated windows from the same employee. Labels must be reviewed outcomes, not tiers generated from the same feature formula. Do not include names, email addresses, employee IDs, passwords, or other direct identifiers. The CSV must have these columns:

```text
click_rate,report_rate,credential_submission_rate,average_response_time,average_quiz_score,training_completion_rate,phishing_attempts,successful_reports,simulation_classifications,simulation_classification_accuracy,department,seniority,risk_tier
```

Rates and accuracy use values from `0` to `1`; quiz scores use `0` to `100`; counts are non-negative whole numbers. `risk_tier` must be `LOW`, `MEDIUM`, or `HIGH`; include at least 60 rows and at least 10 reviewed examples per tier. More independent labeled examples are needed for meaningful validation.

From the AI service directory, train and validate locally:

```powershell
python train_from_csv.py .\data\risk_training.csv
```

The command reports validation accuracy, macro-precision, macro-recall, and macro-F1, then saves the human-labeled model to `MODEL_PATH`. Training stays on this machine. Until a current human-labeled model is installed, risk scoring uses the explainable rule-based fallback. In-app simulation classification accuracy is included in risk features and recommendations.

## 6) Seed demo data

Once MongoDB is running, populate sample users, departments, training modules, assessments, and in-app simulations:

```powershell
cd d:\Nishant\Minor Project
npm run seed
```

The idempotent seed creates one admin, three managers, five employees, ten lessons with 30 quiz questions, five active in-app simulation scenarios, and sample quiz history for each employee. Demo passwords are bcrypt-hashed before storage. Simulations are assigned only to seeded participants; no messages are emailed and no external links are used.

## 7) Access the app

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/health
- AI service: http://localhost:8000/health
- AI docs: http://localhost:8000/docs

### Account registration

Employee registration is open. Admin registration is only enabled when the backend has a private `ADMIN_REGISTRATION_CODE` set to a random value of at least 32 characters. Generate one locally, for example with `python -c "import secrets; print(secrets.token_urlsafe(32))"`, put it in `server/.env`, and share it only with approved administrators. Never commit or publish the code. Without a configured code, admin sign-up is rejected; existing admin account creation by an authenticated administrator is unchanged.

## 8) Validate the AI service

After installing the Python dependencies, run the service and model contract tests from the AI service directory:

```powershell
cd d:\Nishant\Minor Project\ai-service
python -m unittest discover -s tests -p "test_*.py" -v
```

The tests cover health, risk-tier boundaries, explainable weak areas, simulation-classification scoring and recommendations, CSV label validation, and isolated synthetic/real-data model training using temporary files.

## Demo Accounts

Run the seed script before logging in. These development-only accounts are created by `server/src/seed/index.js`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@cyber.local` | `Admin@123` |
| Security Analyst | `analyst@cyber.local` | `Analyst@123` |
| Manager | `manager@cyber.local` | `Manager@123` |
| Manager | `eng.manager@cyber.local` | `Manager@123` |
| Manager | `hr.manager@cyber.local` | `Manager@123` |
| Employee | `ava@cyber.local` | `Employee@123` |
| Employee | `noah@cyber.local` | `Employee@123` |
| Employee | `mia@cyber.local` | `Employee@123` |
| Employee | `ethan@cyber.local` | `Employee@123` |
| Employee | `zoe@cyber.local` | `Employee@123` |

These credentials are for a local demonstration only. Replace or remove them before deployment.

## Core APIs

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- GET `/api/auth/profile` (alias of `/me`)

### Users and departments

- GET `/api/employees`
- GET `/api/employees/:id`
- PUT `/api/employees/:id`
- GET `/api/users`
- POST `/api/users`
- GET `/api/users/:id`
- PUT `/api/users/:id`
- PATCH `/api/users/:id/status`
- GET `/api/departments`
- POST `/api/departments`

### Training and quizzes

Admins can create modules from **Admin → Learning → Create a training module**. Add the lesson description, category, quiz questions, and correct answers; then use **Schedule employee training** on the same page. A module only appears in an employee’s Training page once it is active, assigned to that employee, and its availability date has arrived.

Scheduling a new assignment sends a clearly labeled training-notice email when SMTP is configured. Set SMTP credentials only in `server/.env`, allow only your organization’s approved recipient domains with `SMTP_ALLOWED_RECIPIENT_DOMAINS`, and set `APP_BASE_URL` to the URL employees can reach. No SMTP settings means assignments still save, and the admin UI explicitly reports that no email was sent. Re-scheduling an existing assignment does not send duplicate notices.

- GET `/api/courses`
- POST `/api/courses` (admin)
- GET `/api/assessments`
- POST `/api/assessments` (admin)
- POST `/api/assessments/:id/submit` (employee)
- GET `/api/assessments/results?userId=:id` (admin/manager; employees may request their own)
- POST `/api/learning/progress` with `{ "moduleId": "...", "progressPercent": 1 }` (employee; 1-99 only; quiz pass marks completion)
- GET `/api/training`
- GET `/api/training/assignments` (admin sees assignment progress; employees see their assigned modules)
- POST `/api/training/assignments` (admin; assign a module to all active employees, departments, or selected employees with availability and optional due dates)
- POST `/api/training`
- GET `/api/training/:id`
- PUT `/api/training/:id`
- DELETE `/api/training/:id`
- POST `/api/quizzes/:moduleId/submit`
- GET `/api/quizzes/results/:userId`

### Risk and recommendations

- GET `/api/risk/:userId`
- POST `/api/risk/calculate/:userId`
- GET `/api/risk/organization`
- GET `/api/recommendations/:userId`

### Campaigns and interactions

Admins create an in-app simulation under **Admin → Campaigns** by choosing a built-in scenario template, selecting participating employees, and launching it now or scheduling it. The approved scenario appears in the selected employees’ Simulations page when active. Email is off by default. Admins may explicitly enable a separate, clearly labeled exercise notice; it is sent only to active enrolled participants whose addresses match `SMTP_ALLOWED_RECIPIENT_DOMAINS`, and links only to the platform’s Simulations page. No deceptive simulation content is emailed, and no credentials are requested or collected.

The AI service is limited to defensive risk scoring and training recommendations based on simulation and learning outcomes. It does not generate campaign content or send email. Configure SMTP credentials only in `server/.env`; never place them in source control or chat. Email notice delivery is capped at 100 internal participants per campaign and reports sent, failed, and skipped counts in Admin → Campaigns.

- GET `/api/simulations` (admin sees campaigns; employees see only assigned active scenarios)
- POST `/api/simulations` (admin)
- POST `/api/simulations/:id/respond` with `{ "classification": "SUSPICIOUS" }` or `LEGITIMATE` (employee)
- GET `/api/interactions/available` (employee)
- POST `/api/interactions/:campaignId/respond` (employee)
- GET `/api/campaigns`
- POST `/api/campaigns`
- POST `/api/campaigns/:id/test`
- POST `/api/campaigns/:id/launch` (draft campaigns; scheduled campaigns activate automatically at their scheduled time)
- POST `/api/interactions`

### Dashboard

- GET `/api/analytics/dashboard` (admin/manager)
- GET `/api/analytics/performance?userId=:id` (role-scoped quiz history)
- GET `/api/dashboard/admin`
- GET `/api/dashboard/manager`

### AI service

- GET `/health`
- POST `/train-model` with `{"samples":2000,"seed":42}` for a development-only synthetic model; it does not replace the production model
- POST `/predict-risk?use_ml_model=true`
- POST `/recommend-training`
- Local production training: `python train_from_csv.py .\data\risk_training.csv` from `ai-service`

## Notes for VS Code / Windows

- If PowerShell blocks scripts, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

- If a port is occupied, update the relevant `.env` file or stop the process using that port.

## Verification

The frontend build was validated successfully in this workspace with:

```powershell
npm --prefix client run build
```

which completed successfully. Vite reports a large JavaScript chunk warning, but the build is not blocked.

The backend integration smoke tests can be run with:

```powershell
cd d:\Nishant\Minor Project\server
npm.cmd test
```

The backend tests cover health, protected access, and safe simulation input. The AI tests validate human-labeled CSV training and synthetic-model isolation in temporary directories.

## Project structure

```text
.
├── client/
├── server/
├── ai-service/
├── package.json
├── README.md
└── .gitignore
```

## Important

This project is intended for internal cybersecurity training use only. It should be used in a controlled environment with proper authorization and consent.
