import React, { useEffect, useMemo, useState } from "react";
import { X, CalendarDays, Clock, Plus, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProjectTask, type CreateTaskRequest } from "@/services/taskService.js";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export type SprintLite = { id: string; name: string; status?: string };
type Props = {
  projectId: string;
  sprints?: SprintLite[];           // truyền list sprint sẵn có để chọn nhanh
  defaultSprintId?: string | null;  // gợi ý sprint mặc định (e.g. sprint Active)
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (r: { id: string; code: string }) => void;
  navigateToDetail?: boolean;       // default true
};

export default function QuickTaskCreateModal({
  projectId,
  sprints = [],
  defaultSprintId = null,
  isOpen,
  onClose,
  onCreated,
  navigateToDetail = true,
}: Props) {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Feature" | "Bug" | "Chore">("Feature");
  const [priority, setPriority] = useState<"Urgent" | "High" | "Medium" | "Low">("Medium");
  const [sprintId, setSprintId] = useState<string | null>(defaultSprintId);
  const [estimateHours, setEstimateHours] = useState<number | "">("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  const [dueDate, setDueDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setType("Feature");
      setPriority("Medium");
      setSprintId(defaultSprintId ?? null);
      setEstimateHours("");
      setStoryPoints("");
      setDueDate("");
      setErr(null);
    }
  }, [isOpen, defaultSprintId]);

  const canSubmit = useMemo(() => title.trim().length > 0 && !submitting, [title, submitting]);

  function tmpCode() {
    // nếu BE KHÔNG tự sinh code => dùng tạm để qua unique (project_id, code)
    return `TMP-${Date.now()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErr(null);

    const payload: CreateTaskRequest = {
      title: title.trim(),
      type,
      priority,
      sprintId: sprintId || null,
      estimateHours: estimateHours === "" ? null : Math.max(0, Number(estimateHours)),
      storyPoints: storyPoints === "" ? null : Math.max(0, Number(storyPoints)),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      // Nếu BE tự sinh code thì bỏ dòng dưới.
      // Nếu BE yêu cầu code not null => bật lên:
      // code: tmpCode(),
    };

    try {
      const created = await createProjectTask(projectId, payload);
      onCreated?.(created);
      onClose();
      if (navigateToDetail) {
        // điều chỉnh route detail cho khớp app của bạn
        nav(`/projects/${projectId}/tasks/${created.id}`);
      }
    } catch (ex: any) {
      console.error(ex);
      setErr(ex?.response?.data?.message || "Failed to create task. Please try again.");
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  // == UI controls nhỏ gọn ==
  const PillGroup = ({
    label,
    items,
    value,
    onChange,
  }: {
    label: string;
    items: string[];
    value: string;
    onChange: (v: any) => void;
  }) => (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => {
          const selected = i === value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "px-2.5 h-8 rounded-full border text-sm",
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              )}
            >
              {i}
            </button>
          );
        })}
      </div>
    </div>
  );

  const SprintPicker = () => (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-500">Sprint</div>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setSprintId(null)}
          className={cn(
            "px-2.5 h-8 rounded-full border text-sm",
            sprintId == null
              ? "bg-blue-600 text-white border-blue-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          )}
        >
          None
        </button>
        {sprints.map((s) => {
          const selected = sprintId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              title={s.status ?? ""}
              onClick={() => setSprintId(s.id)}
              className={cn(
                "px-2.5 h-8 rounded-full border text-sm",
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              )}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* modal */}
      <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                      w-full md:w-[640px] bg-white rounded-t-2xl md:rounded-2xl shadow-lg border border-slate-200">
        <form onSubmit={handleSubmit}>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-semibold">Quick create task</div>
            <button type="button" className="text-slate-500 hover:text-slate-700" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* title */}
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500">Title<span className="text-rose-600"> *</span></div>
              <input
                autoFocus
                className="w-full h-10 rounded-xl border border-slate-300 px-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                placeholder="E.g. Fix payment webhook signature"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Type / Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PillGroup
                label="Type"
                items={["Feature", "Bug", "Chore"]}
                value={type}
                onChange={setType}
              />
              <PillGroup
                label="Priority"
                items={["Urgent", "High", "Medium", "Low"]}
                value={priority}
                onChange={setPriority}
              />
            </div>

            {/* Sprint picker */}
            <SprintPicker />

            {/* estimate & points & due */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">Estimate (hours)</div>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full h-10 rounded-xl border border-slate-300 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    placeholder="e.g. 8"
                    value={estimateHours}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d+$/.test(v)) setEstimateHours(v === "" ? "" : Number(v));
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">Story points</div>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  placeholder="e.g. 3"
                  value={storyPoints}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v)) setStoryPoints(v === "" ? "" : Number(v));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">Due date</div>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full h-10 rounded-xl border border-slate-300 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="text-sm">{err}</div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-3 h-10 rounded-xl border text-sm text-slate-700 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "px-3 h-10 rounded-xl border text-sm flex items-center gap-2",
                canSubmit
                  ? "bg-blue-600 text-white border-blue-600 hover:opacity-95"
                  : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
