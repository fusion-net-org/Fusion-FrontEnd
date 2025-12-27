import { axiosInstance } from '../apiConfig';

export const GetMemberByCompanyId = async (
  companyId,
  KeyWord = '',
  DateRangeFrom,
  DateRangeTo,
  Gender,
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
        Gender,
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

export const GetCompanyMemberByUserId = async (
  KeyWord = '',
  Status = null,
  CreateAtFrom = null,
  CreateAtTo = null,
  JoinedAtFrom = null,
  JoinedAtTo = null,
  CompanyName = null,
  MemberName = null,
  PageNumber = 1,
  PageSize = 10,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/companymember/by-user`, {
      params: {
        KeyWord: KeyWord,
        Status: Status,

        'CreateAtRange.From': CreateAtFrom,
        'CreateAtRange.To': CreateAtTo,

        'JoinedAtRange.From': JoinedAtFrom,
        'JoinedAtRange.To': JoinedAtTo,

        CompanyName: CompanyName,
        MemberName: MemberName,

        PageNumber: PageNumber,
        PageSize: PageSize,

        SortColumn: SortColumn,
        SortDescending: SortDescending,
      },
    });
    console.log('response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in GetCompanyMemberByUserId:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

// https://localhost:7160/api/companymember/{memberId}/accept
export const AcceptJoinMemberById = async (memberId) => {
  try {
    const response = await axiosInstance.put(`/companymember/${memberId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting member:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to accept member');
  }
};

// https://localhost:7160/api/companymember/{memberId}/reject
export const RejectJoinMemberById = async (memberId) => {
  try {
    const response = await axiosInstance.put(`/companymember/${memberId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting member:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to reject member');
  }
};

// https://localhost:7160/api/companymember/{companyId}/users/roles
export const AddUserRolesToCompany = async (companyId, payload) => {
  try {
    const response = await axiosInstance.post(`/companymember/${companyId}/users/roles`, payload);
    return response.data;
  } catch (error) {
    console.error('Error adding user roles:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to Add Role member');
  }
};

// https://localhost:7160/api/companymember/{companyId}/users/roles
export const RemoveUserRolesFromCompany = async (companyId, payload) => {
  try {
    const response = await axiosInstance.delete(`/companymember/${companyId}/users/roles`, {
      data: payload,
    });
    return response.data;
  } catch (error) {
    console.error('Error removing user roles:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to Remove Role member');
  }
};

export const getMembersOfCompanyByAdmin = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, value);
      }
    });

    const { data } = await axiosInstance.get(`/companymember/admin/paged?${query.toString()}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
