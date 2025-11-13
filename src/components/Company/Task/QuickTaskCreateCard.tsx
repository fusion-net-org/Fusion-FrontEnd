import React, { useMemo, useState } from "react";
import { CalendarDays, UserRound, CheckSquare, Plus, ChevronDown } from "lucide-react";
import type { SprintVm, TaskVm } from "@/types/projectBoard";
import { createTaskQuick } from "@/services/taskService.js"; 
import { useProjectBoard } from "@/context/ProjectBoardContext";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const isoFromDateInput = (v?: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

export default function QuickTaskCreateCard({
  sprint,
  statusId,
  allowStatusPicker = false,
  onCreated,
  onCancel,
}: {
  sprint: SprintVm;
  statusId: string;
  allowStatusPicker?: boolean;
  onCreated?: (t?: TaskVm) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskVm["priority"]>("Medium");
  const [due, setDue] = useState<string>("");
  const [assigneeName, setAssigneeName] = useState<string>(""); // chỉ hiển thị UI, không gửi BE
  const [isSaving, setIsSaving] = useState(false);
const { attachTaskVm } = useProjectBoard();
  const statusOptions = useMemo(
    () => sprint.statusOrder.map((id) => ({ id, name: sprint.statusMeta[id]?.name ?? sprint.statusMeta[id]?.code ?? id })),
    [sprint],
  );
  const [pickedStatusId, setPickedStatusId] = useState<string>(statusId);

  React.useEffect(() => {
    const ok = sprint.statusMeta[statusId] ? statusId : sprint.statusOrder[0];
    setPickedStatusId(ok);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprint?.id]);

  const canCreate = title.trim().length > 0;

   async function handleCreate() {
    if (!canCreate || isSaving) return;

    const stId = sprint.statusMeta[pickedStatusId] ? pickedStatusId : sprint.statusOrder[0];
    const meta = sprint.statusMeta[stId];

    try {
      setIsSaving(true);
      const projectId = (window as any).__projectId as string;

      // gọi BE
      const api = await createTaskQuick(projectId, {
        title: title.trim(),
        sprintId: sprint.id,
        workflowStatusId: stId,
        statusCode: meta?.code ?? null,
        priority,
        dueDate: isoFromDateInput(due) ?? null,
        type: "Feature",
        estimateHours: null,
      });
const openedAt = api.createAt ?? api.createdAt ?? new Date().toISOString();
const createdAt = api.createAt ?? api.createdAt ?? openedAt;
const updatedAt = api.updateAt ?? api.updatedAt ?? createdAt;

      // map tối thiểu đủ field bắt buộc của TaskVm
      const vm: TaskVm = {
        id: api.id,
        code: api.code ?? "",
        title: api.title ?? title.trim(),
        type: (api.type as any) || "Feature",
        priority: (api.priority as any) || "Medium",
        storyPoints: api.point ?? 0,
        estimateHours: api.estimateHours ?? 0,
        remainingHours: api.remainingHours ?? api.estimateHours ?? 0,
        dueDate: api.dueDate ?? undefined,
        sprintId: api.sprintId ?? sprint.id,
        workflowStatusId: api.currentStatusId ?? stId,
        statusCode: api.status ?? (meta?.code ?? ""),
        statusCategory: sprint.statusMeta[stId]?.category ?? "TODO",

        // các field FE yêu cầu phải có để khỏi lỗi TS
        assignees: [],
        dependsOn: [],
        parentTaskId: api.parentTaskId ?? null,
        carryOverCount: api.carryOverCount ?? 0,

         openedAt,               
  createdAt,               
  updatedAt,      
        sourceTicketId: api.sourceTaskId ?? null,
        sourceTicketCode: api.code ?? "",
      };
attachTaskVm(vm);
      resetForm();
      onCreated?.(vm);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Create task failed");
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDue("");
    setAssigneeName("");
    setPriority("Medium");
    setPickedStatusId(sprint.statusMeta[statusId] ? statusId : sprint.statusOrder[0]);
  }

  function handleCancel() {
    resetForm();
    onCancel?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        className={cn(
          "w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none",
          "border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        )}
        placeholder="What needs to be done?"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Status */}
        <div className="relative">
          <div className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs border-slate-300 text-slate-700">
            <CheckSquare className="h-3.5 w-3.5" />
            {allowStatusPicker ? (
              <select
                value={pickedStatusId}
                onChange={(e) => setPickedStatusId(e.target.value)}
                className="bg-transparent text-xs outline-none"
              >
                {statusOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            ) : (
              <span>{sprint.statusMeta[pickedStatusId]?.name ?? "Status"}</span>
            )}
            {allowStatusPicker && <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-60" />}
          </div>
        </div>

        {/* Due date */}
        <label className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs border-slate-300 text-slate-700">
          <CalendarDays className="h-3.5 w-3.5" />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="bg-transparent text-xs outline-none"
          />
        </label>

        {/* Assignee quick (chỉ UI) */}
        <label className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs border-slate-300 text-slate-700">
          <UserRound className="h-3.5 w-3.5" />
          <input
            value={assigneeName}
            onChange={(e) => setAssigneeName(e.target.value)}
            className="bg-transparent text-xs outline-none placeholder:text-slate-400"
            placeholder="Assignee"
            onKeyDown={onKeyDown}
          />
        </label>

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskVm["priority"])}
          className="ml-auto rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700"
          title="Priority"
          disabled={isSaving}
        >
          <option>Urgent</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

        {/* Cancel + Create */}
        <button
          type="button"
          onClick={handleCancel}
          className="ml-2 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          disabled={isSaving}
        >
          Cancel
        </button>

        <button
          disabled={!canCreate || isSaving}
          onClick={handleCreate}
          className={cn(
            "ml-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm",
            canCreate && !isSaving ? "bg-slate-900 text-white hover:bg-slate-800"
                                   : "bg-slate-200 text-slate-500 cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4" /> {isSaving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
