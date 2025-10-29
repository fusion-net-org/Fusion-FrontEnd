import { axiosInstance } from '../apiConfig';

export const GetMemberByCompanyId = async (
  companyId,
  KeyWord = '',
  DateRangeFrom,
  DateRangeTo,
  PageNumber = 1,
  PageSize = 10,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/companymember/paged/${companyId}`, {
      params: {
        KeyWord,
        'DateRange.From': DateRangeFrom,
        'DateRange.To': DateRangeTo,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error in GetMemberByCompanyId:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};
//https://localhost:7160/api/companymember/summary/CFF1BB25-07CA-417E-84AB-C20B31F6D17B
export const GetSummaryStatusMemberByCompanyId = async (id) => {
  try {
    const response = await axiosInstance.get(`/companymember/summary/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

// https://localhost:7160/api/companymember/status/CFF1BB25-07CA-417E-84AB-C20B31F6D17B?status=inActive
// companyMemberService.js
export const GetMembersByStatus = async (companyId, status) => {
  try {
    const response = await axiosInstance.get(`/companymember/status/${companyId}`, {
      params: { status },
    });
    return response.data;
  } catch (error) {
    console.error('Error in GetMembersByStatus:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};
//https://localhost:7160/api/companymember/invite
export const InviteMemberToCompany = async (inviteeMemberMail, companyId) => {
  try {
    const response = await axiosInstance.post(
      '/companymember/invite',
      {
        inviteeMemberMail,
        companyId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error inviting member:', error);
    throw new Error(error.response?.data?.message || 'Failed to invite member');
  }
};

//https://localhost:7160/api/companymember/member/DE562EA1-F67A-45CB-92A1-1199C1BC09E6/FA5AA664-0D66-4620-8FD1-4B42BFC18578
export const GetCompanyMemberByCompanyIdAndUserId = async (companyId, userId) => {
  try {
    const response = await axiosInstance.get(`/companymember/member/${companyId}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error inviting member:', error);
    throw new Error(error.response?.data?.message || 'Failed to invite member');
  }
};

//https://localhost:7160/api/companymember/fired
export const FireMemberFromCompany = async (firedMemberMail, reason, companyId) => {
  try {
    const response = await axiosInstance.put(
      '/companymember/fired',
      {
        firedMemberMail,
        reason,
        companyId,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error firing member:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fire member');
  }
};
