// src/components/Company/Projects/Backlog/BacklogQuickCreateCard.tsx
import React, { useMemo, useState } from "react";
import { CalendarDays, Plus, Boxes } from "lucide-react";
import type { TaskVm } from "@/types/projectBoard";
import { createDraftTask } from "@/services/taskService.js";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const isoFromDateInput = (v?: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

const VCOL_BACKLOG = "__LANE_BACKLOG__";

export default function BacklogQuickCreateCard({
  onCreated,
  onCancel,
  onReload,

  // maintenance (optional)
  maintenanceEnabled = false,
  components = [],
  defaultComponentId = null,
}: {
  onCreated?: (t?: TaskVm) => void;
  onCancel?: () => void;
  onReload?: () => Promise<void> | void;

  maintenanceEnabled?: boolean;
  components?: { id: string; name: string }[];
  defaultComponentId?: string | null;
}) {
  const params = useParams();
  const routeProjectId = (params as any)?.projectId as string | undefined;

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskVm["priority"]>("Medium");
  const [due, setDue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const componentOptions = useMemo(() => components ?? [], [components]);

  const initialComponentId = useMemo(() => {
    if (!maintenanceEnabled) return "";
    if (defaultComponentId && componentOptions.some((c) => c.id === defaultComponentId)) {
      return defaultComponentId;
    }
    return componentOptions[0]?.id ?? "";
  }, [maintenanceEnabled, defaultComponentId, componentOptions]);

  const [componentId, setComponentId] = useState<string>(initialComponentId);

  React.useEffect(() => {
    setComponentId(initialComponentId);
  }, [initialComponentId]);

  const componentName = useMemo(() => {
    if (!maintenanceEnabled) return "";
    return componentOptions.find((c) => c.id === componentId)?.name ?? "";
  }, [maintenanceEnabled, componentOptions, componentId]);

  // ✅ nếu maintenance có list component thì yêu cầu chọn component
  const mustPickComponent = maintenanceEnabled && componentOptions.length > 0;
  const canCreate =
    title.trim().length > 0 && (!mustPickComponent || !!componentId?.trim());

  const mapDraftDtoToTaskVm = (dto: any): TaskVm => {
    const now = new Date().toISOString();
    return {
      id: String(dto?.id ?? dto?.taskId ?? ""),
      code:
        dto?.ticketCode ??
        dto?.ticket_code ??
        dto?.sourceTicketCode ??
        dto?.code ??
        "BACKLOG",
      title: String(dto?.title ?? title.trim()),
      type: (dto?.type ?? dto?.taskType ?? "Feature") as any,
      priority: (dto?.priority ?? priority ?? "Medium") as any,
      severity: dto?.severity ?? null,

      storyPoints: Number(dto?.storyPoints ?? dto?.story_points ?? dto?.point ?? 0) || 0,
      estimateHours:
        typeof dto?.estimateHours === "number"
          ? dto.estimateHours
          : typeof dto?.estimate_hours === "number"
            ? dto.estimate_hours
            : null,
      remainingHours:
        typeof dto?.remainingHours === "number"
          ? dto.remainingHours
          : typeof dto?.remaining_hours === "number"
            ? dto?.remaining_hours
            : null,

      sprintId: null,
      workflowStatusId: VCOL_BACKLOG as any,
      statusCode: "backlog" as any,
      statusCategory: "TODO" as any,
      StatusName: "Backlog" as any,

      assignees: [],
      dependsOn: [],
      parentTaskId: null,
      carryOverCount: 0,

      openedAt: dto?.createdAt ?? dto?.created_at ?? now,
      createdAt: dto?.createdAt ?? dto?.created_at ?? now,
      updatedAt: dto?.updatedAt ?? dto?.updated_at ?? dto?.createdAt ?? now,

      sourceTicketId: dto?.ticketId ?? dto?.ticket_id ?? null,
      sourceTicketCode: dto?.ticketCode ?? dto?.ticket_code ?? dto?.ticket?.code ?? null,

      dueDate: dto?.dueDate ?? dto?.due_date ?? (isoFromDateInput(due) ?? undefined),

      ...(dto?.componentId || dto?.component_id
        ? {
            componentId: dto?.componentId ?? dto?.component_id,
            componentName: dto?.componentName ?? dto?.component_name ?? dto?.component?.name ?? null,
          }
        : maintenanceEnabled
          ? { componentId: componentId || null, componentName: componentName || "" }
          : {}),
    } as any;
  };

  async function handleCreate() {
    if (!canCreate || isSaving) return;

    const projectId =
      routeProjectId ||
      ((window as any).__projectId as string | undefined);

    if (!projectId) {
      toast.error("Missing projectId");
      return;
    }

    const selectedComponentId =
      maintenanceEnabled
        ? (componentId && componentId.trim()
            ? componentId
            : (componentOptions?.[0]?.id ?? ""))
        : "";

    if (mustPickComponent && !selectedComponentId) {
      toast.error("Please select a component.");
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
        title: title.trim(),
        priority,
        dueDate: isoFromDateInput(due) ?? null,
        type: "Feature",
      };

      if (maintenanceEnabled && selectedComponentId) {
        payload.componentId = selectedComponentId;
      }

      const res: any = await createDraftTask(projectId, payload);
      const dto = res?.data ?? res;

      const vm = mapDraftDtoToTaskVm(dto);

      resetForm();
      onCreated?.(vm);

      await onReload?.();

      toast.success("Created backlog item.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Create backlog failed");
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDue("");
    setPriority("Medium");
    if (maintenanceEnabled) setComponentId(initialComponentId);
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
          "border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        )}
        placeholder="Backlog item title..."
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Due date */}
       

        {/* Component (maintenance only) */}
        {maintenanceEnabled && (
          <label className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs border-slate-300 text-slate-700">
            <Boxes className="h-3.5 w-3.5" />
            <select
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              className="bg-transparent text-xs outline-none"
              disabled={!componentOptions.length || isSaving}
              title="Component"
            >
              {!componentOptions.length ? (
                <option value="">No component</option>
              ) : (
                componentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </label>
        )}

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
      </div>

      <div className="flex">
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
            canCreate && !isSaving
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-slate-200 text-slate-500 cursor-not-allowed",
          )}
        >
          <Plus className="h-4 w-4" /> {isSaving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
