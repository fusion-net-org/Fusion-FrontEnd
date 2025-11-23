/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  Trash2,
  User as UserIcon,
  Folder,
  Handshake,
  CheckCircle,
  Image,
  Contact,
  ClipboardList,
  XCircle,
  Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CompanyRequest } from '@/interfaces/Company/company';
import { getCompanyById } from '@/services/companyService.js';
import { getOwnerUser } from '@/services/userService.js';
import type { User } from '@/interfaces/User/User';
import { getUserIdFromToken } from '@/utils/token';
import UpdateCompany from '@/components/Company/UpdateCompany';
import InvitePartner from '@/components/Partner/InvitePartner';
import DeleteCompany from '@/components/Company/DeleteCompany';
import LoadingOverlay from '@/common/LoadingOverlay';
import type { CompanyRole } from '@/interfaces/Company/company';
import Chart from 'react-apexcharts';
import { Card } from 'antd';

const CompanyDetails: React.FC = () => {
  const [company, setCompany] = useState<CompanyRequest>();
  const [infoUser, setInfoUser] = useState<User>();
  const { companyId } = useParams<{ companyId: string }>();
  const userId = getUserIdFromToken();
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [currentSection, setCurrentSection] = useState<'overview' | 'image' | 'contact' | null>(
    null,
  );

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (updatedCompany: any) => {
    try {
      setLoading(true);
      setCompany((prev) => ({ ...prev, ...updatedCompany }));
      await fetchGetCompanyById();
    } finally {
      setLoading(false);
    }
  };

  //call api
  const fetchGetCompanyById = async () => {
    try {
      setLoading(true);

      const response = await getCompanyById(companyId);
      const data: CompanyRequest = response.data;
      console.log('Data', data);
      setCompany(data);
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGetInfoUserByCompanyId = async () => {
    try {
      setLoading(true);

      const response = await getOwnerUser(companyId);
      const data: User = response.data;
      setInfoUser(data);
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGetCompanyById();
    fetchGetInfoUserByCompanyId();
  }, []);
  return (
    <>
      <LoadingOverlay loading={loading} />
      <div className="min-h-screen font-sans pb-10">
        {/* Banner */}
        <div
          className="relative h-64 w-full bg-cover bg-center rounded-b-3xl shadow-sm"
          style={{ backgroundImage: `url(${company?.avatarCompany})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 rounded-b-3xl" />
        </div>

        {/* Header */}
        <div className="relative -mt-7 px-8 flex flex-col sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Avatar + Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
            <img
              src={company?.imageCompany}
              alt="avatar"
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
            />
            <div className="mt-4 sm:mt-2">
              <h1 className="text-3xl font-bold text-gray-800">{company?.name}</h1>

              <p className="text-gray-500">
                Code: <span className="font-medium">{company?.taxCode}</span> — Since{' '}
                {company?.createAt && new Date(company.createAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="sm:mt-0 flex items-center gap-2">
            {company?.ownerUserId == userId ? (
              <button
                onClick={() => setOpenDeleteModal(true)}
                className="mt-[35px] flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 shadow-md rounded-lg transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Inactive Company
              </button>
            ) : (
              <button
                onClick={() => setOpenInviteModal(true)}
                className="mt-[35px] flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 shadow-md rounded-lg transition-all duration-200"
              >
                <Handshake className="w-4 h-4" />
                Invite Partnership
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overview */}
          <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800 mb-auto">Overview</h2>
              </div>
              {company?.ownerUserId == userId ? (
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setCurrentSection('overview');
                      setOpenUpdateModal(true);
                      setLoading(false);
                    }, 300);
                  }}
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              ) : (
                <></>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-sm ">ID Company</p>
              <p className="font-medium text-gray-800">{company?.id}</p>

              <p className="text-gray-500 text-sm mt-4">Company Name</p>
              <p className="font-medium text-gray-800">{company?.name}</p>

              <p className="text-gray-500 text-sm mt-4">Description</p>
              <p className="font-medium text-gray-800">{company?.detail}</p>

              <p className="text-gray-500 text-sm mt-4">Owner Name</p>
              <div className="flex items-center space-x-2">
                <img
                  src={infoUser?.avatar}
                  alt="Owner Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
                <span className="font-medium text-gray-800">{infoUser?.userName}</span>
                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  {company?.isDeleted ? 'InActive' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800 mb-auto">Image Company</h2>
              </div>
              {company?.ownerUserId == userId ? (
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setCurrentSection('image');
                      setOpenUpdateModal(true);
                      setLoading(false);
                    }, 300);
                  }}
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              ) : (
                <></>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              <div className="flex flex-col items-center">
                <p className="text-gray-500 text-sm mb-2 self-start">Banner</p>
                <img
                  src={company?.imageCompany}
                  className="rounded-xl w-full h-44 object-cover border shadow-sm"
                  alt="banner"
                />
              </div>

              <div className="flex flex-col items-center">
                <p className="text-gray-500 text-sm mb-2 self-start">Avatar</p>
                <img
                  src={company?.avatarCompany}
                  className="rounded-xl w-full h-44 object-contain border shadow-sm"
                  alt="avatar"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800 mb-auto">Information Contact</h2>
              </div>
              {company?.ownerUserId == userId ? (
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setCurrentSection('contact');
                      setOpenUpdateModal(true);
                      setLoading(false);
                    }, 300);
                  }}
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              ) : null}
            </div>

            {/* Contact Info - 4 dòng dọc */}
            <div className="space-y-5">
              <div>
                <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Email
                </p>
                <p className="font-medium text-gray-800 break-all">{company?.email || '—'}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                </p>
                <p className="font-medium text-gray-800">{company?.phoneNumber || '—'}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" /> Website
                </p>
                <p className="font-medium text-gray-800 break-all">{company?.website || '—'}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> Address
                </p>
                <p className="font-medium text-gray-800">{company?.address || '—'}</p>
              </div>
            </div>
          </div>
          {/* Projects Info */}
          <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
            <div className="flex items-center gap-2 mb-4">
              <Contact className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800 mb-auto">Projects Information</h2>
            </div>
            <Card className="bg-white-500 p-0 rounded-xl border-none">
              <Chart
                type="donut"
                height={300}
                series={[
                  company?.totalMember ?? 0,
                  company?.totalProject ?? 0,
                  company?.totalPartners ?? 0,
                  company?.totalApproved ?? 0,
                ]}
                options={{
                  labels: ['Members', 'Projects', 'Partners', 'Approved'],
                  colors: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'],
                  legend: { position: 'bottom' },
                  dataLabels: { enabled: true },
                }}
              />
            </Card>
          </div>

          {/* ===Dashboard === */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Project Performance Overview */}
            <div className="bg-gray-50 rounded-xl shadow-inner border border-gray-100">
              <Card
                title={`${company?.name} Project Performance Overview`}
                className="shadow-inner border rounded-2xl p-4"
              >
                <Chart
                  type="line"
                  height={300}
                  series={[
                    {
                      name: 'Projects',
                      data: [
                        company?.onTimeRelease ?? 0,
                        company?.totalOngoingProjects ?? 0,
                        company?.totalCompletedProjects ?? 0,
                        company?.totalClosedProjects ?? 0,
                        company?.totalLateProjects ?? 0,
                      ],
                    },
                  ]}
                  options={{
                    chart: { toolbar: { show: true }, zoom: { enabled: false } },
                    xaxis: { categories: ['On-Time', 'Ongoing', 'Completed', 'Closed', 'Late'] },
                    colors: ['#6366F1'],
                    stroke: { curve: 'smooth', width: 3 },
                    dataLabels: { enabled: true },
                    markers: { size: 5 },
                    tooltip: { y: { formatter: (val: number) => `${val} projects` } },
                  }}
                />
              </Card>
            </div>

            {/* Chart 2: Company Members by Role */}
            <div className="bg-gray-50 rounded-xl shadow-inner border border-gray-100">
              <Card title="Company Members by Role" className="shadow-inner border rounded-2xl p-4">
                <Chart
                  type="bar"
                  height={300}
                  series={[
                    {
                      name: 'Members',
                      data: company?.companyRoles?.map((role: any) => role.totalMembers) ?? [],
                    },
                  ]}
                  options={{
                    chart: { toolbar: { show: true }, zoom: { enabled: false } },
                    xaxis: {
                      categories: company?.companyRoles?.map((role: any) => role.roleName) ?? [],
                    },
                    colors: ['#10B981'],
                    stroke: { curve: 'smooth', width: 3 },
                    dataLabels: { enabled: true },
                    markers: { size: 5 },
                    tooltip: { y: { formatter: (val: number) => `${val} members` } },
                  }}
                />
              </Card>
            </div>

            {/* Chart 3: Projects Created vs Hired */}
            <div className="bg-gray-50 rounded-xl shadow-inner border border-gray-100">
              <Card
                title="Projects Created vs Hired"
                className="shadow-inner border rounded-2xl p-4"
              >
                <Chart
                  type="donut"
                  height={300}
                  series={[company?.totalProjectCreated ?? 0, company?.totalProjectHired ?? 0]}
                  options={{
                    labels: ['Created', 'Hired'],
                    colors: ['#F59E0B', '#3B82F6'],
                    legend: { position: 'bottom' },
                    dataLabels: { enabled: true },
                  }}
                />
              </Card>
            </div>

            {/* Chart 4: Project Requests Sent vs Received */}
            <div className="bg-gray-50 rounded-xl shadow-inner border border-gray-100">
              <Card
                title="Project Requests Sent vs Received"
                className="shadow-inner border rounded-2xl p-4"
              >
                <Chart
                  type="bar"
                  height={300}
                  series={[
                    {
                      name: 'Total',
                      data: [
                        company?.totalProjectRequestSent ?? 0,
                        company?.totalProjectRequestReceive ?? 0,
                      ],
                    },
                    {
                      name: 'Accepted',
                      data: [
                        company?.totalProjectRequestAcceptSent ?? 0,
                        company?.totalProjectRequestAcceptReceive ?? 0,
                      ],
                    },
                    {
                      name: 'Rejected',
                      data: [
                        company?.totalProjectRequestRejectSent ?? 0,
                        company?.totalProjectRequestRejectReceive ?? 0,
                      ],
                    },
                    {
                      name: 'Pending',
                      data: [
                        company?.totalProjectRequestPendingSent ?? 0,
                        company?.totalProjectRequestPendingReceive ?? 0,
                      ],
                    },
                  ]}
                  options={{
                    chart: { toolbar: { show: true }, stacked: true },
                    xaxis: { categories: ['Sent', 'Received'] },
                    colors: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'],
                    dataLabels: { enabled: true },
                    plotOptions: { bar: { borderRadius: 6 } },
                    tooltip: { y: { formatter: (val: number) => `${val} requests` } },
                    legend: { position: 'top' },
                  }}
                />
              </Card>
            </div>
          </div>

          {/* Google Map Section */}
          <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6 col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Company Location</h2>
            </div>
            {company?.address ? (
              <iframe
                title="Company Location"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '12px' }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  company.address,
                )}&output=embed`}
              ></iframe>
            ) : (
              <p className="text-gray-500 italic">
                Company don't have address please update information about company.
              </p>
            )}
          </div>
        </div>
        {openUpdateModal && currentSection && (
          <UpdateCompany
            company={company}
            section={currentSection}
            onClose={() => setOpenUpdateModal(false)}
            onSave={handleSave}
          />
        )}
        {openInviteModal && (
          <InvitePartner open={openInviteModal} onClose={() => setOpenInviteModal(false)} />
        )}

        {openDeleteModal && company?.id && (
          <DeleteCompany
            open={openDeleteModal}
            companyId={company.id}
            onClose={() => setOpenDeleteModal(false)}
            onSuccess={async () => {
              await fetchGetCompanyById();
              setLoading(false);
            }}
          />
        )}
      </div>
    </>
  );
};
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow text-sm border border-gray-100 space-y-1">
        <p className="font-semibold text-gray-700">{label}</p>

        <p>
          Total: <span className="font-medium">{data.count}</span>
        </p>

        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Accepted:</span>
          <span className="font-medium">{data.accepted}</span>
        </div>

        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span>Rejected:</span>
          <span className="font-medium">{data.rejected}</span>
        </div>

        <div className="flex items-center gap-1 text-yellow-600">
          <Clock className="h-4 w-4" />
          <span>Pending:</span>
          <span className="font-medium">{data.pending}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default CompanyDetails;
