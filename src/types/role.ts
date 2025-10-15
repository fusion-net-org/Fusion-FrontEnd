export type PermissionItem = {
  id: string;
  name: string;
  checked: boolean;
};

export type PermissionGroup = {
  id: string;
  title: string;
  items: PermissionItem[];
};

export type RoleOption = { id: string; name: string; levelLabel: string; };

export type AccessRoleFormModel = {
  roleName: string;
  roleLevelId: string;
  groups: PermissionGroup[];
};
