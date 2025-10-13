export interface User {
  userName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  avatar: string;
}

export interface UserResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: User;
}
