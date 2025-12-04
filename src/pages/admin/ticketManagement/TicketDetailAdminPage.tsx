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
  List,
} from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { GetTicketById } from '@/services/TicketService.js';

const { Title, Text, Paragraph } = Typography;

interface TicketDetail {
  id: string;
  projectId: string;
  projectName: string;
  priority: string;
  isHighestUrgen: boolean;
  ticketName: string;
  description: string;
  statusId: string;
  submittedBy: string;
  submittedByName: string;
  isBillable: boolean;
  budget: number;
  isDeleted: boolean;
  status: string;
  reason: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  total: number;

  process: {
    hasExecution: boolean;
    totalNonBacklogTasks: number;
    startedCount: number;
    doneCount: number;
    progressPercent: number;
    firstStartedAt: string | null;
    lastDoneAt: string | null;
    items: {
      taskId: string;
      taskCode: string;
      title: string;
      statusName: string;
      statusCategory: string;
      isDone: boolean;
      startedAt: string | null;
      lastMovedAt: string | null;
      doneAt: string | null;
    }[];
  };
}

const PRIORITY_COLOR = {
  Urgent: 'volcano',
  High: 'orange',
  Medium: 'geekblue',
  Low: 'cyan',
};

const STATUS_COLOR = {
  Pending: 'gold',
  Accepted: 'blue',
  Rejected: 'red',
  Finished: 'green',
  InProgress: 'processing',
};

const TicketDetailAdminPage: React.FC = () => {
  const { id: paramId } = useParams();
  const nav = useNavigate();

  const id = paramId || localStorage.getItem('ticketDetailId');

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<TicketDetail | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await GetTicketById(id);
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
        <Spin size="large" tip="Loading ticket..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Ticket not found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => nav('/admin/tickets/list')}>
            Back to List
          </Button>
        </Empty>
      </div>
    );
  }

  // Handle click detail
  const handleMemberClick = (uId: any) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', uId);
    nav(`/admin/users/detail/${uId}`);
  };

  const handleProjectClick = (pId: any) => {
    localStorage.setItem('projectDetailEnabled', 'true');
    localStorage.setItem('projectDetailId', pId);
    nav(`/admin/projects/detail/${pId}`);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24 }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a onClick={() => nav('/admin/tickets/list')}>Tickets</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{item.ticketName}</Breadcrumb.Item>
        </Breadcrumb>

        <Space align="center">
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> {item.ticketName}
          </Title>

          <Tag
            color={STATUS_COLOR[item.status as keyof typeof STATUS_COLOR] || 'default'}
            style={{ fontSize: 14 }}
          >
            {item.status}
          </Tag>
        </Space>

        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          Ticket ID: {item.id}
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
            <Space direction="vertical">
              <Tag
                color={STATUS_COLOR[item.status as keyof typeof STATUS_COLOR] || 'default'}
                style={{ fontSize: 14 }}
              >
                {item.status}
              </Tag>

              <Text type="secondary">Priority</Text>
              <Tag
                color={PRIORITY_COLOR[item.priority as keyof typeof PRIORITY_COLOR] || 'blue'}
                style={{ fontSize: 14 }}
              >
                {item.priority}
              </Tag>

              {item.isHighestUrgen && (
                <Tag color="red" icon={<AlertOutlined />}>
                  Highest Urgency
                </Tag>
              )}

              <Divider />

              <Text type="secondary">Created At</Text>
              <Paragraph>{item.createdAt}</Paragraph>

              <Text type="secondary">Updated At</Text>
              <Paragraph>{item.updatedAt}</Paragraph>

              {item.resolvedAt && (
                <>
                  <Text type="secondary">Resolved At</Text>
                  <Paragraph>{item.resolvedAt}</Paragraph>
                </>
              )}

              {item.closedAt && (
                <>
                  <Text type="secondary">Closed At</Text>
                  <Paragraph>{item.closedAt}</Paragraph>
                </>
              )}
            </Space>
          </Card>

          {/* Submitted By */}
          <Card
            title={
              <>
                <UserOutlined /> Submitted By
              </>
            }
            bordered={false}
          >
            <Space direction="vertical">
              <Text strong>{item.submittedByName}</Text>
              <Paragraph copyable>
                ID:{' '}
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => handleMemberClick(item.submittedBy)}
                >
                  {item.submittedBy}
                </span>
              </Paragraph>

              <Divider />

              <Text type="secondary">Billable</Text>
              <Paragraph>{item.isBillable ? 'Yes' : 'No'}</Paragraph>

              <Text type="secondary">Budget</Text>
              <Paragraph>{item.budget} vnd</Paragraph>
            </Space>
          </Card>
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} lg={16}>
          {/* Project Info */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Project Information</span>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <Text type="secondary">Project Name</Text>
            <Paragraph strong>{item.projectName}</Paragraph>

            <Paragraph type="secondary" copyable>
              ID:{' '}
              <span
                className="cursor-pointer hover:underline"
                onClick={() => handleProjectClick(item.projectId)}
              >
                {item.projectId}
              </span>
            </Paragraph>
          </Card>

          {/* Ticket Details */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Ticket Details</span>
              </Space>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary">Description</Text>
                <Paragraph>{item.description}</Paragraph>
              </div>

              {item.reason && (
                <div>
                  <Text type="secondary">Reason</Text>
                  <Paragraph>{item.reason}</Paragraph>
                </div>
              )}

              <Divider />

              {/* Process */}
              <div>
                <Text type="secondary">Process Progress</Text>
                <Paragraph>
                  <ThunderboltOutlined /> {item.process?.progressPercent ?? 0}% completed
                </Paragraph>

                <Paragraph type="secondary">
                  Tasks Done: {item.process?.doneCount ?? 0}/
                  {item.process?.totalNonBacklogTasks ?? 0}
                </Paragraph>

                <Divider />

                <Text strong>Task Items</Text>

                <List
                  itemLayout="vertical"
                  dataSource={item.process?.items || []}
                  renderItem={(task) => (
                    <List.Item key={task.taskId}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{task.title}</Text>
                            <Tag color={task.isDone ? 'green' : 'blue'}>{task.statusName}</Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical">
                            <Text type="secondary">Code: {task.taskCode}</Text>
                            <Text type="secondary">Status: {task.statusCategory}</Text>
                            {task.startedAt && (
                              <Text>
                                <CalendarOutlined /> Started: {task.startedAt}
                              </Text>
                            )}
                            {task.doneAt && (
                              <Text>
                                <CheckCircleOutlined /> Done: {task.doneAt}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Back Button */}
      <div style={{ marginTop: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/admin/tickets/list')}>
          Back to List
        </Button>
      </div>
    </div>
  );
};

export default TicketDetailAdminPage;
