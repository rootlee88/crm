import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/Login';
import DashboardPage from './pages/dashboard/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import LeadList from './pages/leads/LeadList';
import OpportunityList from './pages/opportunities/OpportunityList';
import ContractList from './pages/contracts/ContractList';
import TaskList from './pages/tasks/TaskList';
import ActivityList from './pages/activities/ActivityList';
import SettingsPage from './pages/settings/Settings';
import ReportsPage from './pages/reports/Reports';

// 路由权限配置
const rolePermissions: { [key: string]: string[] } = {
  admin: ['/dashboard', '/customers', '/leads', '/opportunities', '/contracts', '/tasks', '/activities', '/reports', '/settings'],
  manager: ['/dashboard', '/customers', '/leads', '/opportunities', '/contracts', '/tasks', '/activities', '/reports'],
  user: ['/dashboard', '/customers', '/leads', '/opportunities', '/contracts', '/tasks'],
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 权限路由包装组件
const PermissionRoute = ({ path, element }: { path: string; element: React.ReactNode }) => {
  const { user } = useAuth();
  const allowedPaths = rolePermissions[user?.role || 'user'] || [];
  
  // 管理员可以访问所有页面
  if (user?.role === 'admin') {
    return <>{element}</>;
  }
  
  // 检查是否有权限访问该路由
  if (!allowedPaths.includes(path)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{element}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <PermissionRoute path="/dashboard" element={<DashboardPage />} />,
      },
      {
        path: '/customers',
        element: <PermissionRoute path="/customers" element={<CustomerList />} />,
      },
      {
        path: '/leads',
        element: <PermissionRoute path="/leads" element={<LeadList />} />,
      },
      {
        path: '/opportunities',
        element: <PermissionRoute path="/opportunities" element={<OpportunityList />} />,
      },
      {
        path: '/contracts',
        element: <PermissionRoute path="/contracts" element={<ContractList />} />,
      },
      {
        path: '/tasks',
        element: <PermissionRoute path="/tasks" element={<TaskList />} />,
      },
      {
        path: '/activities',
        element: <PermissionRoute path="/activities" element={<ActivityList />} />,
      },
      {
        path: '/reports',
        element: <PermissionRoute path="/reports" element={<ReportsPage />} />,
      },
      {
        path: '/settings',
        element: <PermissionRoute path="/settings" element={<SettingsPage />} />,
      },
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export default router;