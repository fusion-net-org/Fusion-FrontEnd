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
  Modal,
  List,
} from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  ApartmentOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { getProjectRequestIdByAdmin } from '@/services/projectRequest.js';

const { Title, Text, Paragraph } = Typography;

const statusColor = {
  Pending: 'warning',
  Accepted: 'success',
  Rejected: 'error',
  Finished: 'blue',
  InProgress: 'processing',
};

interface TicketRecord {
  submittedBy: string;
  submittedByName: string;
  ticketComments: string;
}

const ProjectRequestDetailAdminPage: React.FC = () => {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const id = paramId || localStorage.getItem('projectRequestId');

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  // MODAL COMMENTS
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState<any[]>([]);

  const openCommentModal = (comments: any) => {
    const safeComments = Array.isArray(comments) ? comments : [];
    setSelectedComments(safeComments);
    setCommentModalOpen(true);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const res = await getProjectRequestIdByAdmin(id);
      if (res?.succeeded) setItem(res.data);
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  const handleMemberClick = (uId: string) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', uId);
    nav(`/admin/users/detail/${uId}`);
  };

  const handleCompanyClick = (cId: string) => {
    localStorage.setItem('companyDetailEnabled', 'true');
    localStorage.setItem('companyDetailId', cId);
    nav(`/admin/companies/detail/${cId}`);
  };

  if (loading)
    return (
      <div style={{ minHeight: '60vh' }} className="flex items-center justify-center">
        <Spin size="large" tip="Loading project request..." />
      </div>
    );

  if (!item)
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Project Request not found">
          <Button type="primary" onClick={() => nav('/admin/project-request/list')}>
            Back to List
          </Button>
        </Empty>
      </div>
    );

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* BREADCRUMB */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24 }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => nav('/admin/project-request/list')}>
            Project Requests
          </Breadcrumb.Item>
          <Breadcrumb.Item>{item.projectName}</Breadcrumb.Item>
        </Breadcrumb>

        <Space align="center">
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> {item.projectName}
          </Title>
          <Tag color="blue">{item.code}</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* LEFT */}
        <Col xs={24} lg={8}>
          {/* STATUS CARD */}
          <Card
            title={
              <>
                <InfoCircleOutlined /> Status
              </>
            }
            bordered={false}
          >
            <Tag
              color={statusColor[item.status as keyof typeof statusColor] || 'default'}
              style={{ fontSize: 14 }}
            >
              {item.status}
            </Tag>

            <Divider style={{ margin: '12px 0' }} />

            <Text type="secondary">Created At</Text>
            <Paragraph>{item.createAt}</Paragraph>

            <Text type="secondary">Updated At</Text>
            <Paragraph>{item.updateAt}</Paragraph>
          </Card>

          {/* CREATOR */}
          <Card
            style={{ marginTop: 16 }}
            title={
              <>
                <UserOutlined /> Created By
              </>
            }
            bordered={false}
          >
            <div className="cursor-pointer" onClick={() => handleMemberClick(item.createdBy)}>
              <Space>
                <Avatar icon={<UserOutlined />} />
                <Text strong>{item.createdName}</Text>
              </Space>
            </div>
          </Card>

          {/* COMPANY INFO */}
          <Card
            title={
              <Space>
                <ApartmentOutlined /> Company Information
              </Space>
            }
            bordered={false}
            style={{ marginTop: 16 }}
          >
            <div className="space-y-3">
              <div>
                <Text type="secondary">Requester Company</Text>
                <Paragraph
                  strong
                  className="cursor-pointer hover:underline"
                  onClick={() => handleCompanyClick(item.requesterCompanyId)}
                >
                  {item.requesterCompanyName}
                </Paragraph>
              </div>

              <div>
                <Text type="secondary">Executor Company</Text>
                <Paragraph
                  strong
                  className="cursor-pointer hover:underline"
                  onClick={() => handleCompanyClick(item.executorCompanyId)}
                >
                  {item.executorCompanyName}
                </Paragraph>
              </div>
            </div>
          </Card>
        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={16}>
          {/* PROJECT REQUEST DETAILS */}
          <Card
            title={
              <Space>
                <FileTextOutlined /> Project Request Details
              </Space>
            }
            bordered={false}
          >
            <Text type="secondary">Project Name</Text>
            <Paragraph strong>{item.projectName}</Paragraph>

            <Text type="secondary">Description</Text>
            <Paragraph>{item.description}</Paragraph>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Start Date</Text>
                <Paragraph>
                  <CalendarOutlined /> {item.startDate}
                </Paragraph>
              </Col>

              <Col span={12}>
                <Text type="secondary">End Date</Text>
                <Paragraph>
                  <CalendarOutlined /> {item.endDate}
                </Paragraph>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Text type="secondary">Converted to Project?</Text>
            <Paragraph>
              {item.isHaveProject ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>}
            </Paragraph>
          </Card>

          {/* TICKETS */}
          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <FileTextOutlined /> Related Tickets
              </Space>
            }
            bordered={false}
          >
            {item.tickets?.length ? (
              <>
                <Table<TicketRecord>
                  rowKey="id"
                  pagination={false}
                  dataSource={item.tickets}
                  columns={[
                    { title: 'Ticket Name', dataIndex: 'ticketName' },
                    { title: 'Priority', dataIndex: 'priority' },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      render: (v) => <Tag color="blue">{v}</Tag>,
                    },
                    {
                      title: 'Submitted By',
                      dataIndex: 'submittedByName',
                      render: (_, r) => (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => handleMemberClick(r.submittedBy)}
                        >
                          {r.submittedByName}
                        </span>
                      ),
                    },
                    { title: 'Resolved At', dataIndex: 'resolvedAt' },

                    // COMMENT COLUMN
                    {
                      title: 'Comments',
                      dataIndex: 'ticketComments',
                      render: (_, record) => (
                        <span
                          className="cursor-pointer text-blue-500 hover:underline"
                          onClick={() => openCommentModal(record.ticketComments)}
                        >
                          View (
                          {Array.isArray(record.ticketComments) ? record.ticketComments.length : 0})
                        </span>
                      ),
                    },
                  ]}
                />

                {/* MODAL SHOW COMMENTS */}
                <Modal
                  title="Ticket Comments"
                  open={commentModalOpen}
                  onCancel={() => setCommentModalOpen(false)}
                  footer={null}
                  width={700}
                >
                  {selectedComments.length ? (
                    <List
                      dataSource={selectedComments}
                      renderItem={(c: any) => (
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: '12px 0',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          <Avatar src={c.authorUserAvatar} />

                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{c.authorUserName}</div>
                            <div style={{ margin: '4px 0' }}>{c.body}</div>
                            <div style={{ color: '#999', fontSize: 12 }}>{c.createAt}</div>
                          </div>
                        </div>
                      )}
                    />
                  ) : (
                    <Empty description="No comments" />
                  )}
                </Modal>
              </>
            ) : (
              <Empty description="No tickets found" />
            )}
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/admin/project-request/list')}>
          Back to List
        </Button>
      </div>
    </div>
  );
};

export default ProjectRequestDetailAdminPage;
