export interface User {
  id?: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  avatar: string;
  role?: string;
}

export interface UserResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: User;
}
export interface ApiResponse<T> {
   succeeded: boolean;
   statusCode: number;
   message: string; data: T; 
}

export interface AdminUser {
   id: string;
   userName: string; 
   email: string; 
   phone?: string | null; 
   address?: string | null; 
   gender?: string | null; 
   status: boolean; 
   createAt: string;  
   updateAt?: string | null; 
   avatar: string;
}
/** PagedResult<T> */ 
export interface PagedResult<T> {
   items: T[]; 
   totalCount: number; 
   pageNumber: number; 
   pageSize: number; 
}

// ========== OverView Chart ============
//1. Growth & Active Status
export interface UserGrowthPoint {
  period: string;
  newUsers: number;
}
export interface UserGrowthAndStatusOverview {
  growth: UserGrowthPoint[];
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

// 2. User distribution by company (top companies)
export interface UserCompanyDistributionPoint {
  companyId: string;
  companyName: string;
  userCount: number;
}

// 3. User by permission level
export interface UserPermissionLevelPoint {
  level: string; // "System admin" | "Company owner" | ...
  count: number;
}

export interface UserPermissionLevelOverview {
  totalUsers: number;
  levels: UserPermissionLevelPoint[];
}
