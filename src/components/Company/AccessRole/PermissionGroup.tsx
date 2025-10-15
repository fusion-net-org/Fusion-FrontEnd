import React from "react";
import type { PermissionGroup as Group, PermissionItem } from "../../../types/role";

export default function PermissionGroup({ group, onToggle }: {
  group: Group; onToggle: (groupId: string, itemId?: string, value?: boolean) => void;
}) {
  const allChecked = group.items.every(i => i.checked);
  return (
    <div className="group">
      <div className="groupTitle">
        <span
          className={`checkbox ${allChecked ? "checkboxChecked" : ""}`}
          role="checkbox" aria-checked={allChecked}
          onClick={() => onToggle(group.id, undefined, !allChecked)}
        />
        <span>{group.title}</span>
      </div>

      <div className="block">
        {group.items.map((it: PermissionItem) => (
          <div key={it.id} className="item">
            <span
              className={`checkbox ${it.checked ? "checkboxChecked" : ""}`}
              role="checkbox" aria-checked={it.checked}
              onClick={() => onToggle(group.id, it.id, !it.checked)}
            />
            <span>{it.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
