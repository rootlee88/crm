import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Tag } from 'antd';
import {
  TeamOutlined,
  RadarChartOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../../api';
import { DashboardStats, FunnelStage, Lead } from '../../types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statistics, funnelData, leadsData] = await Promise.all([
        dashboardApi.getStatistics(),
        dashboardApi.getFunnel(),
        dashboardApi.getRecentConverted(),
      ]);
      setStats(statistics);
      setFunnel(funnelData);
      setRecentLeads(leadsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const stageLabels: { [key: string]: string } = {
    prospecting: '初步接触',
    qualification: '需求确认',
    proposal: '方案报价',
    negotiation: '谈判',
    closed_won: '成交',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={stats?.customers.total || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="线索总数"
              value={stats?.leads.total || 0}
              prefix={<RadarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中商机"
              value={stats?.opportunities.total || 0}
              prefix={<DollarOutlined />}
              suffix={`¥${(stats?.opportunities.amount || 0).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="执行中合同"
              value={stats?.contracts.total || 0}
              prefix={<FileTextOutlined />}
              suffix={`¥${(stats?.contracts.amount || 0).toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理任务"
              value={stats?.tasks.pending || 0}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成任务"
              value={stats?.tasks.completed || 0}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日活动"
              value={stats?.activities.today || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已转化线索"
              value={stats?.leads.converted || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 销售漏斗 */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="销售漏斗">
            <div className="flex items-center justify-around">
              {funnel.map((stage, index) => (
                <div key={stage.stage} className="text-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-2"
                    style={{
                      background: `hsl(${200 - index * 30}, 70%, 90%)`,
                    }}
                  >
                    <span className="text-xl font-bold">{stage.count}</span>
                  </div>
                  <div className="text-gray-600">{stageLabels[stage.stage]}</div>
                  <div className="text-sm text-gray-400">
                    ¥{stage.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="最近转化">
            <Table
              dataSource={recentLeads}
              columns={[
                {
                  title: '姓名',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '公司',
                  dataIndex: 'company',
                  key: 'company',
                },
                {
                  title: '转化时间',
                  dataIndex: 'updatedAt',
                  key: 'updatedAt',
                  render: (text: string) => new Date(text).toLocaleDateString(),
                },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;