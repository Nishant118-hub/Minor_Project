import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const destinations = {
  ADMIN: '/admin/dashboard',
  SECURITY_ANALYST: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard'
};

export default function RoleLanding() {
  const { user } = useAuth();
  return <Navigate to={destinations[user.role] || '/login'} replace />;
}
