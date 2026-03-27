import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { leadApi, authApi, customerApi } from '../../api';
import { Lead, User, Customer } from '../../types';
import dayjs from 'dayjs';

const LeadPage: React.FC = () => {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<number | null>(null);
  const [convertForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadUsers();
    loadCustomers();
  }, [page, pageSize, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await leadApi.getList({ page, pageSize, search });
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

  const loadCustomers = async () => {
    try {
      const res = await customerApi.getList({ pageSize: 100 });
      setCustomers(res.data);
    } catch (error) {
      console.error('加载客户失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Lead) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await leadApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await leadApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await leadApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleConvert = (record: Lead) => {
    setConvertLeadId(record.id);
    convertForm.resetFields();
    setConvertModalVisible(true);
  };

  const handleConvertSubmit = async () => {
    try {
      const values = await convertForm.validateFields();
      await leadApi.convert(convertLeadId!, values.customerId);
      message.success('线索转换成功');
      setConvertModalVisible(false);
      loadData();
    } catch (error) {
      message.error('转换失败');
    }
  };

  const statusMap: { [key: number]: { text: string; color: string } } = {
    1: { text: '新线索', color: 'blue' },
    2: { text: '已跟进', color: 'orange' },
    3: { text: '已转化', color: 'green' },
    4: { text: '已放弃', color: 'red' },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '负责人', dataIndex: 'owner', key: 'owner', render: (owner: User) => owner?.realName || owner?.username || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: number) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      )
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
      render: (_: any, record: Lead) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 1 && (
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleConvert(record)}>
              转换
            </Button>
          )}
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
          <h1 className="text-xl font-bold">线索管理</h1>
          <div className="flex gap-2">
            <Input
              placeholder="搜索线索..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增线索
            </Button>
          </div>
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
        title={editingId ? '编辑线索' : '新增线索'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="company" label="公司">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input />
          </Form.Item>
          <Form.Item name="ownerId" label="负责人">
            <Select placeholder="选择负责人">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>
                  {u.realName || u.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>新线索</Select.Option>
              <Select.Option value={2}>已跟进</Select.Option>
              <Select.Option value={4}>已放弃</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="线索转换为客户"
        open={convertModalVisible}
        onOk={handleConvertSubmit}
        onCancel={() => setConvertModalVisible(false)}
      >
        <Form form={convertForm} layout="vertical">
          <Form.Item name="customerId" label="关联客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="选择已有客户或新建客户">
              {customers.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name} - {c.company}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div className="text-gray-500 text-sm">
            提示：转换后该线索状态将变为"已转化"
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadPage;