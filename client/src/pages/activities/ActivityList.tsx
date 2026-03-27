import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Segmented } from 'antd';
import { activityApi } from '../../api';
import { Activity } from '../../types';
import dayjs from 'dayjs';

const ActivityPage: React.FC = () => {
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [page, pageSize, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await activityApi.getList({ page, pageSize, type: typeFilter });
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeMap: { [key: string]: { text: string; color: string } } = {
    login: { text: '登录', color: 'blue' },
    create: { text: '创建', color: 'green' },
    update: { text: '更新', color: 'orange' },
    delete: { text: '删除', color: 'red' },
    convert: { text: '转换', color: 'purple' },
  };

  const targetTypeMap: { [key: string]: string } = {
    customer: '客户',
    lead: '线索',
    opportunity: '商机',
    contract: '合同',
    task: '任务',
  };

  const columns = [
    { 
      title: '时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    { title: '用户', dataIndex: 'user', key: 'user', render: (u: any) => u?.realName || u?.username || '-' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => (
        <Tag color={typeMap[type]?.color}>{typeMap[type]?.text || type}</Tag>
      )
    },
    { title: '动作', dataIndex: 'action', key: 'action' },
    { 
      title: '对象', 
      dataIndex: 'targetType', 
      key: 'targetType',
      render: (type: string, record: Activity) => (
        <span>
          {targetTypeMap[type] || '-'}
          {record.targetId && ` #${record.targetId}`}
        </span>
      )
    },
    { title: '详情', dataIndex: 'content', key: 'content' },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">活动日志</h1>
          <Segmented
            options={[
              { label: '全部', value: 'all' },
              { label: '登录', value: 'login' },
              { label: '创建', value: 'create' },
              { label: '更新', value: 'update' },
              { label: '删除', value: 'delete' },
            ]}
            onChange={(val) => setTypeFilter(val === 'all' ? undefined : val as string)}
            defaultValue="all"
          />
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
    </div>
  );
};

export default ActivityPage;