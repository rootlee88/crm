import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, Card, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { opportunityApi, authApi, customerApi } from '../../api';
import { Opportunity, User, Customer } from '../../types';
import dayjs from 'dayjs';

const OpportunityPage: React.FC = () => {
  const [data, setData] = useState<Opportunity[]>([]);
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

  useEffect(() => {
    loadData();
    loadUsers();
    loadCustomers();
  }, [page, pageSize, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await opportunityApi.getList({ page, pageSize, search });
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

  const handleEdit = (record: Opportunity) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      expectedDate: record.expectedDate ? dayjs(record.expectedDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await opportunityApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        expectedDate: values.expectedDate?.format('YYYY-MM-DD'),
      };
      if (editingId) {
        await opportunityApi.update(editingId, submitData);
        message.success('更新成功');
      } else {
        await opportunityApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const stageMap: { [key: string]: { text: string; color: string } } = {
    prospecting: { text: '初步接触', color: 'blue' },
    qualification: { text: '需求确认', color: 'cyan' },
    proposal: { text: '方案报价', color: 'purple' },
    negotiation: { text: '谈判', color: 'orange' },
    closed_won: { text: '成交', color: 'green' },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '商机名称', dataIndex: 'name', key: 'name' },
    { title: '客户', dataIndex: 'customer', key: 'customer', render: (c: Customer) => c?.name || '-' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
    { 
      title: '阶段', 
      dataIndex: 'stage', 
      key: 'stage',
      render: (stage: string) => (
        <Tag color={stageMap[stage]?.color}>{stageMap[stage]?.text}</Tag>
      )
    },
    { title: '概率', dataIndex: 'probability', key: 'probability', render: (v: number) => `${v}%` },
    { title: '预计成交', dataIndex: 'expectedDate', key: 'expectedDate', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '负责人', dataIndex: 'owner', key: 'owner', render: (owner: User) => owner?.realName || owner?.username || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '进行中' : '已关闭'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Opportunity) => (
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
          <h1 className="text-xl font-bold">商机管理</h1>
          <div className="flex gap-2">
            <Input
              placeholder="搜索商机..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增商机
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
        title={editingId ? '编辑商机' : '新增商机'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商机名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select placeholder="选择客户">
              {customers.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name} - {c.company}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="金额">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入金额" />
          </Form.Item>
          <Form.Item name="stage" label="阶段" initialValue="prospecting">
            <Select>
              <Select.Option value="prospecting">初步接触</Select.Option>
              <Select.Option value="qualification">需求确认</Select.Option>
              <Select.Option value="proposal">方案报价</Select.Option>
              <Select.Option value="negotiation">谈判</Select.Option>
              <Select.Option value="closed_won">成交</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="probability" label="概率" initialValue={10}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} addonAfter="%" />
          </Form.Item>
          <Form.Item name="expectedDate" label="预计成交日期">
            <DatePicker style={{ width: '100%' }} />
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
              <Select.Option value={1}>进行中</Select.Option>
              <Select.Option value={0}>已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OpportunityPage;