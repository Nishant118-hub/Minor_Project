import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleLanding from './components/RoleLanding';
import AppLayout from './layouts/AppLayout';
import AdminCampaignsPage from './pages/AdminCampaignsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDepartmentsPage from './pages/AdminDepartmentsPage';
import AdminLearningPage from './pages/AdminLearningPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import EmployeeBadgesPage from './pages/EmployeeBadgesPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import EmployeeSimulationsPage from './pages/EmployeeSimulationsPage';
import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import ManagerReportsPage from './pages/ManagerReportsPage';
import ManagerTeamPage from './pages/ManagerTeamPage';
import RecommendationsPage from './pages/RecommendationsPage';
import RegistrationPage from './pages/RegistrationPage';
import TrainingPage from './pages/TrainingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<RoleLanding />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/learning" element={<AdminLearningPage />} />
            <Route path="/admin/campaigns" element={<AdminCampaignsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/team" element={<ManagerTeamPage />} />
            <Route path="/manager/reports" element={<ManagerReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/training" element={<TrainingPage />} />
            <Route path="/employee/simulations" element={<EmployeeSimulationsPage />} />
            <Route path="/employee/recommendations" element={<RecommendationsPage />} />
            <Route path="/employee/badges" element={<EmployeeBadgesPage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
