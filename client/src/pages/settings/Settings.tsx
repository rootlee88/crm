import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, Card, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { authApi, departmentApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { User, Department } from '../../types';
import dayjs from 'dayjs';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [userData, setUserData] = useState<User[]>([]);
  const [deptData, setDeptData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userForm] = Form.useForm();
  const [deptForm] = Form.useForm();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await authApi.getUsers();
        setUserData(res);
      } else if (activeTab === 'departments') {
        const res = await departmentApi.getList();
        setDeptData(res);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingId(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (record: User) => {
    setEditingId(record.id);
    userForm.setFieldsValue({
      username: record.username,
      email: record.email,
      realName: record.realName,
      role: record.role,
      departmentId: record.departmentId,
      dataScope: record.dataScope,
      status: record.status,
    });
    setUserModalVisible(true);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await authApi.deleteUser(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitUser = async () => {
    try {
      const values = await userForm.validateFields();
      if (editingId) {
        await authApi.updateUser(editingId, values);
        message.success('更新成功');
      } else {
        await authApi.createUser(values);
        message.success('创建成功');
      }
      setUserModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddDept = () => {
    setEditingId(null);
    deptForm.resetFields();
    setDeptModalVisible(true);
  };

  const handleEditDept = (record: Department) => {
    setEditingId(record.id);
    deptForm.setFieldsValue({
      name: record.name,
      status: record.status,
    });
    setDeptModalVisible(true);
  };

  const handleDeleteDept = async (id: number) => {
    try {
      await departmentApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmitDept = async () => {
    try {
      const values = await deptForm.validateFields();
      if (editingId) {
        await departmentApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await departmentApi.create(values);
        message.success('创建成功');
      }
      setDeptModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '部门', dataIndex: 'department', key: 'department', render: (dept: Department) => dept?.name || '-' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { 
      title: '角色', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => {
        const roleMap: { [key: string]: { text: string; color: string } } = {
          admin: { text: '管理员', color: 'red' },
          manager: { text: '经理', color: 'orange' },
          user: { text: '普通用户', color: 'blue' },
        };
        return <Tag color={roleMap[role]?.color}>{roleMap[role]?.text || role}</Tag>;
      }
    },
    { 
      title: '数据范围', 
      dataIndex: 'dataScope', 
      key: 'dataScope',
      render: (scope: string) => {
        const scopeMap: { [key: string]: { text: string; color: string } } = {
          self: { text: '仅自己', color: 'blue' },
          department: { text: '本部门', color: 'orange' },
          all: { text: '全部', color: 'green' },
        };
        return <Tag color={scopeMap[scope]?.color}>{scopeMap[scope]?.text || scope}</Tag>;
      }
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            编辑
          </Button>
          {record.id !== currentUser?.id && (
            <Popconfirm title="确定删除?" onConfirm={() => handleDeleteUser(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const deptColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '部门名称', dataIndex: 'name', key: 'name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Department) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDept(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDeleteDept(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'users', label: '用户管理' },
          { key: 'departments', label: '部门管理' },
        ]} />

        {activeTab === 'users' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">用户管理</h1>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                新增用户
              </Button>
            </div>
            <Table
              dataSource={userData}
              columns={userColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </>
        )}

        {activeTab === 'departments' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">部门管理</h1>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDept}>
                新增部门
              </Button>
            </div>
            <Table
              dataSource={deptData}
              columns={deptColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </>
        )}
      </Card>

      <Modal
        title={editingId ? '编辑用户' : '新增用户'}
        open={userModalVisible}
        onOk={handleSubmitUser}
        onCancel={() => setUserModalVisible(false)}
        width={500}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          {!editingId && (
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="realName" label="姓名">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="departmentId" label="部门">
            <Select allowClear>
              {deptData.map(d => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="user">
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="manager">经理</Select.Option>
              <Select.Option value="user">普通用户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dataScope" label="数据范围" initialValue="self">
            <Select>
              <Select.Option value="self">仅自己</Select.Option>
              <Select.Option value="department">本部门</Select.Option>
              <Select.Option value="all">全部</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingId ? '编辑部门' : '新增部门'}
        open={deptModalVisible}
        onOk={handleSubmitDept}
        onCancel={() => setDeptModalVisible(false)}
        width={400}
      >
        <Form form={deptForm} layout="vertical">
          <Form.Item name="name" label="部门名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;