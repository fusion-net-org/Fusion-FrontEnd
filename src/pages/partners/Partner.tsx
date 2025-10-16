/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { UserPlus, Users, Check, X, Ban } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import InvitePartners from '@/components/Partner/InvitePartner';
const Partners: React.FC = () => {
  //state open invite popup
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const partners = [
    {
      name: 'Cloudnine',
      ownerName: 'Alice Johnson',
      code: 'C54',
      status: 'Connected',
      date: '9/10/2014',
      dateReponse: '9/15/2014',
      projects: 2,
      action: 'accept',
    },
    {
      name: 'Delta Fintech',
      ownerName: 'Bob Smith',
      code: 'C54',
      status: 'Connected',
      date: '11/1/2011',
      dateReponse: '11/5/2011',
      projects: 0,
      action: 'friend',
    },
    {
      name: 'Epsilon Media',
      ownerName: 'Carol White',
      code: '43H',
      status: 'Incoming',
      date: '4/27/2006',
      dateReponse: '5/1/2006',
      projects: 5,
      action: 'cancel',
    },
    {
      name: 'Beta Logistics',
      ownerName: 'David Brown',
      code: 'C54',
      status: 'Outgoing',
      date: '2/12/2016',
      dateReponse: '2/15/2016',
      projects: 2,
      action: 'friend',
    },
    {
      name: 'Epsilon Media',
      ownerName: 'Eva Green',
      code: '43H',
      status: 'Incoming',
      date: '4/27/2006',
      dateReponse: '5/1/2006',
      projects: 0,
      action: 'cancel',
    },
    {
      name: 'Cloudnine',
      ownerName: 'Frank Black',
      code: 'C54',
      status: 'Connected',
      date: '9/10/2014',
      dateReponse: '9/15/2014',
      projects: 1,
      action: 'accept',
    },
    {
      name: 'Epsilon Media',
      ownerName: 'Grace Blue',
      code: '43H',
      status: 'Outgoing',
      date: '4/27/2006',
      dateReponse: '5/1/2006',
      projects: 5,
      action: 'cancel',
    },
    {
      name: 'Fabrikam Heath',
      ownerName: 'Hank Gray',
      code: 'FDH',
      status: 'Incoming',
      date: '4/27/2006',
      dateReponse: '5/1/2006',
      projects: 0,
      action: 'friend',
    },
    {
      name: 'Fabrikam Heath',
      ownerName: 'Hank Gray',
      code: 'FDH',
      status: 'Incoming',
      date: '4/27/2006',
      dateReponse: '5/1/2006',
      projects: 0,
      action: 'friend',
    },
    {
      name: 'Fabrikam Heath',
      ownerName: 'Hank Gray',
      code: 'FDH',
      status: 'Incoming',
      date: '4/27/2006',
      dateReponse: '5/1/2006',
      projects: 0,
      action: 'friend',
    },
  ];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connected':
        return 'bg-green-100 text-green-700 border-green-400';
      case 'Incoming':
        return 'bg-yellow-100 text-yellow-700 border-yellow-400';
      case 'Outgoing':
        return 'bg-red-100 text-red-700 border-red-400';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="px-6 font-inter">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Partners</h1>
          <p className="text-gray-500 text-sm">
            Connect businesses to open project rights and share personnel
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite Partner
        </button>
        <InvitePartners open={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      </div>

      {/* Status summary */}
      <div className="flex gap-3 mb-4">
        <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
          Connected: 1
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
          Incoming: 1
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700">Outgoing: 1</span>
      </div>

      {/* Search + filter */}
      <div className="flex justify-between items-center bg-gray-50 p-1 rounded-md mb-3">
        <input
          type="text"
          placeholder="Search Business name/ID Business"
          className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-100"
        />
        <div className="flex items-center gap-2 text-blue-600 text-sm cursor-pointer">
          <select className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none">
            <option>All</option>
            <option>Connected</option>
            <option>Incoming</option>
            <option>Outgoing</option>
          </select>
          <span>5 results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Projects</th>
              <th className="px-4 py-3 text-left">Option</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">Code: {p.code}</div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-gray-800">{p.ownerName}</div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 border rounded-full text-xs font-medium ${getStatusColor(
                      p.status,
                    )}`}
                  >
                    {p.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div>
                    <div>
                      <span className="font-medium text-gray-800">Since:</span> {p.date}
                    </div>
                    <div className="text-xs text-gray-500">Responded: {p.dateReponse}</div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800">{p.projects}</span> Projects
                </td>

                <td className="px-4 py-3">
                  {p.action === 'accept' && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button className="px-3 py-1 border border-gray-300 text-sm rounded-full hover:bg-gray-100 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                  {p.action === 'friend' && (
                    <button className="px-3 py-1 border border-blue-400 text-blue-500 rounded-full text-sm hover:bg-blue-50 flex items-center gap-1">
                      <Users className="w-4 h-4" /> Friend
                    </button>
                  )}
                  {p.action === 'cancel' && (
                    <button className="px-3 py-1 border border-red-400 text-red-500 rounded-md text-sm hover:bg-red-50 flex items-center gap-1">
                      <Ban className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4">
        <Stack spacing={2}>
          <Pagination
            count={4}
            page={1}
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

export default Partners;
