/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, Avatar, Tag, Button, Space, Input, DatePicker, Select, Pagination } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined, InboxOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import LoadingOverlay from '@/common/LoadingOverlay';
import {
  GetCompanyMemberByUserId,
  AcceptJoinMemberById,
  RejectJoinMemberById,
} from '@/services/companyMemberService.js';
import type { CompanyMemberItem, CompanyMemberPagedResponse } from '@/interfaces/Company/member';
import { useDebounce } from '@/hook/Debounce';
import { Paging } from '../Paging/Paging';

const { RangePicker } = DatePicker;
const { Option } = Select;

const InvitationPage: React.FC = () => {
  //use state data
  const [members, setMembers] = useState<CompanyMemberItem[]>([]);
  const [viewGrid, setViewGrid] = useState(false);

  //use state search
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);

  //use state date
  const [createDateRange, setCreateDateRange] = useState<any>(null);
  const [joinDateRange, setJoinDateRange] = useState<any>(null);

  //use state filter
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Active' | 'Inactive'>(
    'All',
  );
  //sort column
  const [sortColumn, setSortColumn] = useState<string>('JoinedAt');
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  // state loading
  const [loading, setLoading] = useState(false);

  // Paging state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalItems, setTotalItems] = useState(0);

  const fetchMembers = async (page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true);
      const response: CompanyMemberPagedResponse = await GetCompanyMemberByUserId(
        debouncedSearchText,
        statusFilter !== 'All' ? statusFilter : null,
        createDateRange ? createDateRange[0].toISOString() : null,
        createDateRange ? createDateRange[1].toISOString() : null,
        joinDateRange ? joinDateRange[0].toISOString() : null,
        joinDateRange ? joinDateRange[1].toISOString() : null,
        null,
        null,
        page,
        size,
        sortColumn,
        sortDescending,
      );

      if (response.statusCode === 200) {
        setMembers(response.data.items);
        setTotalItems(response.data.totalCount);
        setPageNumber(page);
        setPageSize(size);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleAccept = async (memberId: number) => {
    try {
      setLoading(true);
      await AcceptJoinMemberById(memberId);
      fetchMembers(pageNumber);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (memberId: number) => {
    try {
      setLoading(true);
      await RejectJoinMemberById(memberId);
      fetchMembers(pageNumber);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMembers(1);
  }, [debouncedSearchText, createDateRange, joinDateRange, statusFilter]);

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Tag color="green">Accepted</Tag>;
      case 'inactive':
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag color="orange">Pending</Tag>;
    }
  };
  const renderActionButton = (status: string, memberId: number) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'pending') {
      return (
        <Space>
          <Button type="primary" size="middle" onClick={() => handleAccept(memberId)}>
            Accept
          </Button>
          <Button danger size="middle" onClick={() => handleReject(memberId)}>
            Reject
          </Button>
        </Space>
      );
    } else if (lowerStatus === 'active') {
      return (
        <Button type="default" style={{ backgroundColor: '#52c41a', color: '#fff' }}>
          Active
        </Button>
      );
    } else if (lowerStatus === 'inactive') {
      return (
        <Button type="default" style={{ backgroundColor: '#ff4d4f', color: '#fff' }}>
          Inactive
        </Button>
      );
    }
    return null;
  };

  const columns: ColumnsType<CompanyMemberItem> = [
    {
      title: 'Avatar',
      dataIndex: 'companyAvatar',
      render: (avatar, record) =>
        avatar ? (
          <Avatar src={avatar} size={48} />
        ) : (
          <Avatar size={48}>{record.companyName[0]}</Avatar>
        ),
      width: 80,
    },
    {
      title: (
        <div
          className="flex items-center gap-1 cursor-pointer select-none"
          onClick={() => {
            setSortColumn('Company.Name');
            setSortDescending((prev) => !prev);
            fetchMembers(1);
          }}
        >
          Company Name
          {sortColumn === 'Company.Name' ? (
            sortDescending ? (
              <ChevronDown size={16} strokeWidth={2.5} />
            ) : (
              <ChevronUp size={16} strokeWidth={2.5} />
            )
          ) : (
            <ChevronUp size={16} strokeWidth={1} className="opacity-150" />
          )}
        </div>
      ),
      dataIndex: 'companyName',
    },
    {
      title: (
        <div
          className="flex items-center gap-1 cursor-pointer select-none"
          onClick={() => {
            setSortColumn('Company.Email');
            setSortDescending((prev) => !prev);
            fetchMembers(1);
          }}
        >
          Email
          {sortColumn === 'Company.Email' ? (
            sortDescending ? (
              <ChevronDown size={16} strokeWidth={2.5} />
            ) : (
              <ChevronUp size={16} strokeWidth={2.5} />
            )
          ) : (
            <ChevronUp size={16} strokeWidth={1} className="opacity-150" />
          )}
        </div>
      ),
      dataIndex: 'companyEmail',
    },

    { title: 'Owner', dataIndex: 'companyOwner' },
    { title: 'Phone', dataIndex: 'companyPhone' },
    {
      title: (
        <div
          className="flex items-center gap-1 cursor-pointer select-none"
          onClick={() => {
            setSortColumn('Company.CreateAt');
            setSortDescending((prev) => !prev);
            fetchMembers(1);
          }}
        >
          Create At
          {sortColumn === 'Company.CreateAt' ? (
            sortDescending ? (
              <ChevronDown size={16} strokeWidth={2.5} />
            ) : (
              <ChevronUp size={16} strokeWidth={2.5} />
            )
          ) : (
            <ChevronUp size={16} strokeWidth={1} className="opacity-150" />
          )}
        </div>
      ),
      dataIndex: 'companyCreateAt',
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: (
        <div
          className="flex items-center gap-1 cursor-pointer select-none"
          onClick={() => {
            setSortColumn('JoinedAt');
            setSortDescending((prev) => !prev);
            fetchMembers(1);
          }}
        >
          Join At
          {sortColumn === 'JoinedAt' ? (
            sortDescending ? (
              <ChevronDown size={16} strokeWidth={2.5} />
            ) : (
              <ChevronUp size={16} strokeWidth={2.5} />
            )
          ) : (
            <ChevronUp size={16} strokeWidth={1} className="opacity-150" />
          )}
        </div>
      ),
      dataIndex: 'memberJoinAt',
      align: 'center',
      render: (date) =>
        !date || date.startsWith('0001-01-01') ? '---' : moment(date).format('DD/MM/YYYY'),
    },

    {
      title: 'Roles',
      dataIndex: 'roles',
      align: 'start',
      render: (roles: string[]) =>
        roles && roles.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'start',
              gap: '6px',
            }}
          >
            {roles.map((role, index) => (
              <Tag key={index} color="blue" style={{ width: 'fit-content' }}>
                {role}
              </Tag>
            ))}
          </div>
        ) : (
          <Tag style={{ margin: '0 auto' }}>None</Tag>
        ),
    },

    {
      title: 'Status',
      dataIndex: 'status',
      render: getStatusTag,
    },
    {
      title: 'Action',
      render: (_, record) => renderActionButton(record.status, record.id),
    },
  ];

  return (
    <div className="p-3 min-h-screen">
      <LoadingOverlay loading={loading} message="Searching..." transparent={true} />
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Company Invitations</h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Space size="middle" className="flex-wrap">
          <div className="flex flex-col">
            <label className="text-gray-700 text-sm mb-1">Search</label>
            <Input
              placeholder="Search company name, email, phone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 400 }}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 text-sm mb-1">Create Date</label>
            <RangePicker onChange={(dates) => setCreateDateRange(dates)} />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 text-sm mb-1">Join Date</label>
            <RangePicker onChange={(dates) => setJoinDateRange(dates)} />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 text-sm mb-1">Status</label>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
              <Option value="All">All</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </div>
        </Space>
      </div>

      {/* VIEW SWITCH */}
      <div className="flex gap-2 mb-4">
        <Button
          type={!viewGrid ? 'primary' : 'default'}
          icon={<UnorderedListOutlined />}
          onClick={() => setViewGrid(false)}
        >
          List View
        </Button>
        <Button
          type={viewGrid ? 'primary' : 'default'}
          icon={<AppstoreOutlined />}
          onClick={() => setViewGrid(true)}
        >
          Grid View
        </Button>
      </div>

      {/* GRID VIEW */}
      {viewGrid && (
        <div>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
              <InboxOutlined style={{ fontSize: 64 }} />
              <p className="mt-4 text-lg">No Data</p>
            </div>
          ) : (
            <div
              className="
          grid gap-6 mt-4 
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        "
            >
              {members.map((company) => (
                <div
                  key={company.id}
                  className="
              bg-white rounded-2xl shadow-lg p-5 
              hover:shadow-xl hover:-translate-y-1
              transition-all duration-300 border border-gray-100
              flex flex-col justify-between
            "
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar
                      src={company.companyAvatar || undefined}
                      size={64}
                      alt={company.companyName}
                    >
                      {company.companyName?.[0]}
                    </Avatar>

                    <div className="flex flex-col">
                      <h3 className="font-semibold text-lg truncate">{company.companyName}</h3>

                      <div className="mt-1">{getStatusTag(company.status)}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-sm text-gray-700 space-y-2 mb-2">
                    <p className="flex items-center gap-1 truncate">
                      <User size={15} /> <span className="font-medium">Owner:</span>{' '}
                      {company.companyOwner}
                    </p>

                    <p className="flex items-center gap-1 truncate">
                      <Phone size={15} /> <span className="font-medium">Phone:</span>{' '}
                      {company.companyPhone}
                    </p>

                    <p className="flex items-center gap-1 truncate">
                      <MapPin size={15} /> <span className="font-medium">Address:</span>{' '}
                      {company.companyAddress || '--'}
                    </p>

                    <p className="flex items-center gap-1">
                      <Calendar size={15} /> <span className="font-medium">Created:</span>{' '}
                      {moment(company.companyCreateAt).format('DD/MM/YYYY')}
                    </p>

                    <p className="flex items-center gap-1">
                      <Clock size={15} /> <span className="font-medium">Joined:</span>{' '}
                      {!company.memberJoinAt || company.memberJoinAt.startsWith('0001')
                        ? '--'
                        : moment(company.memberJoinAt).format('DD/MM/YYYY')}
                    </p>
                  </div>

                  {/* Roles */}
                  <div className="mb-4">
                    <div className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <ShieldCheck size={15} className="text-gray-500" /> Roles
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {company.roles?.length > 0 ? (
                        company.roles.map((role, i) => (
                          <Tag
                            key={i}
                            color="grey"
                            style={{
                              margin: 0,
                              fontSize: 12,
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {role}
                          </Tag>
                        ))
                      ) : (
                        <Tag>None</Tag>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex gap-3 pt-3 border-t">
                    {renderActionButton(company.status, company.id)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="w-full mt-4">
            <Paging
              page={pageNumber}
              pageSize={pageSize}
              totalCount={totalItems}
              onPageChange={(page) => fetchMembers(page)}
              onPageSizeChange={(size) => fetchMembers(1, size)}
            />
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      {!viewGrid && (
        <div>
          <Table columns={columns} dataSource={members} rowKey="id" pagination={false} bordered />

          {/* Pagination */}
          <div className="w-full">
            <Paging
              page={pageNumber}
              pageSize={pageSize}
              totalCount={totalItems}
              onPageChange={(page) => fetchMembers(page)}
              onPageSizeChange={(size) => fetchMembers(1, size)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationPage;
