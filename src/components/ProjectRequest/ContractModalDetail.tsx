import React, { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import { getContractById } from '@/services/contractService.js';
import type { ContractResponse, ContractData } from '@/interfaces/Contract/contract';

interface ContractModalProps {
  open: boolean;
  contractId?: string;
  onClose: () => void;
}

const ContractModalDetail: React.FC<ContractModalProps> = ({ open, contractId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<ContractData | null>(null);

  useEffect(() => {
    if (open && contractId) {
      fetchContract(contractId);
    }
  }, [open, contractId]);

  const fetchContract = async (id: string) => {
    setLoading(true);
    try {
      const res: ContractResponse = await getContractById(id);
      if (res.succeeded && res.data) {
        setContract(res.data);
      } else {
        setContract(null);
      }
    } catch (error) {
      console.error(error);
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Contract Details" open={open} onCancel={onClose} footer={null} width={700}>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : contract ? (
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>Contract ID:</strong> {contract.id}
          </p>
          <p>
            <strong>Contract Code:</strong> {contract.contractCode}
          </p>
          <p>
            <strong>Title:</strong> {contract.contractName}
          </p>
          <p>
            <strong>Budget:</strong> {contract.budget.toLocaleString('vi-VN')} VND
          </p>
          <p>
            <strong>Status:</strong> {contract.status}
          </p>
          <p>
            <strong>Effective Date:</strong>{' '}
            {new Date(contract.effectiveDate).toLocaleDateString('vi-VN')}
          </p>
          <p>
            <strong>Expired Date:</strong>{' '}
            {new Date(contract.expiredDate).toLocaleDateString('vi-VN')}
          </p>

          {/* Appendices */}
          <div>
            <strong>Appendices:</strong>
            {contract.appendices.length > 0 ? (
              <ul className="list-disc list-inside">
                {contract.appendices.map((app) => (
                  <li key={app.id}>
                    {app.appendixCode} - {app.appendixName}
                  </li>
                ))}
              </ul>
            ) : (
              <span> — </span>
            )}
          </div>

          {/* Attachment */}
          {contract.attachment && (
            <p>
              <strong>Attachment:</strong>{' '}
              <a
                href={contract.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View File
              </a>
            </p>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-400">No contract data available</p>
      )}
    </Modal>
  );
};

export default ContractModalDetail;
