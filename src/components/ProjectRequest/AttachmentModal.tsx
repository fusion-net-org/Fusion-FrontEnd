/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Modal } from 'antd';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { uploadContractFile } from '@/services/contractService.js'; // import hàm upload

interface AttachmentModalProps {
  open: boolean;
  contractId?: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const AttachmentModal: React.FC<AttachmentModalProps> = ({
  open,
  contractId,
  onClose,
  onUploadSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file!');
      return;
    }
    if (!contractId) {
      toast.error('Missing contract ID!');
      return;
    }
    setLoading(true);
    try {
      await uploadContractFile(contractId, file);
      toast.success('Attachment uploaded successfully!');
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Upload Attachment"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="upload" type="primary" loading={loading} onClick={handleUpload}>
          Upload
        </Button>,
      ]}
    >
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="*/*" />
    </Modal>
  );
};

export default AttachmentModal;
