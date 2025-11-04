import React from "react";
import type { Project, ProjectStatus } from "./ProjectCard";

const StatusDot = ({ color }: { color: string }) => (
  <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
);

export default function KanbanColumn({
  title, color, items, selectedId, onOpen
}: {
  title: ProjectStatus; color: string; items: Project[];
  selectedId?: string | null; onOpen: (p: Project) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <StatusDot color={color} /> {title}
        </div>
        <span className="text-xs text-slate-500">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(p => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className={[
              "w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:shadow",
              selectedId === p.id ? "ring-2 ring-blue-200" : ""
            ].join(" ")}
          >
            <div className="text-[11px] font-semibold tracking-wide text-blue-600">{p.code}</div>
            <div className="text-sm font-semibold text-slate-800">{p.name}</div>
            <div className="mt-1 text-xs text-slate-600">{p.ownerCompany}</div>
            {p.startDate && <div className="mt-1 text-xs text-slate-500">{p.startDate}</div>}
          </button>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No project
          </div>
        )}
      </div>
    </div>
  );
}
