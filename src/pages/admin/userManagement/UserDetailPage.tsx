import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Avatar, Descriptions, Tag, Tabs, Table } from 'antd';
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

  // State chính
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [activeTab, setActiveTab] = useState('detail');

  // Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // Owner Companies
  const [ownerCompanies, setOwnerCompanies] = useState<any[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerPagination, setOwnerPagination] = useState({
    pageNumber: 1,
    pageSize: 5,
    total: 0,
  });

  // Member Companies
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
        <Spin />
      </div>
    );

  if (!user) return <div className="text-center text-gray-500 mt-10">User not found.</div>;

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
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Tax Code', dataIndex: 'taxCode', key: 'taxCode' },
    {
      title: 'Created At',
      dataIndex: 'createAt',
      key: 'createAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const companyMemberColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Tax Code', dataIndex: 'taxCode', key: 'taxCode' },
    {
      title: 'Join At',
      dataIndex: 'joinAt',
      key: 'joinAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          { key: 'detail', label: 'User Detail' },
          { key: 'owner', label: 'Company Owner' },
          { key: 'member', label: 'Company Member' },
          { key: 'log', label: 'User Log' },
        ]}
      />

      {/* TAB 1: USER DETAIL */}
      {activeTab === 'detail' && (
        <Card
          title={
            <div className="flex items-center space-x-3">
              <Avatar size={60} src={user.avatar} />
              <div>
                <h2 className="text-lg font-semibold">{user.userName}</h2>
                <p className="text-sm text-gray-500">{renderValue(user.email)}</p>
              </div>
            </div>
          }
          bordered
          className="shadow-md"
        >
          <Descriptions bordered column={1} labelStyle={{ fontWeight: 'bold', width: 150 }}>
            <Descriptions.Item label="Phone">{renderValue(user.phone)}</Descriptions.Item>
            <Descriptions.Item label="Gender">{renderValue(user.gender)}</Descriptions.Item>
            <Descriptions.Item label="Address">{renderValue(user.address)}</Descriptions.Item>
            <Descriptions.Item label="Google Sub">{renderValue(user.googleSub)}</Descriptions.Item>
            <Descriptions.Item label="System Admin">
              {user.isSystemAdmin ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {user.status ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {renderValue(dayjs(user.createAt).format('YYYY-MM-DD HH:mm'))}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {renderValue(dayjs(user.updateAt).format('YYYY-MM-DD HH:mm'))}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* TAB 2: COMPANY OWNER */}
      {activeTab === 'owner' && (
        <Card title="Company Owner" bordered className="shadow-md">
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
              }}
            />
          )}
        </Card>
      )}

      {/* TAB 3: COMPANY MEMBER */}
      {activeTab === 'member' && (
        <Card title="Company Member" bordered className="shadow-md">
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
              }}
            />
          )}
        </Card>
      )}

      {/* TAB 4: USER LOG */}
      {activeTab === 'log' && (
        <Card title="User Log" bordered className="shadow-md">
          {logLoading ? (
            <div className="flex justify-center py-6">
              <Spin />
            </div>
          ) : (
            <Table
              dataSource={logs}
              columns={logColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default UserDetailPage;
