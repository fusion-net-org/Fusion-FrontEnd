import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Spin,
  Avatar,
  Descriptions,
  Tag,
  Tabs,
  Table,
  Row,
  Col,
  Badge,
  Empty,
  Button,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  CalendarOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import {
  getUserFullInfo,
  getUserLogsByUser,
  getAllOwnerCompanyByUser,
  getAllMemberCompanyByUser,
} from '@/services/userService.js';
import dayjs from 'dayjs';

interface UserDetail {
  id: string;
  userName: string;
  avatar: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  googleSub: string | null;
  isSystemAdmin: boolean;
  status: boolean;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  createAt: string;
  updateAt: string;
}

const UserDetailPage = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const id = paramId || localStorage.getItem('userDetailId');

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [activeTab, setActiveTab] = useState('detail');

  const [logs, setLogs] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const [ownerCompanies, setOwnerCompanies] = useState<any[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerPagination, setOwnerPagination] = useState({
    pageNumber: 1,
    pageSize: 5,
    total: 0,
  });

  const [memberCompanies, setMemberCompanies] = useState<any[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberPagination, setMemberPagination] = useState({
    pageNumber: 1,
    pageSize: 5,
    total: 0,
  });

  useEffect(() => {
    if (!id) {
      navigate('/admin/users/list');
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await getUserFullInfo(id);
        if (res?.succeeded) setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const fetchLogs = async () => {
    if (!id) return;
    setLogLoading(true);
    try {
      const res = await getUserLogsByUser(id);
      if (res?.succeeded) setLogs(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogLoading(false);
    }
  };

  const fetchOwnerCompanies = async (page = 1, size = 5) => {
    if (!id) return;
    setOwnerLoading(true);
    try {
      const res = await getAllOwnerCompanyByUser(id, page, size);
      if (res?.succeeded) {
        setOwnerCompanies(res.data?.items || []);
        setOwnerPagination({
          pageNumber: page,
          pageSize: size,
          total: res.data?.totalCount || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOwnerLoading(false);
    }
  };

  const fetchMemberCompanies = async (page = 1, size = 5) => {
    if (!id) return;
    setMemberLoading(true);
    try {
      const res = await getAllMemberCompanyByUser(id, page, size);
      if (res?.succeeded) {
        setMemberCompanies(res.data?.items || []);
        setMemberPagination({
          pageNumber: page,
          pageSize: size,
          total: res.data?.totalCount || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'log') fetchLogs();
    if (activeTab === 'owner') fetchOwnerCompanies();
    if (activeTab === 'member') fetchMemberCompanies();
  }, [activeTab]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="User not found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate('/admin/users/list')}>
            Back to user list
          </Button>
        </Empty>
      </div>
    );
  }

  const renderValue = (value: any) =>
    value ? value : <span className="text-gray-400 italic">Not provided</span>;

  const logColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '20%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '55%',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '25%',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const companyOwnerColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: '15%' },
    { title: 'Name', dataIndex: 'name', key: 'name', width: '40%' },
    { title: 'Tax Code', dataIndex: 'taxCode', key: 'taxCode', width: '20%' },
    {
      title: 'Created At',
      dataIndex: 'createAt',
      key: 'createAt',
      width: '25%',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const companyMemberColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: '15%' },
    { title: 'Name', dataIndex: 'name', key: 'name', width: '40%' },
    { title: 'Tax Code', dataIndex: 'taxCode', key: 'taxCode', width: '20%' },
    {
      title: 'Join At',
      dataIndex: 'joinAt',
      key: 'joinAt',
      width: '25%',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={[
            { key: 'detail', label: 'User Detail' },
            { key: 'owner', label: 'Company Owner' },
            { key: 'member', label: 'Company Member' },
            { key: 'log', label: 'User Log' },
          ]}
        />

        {activeTab === 'detail' && (
          <div style={{ marginTop: 24 }}>
            {/* Profile Header Card */}
            <Card
              bordered={false}
              style={{ marginBottom: 24, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
            >
              <Row gutter={24} align="middle">
                <Col xs={24} sm={6} md={4} style={{ textAlign: 'center' }}>
                  <Badge
                    count={user.isSystemAdmin ? 'ADMIN' : 0}
                    style={{
                      backgroundColor: '#faad14',
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '0 8px',
                      height: 20,
                      lineHeight: '20px',
                    }}
                  >
                    <Avatar
                      size={100}
                      src={user.avatar}
                      style={{
                        border: '3px solid #fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    />
                  </Badge>
                </Col>
                <Col xs={24} sm={18} md={20}>
                  <div style={{ marginTop: 16 }}>
                    <h1
                      style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#262626' }}
                    >
                      {user.userName}
                    </h1>
                    <p style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 12 }}>
                      <MailOutlined style={{ marginRight: 6 }} />
                      {user.email}
                    </p>
                    <div>
                      <Tag
                        color={user.status ? 'success' : 'default'}
                        style={{ fontSize: 12, padding: '4px 12px', border: 'none' }}
                      >
                        {user.status ? 'Active' : 'Inactive'}
                      </Tag>
                      {user.isSystemAdmin && (
                        <Tag
                          color="gold"
                          style={{ fontSize: 12, padding: '4px 12px', border: 'none' }}
                        >
                          <SafetyOutlined /> System Administrator
                        </Tag>
                      )}
                      <Tag
                        color="blue"
                        style={{ fontSize: 12, padding: '4px 12px', border: 'none' }}
                      >
                        <CalendarOutlined /> Joined {dayjs(user.createAt).format('MMM YYYY')}
                      </Tag>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Information Grid */}
            <Row gutter={[24, 24]}>
              {/* Contact Information */}
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      <PhoneOutlined style={{ marginRight: 8 }} />
                      Contact Information
                    </span>
                  }
                  bordered={false}
                  style={{ height: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
                >
                  <Descriptions column={1} colon={false}>
                    <Descriptions.Item
                      label={<span style={{ color: '#8c8c8c', fontSize: 13 }}>Phone Number</span>}
                      contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {renderValue(user.phone)}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={<span style={{ color: '#8c8c8c', fontSize: 13 }}>Email Address</span>}
                      contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {renderValue(user.email)}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <span style={{ color: '#8c8c8c', fontSize: 13 }}>Physical Address</span>
                      }
                      contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {renderValue(user.address)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* Personal Information */}
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      Personal Information
                    </span>
                  }
                  bordered={false}
                  style={{ height: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
                >
                  <Descriptions column={1} colon={false}>
                    <Descriptions.Item
                      label={<span style={{ color: '#8c8c8c', fontSize: 13 }}>Gender</span>}
                      contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {renderValue(user.gender)}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={<span style={{ color: '#8c8c8c', fontSize: 13 }}>Google Account</span>}
                      contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {renderValue(user.googleSub)}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={<span style={{ color: '#8c8c8c', fontSize: 13 }}>User ID</span>}
                      contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {user.id}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* Account Status */}
              <Col xs={24}>
                <Card
                  title={
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      <IdcardOutlined style={{ marginRight: 8 }} />
                      Account Status & Timeline
                    </span>
                  }
                  bordered={false}
                  style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
                          Account Type
                        </div>
                        <Tag
                          color={user.isSystemAdmin ? 'gold' : 'default'}
                          style={{ fontSize: 14, padding: '6px 16px' }}
                        >
                          {user.isSystemAdmin ? 'Administrator' : 'Regular User'}
                        </Tag>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
                          Current Status
                        </div>
                        <Tag
                          color={user.status ? 'success' : 'error'}
                          style={{ fontSize: 14, padding: '6px 16px' }}
                        >
                          {user.status ? 'Active' : 'Inactive'}
                        </Tag>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
                          Created Date
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {dayjs(user.createAt).format('MMM DD, YYYY')}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {dayjs(user.createAt).format('HH:mm')}
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
                          Last Updated
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {dayjs(user.updateAt).format('MMM DD, YYYY')}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {dayjs(user.updateAt).format('HH:mm')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {activeTab === 'owner' && (
          <Card
            title="Company Owner"
            bordered={false}
            style={{ marginTop: 24, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
          >
            {ownerLoading ? (
              <div className="flex justify-center py-6">
                <Spin />
              </div>
            ) : (
              <Table
                dataSource={ownerCompanies}
                rowKey="id"
                columns={companyOwnerColumns}
                pagination={{
                  current: ownerPagination.pageNumber,
                  pageSize: ownerPagination.pageSize,
                  total: ownerPagination.total,
                  onChange: (page, pageSize) => fetchOwnerCompanies(page, pageSize),
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} items`,
                }}
              />
            )}
          </Card>
        )}

        {activeTab === 'member' && (
          <Card
            title="Company Member"
            bordered={false}
            style={{ marginTop: 24, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
          >
            {memberLoading ? (
              <div className="flex justify-center py-6">
                <Spin />
              </div>
            ) : (
              <Table
                dataSource={memberCompanies}
                rowKey="id"
                columns={companyMemberColumns}
                pagination={{
                  current: memberPagination.pageNumber,
                  pageSize: memberPagination.pageSize,
                  total: memberPagination.total,
                  onChange: (page, pageSize) => fetchMemberCompanies(page, pageSize),
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} items`,
                }}
              />
            )}
          </Card>
        )}

        {activeTab === 'log' && (
          <Card
            title="User Log"
            bordered={false}
            style={{ marginTop: 24, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
          >
            {logLoading ? (
              <div className="flex justify-center py-6">
                <Spin />
              </div>
            ) : (
              <Table
                dataSource={logs}
                columns={logColumns}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  showTotal: (total) => `Total ${total} logs`,
                }}
              />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDetailPage;
