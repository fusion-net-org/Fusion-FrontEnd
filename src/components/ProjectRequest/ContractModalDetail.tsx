/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Modal, Spin, Button } from 'antd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getContractById } from '@/services/contractService.js';
import { AcceptProjectRequest } from '@/services/projectRequest.js';
import type { ContractResponse, ContractData } from '@/interfaces/Contract/contract';
import { FileText, Edit2 } from 'lucide-react';
import EditContractModal from './EditContractModal'; // import modal edit
import AttachmentModal from '@/components/ProjectRequest/AttachmentModal';
interface ContractModalProps {
  open: boolean;
  contractId?: string;
  projectRequestId?: string;
  onClose: () => void;
  onAccepted?: () => void;
  isView?: boolean;
  viewMode?: 'AsRequester' | 'AsExecutor';
}

const ContractModalDetail: React.FC<ContractModalProps> = ({
  open,
  contractId,
  projectRequestId,
  onClose,
  onAccepted,
  isView = false,
  viewMode = 'AsRequester',
}) => {
  const [loading, setLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  console.log(viewMode);
  useEffect(() => {
    if (contractId) {
      fetchContract(contractId);
    } else {
      setContract(null);
    }
  }, [contractId, open]);

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

  const handleClose = () => {
    setContract(null);
    onClose();
  };

  const handleAccept = async () => {
    if (!projectRequestId) {
      toast.error('Missing project request id!');
      return;
    }
    try {
      setAcceptLoading(true);
      const res = await AcceptProjectRequest(projectRequestId);
      if (res.statusCode === 200) {
        toast.success(res.message || 'Accepted successfully!');
        onClose();
        if (onAccepted) onAccepted();
      } else {
        toast.error(res.message || 'Failed to accept request');
      }
    } catch (error) {
      toast.error('Failed to accept request');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleEditSave = () => {
    setEditModalOpen(false);
    if (contractId) fetchContract(contractId);
  };

  return (
    <>
      <Modal
        title={
          <div className="text-sm font-semibold text-gray-800 border-b pb-1">Contract Details</div>
        }
        open={open}
        onCancel={handleClose}
        width={600}
        footer={
          <div className="flex justify-end gap-2">
            <Button size="middle" onClick={handleClose}>
              Close
            </Button>
            {!isView && (
              <Button
                size="middle"
                type="primary"
                loading={acceptLoading}
                onClick={handleAccept}
                disabled={!contract}
              >
                Accept
              </Button>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="flex justify-center py-6">
            <Spin size="small" />
          </div>
        ) : contract ? (
          <div className="space-y-2 text-gray-700 mt-1 text-xs">
            {/* Contract info */}
            <div className="relative p-[14px] border rounded-md shadow-sm bg-gray-50">
              {contract && viewMode === 'AsRequester' && isView && (
                <Button
                  size="middle"
                  type="default"
                  icon={<Edit2 className="w-4 h-4 mr-1" />}
                  onClick={() => setEditModalOpen(true)}
                  className="absolute top-2 right-2"
                >
                  Edit
                </Button>
              )}

              {/* Contract ID */}
              <div>
                <p className="text-[14px] text-gray-500">Contract ID</p>
                <p className="font-medium">{contract.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-[14px] border rounded-md shadow-sm">
                <p className="text-[14px] text-gray-500">Contract Code</p>
                <p className="font-semibold">{contract.contractCode}</p>
              </div>
              <div className="p-[14px] border rounded-md shadow-sm">
                <p className="text-[14px] text-gray-500">Status</p>
                <p className="font-semibold">{contract.status}</p>
              </div>
            </div>
            <div className="p-[14px] border rounded-md shadow-sm">
              <p className="text-[14px] text-gray-500">Title</p>
              <p className="font-semibold">{contract.contractName}</p>
            </div>
            <div className="p-[14px] border rounded-md shadow-sm">
              <p className="text-[14px] text-gray-500">Budget</p>
              <p className="font-semibold text-gray-700">
                {contract.budget.toLocaleString('vi-VN')} VND
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-[14px] border rounded-md shadow-sm">
                <p className="text-[14px] text-gray-500">Effective Date</p>
                <p className="font-semibold">
                  {new Date(contract.effectiveDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="p-[14px] border rounded-md shadow-sm">
                <p className="text-[14px] text-gray-500">Expired Date</p>
                <p className="font-semibold">
                  {new Date(contract.expiredDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Appendices */}
            <div className="p-[14px] border rounded-md shadow-sm bg-white">
              <p className="text-[14px] text-gray-500 font-medium mb-2">Appendices</p>
              {contract.appendices.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {contract.appendices.map((app) => (
                    <div
                      key={app.id}
                      className="border rounded-lg p-3 shadow-sm hover:shadow-md transition-all bg-gray-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-800">
                          {app.appendixCode} – {app.appendixName}
                        </span>
                      </div>
                      {app.appendixDescription && (
                        <p className="text-gray-600 text-xs pl-5">{app.appendixDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mt-2 text-center text-sm py-4 border rounded-md bg-gray-50">
                  No appendices available
                </p>
              )}
            </div>

            {/* Attachment */}
            {contract.attachment && (
              <div className="relative p-[14px] border rounded-md shadow-sm">
                {viewMode === 'AsRequester' && isView && (
                  <Button
                    size="middle"
                    type="default"
                    icon={<Edit2 className="w-4 h-4 mr-1" />}
                    onClick={() => setAttachmentModalOpen(true)}
                    className="absolute top-2 right-2"
                  >
                    Edit
                  </Button>
                )}
                <p className="text-[14px] text-gray-500">Attachment</p>
                <a
                  href={contract.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium text-xs"
                >
                  View File
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center py-20 bg-gray-50 rounded-md">
            <p className="text-gray-400 text-sm font-medium">No contract data available</p>
          </div>
        )}
      </Modal>

      {contract && viewMode === 'AsRequester' && isView && (
        <EditContractModal
          open={editModalOpen}
          contractId={contract.id}
          onClose={() => setEditModalOpen(false)}
          onSave={handleEditSave}
        />
      )}

      {contract && viewMode === 'AsRequester' && isView && (
        <AttachmentModal
          open={attachmentModalOpen}
          contractId={contract.id}
          onClose={() => setAttachmentModalOpen(false)}
          onUploadSuccess={() => fetchContract(contract.id)}
        />
      )}
    </>
  );
};

export default ContractModalDetail;
