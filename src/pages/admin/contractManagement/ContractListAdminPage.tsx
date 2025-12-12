import React, { useEffect, useState } from 'react';
import { FileSignature, Edit } from 'lucide-react';
import { Button, Modal, Descriptions, Tag } from 'antd';
import { toast } from 'react-toastify';
import { getAllContractByAdmin } from '@/services/contractService.js';
import { useNavigate } from 'react-router-dom';

type Appendix = {
  id: string;
  appendixName: string;
  appendixCode: string;
  appendixDescription: string;
};

type Contract = {
  id: string;
  projectRequestId: string;
  executorCompanyId: string;
  requesterCompanyId: string;
  contractCode: string;
  contractName: string;
  budget: number;
  status: string;
  effectiveDate: string;
  expiredDate: string;
  appendices: Appendix[];
  attachment: string;
};

export default function ContractListAdminPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const reload = async () => {
    try {
      setLoading(true);
      const res = await getAllContractByAdmin();
      setItems(res?.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleView = (c: Contract) => {
    localStorage.setItem('contractDetailEnabled', 'true');
    localStorage.setItem('contractDetailId', c.id);
    navigate(`/admin/contracts/detail/${c.id}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-gray-900 m-0">Contract Management</h1>
                <p className="text-sm text-gray-500 m-0">
                  View and manage all contracts between companies
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Contract Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Contract Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Budget (VND)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Effective Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Expired Date
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {items.length > 0 ? (
                  items.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {c.contractCode}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">{c.contractName}</td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {c.budget?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </td>

                      <td className="px-6 py-4">
                        <Tag color="blue" style={{ fontSize: 13 }}>
                          {c.status || 'N/A'}
                        </Tag>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{c.effectiveDate}</td>

                      <td className="px-6 py-4 text-sm text-gray-700">{c.expiredDate}</td>

                      <td className="px-6 py-4 text-center flex items-center justify-center">
                        <Button
                          type="link"
                          icon={<Edit size={16} />}
                          className="flex items-center justify-center gap-1 text-xs"
                          onClick={() => handleView(c)}
                        >
                          View Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-6">
                      No contracts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing <b>{items.length}</b> contract(s)
          </div>
        </div>
      </div>
    </>
  );
}
