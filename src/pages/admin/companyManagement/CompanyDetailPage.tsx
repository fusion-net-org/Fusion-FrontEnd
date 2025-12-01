/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Tabs, Table, Tag, Avatar, Descriptions } from 'antd';
import { getCompanyById } from '@/services/companyService.js';

interface Member {
  id: number;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  email: string;
  phone: string;
  status: string;
  joinedAt: string;
  isOwner: boolean;
}

const { TabPane } = Tabs;

export default function CompanyDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);

  const id = paramId || localStorage.getItem('companyDetailId');

  useEffect(() => {
    if (!id) {
      navigate('/admin/companies/list', { replace: true });
      return;
    }

    const fetchCompany = async () => {
      setLoading(true);
      try {
        const res = await getCompanyById(id);
        if (res?.succeeded) setCompany(res.data);
        else setCompany(null);
      } catch (err) {
        console.error(err);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id, navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );

  if (!company) return <div className="text-center text-gray-500">Company not found.</div>;

  // Handle click
  const handleProjectClick = (projectId: string) => {
    localStorage.setItem('projectDetailEnabled', 'true');
    localStorage.setItem('projectDetailId', projectId);
    navigate(`/admin/projects/detail/${projectId}`);
  };

  const handleMemberClick = (memberId: string) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', memberId);
    navigate(`/admin/users/detail/${memberId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <Card
        title={<span className="text-lg font-semibold">Company Detail</span>}
        bordered
        className="shadow-md"
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Company detail" key="1">
            <div className="flex flex-col md:flex-row gap-6">
              {/* LEFT: Avatar + Name */}
              <div className="flex flex-col items-center">
                <Avatar src={company.avatarCompany || company.imageCompany} size={120} />

                <h2 className="mt-3 text-xl font-semibold text-center w-[180px] break-words">
                  {company.name}
                </h2>
              </div>

              {/* RIGHT: Detail Info */}
              <div className="flex-1">
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Company ID">{company.id}</Descriptions.Item>

                  <Descriptions.Item label="Owner">
                    <div className="flex items-center gap-2">
                      <Avatar src={company.ownerUserAvatar} size="small" />
                      <span>{company.ownerUserName}</span>
                    </div>
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">{company.email}</Descriptions.Item>
                  <Descriptions.Item label="Tax Code">{company.taxCode}</Descriptions.Item>

                  <Descriptions.Item label="Phone">
                    {company.phoneNumber ? (
                      company.phoneNumber
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Address">
                    {company.address ? (
                      company.address
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Website">
                    {company.website ? (
                      company.website
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Detail">
                    {company.detail ? (
                      company.detail
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Created At">
                    {new Date(company.createAt).toLocaleString()}
                  </Descriptions.Item>

                  <Descriptions.Item label="Updated At">
                    {new Date(company.updateAt).toLocaleString()}
                  </Descriptions.Item>

                  <Descriptions.Item label="Status">
                    {company.isDeleted ? (
                      <Tag color="red">Deleted</Tag>
                    ) : (
                      <Tag color="green">Active</Tag>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Statistics">
                    <div className="space-x-2">
                      <Tag color="blue">Members: {company.totalMember}</Tag>
                      <Tag color="purple">Projects: {company.totalProject}</Tag>
                      <Tag color="cyan">Partners: {company.totalPartners}</Tag>
                      <Tag color="green">Approved: {company.totalApproved}</Tag>
                      <Tag color="orange">Waiting: {company.totalWaitForApprove}</Tag>
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </TabPane>

          <TabPane tab="Project list" key="2">
            <Table
              bordered
              dataSource={company.listProjects}
              rowKey="id"
              pagination={false}
              columns={[
                { title: 'Code', dataIndex: 'code', key: 'code' },
                {
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (_: any, record: any) => (
                    <span
                      className=" hover:underline cursor-pointer"
                      onClick={() => handleProjectClick(record.id)}
                    >
                      {record.name}
                    </span>
                  ),
                },
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                {
                  title: 'Start - End',
                  key: 'dates',
                  render: (r: any) => `${r.startDate} → ${r.endDate}`,
                },
                {
                  title: 'Created At',
                  dataIndex: 'createAt',
                  key: 'createAt',
                  render: (v: string) => new Date(v).toLocaleString(),
                },
              ]}
            />
          </TabPane>

          <TabPane tab="Member list" key="3">
            <Table
              bordered
              dataSource={company.listMembers}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Avatar',
                  dataIndex: 'memberAvatar',
                  key: 'avatar',
                  render: (v: string) => <Avatar src={v} size="small" />,
                },
                {
                  title: 'Name',
                  dataIndex: 'memberName',
                  key: 'memberName',
                  render: (_: any, record: any) => (
                    <span
                      className=" hover:underline cursor-pointer"
                      onClick={() => handleMemberClick(record.memberId)}
                    >
                      {record.memberName}
                    </span>
                  ),
                },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) =>
                    status === 'Active' ? <Tag color="green">Active</Tag> : <Tag>{status}</Tag>,
                },
                {
                  title: 'Joined At',
                  dataIndex: 'joinedAt',
                  key: 'joinedAt',
                  render: (v: string) => new Date(v).toLocaleString(),
                },
                {
                  title: 'Owner',
                  dataIndex: 'isOwner',
                  key: 'isOwner',
                  render: (isOwner: boolean) =>
                    isOwner ? <Tag color="blue">Owner</Tag> : <Tag>Member</Tag>,
                },
              ]}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
