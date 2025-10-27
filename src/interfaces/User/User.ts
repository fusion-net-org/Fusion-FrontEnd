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
