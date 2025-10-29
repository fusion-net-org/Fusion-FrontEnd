export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  status: "Active" | "Locked" | "Pending" | string;
  roles: string[];
  createdAt: string;
};

export type AdminUserPaged = {
  items: AdminUserRow[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

type Query = {
  keyword?: string;
  status?: string;               
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;             
  sortDescending?: boolean;
};