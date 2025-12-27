import React from "react";
import type { PermissionGroup as Group, PermissionItem } from "../../../types/role";

function Checkbox({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={[
        "w-4 h-4 rounded-[4px] border-[1.5px] inline-flex items-center justify-center cursor-pointer select-none",
        checked ? "border-[#2e8bff] bg-[#2e8bff]" : "border-[#d4d4d8] bg-white",
      ].join(" ")}
    >
      {checked && (
        <span className="block w-2 h-1 border-l-2 border-b-2 border-white rotate-[-45deg] -translate-y-[1px]" />
      )}
    </span>
  );
}

export default function PermissionGroup({
  group,
  onToggle,
  disabled = false, //  add
}: {
  group: Group;
  onToggle: (groupId: string, itemId?: string, value?: boolean) => void;
  disabled?: boolean;
}) {
  const allChecked = group.items.every((i) => i.checked);

  return (
    <div className={["border border-[#e5e7eb] rounded-xl bg-white p-3", disabled ? "opacity-70" : ""].join(" ")}>
      <button
        type="button"
        disabled={disabled} // 
        onClick={() => onToggle(group.id, undefined, !allChecked)}
        className={[
          "w-full inline-flex items-center gap-2 font-semibold text-[#1f2937] text-[14px] mb-[10px] text-left",
          disabled ? "cursor-not-allowed" : ""
        ].join(" ")}
      >
        <Checkbox
          checked={allChecked}
          onClick={() => { if (!disabled) onToggle(group.id, undefined, !allChecked); }} //  guard
        />
        <span className="select-none">{group.title}</span>
      </button>

      <div className="bg-[#eef6ff] border border-[#d8ebff] rounded-xl p-[10px] px-3">
        {group.items.map((it) => {
          const checked = !!it.checked;
          return (
            <button
              key={it.id}
              type="button"
              disabled={disabled} // 
              onClick={() => onToggle(group.id, it.id, !checked)}
              className={[
                "w-full flex items-center gap-[10px] py-2 px-[2px] text-[14px] text-[#374151] text-left rounded-lg",
                disabled ? "cursor-not-allowed" : "hover:bg-white/60"
              ].join(" ")}
            >
              <Checkbox
                checked={checked}
                onClick={() => { if (!disabled) onToggle(group.id, it.id, !checked); }} //  guard
              />
              <span className="select-none">{it.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

