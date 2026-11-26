import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleLanding from './components/RoleLanding';
import AppLayout from './layouts/AppLayout';

const AdminCampaignsPage = lazy(() => import('./pages/AdminCampaignsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminDepartmentsPage = lazy(() => import('./pages/AdminDepartmentsPage'));
const AdminLearningPage = lazy(() => import('./pages/AdminLearningPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminIncidentsPage = lazy(() => import('./pages/AdminIncidentsPage'));
const DepartmentLeaderboardPage = lazy(() => import('./pages/DepartmentLeaderboardPage'));
const EmployeeAnalyzerPage = lazy(() => import('./pages/EmployeeAnalyzerPage'));
const EmployeeBadgesPage = lazy(() => import('./pages/EmployeeBadgesPage'));
const EmployeeDailyChallengePage = lazy(() => import('./pages/EmployeeDailyChallengePage'));
const EmployeeDashboardPage = lazy(() => import('./pages/EmployeeDashboardPage'));
const EmployeeIncidentsPage = lazy(() => import('./pages/EmployeeIncidentsPage'));
const EmployeeProfilePage = lazy(() => import('./pages/EmployeeProfilePage'));
const EmployeeSimulationsPage = lazy(() => import('./pages/EmployeeSimulationsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ManagerDashboardPage = lazy(() => import('./pages/ManagerDashboardPage'));
const ManagerReportsPage = lazy(() => import('./pages/ManagerReportsPage'));
const ManagerTeamPage = lazy(() => import('./pages/ManagerTeamPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const MetaverseSecurityPage = lazy(() => import('./pages/MetaverseSecurityPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">Loading page…</div>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<RoleLanding />} />

          {/* ADMIN & SECURITY ANALYST ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SECURITY_ANALYST']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/learning" element={<AdminLearningPage />} />
            <Route path="/admin/campaigns" element={<AdminCampaignsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
            <Route path="/admin/metaverse" element={<MetaverseSecurityPage />} />
            <Route path="/admin/leaderboard" element={<DepartmentLeaderboardPage />} />
          </Route>

          {/* MANAGER ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/team" element={<ManagerTeamPage />} />
            <Route path="/manager/reports" element={<ManagerReportsPage />} />
            <Route path="/manager/leaderboard" element={<DepartmentLeaderboardPage />} />
          </Route>

          {/* EMPLOYEE ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/daily-challenge" element={<EmployeeDailyChallengePage />} />
            <Route path="/employee/training" element={<TrainingPage />} />
            <Route path="/employee/simulations" element={<EmployeeSimulationsPage />} />
            <Route path="/employee/analyzer" element={<EmployeeAnalyzerPage />} />
            <Route path="/employee/incidents" element={<EmployeeIncidentsPage />} />
            <Route path="/employee/leaderboard" element={<DepartmentLeaderboardPage />} />
            <Route path="/employee/recommendations" element={<RecommendationsPage />} />
            <Route path="/employee/badges" element={<EmployeeBadgesPage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
            <Route path="/employee/metaverse" element={<MetaverseSecurityPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
