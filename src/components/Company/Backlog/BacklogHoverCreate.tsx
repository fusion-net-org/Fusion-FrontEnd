import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { TaskVm } from "@/types/projectBoard";
import useClickOutside from "@/hook/useClickOutside";
import BacklogQuickCreateCard from "./BacklogQuickCreateCard";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export default function BacklogHoverCreate({
  className = "",
  onCreatedVM,
  onReload,

  maintenanceEnabled = false,
  components = [],
  defaultComponentId = null,
}: {
  className?: string;
  onCreatedVM?: (t: TaskVm) => void;
  onReload?: () => Promise<void> | void;

  maintenanceEnabled?: boolean;
  components?: { id: string; name: string }[];
  defaultComponentId?: string | null;
}) {
  const [open, setOpen] = useState(false);
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
            "group-hover:opacity-100",
          )}
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      ) : (
        <BacklogQuickCreateCard
          maintenanceEnabled={maintenanceEnabled}
          components={components}
          defaultComponentId={defaultComponentId}
          onReload={onReload}
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
