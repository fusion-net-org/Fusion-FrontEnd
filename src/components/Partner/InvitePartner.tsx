/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Modal, Input } from 'antd';
import { InvitePartnert } from '@/services/partnerService.js';
interface InvitePartnerProps {
  open: boolean;
  onClose: () => void;
}

const mockCompanies = [
  { name: 'Beta Logistics', code: 'F643' },
  { name: 'Epsilon Media', code: '43H' },
  { name: 'Cloudnine', code: 'KH24' },
  { name: 'Epsilon Media', code: '43H' },
  { name: 'Fabrikam Heath', code: 'FDH41' },
  { name: 'Fabrikam Heath', code: 'FDH41' },
  { name: 'Fabrikam Heath', code: 'FDH41' },
  { name: 'Fabrikam Heath', code: 'FDH41' },
  { name: 'Fabrikam Heath', code: 'FDH41' },
  { name: 'Fabrikam Heath', code: 'FDH41' },
];

const InvitePartner: React.FC<InvitePartnerProps> = ({ open, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = mockCompanies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal
      title={
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Invite business to connect</h2>
          <p className="text-sm text-gray-500">Choose a business and send an invitation</p>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
    >
      {/* Search inputs */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Search Company</label>
          <Input
            placeholder="Input name or ID business"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Note (Optional)</label>
          <Input placeholder="Input content" className="mt-1 py-2" />
        </div>

        <div className="border-t my-2"></div>

        {/* Company list */}
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {filtered.map((c, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <div>
                <div className="font-medium text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-500">Code: {c.code}</div>
              </div>
              <button className="px-4 py-1 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 transition">
                Invite
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvitePartner;
