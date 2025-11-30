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
} from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  ApartmentOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { GetProjectRequestById } from '@/services/projectRequest.js';

const { Title, Text, Paragraph } = Typography;

interface ProjectRequestDetail {
  id: string;
  requesterCompanyId: string;
  requesterCompanyName: string;
  requesterCompanyLogoUrl: string;
  executorCompanyId: string;
  executorCompanyName: string;
  executorCompanyLogoUrl: string;
  contractId: string | null;
  createdBy: string;
  createdName: string;
  code: string;
  projectName: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createAt: string;
  updateAt: string;
  isDeleted: boolean;
  isHaveProject: boolean;
  convertedProjectId: string;
}

const statusColor = {
  Pending: 'warning',
  Accepted: 'success',
  Rejected: 'error',
  Finished: 'blue',
  InProgress: 'processing',
};

const ProjectRequestDetailAdminPage: React.FC = () => {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const id = paramId || localStorage.getItem('projectRequestId');

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ProjectRequestDetail | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await GetProjectRequestById(id);
      if (res?.succeeded) setItem(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spin size="large" tip="Loading project request..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Project Request not found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => nav('/admin/project-request/list')}>
            Back to List
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24 }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a onClick={() => nav('/admin/project-request/list')}>Project Requests</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{item.projectName}</Breadcrumb.Item>
        </Breadcrumb>

        <Space align="center">
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> {item.projectName}
          </Title>
          <Tag color="blue" style={{ fontSize: 14 }}>
            {item.code}
          </Tag>
        </Space>

        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          Request ID: {item.id}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {/* LEFT COLUMN */}
        <Col xs={24} lg={8}>
          {/* Status */}
          <Card
            title={
              <>
                <InfoCircleOutlined /> Status
              </>
            }
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <Tag
              color={statusColor[item.status as keyof typeof statusColor] || 'default'}
              style={{ fontSize: 14 }}
            >
              {item.status}
            </Tag>

            <Divider />

            <Text type="secondary">Created At</Text>
            <Paragraph style={{ marginTop: 4 }}>{item.createAt}</Paragraph>

            <Text type="secondary">Updated At</Text>
            <Paragraph style={{ marginTop: 4 }}>{item.updateAt}</Paragraph>
          </Card>

          {/* Creator */}
          <Card
            title={
              <>
                <UserOutlined /> Created By
              </>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{item.createdName}</Text>
              <Paragraph copyable>ID: {item.createdBy}</Paragraph>
            </Space>
          </Card>
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} lg={16}>
          {/* Company Info */}
          <Card
            title={
              <Space>
                <ApartmentOutlined />
                <span>Company Information</span>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Requester Company</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {item.requesterCompanyName}
                  </Text>
                </div>
                <Paragraph type="secondary" copyable>
                  ID: {item.requesterCompanyId}
                </Paragraph>
              </Col>

              <Col span={12}>
                <Text type="secondary">Executor Company</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {item.executorCompanyName}
                  </Text>
                </div>
                <Paragraph type="secondary" copyable>
                  ID: {item.executorCompanyId}
                </Paragraph>
              </Col>
            </Row>
          </Card>

          {/* Project Request Details */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Project Request Details</span>
              </Space>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary">Project Name</Text>
                <Paragraph strong style={{ marginTop: 4 }}>
                  {item.projectName}
                </Paragraph>
              </div>

              <div>
                <Text type="secondary">Description</Text>
                <Paragraph style={{ marginTop: 4 }}>{item.description}</Paragraph>
              </div>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Start Date</Text>
                  <Paragraph style={{ marginTop: 4 }}>
                    <CalendarOutlined /> {item.startDate}
                  </Paragraph>
                </Col>
                <Col span={12}>
                  <Text type="secondary">End Date</Text>
                  <Paragraph style={{ marginTop: 4 }}>
                    <CalendarOutlined /> {item.endDate}
                  </Paragraph>
                </Col>
              </Row>

              <Divider />

              <div>
                <Text type="secondary">Converted to Project?</Text>
                <Paragraph strong style={{ marginTop: 4 }}>
                  {item.isHaveProject ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>}
                </Paragraph>

                {item.isHaveProject && (
                  <Paragraph copyable>Converted Project ID: {item.convertedProjectId}</Paragraph>
                )}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Back Button */}
      <div style={{ marginTop: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/admin/project-request/list')}>
          Back to List
        </Button>
      </div>
    </div>
  );
};

export default ProjectRequestDetailAdminPage;
