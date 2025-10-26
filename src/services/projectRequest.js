import { axiosInstance } from '../apiConfig';

export const GetProjectRequestByCompanyId = async (
  companyId,
  Keyword = null,
  Status = null,
  ViewMode = null,
  DateFilterType = null,
  DateRangeFrom = null,
  DateRangeTo = null,
  PageNumber = null,
  PageSize = null,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/projectrequest/paged/${companyId}`, {
      params: {
        Keyword,
        Status,
        ViewMode,
        DateFilterType,
        'DateRange.From': DateRangeFrom,
        'DateRange.To': DateRangeTo,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in GetProjectRequestByCompanyId:', error);
    return { data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 } };
  }
};
