import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  List,
  Progress,
  Typography,
  Spin,
  Divider,
  Space,
  Button,
  Statistic,
  Badge,
  Empty,
  Breadcrumb,
  Collapse,
} from 'antd';
import {
  UserOutlined,
  ApartmentOutlined,
  ProjectOutlined,
  TeamOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { getProjectById } from '@/services/projectService.js';

const { Title, Text, Paragraph } = Typography;

interface Member {
  memberId: string;
  memberName: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  point: number;
  status: string;
}

interface Sprint {
  id: string;
  name: string;
  taskCount: number;
  totalPoint: number;
  tasks: Task[];
}

interface ProjectDetail {
  id: string;
  name: string;
  projectType: string;
  companyRequestId: string;
  companyRequestName: string;
  companyExecutorId: string;
  companyExecutorName: string;
  workflowId: string;
  workflowName: string;
  ownerId: string;
  ownerName: string;
  members: Member[];
  sprintCount: number;
  totalTask: number;
  totalPoint: number;
  progress: number;
  sprints: Sprint[];
}

const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    done: 'success',
    completed: 'success',
    'in progress': 'processing',
    todo: 'default',
    pending: 'warning',
    blocked: 'error',
  };
  return statusMap[status.toLowerCase()] || 'default';
};

const ProjectDetailAdminPage: React.FC = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const id = paramId || localStorage.getItem('projectDetailId');
  const { Panel } = Collapse;
  const { Text } = Typography;

  const fetchProject = async () => {
    try {
      const res = await getProjectById(id);
      if (res.succeeded) {
        setProject(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spin size="large" tip="Loading project details..." />
      </div>
    );
  }

  //Xem detail user:
  const handleMemberClick = (uId: any) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', uId);
    navigate(`/admin/users/detail/${uId}`);
  };

  // Detail company
  const handleCompanyClick = (cId: any) => {
    localStorage.setItem('companyDetailEnabled', 'true');
    localStorage.setItem('companyDetailId', cId);
    navigate(`/admin/companies/detail/${cId}`);
  };

  // No project
  if (!project) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Project not found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate('/admin/projects/list')}>
            Back to Projects
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <div
        style={{ background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}
      >
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a onClick={() => navigate('/admin/projects/list')}>Projects</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{project.name}</Breadcrumb.Item>
        </Breadcrumb>

        <Space align="center" style={{ width: '100%', justifyContent: 'flex-start' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ProjectOutlined /> {project.name}
          </Title>
          <Tag color="blue" style={{ fontSize: '14px' }}>
            {project.projectType}
          </Tag>
        </Space>

        <Paragraph type="secondary" style={{ marginTop: '8px', marginBottom: 0 }}>
          Project ID: {project.id}
        </Paragraph>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Project Progress"
              value={project.progress}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: project.progress >= 70 ? '#3f8600' : '#1890ff' }}
            />
            <Progress
              percent={project.progress}
              status={project.progress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Sprints"
              value={project.sprintCount}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Tasks"
              value={project.totalTask}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Points"
              value={project.totalPoint}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={8}>
          {/* Owner & Workflow Info */}
          <Card
            title={
              <>
                <UserOutlined /> Owner Information
              </>
            }
            bordered={false}
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Project Owner</Text>
                <div
                  style={{ marginTop: '8px' }}
                  className="cursor-pointer"
                  onClick={() => handleMemberClick(project.ownerId)}
                >
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Text strong>{project.ownerName}</Text>
                  </Space>
                </div>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">Owner ID</Text>
                <Paragraph
                  copyable
                  style={{ marginTop: '4px', marginBottom: 0 }}
                  className="cursor-pointer hover:underline"
                  onClick={() => handleMemberClick(project.ownerId)}
                >
                  {project.ownerId}
                </Paragraph>
              </div>
            </Space>
          </Card>

          {/* Company Info */}
          <Card
            title={
              <>
                <ApartmentOutlined /> Company Information
              </>
            }
            bordered={false}
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary">Company request</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {project.companyRequestName}
                  </Text>
                </div>
                <Paragraph
                  type="secondary"
                  copyable
                  style={{ marginTop: '4px', marginBottom: 0, fontSize: '12px' }}
                  className="cursor-pointer hover:underline"
                  onClick={() => handleCompanyClick(project.companyRequestId)}
                >
                  ID: {project.companyRequestId}
                </Paragraph>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text type="secondary">Company excutor</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {project.companyExecutorName}
                  </Text>
                </div>
                <Paragraph
                  type="secondary"
                  copyable
                  style={{ marginTop: '4px', marginBottom: 0, fontSize: '12px' }}
                  className="cursor-pointer hover:underline"
                  onClick={() => handleCompanyClick(project.companyExecutorId)}
                >
                  ID: {project.companyExecutorId}
                </Paragraph>
              </div>
            </Space>
          </Card>

          {/* Workflow Info */}
          <Card
            title={
              <>
                <ProjectOutlined /> Workflow
              </>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Workflow Name</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {project.workflowName}
                  </Text>
                </div>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">Workflow ID</Text>
                <Paragraph copyable style={{ marginTop: '4px', marginBottom: 0 }}>
                  {project.workflowId}
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={16}>
          {/* Members Section */}
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Project Members</span>
                <Badge count={project.members.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            bordered={false}
            style={{ marginBottom: '16px' }}
          >
            {project.members.length === 0 ? (
              <Empty description="No members assigned" />
            ) : (
              <List
                grid={{
                  gutter: 16,
                  xs: 1,
                  sm: 2,
                  md: 3,
                  lg: 3,
                  xl: 4,
                }}
                dataSource={project.members}
                pagination={{
                  pageSize: 12,
                  showSizeChanger: false,
                  showQuickJumper: true,
                }}
                renderItem={(member) => (
                  <List.Item>
                    <Card
                      hoverable
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleMemberClick(member.memberId)}
                    >
                      <Avatar
                        size={64}
                        src={member.avatar}
                        icon={!member.avatar && <UserOutlined />}
                        style={{ marginBottom: '12px' }}
                      />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>
                          {member.memberName}
                        </Text>
                        {/* <Text
                          type="secondary"
                          style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}
                          ellipsis={{ tooltip: member.memberId }}
                        >
                          {member.memberId.substring(0, 8)}...
                        </Text> */}
                      </div>
                      <Tag color="blue" style={{ marginTop: '8px' }}>
                        Member
                      </Tag>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Sprints Section */}
          <Card
            title={
              <Space>
                <RocketOutlined />
                <span>Sprints</span>
                <Badge count={project.sprints.length} />
              </Space>
            }
            bordered={false}
          >
            {project.sprints.length === 0 ? (
              <Empty description="No sprints available" />
            ) : project.sprints.length <= 3 ? (
              // ≤ 3 sprints
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {project.sprints.map((sprint) => (
                  <Card
                    key={sprint.id}
                    type="inner"
                    title={
                      <Space>
                        <Badge status="processing" />
                        <Text strong>{sprint.name}</Text>
                      </Space>
                    }
                    extra={
                      <Space>
                        <Tag color="purple" icon={<ClockCircleOutlined />}>
                          {sprint.taskCount} Tasks
                        </Tag>
                        <Tag color="gold" icon={<TrophyOutlined />}>
                          {sprint.totalPoint} Points
                        </Tag>
                      </Space>
                    }
                    style={{
                      borderLeft: '4px solid #1890ff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    {sprint.tasks.length > 0 ? (
                      <List
                        itemLayout="horizontal"
                        dataSource={sprint.tasks}
                        renderItem={(task) => (
                          <List.Item
                            style={{
                              padding: '12px 0',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar style={{ backgroundColor: '#1890ff' }} size="small">
                                  {task.point}
                                </Avatar>
                              }
                              title={
                                <Space>
                                  <Text strong>{task.title}</Text>
                                  <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                                </Space>
                              }
                              description={
                                <Space>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Task ID: {task.id}
                                  </Text>
                                  <Divider type="vertical" />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <TrophyOutlined /> {task.point} points
                                  </Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty
                        description="No tasks in this sprint"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Card>
                ))}
              </Space>
            ) : (
              //> 3 sprints
              <Collapse
                accordion
                bordered={false}
                style={{
                  background: 'transparent',
                }}
                expandIconPosition="end"
              >
                {project.sprints.map((sprint) => (
                  <Panel
                    key={sprint.id}
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      marginBottom: 12,
                      overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                    header={
                      <Space size="middle" wrap>
                        <Badge status="processing" />
                        <Text strong>{sprint.name}</Text>
                        <Tag color="purple" icon={<ClockCircleOutlined />}>
                          {sprint.taskCount} Tasks
                        </Tag>
                        <Tag color="gold" icon={<TrophyOutlined />}>
                          {sprint.totalPoint} Points
                        </Tag>
                      </Space>
                    }
                  >
                    {sprint.tasks.length > 0 ? (
                      <div
                        style={{
                          maxHeight: 350,
                          overflowY: 'auto',
                          paddingRight: 8,
                        }}
                      >
                        <List
                          itemLayout="horizontal"
                          dataSource={sprint.tasks}
                          pagination={{ pageSize: 5, size: 'small' }}
                          renderItem={(task) => (
                            <List.Item
                              style={{
                                padding: '10px 0',
                                borderBottom: '1px solid #f0f0f0',
                              }}
                            >
                              <List.Item.Meta
                                avatar={
                                  <Avatar style={{ backgroundColor: '#1890ff' }} size="small">
                                    {task.point}
                                  </Avatar>
                                }
                                title={
                                  <Space>
                                    <Text strong>{task.title}</Text>
                                    <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                                  </Space>
                                }
                                description={
                                  <Space>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      Task ID: {task.id}
                                    </Text>
                                    <Divider type="vertical" />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      <TrophyOutlined /> {task.point} points
                                    </Text>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    ) : (
                      <Empty
                        description="No tasks in this sprint"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ margin: '20px 0' }}
                      />
                    )}
                  </Panel>
                ))}
              </Collapse>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectDetailAdminPage;
