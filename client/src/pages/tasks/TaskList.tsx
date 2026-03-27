import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, Card, DatePicker, Segmented } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { taskApi, authApi } from '../../api';
import { Task, User } from '../../types';
import dayjs from 'dayjs';

const TaskPage: React.FC = () => {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadUsers();
  }, [page, pageSize, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getList({ page, pageSize, status: statusFilter });
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await authApi.getUsers();
      setUsers(res);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Task) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      dueDate: record.dueDate ? dayjs(record.dueDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await taskApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleStatusChange = async (id: number, status: number) => {
    try {
      await taskApi.updateStatus(id, status);
      message.success('状态更新成功');
      loadData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
      };
      if (editingId) {
        await taskApi.update(editingId, submitData);
        message.success('更新成功');
      } else {
        await taskApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const priorityMap: { [key: number]: string } = {
    1: '高',
    2: '中',
    3: '低',
  };

  const typeMap: { [key: string]: string } = {
    general: '一般',
    meeting: '会议',
    call: '电话',
    todo: '待办',
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '任务标题', dataIndex: 'title', key: 'title' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => typeMap[type] || type
    },
    { 
      title: '优先级', 
      dataIndex: 'priority', 
      key: 'priority',
      render: (p: number) => {
        const colors: { [key: number]: string } = { 1: 'red', 2: 'orange', 3: 'green' };
        return <Tag color={colors[p]}>{priorityMap[p]}</Tag>;
      }
    },
    { 
      title: '截止日期', 
      dataIndex: 'dueDate', 
      key: 'dueDate',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-'
    },
    { title: '指派给', dataIndex: 'assignee', key: 'assignee', render: (a: User) => a?.realName || a?.username || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (_: any, record: Task) => {
        const statusMap: { [key: number]: { text: string; color: string } } = {
          0: { text: '已取消', color: 'default' },
          1: { text: '待处理', color: 'red' },
          2: { text: '进行中', color: 'blue' },
          3: { text: '已完成', color: 'green' },
        };
        return (
          <Select
            value={record.status}
            onChange={(val) => handleStatusChange(record.id, val)}
            size="small"
            style={{ width: 100 }}
          >
            <Select.Option value={1}>待处理</Select.Option>
            <Select.Option value={2}>进行中</Select.Option>
            <Select.Option value={3}>已完成</Select.Option>
            <Select.Option value={0}>已取消</Select.Option>
          </Select>
        );
      }
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">任务管理</h1>
          <Space>
            <Segmented
              options={[
                { label: '全部', value: -1 },
                { label: '待处理', value: 1 },
                { label: '进行中', value: 2 },
                { label: '已完成', value: 3 },
              ]}
              onChange={(val) => setStatusFilter(val === -1 ? undefined : val as number)}
              defaultValue={-1}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增任务
            </Button>
          </Space>
        </div>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑任务' : '新增任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="任务标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="任务内容">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="general">
            <Select>
              <Select.Option value="general">一般</Select.Option>
              <Select.Option value="meeting">会议</Select.Option>
              <Select.Option value="call">电话</Select.Option>
              <Select.Option value="todo">待办</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={2}>
            <Select>
              <Select.Option value={1}>高</Select.Option>
              <Select.Option value={2}>中</Select.Option>
              <Select.Option value={3}>低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="assigneeId" label="指派人">
            <Select placeholder="选择指派人">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>
                  {u.realName || u.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>待处理</Select.Option>
              <Select.Option value={2}>进行中</Select.Option>
              <Select.Option value={3}>已完成</Select.Option>
              <Select.Option value={0}>已取消</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskPage;