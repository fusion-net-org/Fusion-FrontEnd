// src/components/Company/Task/ColumnHoverCreate.tsx
import React, { useState } from "react";
import { Plus } from "lucide-react";
import QuickTaskCreateCard from "@/components/Company/Task/QuickTaskCreateCard";
import type { SprintVm, TaskVm  } from "@/types/projectBoard";
import useClickOutside from "@/hook/useClickOutside";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export default function ColumnHoverCreate({
  sprint,
  statusId,
  allowStatusPicker = false,
  className = "",
  onCreatedVM,
}: {
  sprint: SprintVm;
  statusId: string;
  allowStatusPicker?: boolean;
  className?: string;
  onCreatedVM?: (t: TaskVm) => void; 
}) {
  const [open, setOpen] = useState(false);

  // 👇 ref bao toàn bộ vùng (button + card). Click ngoài vùng này sẽ đóng.
  const rootRef = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={rootRef} className={cn("mb-2", className)}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 px-2 py-1 text-sm rounded-md",
            "text-slate-700 hover:text-slate-900",
            "opacity-0 transition-opacity",
            "group-hover:opacity-100" // nhớ parent cột có class 'group relative'
          )}
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      ) : (
        <QuickTaskCreateCard
          sprint={sprint}
          statusId={statusId}
          allowStatusPicker={allowStatusPicker}
         onCreated={(vm) => {
            if (vm) onCreatedVM?.(vm); 
            setOpen(false);           
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}
