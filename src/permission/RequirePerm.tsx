import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/permission/PermissionProvider";

type Props = {
  code?: string;         
  any?: string[];        
  all?: string[];      
  children: React.ReactNode;
  redirectTo?: string;   
};

export default function RequirePerm({
  code,
  any,
  all,
  children,
  redirectTo = "/403",
}: Props) {
  const { loading, can, canAny, canAll } = usePermissions();
  const loc = useLocation();

  if (loading) return null; // hoặc skeleton

  const ok =
    (code ? can(code) : true) &&
    (any ? canAny(any) : true) &&
    (all ? canAll(all) : true);

  if (!ok) {
    return <Navigate to={redirectTo} replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
