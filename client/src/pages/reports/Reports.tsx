import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Table, Tag, Spin, Statistic, Progress } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { dashboardApi } from '../../api';

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salesData, setSalesData] = useState<any>(null);
  const [customerGrowth, setCustomerGrowth] = useState<any>(null);
  const [conversionData, setConversionData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sales, growth, conversion] = await Promise.all([
        dashboardApi.getSalesReport(year),
        dashboardApi.getCustomerGrowth(year),
        dashboardApi.getConversionReport({ year }),
      ]);
      setSalesData(sales);
      setCustomerGrowth(growth);
      setConversionData(conversion);
    } catch (error) {
      console.error('加载报表数据失败:', error);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">报表分析</h1>
        <Select value={year} onChange={setYear} style={{ width: 120 }}>
          {[2023, 2024, 2025, 2026].map(y => (
            <Select.Option key={y} value={y}>{y}年</Select.Option>
          ))}
        </Select>
      </div>

      {/* 销售业绩报表 */}
      <Card title={<><BarChartOutlined /> 销售业绩报表</>} className="mb-6">
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Statistic 
              title="年度合同金额" 
              value={salesData?.summary?.totalContractAmount || 0} 
              prefix="¥" 
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="合同数量" 
              value={salesData?.summary?.totalContractCount || 0} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="成交金额" 
              value={salesData?.summary?.totalWonAmount || 0} 
              prefix="¥" 
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="成交数量" 
              value={salesData?.summary?.totalWonCount || 0} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
        
        <Table
          dataSource={salesData?.monthly || []}
          columns={[
            { title: '月份', dataIndex: 'monthName', key: 'monthName' },
            { 
              title: '合同金额', 
              dataIndex: 'contractAmount', 
              key: 'contractAmount',
              render: (v: number) => `¥${v.toLocaleString()}`
            },
            { title: '合同数', dataIndex: 'contractCount', key: 'contractCount' },
            { 
              title: '成交金额', 
              dataIndex: 'wonAmount', 
              key: 'wonAmount',
              render: (v: number) => `¥${v.toLocaleString()}`
            },
            { title: '成交数', dataIndex: 'wonCount', key: 'wonCount' },
          ]}
          pagination={false}
          rowKey="month"
        />
      </Card>

      {/* 客户增长趋势 */}
      <Card title={<><LineChartOutlined /> 客户增长趋势</>} className="mb-6">
        <Row gutter={16} className="mb-4">
          <Col span={12}>
            <Statistic title="本年新增客户" value={customerGrowth?.total || 0} />
          </Col>
          <Col span={12}>
            <Statistic title="累计客户总数" value={customerGrowth?.total || 0} />
          </Col>
        </Row>
        
        <Table
          dataSource={customerGrowth?.monthly || []}
          columns={[
            { title: '月份', dataIndex: 'monthName', key: 'monthName' },
            { title: '新增客户', dataIndex: 'newCount', key: 'newCount' },
            { title: '累计客户', dataIndex: 'cumulative', key: 'cumulative' },
            {
              title: '增长趋势',
              dataIndex: 'newCount',
              key: 'trend',
              render: (v: number) => <Progress percent={v * 10} showInfo={false} status="active" />
            },
          ]}
          pagination={false}
          rowKey="month"
        />
      </Card>

      {/* 转化率分析 */}
      <Card title={<><PieChartOutlined /> 转化率分析</>}>
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="线索转化漏斗">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>线索总数</span>
                    <span>{conversionData?.leads?.total || 0}</span>
                  </div>
                  <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>已联系 ({conversionData?.leads?.contacted || 0})</span>
                    <span>{conversionData?.leads?.contactRate || 0}%</span>
                  </div>
                  <Progress percent={conversionData?.leads?.contactRate || 0} showInfo={false} strokeColor="#52c41a" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>已转化 ({conversionData?.leads?.converted || 0})</span>
                    <span>{conversionData?.leads?.convertRate || 0}%</span>
                  </div>
                  <Progress percent={conversionData?.leads?.convertRate || 0} showInfo={false} strokeColor="#faad14" />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="商机转化漏斗">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>商机总数</span>
                    <span>{conversionData?.opportunities?.total || 0}</span>
                  </div>
                  <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>方案报价 ({conversionData?.opportunities?.proposal || 0})</span>
                    <span>{conversionData?.opportunities?.proposalRate || 0}%</span>
                  </div>
                  <Progress percent={conversionData?.opportunities?.proposalRate || 0} showInfo={false} strokeColor="#52c41a" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>谈判中 ({conversionData?.opportunities?.negotiation || 0})</span>
                    <span>{conversionData?.opportunities?.negotiationRate || 0}%</span>
                  </div>
                  <Progress percent={conversionData?.opportunities?.negotiationRate || 0} showInfo={false} strokeColor="#faad14" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>已成交 ({conversionData?.opportunities?.won || 0})</span>
                    <span>{conversionData?.opportunities?.winRate || 0}%</span>
                  </div>
                  <Progress percent={conversionData?.opportunities?.winRate || 0} showInfo={false} strokeColor="#722ed1" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ReportsPage;