import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Spin,
  Button,
  Space,
  Empty,
  Breadcrumb,
  Divider,
  Avatar,
  Table,
} from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  CalendarOutlined,
  PaperClipOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { getContractById } from '@/services/contractService.js';

const { Title, Text, Paragraph } = Typography;

const statusColor: Record<string, any> = {
  DRAFT: 'default',
  ACTIVE: 'blue',
  EXPIRED: 'error',
  CANCELLED: 'warning',
};

const ContractDetailAdminPage: React.FC = () => {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const id = paramId || localStorage.getItem('contractDetailId');

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const res = await getContractById(id);
      if (res?.succeeded) setItem(res.data);
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  const handleCompanyClick = (cId: string) => {
    if (!cId || cId === '00000000-0000-0000-0000-000000000000') return;
    localStorage.setItem('companyDetailEnabled', 'true');
    localStorage.setItem('companyDetailId', cId);
    nav(`/admin/companies/detail/${cId}`);
  };

  const handleProjectRequestClick = (prId: string) => {
    if (!prId || prId === '00000000-0000-0000-0000-000000000000') return;
    localStorage.setItem('projectRequestDetailEnabled', 'true');
    localStorage.setItem('projectRequestId', prId);
    nav(`/admin/project-request/detail/${prId}`);
  };

  if (loading)
    return (
      <div style={{ minHeight: '60vh' }} className="flex items-center justify-center">
        <Spin size="large" tip="Loading contract..." />
      </div>
    );

  if (!item)
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Contract not found">
          <Button type="primary" onClick={() => nav('/admin/contracts/list')}>
            Back to List
          </Button>
        </Empty>
      </div>
    );

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24 }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item className="cursor-pointer" onClick={() => nav('/admin/contracts/list')}>
            Contracts
          </Breadcrumb.Item>
          <Breadcrumb.Item>{item.contractName}</Breadcrumb.Item>
        </Breadcrumb>

        <Space align="center">
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> {item.contractName}
          </Title>
          <Tag color="blue">{item.contractCode}</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <>
                <InfoCircleOutlined /> Status
              </>
            }
            bordered={false}
          >
            <Tag color={statusColor[item.status] || 'default'} style={{ fontSize: 14 }}>
              {item.status}
            </Tag>

            <Divider style={{ margin: '12px 0' }} />

            <Text type="secondary">Effective Date</Text>
            <Paragraph>
              <CalendarOutlined /> {item.effectiveDate}
            </Paragraph>

            <Text type="secondary">Expired Date</Text>
            <Paragraph>
              <CalendarOutlined /> {item.expiredDate}
            </Paragraph>
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <ApartmentOutlined /> Companies
              </Space>
            }
            bordered={false}
          >
            <div className="space-y-3">
              <div>
                <Text type="secondary">Requester Company</Text>
                <Paragraph
                  strong
                  className="cursor-pointer hover:underline"
                  onClick={() => handleCompanyClick(item.requesterCompanyId)}
                >
                  {item.requesterCompanyId === '00000000-0000-0000-0000-000000000000'
                    ? 'N/A'
                    : item.requesterCompanyId}
                </Paragraph>
              </div>

              <div>
                <Text type="secondary">Executor Company</Text>
                <Paragraph
                  strong
                  className="cursor-pointer hover:underline"
                  onClick={() => handleCompanyClick(item.executorCompanyId)}
                >
                  {item.executorCompanyId === '00000000-0000-0000-0000-000000000000'
                    ? 'N/A'
                    : item.executorCompanyId}
                </Paragraph>
              </div>
            </div>
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <FileTextOutlined /> Related Project Request
              </Space>
            }
            bordered={false}
          >
            <Paragraph
              strong
              className="cursor-pointer hover:underline"
              onClick={() => handleProjectRequestClick(item.projectRequestId)}
            >
              {item.projectRequestId === '00000000-0000-0000-0000-000000000000'
                ? 'No related project request'
                : item.projectRequestId}
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <FileTextOutlined /> Contract Details
              </Space>
            }
            bordered={false}
          >
            <Text type="secondary">Contract Name</Text>
            <Paragraph strong>{item.contractName}</Paragraph>

            <Text type="secondary">Budget</Text>
            <Paragraph strong>{item.budget.toLocaleString()} VND</Paragraph>

            <Divider style={{ margin: '12px 0' }} />

            <Text type="secondary">Attachment</Text>
            <Paragraph>
              {item.attachment ? (
                <a href={item.attachment} target="_blank" rel="noopener noreferrer">
                  <PaperClipOutlined /> View Attachment
                </a>
              ) : (
                'No attachment'
              )}
            </Paragraph>

            <Divider style={{ margin: '12px 0' }} />
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <FileTextOutlined /> Appendices
              </Space>
            }
            bordered={false}
          >
            {item.appendices?.length ? (
              <Table
                rowKey="id"
                pagination={false}
                dataSource={item.appendices}
                columns={[
                  { title: 'Name', dataIndex: 'appendixName' },
                  { title: 'Code', dataIndex: 'appendixCode' },
                  { title: 'Description', dataIndex: 'appendixDescription' },
                ]}
              />
            ) : (
              <Empty description="No appendices" />
            )}
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/admin/contracts/list')}>
          Back to List
        </Button>
      </div>
    </div>
  );
};

export default ContractDetailAdminPage;
