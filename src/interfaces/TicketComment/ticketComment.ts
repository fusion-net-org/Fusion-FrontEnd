export interface TicketCommentResponse {
  id: number;
  ticketId: string;
  authorUserId: string;
  authorUserName: string;
  authorUserAvatar: string;
  body: string;
  createAt: string;
  updateAt: string;
  isDeleted: boolean;
  isOwner: boolean;
}

export interface PagedTicketCommentResponse {
  items: TicketCommentResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface TicketCommentApiResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: PagedTicketCommentResponse | null;
}
