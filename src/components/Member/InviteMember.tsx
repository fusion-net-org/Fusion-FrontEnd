/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { InviteMemberToCompany } from '@/services/companyMemberService.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Mail } from 'lucide-react';

interface InviteMemberProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSuccess?: () => void;
}

const InviteMember: React.FC<InviteMemberProps> = ({
  companyId,
  isOpen,
  onClose,
  onInviteSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInvite = async () => {
    if (!email) {
      setErrorMsg('Please enter an email.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await InviteMemberToCompany(email, companyId);
      setSuccessMsg('Member invited successfully!');
      setEmail('');
      onInviteSuccess?.();
      toast.success('Member invited successfully!');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to invite member.');
      toast.error(error.message || 'Failed to invite member.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-scaleIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Invite Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Email input */}
        <div className="mb-4 relative">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Enter member email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition"
            />
          </div>
          {errorMsg && <p className="mt-2 text-sm text-red-500">{errorMsg}</p>}
          {successMsg && <p className="mt-2 text-sm text-green-500">{successMsg}</p>}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-2xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading}
            className={`px-6 py-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-transform ${
              loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {loading ? 'Inviting...' : 'Invite'}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-5 text-sm text-gray-500">
          After inviting, the member will receive an email to join your company.
        </p>
      </div>
    </div>
  );
};

export default InviteMember;
