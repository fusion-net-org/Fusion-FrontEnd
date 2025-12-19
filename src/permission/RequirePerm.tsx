// src/permission/RequirePerm.tsx
import React from "react";
import { usePermissions } from "@/permission/PermissionProvider";
import NoPermission from "@/pages/notfound/NoPermission"; // đổi path theo project bạn

type Props = {
  code?: string;
  anyOf?: string[];
  allOf?: string[];
  children: React.ReactNode;
};

export default function RequirePerm({ code, anyOf, allOf, children }: Props) {
  const { loading, can, canAny, canAll } = usePermissions();

  if (loading) return null; // hoặc spinner

  const ok =
    code ? can(code) :
    anyOf ? canAny(anyOf) :
    allOf ? canAll(allOf) :
    true;

  if (!ok) return <NoPermission />;

  return <>{children}</>;
}
