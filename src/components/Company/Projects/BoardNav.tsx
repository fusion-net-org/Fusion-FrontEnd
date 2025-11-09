import React from "react";
import type { SprintVm } from "@/pages/project/ProjectBoardPage";

const brand = "#2E8BFF";

export default function BoardNav({
  title,
  view,
  onViewChange,
  sprints,
  activeId,
  onActiveChange,
}: {
  title: string;
  view: "Kanban" | "Sprint" | "List";
  onViewChange: (v: "Kanban" | "Sprint" | "List") => void;
  sprints: SprintVm[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
}) {
  const Pill = ({
    selected,
    children,
    onClick,
  }: {
    selected: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={
        "h-9 px-4 rounded-lg border text-sm font-medium shrink-0 " +
        (selected
          ? "text-white border-transparent"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")
      }
      style={selected ? { backgroundColor: brand } : {}}
    >
      {children}
    </button>
  );

  return (
    <nav className="w-full max-w-full overflow-x-hidden">
      {/* Title + Switch */}
      <div className="px-8 pt-5 min-w-0">
        <div className="text-[22px] font-semibold text-gray-900">{title}</div>
        <div className="mt-3 inline-flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
          <Pill selected={view === "Kanban"} onClick={() => onViewChange("Kanban")}>Kanban</Pill>
          <Pill selected={view === "Sprint"} onClick={() => onViewChange("Sprint")}>Sprint</Pill>
          <Pill selected={view === "List"}   onClick={() => onViewChange("List")}>List</Pill>
        </div>
      </div>

      {/* Sprint tabs – scroll ngang */}
     
    </nav>
  );
}
