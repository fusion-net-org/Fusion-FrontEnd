import React from "react";
import type { SprintVm } from "@/pages/project/ProjectBoardPage";

const brand = "#2E8BFF";

function totalTasks(s: SprintVm) {
  return (["todo", "inprogress", "inreview", "done"] as const).reduce(
    (sum, k) => sum + (s.columns[k]?.length ?? 0),
    0
  );
}

export default function BoardNav({
  title,
  view,
  onViewChange,
  sprints,
  activeId,
  onActiveChange,
}: {
  title: string;
  view: "Kanban" | "Sprint";
  onViewChange: (v: "Kanban" | "Sprint") => void;
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
          <Pill selected={view === "Kanban"} onClick={() => onViewChange("Kanban")}>
            Kanban
          </Pill>
          <Pill selected={view === "Sprint"} onClick={() => onViewChange("Sprint")}>
            Sprint
          </Pill>
        </div>
      </div>

      {/* Sprint tabs – riêng vùng này được scroll ngang */}
      <div className="mt-4 -mx-8 px-8 min-w-0">
        <div
          className="
            relative max-w-full min-w-0
            overflow-x-auto overscroll-x-contain
            [-ms-overflow-style:auto] [scrollbar-width:thin]
            pl-8 pr-8
          "
        >
          <div className="inline-flex items-center gap-3 whitespace-nowrap min-w-max pr-2">
            {sprints.map((s) => {
              const selected = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => onActiveChange(s.id)}
                  className={
                    "h-9 px-4 rounded-xl border inline-flex items-center gap-2 shadow-sm shrink-0 " +
                    (selected
                      ? "text-white border-transparent"
                      : "bg-white text-gray-700 hover:bg-gray-50")
                  }
                  style={selected ? { backgroundColor: brand } : {}}
                  title={`${s.startDate ?? ""}${s.endDate ? " → " + s.endDate : ""}`}
                >
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    {s.name.split(":")[0]}
                  </span>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                    {totalTasks(s)} tasks
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
