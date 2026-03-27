import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">CRM 系统</h1>
          <p className="text-gray-500 mt-2">请登录您的账号</p>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className="text-center text-gray-400 text-sm mt-4">
          默认账号: admin / admin123
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;