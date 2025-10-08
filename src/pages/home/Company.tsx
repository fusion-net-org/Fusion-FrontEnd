import React from 'react';
import { Search, Users, Folder, ChevronDown, Bell, SlidersHorizontal } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import FormCreateCompany from '../../components/Company/CreateCompany';

const companies = [
  {
    id: 1,
    name: 'Company Name',
    role: 'Owner',
    tags: ['Company Owner', 'System'],
    members: 7,
    projects: 3,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 2,
    name: 'Company Name',
    role: 'Leader',
    tags: ['Project Manager', 'Leader'],
    members: 4,
    projects: 2,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    id: 3,
    name: 'Company Name',
    role: 'Member',
    tags: ['Dev', 'Member'],
    members: 6,
    projects: 1,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b',
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
  },
  {
    id: 4,
    name: 'Company Name',
    role: 'Leader',
    tags: ['Project Manager', 'Leader'],
    members: 3,
    projects: 2,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1493238792000-8113da705763',
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    id: 5,
    name: 'Company Name',
    role: 'Leader',
    tags: ['Project Manager', 'Leader'],
    members: 3,
    projects: 2,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1493238792000-8113da705763',
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    id: 6,
    name: 'Company Name',
    role: 'Leader',
    tags: ['Project Manager', 'Leader'],
    members: 3,
    projects: 2,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1493238792000-8113da705763',
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    id: 7,
    name: 'Company Name',
    role: 'Leader',
    tags: ['Project Manager', 'Leader'],
    members: 3,
    projects: 2,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1493238792000-8113da705763',
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    id: 8,
    name: 'Company Name',
    role: 'Leader',
    tags: ['Project Manager', 'Leader'],
    members: 3,
    projects: 2,
    owner: 'Tuong Nguyen',
    cover: 'https://images.unsplash.com/photo-1493238792000-8113da705763',
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
];

const Company: React.FC = () => {
  return (
    <div className="p-1 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Input search"
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 w-[600px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* avatar */}
        <div className="flex items-center gap-4 mr-2">
          {/* Notification icon */}
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-600 hover:text-blue-600 transition" />
            <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <div className="text-sm">
              <p className="font-medium text-gray-800">Nguyen Tuong</p>
              <p className="text-gray-500 text-xs">Admin</p>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-600 mb-3" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Company</h2>
          <p className="text-gray-500 text-sm">
            Manage all companies you belong to and their settings.
          </p>
        </div>
        {/* Button Create Company */}
        <div>
          {/* <button className="flex  items-center gap-2 bg-blue-600 h-[40px] text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">
            <Plus className="w-5 h-5" /> Create New Company
          </button> */}
          <FormCreateCompany />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Relationship filter */}
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-500">Relationship:</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition">
              All
            </button>
            <button className="px-3 py-1.5 border border-blue-500 rounded-lg text-sm text-white bg-blue-500 font-medium shadow-sm hover:bg-blue-600 transition">
              Owner
            </button>
            <button className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition">
              Member
            </button>
          </div>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-500">Role:</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-orange-200 rounded-lg text-sm text-orange-500 hover:bg-orange-100 transition">
              Product Manager
            </button>
            <button className="px-3 py-1.5 border border-orange-500 rounded-lg text-sm text-white bg-orange-500 font-medium shadow-sm hover:bg-orange-600 transition">
              Team Lead
            </button>
            <button className="px-3 py-1.5 border border-orange-200 rounded-lg text-sm text-orange-500 hover:bg-orange-100 transition">
              Dev
            </button>
          </div>
        </div>

        {/* Sort filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          <span className="text-gray-500 font-medium text-sm">Sort by:</span>
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              defaultValue="A-Z"
            >
              <option value="A-Z">A - Z</option>
              <option value="Z-A">Z - A</option>
              <option value="Newest">Newest</option>
              <option value="Oldest">Oldest</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Company Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white"
          >
            <img src={company.cover} alt="cover" className="w-full h-32 object-cover" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={company.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-sm text-gray-500">Subscription</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {company.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-xs font-semibold text-blue-500 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between text-sm text-gray-500 mt-3">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 mb-0.5" /> {company.members} Members
                </span>
                <span className="flex items-center gap-1">
                  <Folder className="w-4 h-4 mb-0.5" /> {company.projects} Projects
                </span>
              </div>

              <div className="flex gap-2 text-sm text-gray-600">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Owner</span>
                  <span className="font-medium font-semibold">{company.owner}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-6 pr-2">
        <Stack spacing={2}>
          <Pagination
            count={10}
            color="primary"
            variant="outlined"
            shape="rounded"
            size="medium"
            showFirstButton
            showLastButton
          />
        </Stack>
      </div>
    </div>
  );
};

export default Company;
