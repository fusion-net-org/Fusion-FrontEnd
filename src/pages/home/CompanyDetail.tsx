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
  Check,
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Member', value: company?.totalMember, icon: UserIcon },
                { label: 'Total Project', value: company?.totalProject, icon: Folder },
                { label: 'Total Partner', value: company?.totalPartners, icon: Handshake },
                { label: 'Total Approved', value: company?.totalApproved, icon: CheckCircle },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition"
                >
                  <item.icon className="w-6 h-6 text-blue-500 mb-1" />
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ===Dashboard === */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1 Performance project */}
            <div className="bg-gray-50 rounded-xl p-5 shadow-inner border border-gray-100">
              <h3 className="text-base font-semibold text-gray-700 text-center mb-4">
                {company?.name} Project Performance Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'On-Time', value: company?.onTimeRelease ?? 0 },
                    { name: 'Ongoing', value: company?.totalOngoingProjects ?? 0 },
                    { name: 'Completed', value: company?.totalCompletedProjects ?? 0 },
                    { name: 'Closed', value: company?.totalClosedProjects ?? 0 },
                    { name: 'Late', value: company?.totalLateProjects ?? 0 },
                  ]}
                  margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 shadow-inner border border-gray-100">
              <h3 className="text-base font-semibold text-gray-700 text-center mb-4">
                Company Members by Role
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    company?.companyRoles?.map((role: any) => ({
                      role: role.roleName,
                      count: role.totalMembers,
                    })) ?? []
                  }
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3 project create and hired */}
            <div className="bg-gray-50 rounded-xl p-5 shadow-inner border border-gray-100">
              <h3 className="text-base font-semibold text-gray-700 text-center mb-4">
                Projects Created vs Hired
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { type: 'Created', count: company?.totalProjectCreated ?? 0 },
                    { type: 'Hired', count: company?.totalProjectHired ?? 0 },
                  ]}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 4 project request send and receive */}
            <div className="bg-gray-50 rounded-xl p-5 shadow-inner border border-gray-100">
              <h3 className="text-base font-semibold text-gray-700 text-center mb-4">
                Project Requests Sent vs Received
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      type: 'Sent',
                      count: company?.totalProjectRequestSent ?? 0,
                      accepted: company?.totalProjectRequestAcceptSent ?? 0,
                      rejected: company?.totalProjectRequestRejectSent ?? 0,
                      pending: company?.totalProjectRequestPendingSent ?? 0,
                    },
                    {
                      type: 'Received',
                      count: company?.totalProjectRequestReceive ?? 0,
                      accepted: company?.totalProjectRequestAcceptReceive ?? 0,
                      rejected: company?.totalProjectRequestRejectReceive ?? 0,
                      pending: company?.totalProjectRequestPendingReceive ?? 0,
                    },
                  ]}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
