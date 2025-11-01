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
