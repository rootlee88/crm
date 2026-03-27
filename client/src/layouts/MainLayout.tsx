import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, message, Tag, Modal, Form, Input } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  RadarChartOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api';

const { Header, Sider, Content } = Layout;

// 角色权限菜单配置
const roleMenus: { [key: string]: { key: string; icon: React.ReactNode; label: string }[] } = {
  admin: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
    { key: '/leads', icon: <RadarChartOutlined />, label: '线索管理' },
    { key: '/opportunities', icon: <DollarOutlined />, label: '商机管理' },
    { key: '/contracts', icon: <FileTextOutlined />, label: '合同管理' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: '任务管理' },
    { key: '/activities', icon: <HistoryOutlined />, label: '活动日志' },
    { key: '/reports', icon: <BarChartOutlined />, label: '报表分析' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  ],
  manager: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
    { key: '/leads', icon: <RadarChartOutlined />, label: '线索管理' },
    { key: '/opportunities', icon: <DollarOutlined />, label: '商机管理' },
    { key: '/contracts', icon: <FileTextOutlined />, label: '合同管理' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: '任务管理' },
    { key: '/activities', icon: <HistoryOutlined />, label: '活动日志' },
    { key: '/reports', icon: <BarChartOutlined />, label: '报表分析' },
  ],
  user: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
    { key: '/leads', icon: <RadarChartOutlined />, label: '线索管理' },
    { key: '/opportunities', icon: <DollarOutlined />, label: '商机管理' },
    { key: '/contracts', icon: <FileTextOutlined />, label: '合同管理' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: '任务管理' },
  ],
};

const roleLabels: { [key: string]: { text: string; color: string } } = {
  admin: { text: '管理员', color: 'red' },
  manager: { text: '销售经理', color: 'orange' },
  user: { text: '销售代表', color: 'blue' },
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const handlePasswordChange = async (values: { oldPassword: string; newPassword: string }) => {
    try {
      await authApi.changePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功，请重新登录');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      logout();
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || '密码修改失败');
    }
  };

  // 根据用户角色获取菜单项
  const userRole = user?.role || 'user';
  const menuItems = roleMenus[userRole] || roleMenus.user;

  const userMenuItems = [
    {
      key: 'changePassword',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="bg-white fixed left-0 top-0 bottom-0 z-10 h-screen"
      >
        <div className="h-16 flex items-center justify-center border-b">
          {!collapsed && (
            <span className="text-lg font-bold text-gray-800">CRM 系统</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0"
          style={{ marginTop: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header className="bg-white px-4 flex justify-between items-center shadow-sm fixed top-0 right-0 z-10" style={{ width: collapsed ? 'calc(100% - 80px)' : 'calc(100% - 200px)', height: 64 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer">
              <Avatar className="bg-blue-500">
                {user?.realName?.[0] || user?.username?.[0] || 'U'}
              </Avatar>
              <span className="ml-2 mr-2">{user?.realName || user?.username}</span>
              <Tag color={roleLabels[userRole]?.color}>{roleLabels[userRole]?.text}</Tag>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-4" style={{ marginTop: 64 }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => { setPasswordModalVisible(false); passwordForm.resetFields(); }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainLayout;