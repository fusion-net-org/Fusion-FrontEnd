export interface Role {
  id: number;
  name: string;
  description?: string | null;
}

export interface IRoleDto {
  id: number;
  name: string;
  description?: string;
}
