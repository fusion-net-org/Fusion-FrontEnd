/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, Avatar, Tag, Button, Space, Input, DatePicker, Select, Pagination } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import { Calendar, Clock, Mail, MapPin, Phone, User } from 'lucide-react';
import LoadingOverlay from '@/common/LoadingOverlay';
import {
  GetCompanyMemberByUserId,
  AcceptJoinMemberById,
  RejectJoinMemberById,
} from '@/services/companyMemberService.js';
import type { CompanyMemberItem, CompanyMemberPagedResponse } from '@/interfaces/Company/member';
import { useDebounce } from '@/hook/Debounce';

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

  // state loading
  const [loading, setLoading] = useState(false);

  // Paging state
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 8;
  const [totalItems, setTotalItems] = useState(0);

  const fetchMembers = async (page: number = 1) => {
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
        pageSize,
      );

      if (response.statusCode === 200) {
        setMembers(response.data.items);
        setTotalItems(response.data.totalCount);
        setPageNumber(page);
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
    { title: 'Company Name', dataIndex: 'companyName' },
    { title: 'Email', dataIndex: 'companyEmail' },
    { title: 'Owner', dataIndex: 'companyOwner' },
    { title: 'Phone', dataIndex: 'companyPhone' },
    {
      title: 'Create At',
      dataIndex: 'companyCreateAt',
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Join At',
      dataIndex: 'memberJoinAt',
      align: 'center',
      render: (date) =>
        !date || date.startsWith('0001-01-01') ? '---' : moment(date).format('DD/MM/YYYY'),
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
              <Option value="Accepted">Accepted</Option>
              <Option value="Rejected">Rejected</Option>
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
      {viewGrid ? (
        <div>
          <div className="grid gap-6 mt-4 auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl shadow-md p-6 hover:-translate-y-1 transition"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-5 border-b pb-4">
                  <Avatar
                    src={company.companyAvatar || undefined}
                    size={72}
                    alt={company.companyName}
                  >
                    {company.companyName?.[0]}
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-xl truncate">{company.companyName}</h3>
                    {getStatusTag(company.status)}
                  </div>
                </div>

                {/* Info with labels */}
                <div className="space-y-2 text-sm text-gray-700 mb-6">
                  <p className="flex items-center gap-1 truncate">
                    <User size={16} /> <span className="font-semibold">Owner:</span>{' '}
                    {company.companyOwner}
                  </p>
                  <p className="flex items-center gap-1 truncate">
                    <Phone size={16} /> <span className="font-semibold">Phone:</span>{' '}
                    {company.companyPhone}
                  </p>
                  <p className="flex items-center gap-1 truncate">
                    <MapPin size={16} /> <span className="font-semibold">Address:</span>{' '}
                    {company.companyAddress}
                  </p>
                  <p className="flex items-center gap-1 truncate">
                    <Calendar size={16} /> <span className="font-semibold">Created At:</span>{' '}
                    {moment(company.companyCreateAt).format('DD/MM/YYYY')}
                  </p>
                  <p className="flex items-center gap-1 truncate">
                    <Clock size={16} /> <span className="font-semibold">Join At:</span>{' '}
                    {!company.memberJoinAt || company.memberJoinAt.startsWith('0001-01-01')
                      ? '--'
                      : moment(company.memberJoinAt).format('DD/MM/YYYY')}
                  </p>
                </div>

                {/* Action */}
                <div className="flex gap-3 border-t pt-4">
                  {renderActionButton(company.status, company.id)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-end mt-6">
            <Pagination
              current={pageNumber}
              pageSize={pageSize}
              total={totalItems}
              onChange={(page) => fetchMembers(page)}
              showSizeChanger={false}
            />
          </div>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          pagination={{
            current: pageNumber,
            pageSize: pageSize,
            total: totalItems,
            onChange: (page) => fetchMembers(page),
          }}
          bordered
        />
      )}
    </div>
  );
};

export default InvitationPage;
