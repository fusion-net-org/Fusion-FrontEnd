/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Select } from 'antd';
import { InvitePartnert } from '@/services/partnerService.js';
import { getAllCompaniesV2 } from '@/services/companyService.js';
import { Loader2 } from 'lucide-react';
import type { CompanyRequestV2, CompanyResponseV2 } from '@/interfaces/Company/company';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/common/LoadingOverlay';

interface InvitePartnerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InvitePartner: React.FC<InvitePartnerProps> = ({ open, onClose, onSuccess }) => {
  //#region use state
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerCompanies, setOwnerCompanies] = useState<CompanyRequestV2[]>([]);
  const [companies, setCompanies] = useState<CompanyRequestV2[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  //#endregion

  //#region handling
  const handleSearch = async (term: string) => {
    try {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();
      setLoading(true);
      setErrorMessage(null);

      const start = Date.now();

      const res = await getAllCompaniesV2(
        term,
        '',
        '',
        null,
        null,
        1,
        25,
        null,
        null,
        selectedCompany || '',
      );
      const data: CompanyResponseV2 = res.data;

      if (!res.succeeded) {
        setCompanies([]);
        setErrorMessage(res.message || 'No companies found.');
      } else {
        setCompanies(data.items ?? []);
      }

      const elapsed = Date.now() - start;
      const minDuration = 500;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error('Error searching companies:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (companyBID: string) => {
    try {
      if (!selectedCompany) return;

      const body = {
        companyAID: selectedCompany,
        companyBID,
        note: note || null,
      };
      setLoading(true);

      const res = await InvitePartnert(body);
      const responseData = res.data;

      if (responseData.succeeded) {
        toast.success(responseData.message || 'Invite sent successfully!');

        await fetchCompanies(1, 25, selectedCompany || '');
        setLoading(false);
        onClose?.();
        onSuccess?.();
      } else {
        toast.error(responseData.message || 'Something went wrong');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending invite');
    }
  };

  //#endregion

  //#region  fetch
  const fetchCompanies = async (pageNumber = 1, pageSize = 25, companyId = '') => {
    try {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();
      setLoading(true);
      setErrorMessage(null);

      const start = Date.now();
      const res = await getAllCompaniesV2(
        '',
        '',
        '',
        null,
        null,
        pageNumber,
        pageSize,
        null,
        null,
        companyId,
      );
      const data: CompanyResponseV2 = res.data;
      console.log(data);
      if (!res.succeeded) {
        setCompanies([]);
        setErrorMessage(res.message || 'No companies found.');
      } else {
        setCompanies(data.items ?? []);
      }

      const elapsed = Date.now() - start;
      const minDuration = 500;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error('Error fetching companies:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerCompanies = async (pageNumber = 1, pageSize = 25) => {
    const userData = localStorage.getItem('user');
    const username = userData ? JSON.parse(userData).username : '';
    try {
      const response = await getAllCompaniesV2(
        '',
        username || '',
        '',
        null,
        null,
        pageNumber,
        pageSize,
      );
      const data: CompanyResponseV2 = response.data;
      const ownerList = data.items ?? [];
      setOwnerCompanies(data.items ?? []);
      if (ownerList.length > 0 && !selectedCompany) {
        setSelectedCompany(ownerList[0].id);
      }
    } catch (error) {
      throw new Error();
    }
  };
  //#endregion

  //#region  use effect
  useEffect(() => {
    if (open) {
      // Open
      fetchOwnerCompanies();
    } else {
      // close
      setSearchTerm('');
      setNote('');
      setCompanies([]);
      setOwnerCompanies([]);
      setSelectedCompany(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
      } else {
        fetchCompanies(1, 25, selectedCompany || '');
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedCompany]);
  //#endregion

  //#endregion

  //#region  coding
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
      <LoadingOverlay loading={loading} message="Loading Partners..." />

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Your Company</label>
          <Select
            className="w-full mt-1"
            placeholder="Select your company"
            value={selectedCompany}
            onChange={(value) => setSelectedCompany(value)}
            options={ownerCompanies.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
          />
        </div>

        {/*Search */}
        <div>
          <label className="text-sm font-medium text-gray-700">Search Company</label>
          <Input
            placeholder="Input Company Name or Tax Code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 py-2"
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-gray-700">Note (Optional)</label>
          <Input
            placeholder="Input content"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 py-2"
          />
        </div>

        <div className="border-t my-2"></div>

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : companies.length > 0 ? (
            companies.map((c, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500">Tax Code: {c.taxCode}</div>
                </div>
                {c.isOwner && c.isPartner ? (
                  <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full font-medium">
                    Your Company & Partner
                  </span>
                ) : c.isOwner ? (
                  <span className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-full font-medium">
                    Owner Company
                  </span>
                ) : c.isPartner ? (
                  <span className="px-3 py-1 text-sm text-emerald-700 bg-emerald-100 rounded-full font-medium">
                    Partnered
                  </span>
                ) : c.isPendingAprovePartner ? (
                  <span className="px-3 py-1 text-sm text-orange-700 bg-orange-100 rounded-full font-medium">
                    Wait For Response
                  </span>
                ) : (
                  <button
                    onClick={() => handleInvite(c.id)}
                    className="px-4 py-1 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 transition"
                  >
                    Invite
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              {errorMessage || 'No companies found.'}
            </div>
          )}
        </div>

        {/* Cancel */}
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
  //#endregion
};

export default InvitePartner;
