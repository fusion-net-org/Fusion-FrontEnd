import { axiosInstance } from '../apiConfig';

export const createContract = async (data) => {
  try {
    const payload = {
      contractCode: data.ContractCode,
      contractName: data.ContractName,
      effectiveDate: data.EffectiveDate,
      expiredDate: data.ExpiredDate,
      budget: data.Budget,
      appendices: data.Appendices || [],
    };

    const response = await axiosInstance.post('/contract', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
//https://localhost:7160/api/contract/D20B197A-E59A-4F4B-079B-08DE2474AF01/upload
export const uploadContractFile = async (contractId, file) => {
  try {
    if (!file) throw new Error('File is required');

    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(`/contract/${contractId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error uploading file!');
  }
};

export const getContractById = async (contractId) => {
  try {
    const response = await axiosInstance.get(`/contract/${contractId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching contract!');
  }
};
