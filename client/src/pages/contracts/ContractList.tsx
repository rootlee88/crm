import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, Card, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { contractApi, customerApi } from '../../api';
import { Contract, Customer } from '../../types';
import dayjs from 'dayjs';

const ContractPage: React.FC = () => {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCustomers();
  }, [page, pageSize, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await contractApi.getList({ page, pageSize, search });
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
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

  const handleEdit = (record: Contract) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      signDate: record.signDate ? dayjs(record.signDate) : null,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await contractApi.delete(id);
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
        signDate: values.signDate?.format('YYYY-MM-DD'),
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };
      if (editingId) {
        await contractApi.update(editingId, submitData);
        message.success('更新成功');
      } else {
        await contractApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo' },
    { title: '客户', dataIndex: 'customer', key: 'customer', render: (c: Customer) => c?.name || '-' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '签订日期', dataIndex: 'signDate', key: 'signDate', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '执行中' : '已终止'}
        </Tag>
      )
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', render: (c: any) => c?.realName || c?.username || '-' },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Contract) => (
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
          <h1 className="text-xl font-bold">合同管理</h1>
          <div className="flex gap-2">
            <Input
              placeholder="搜索合同..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增合同
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
        title={editingId ? '编辑合同' : '新增合同'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
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
          <Form.Item name="signDate" label="签订日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="结束日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>执行中</Select.Option>
              <Select.Option value={0}>已终止</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="fileUrl" label="合同文件URL">
            <Input placeholder="输入文件URL" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractPage;