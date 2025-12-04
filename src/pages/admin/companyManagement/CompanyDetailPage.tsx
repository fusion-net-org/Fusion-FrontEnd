/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Tabs, Table, Tag, Avatar, Descriptions } from 'antd';
import { Search } from 'lucide-react';
import { getCompanyById, getProjectsOfCompanyByAdmin } from '@/services/companyService.js';
import { getMembersOfCompanyByAdmin } from '@/services/companyMemberService.js';
import { useDebounce } from '@/hook/Debounce';

const { TabPane } = Tabs;

interface ProjectRecord {
  id: string;
  name?: string;
  ownerId?: string;
  ownerName?: string;
}

interface MemberRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  email: string;
  phone: string;
  status: string;
  joinedAt: string;
  isOwner: boolean;
}

/* --------------------------- PROJECT LIST TAB --------------------------- */
const ProjectListTab = ({ companyId }: { companyId: string }) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 500);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjectsOfCompanyByAdmin({
        CompanyId: companyId,
        ProjectName: debouncedSearch,
        Status: status,
        PageNumber: page,
        PageSize: pageSize,
      });

      if (res?.succeeded) {
        setProjects(res.data.items || []);
        setTotal(res.data.totalCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, pageSize, debouncedSearch, status]);

  const handleProjectClick = (projectId: string) => {
    localStorage.setItem('projectDetailEnabled', 'true');
    localStorage.setItem('projectDetailId', projectId);
    navigate(`/admin/projects/detail/${projectId}`);
  };

  const handleUserClick = (uId: any) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', uId);
    navigate(`/admin/users/detail/${uId}`);
  };

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />

          <input
            placeholder="Search by project name..."
            className="
              pl-9 pr-3 py-2
              border border-gray-300
              rounded-md
              w-[250px]
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              transition-all
            "
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {/* TABLE */}
      <Table<ProjectRecord>
        bordered
        loading={loading}
        dataSource={projects}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            render: (value: string | null | undefined) =>
              value ? value : <span className="text-gray-400 italic">N/A</span>,
          },
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (_, r) => (
              <span
                className="cursor-pointer hover:underline"
                onClick={() => handleProjectClick(r.id)}
              >
                {r.name}
              </span>
            ),
          },
          { title: 'Description', dataIndex: 'description', key: 'description' },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (v) => <Tag color="blue">{v}</Tag>,
          },
          {
            title: 'Type',
            dataIndex: 'projectType',
            key: 'projectType',
          },
          {
            title: 'Owner',
            dataIndex: 'ownerName',
            key: 'ownerName',
            render: (_, r) => (
              <span
                className="cursor-pointer hover:underline"
                onClick={() => handleUserClick(r.ownerId)}
              >
                {r.ownerName}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};

/* --------------------------- MEMBER LIST TAB --------------------------- */
const MemberListTab = ({ companyId }: { companyId: string }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);
  const navigate = useNavigate();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getMembersOfCompanyByAdmin({
        CompanyId: companyId,
        MemberName: debouncedSearch,
        PageNumber: page,
        PageSize: pageSize,
      });

      if (res?.succeeded) {
        setMembers(res.data.items || []);
        setTotal(res.data.totalCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, pageSize, debouncedSearch]);

  const handleMemberClick = (memberId: string) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', memberId);
    navigate(`/admin/users/detail/${memberId}`);
  };

  return (
    <div className="space-y-4">
      {/* FILTER */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />

          <input
            placeholder="Search by member name..."
            className="
              pl-9 pr-3 py-2
              border border-gray-300
              rounded-md
              w-[250px]
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              transition-all
            "
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {/* TABLE */}
      <Table<MemberRecord>
        bordered
        loading={loading}
        dataSource={members}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        onRow={(record) => ({
          onClick: () => handleMemberClick(record.memberId),
          style: { cursor: 'pointer' },
        })}
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
            render: (_, r) => (
              <span
                className="cursor-pointer hover:underline"
                onClick={() => handleMemberClick(r.memberId)}
              >
                {r.memberName}
              </span>
            ),
          },
          {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
          },
          {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (v) => (v ? v : <span className="text-gray-400 italic">Not provided</span>),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (st) => (st === 'Active' ? <Tag color="green">Active</Tag> : <Tag>{st}</Tag>),
          },
          {
            title: 'Joined At',
            dataIndex: 'joinedAt',
            key: 'joinedAt',
            render: (v) => new Date(v).toLocaleString(),
          },
          {
            title: 'Role',
            dataIndex: 'isOwner',
            key: 'isOwner',
            render: (ok) => (ok ? <Tag color="blue">Owner</Tag> : <Tag>Member</Tag>),
          },
        ]}
      />
    </div>
  );
};
/* --------------------------- MAIN PAGE --------------------------- */

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

  return (
    <div className="p-6 space-y-6">
      <Card
        title={<span className="text-lg font-semibold">Company Detail</span>}
        bordered
        className="shadow-md"
      >
        <Tabs defaultActiveKey="1">
          {/* ---------------- Company Detail ---------------- */}
          <TabPane tab="Company detail" key="1">
            <div className="flex flex-col md:flex-row gap-6">
              {/* LEFT */}
              <div className="flex flex-col items-center">
                <Avatar src={company.avatarCompany || company.imageCompany} size={120} />
                <h2 className="mt-3 text-xl font-semibold text-center w-[180px] break-words">
                  {company.name}
                </h2>
              </div>

              {/* RIGHT */}
              <div className="flex-1">
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Company Name">{company.name}</Descriptions.Item>

                  <Descriptions.Item label="Owner">
                    <div className="flex items-center gap-2">
                      <Avatar src={company.ownerUserAvatar} size="small" />
                      <span>{company.ownerUserName}</span>
                    </div>
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">{company.email}</Descriptions.Item>
                  <Descriptions.Item label="Tax Code">{company.taxCode}</Descriptions.Item>

                  <Descriptions.Item label="Phone">
                    {company.phoneNumber || (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Address">
                    {company.address || <span className="text-gray-400 italic">Not provided</span>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Website">
                    {company.website || <span className="text-gray-400 italic">Not provided</span>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Detail">
                    {company.detail || <span className="text-gray-400 italic">Not provided</span>}
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

          {/* ---------------- Project list (API + filter) ---------------- */}
          <TabPane tab="Project list" key="2">
            <ProjectListTab companyId={company.id} />
          </TabPane>

          {/* ---------------- Member list ---------------- */}
          <TabPane tab="Member list" key="3">
            <MemberListTab companyId={company.id} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
