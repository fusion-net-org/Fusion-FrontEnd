import React from "react";
import type { Project, ProjectStatus } from "./ProjectCard";
import { CheckCircle2, PauseCircle, PlayCircle, CalendarClock } from "lucide-react";

export default function StatsBar({ items }: { items: Project[] }) {
  const map = React.useMemo(() => {
    const counter: Record<ProjectStatus, number> = { Planned: 0, InProgress: 0, OnHold: 0, Completed: 0 };
    items.forEach(p => counter[p.status]++);
    return counter;
  }, [items]);

  const Tile: React.FC<{ label: string; value: number; icon: React.ReactNode; ring: string }> = ({ label, value, icon, ring }) => (
    <div className={[
      "flex items-center justify-between rounded-2xl border bg-white/80 px-4 py-3 shadow-sm",
      "border-slate-200 backdrop-blur",
      ring
    ].join(" ")}>
      <div className="flex items-center gap-2 text-slate-700">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label="Planned"    value={map.Planned}    ring="ring-1 ring-amber-100"   icon={<CalendarClock className="size-5 text-amber-500" />} />
      <Tile label="In Progress" value={map.InProgress} ring="ring-1 ring-blue-100"    icon={<PlayCircle className="size-5 text-blue-500" />} />
      <Tile label="On Hold"    value={map.OnHold}     ring="ring-1 ring-violet-100"  icon={<PauseCircle className="size-5 text-violet-500" />} />
      <Tile label="Completed"  value={map.Completed}  ring="ring-1 ring-green-100"   icon={<CheckCircle2 className="size-5 text-green-500" />} />
    </div>
  );
}
