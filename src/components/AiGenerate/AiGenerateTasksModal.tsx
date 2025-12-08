/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import {
  X,
  Target,
  Clock,
  Users,
  ListChecks,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import type { SprintVm, TaskVm } from "@/types/projectBoard";
import type { AiTaskGenerateRequest } from "@/types/aiTaskGenerate";
import { generateAndSaveAiTasks } from "@/services/AITaskService.js";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

// Giới hạn tổng số task AI cho 1 lần gen (quantity × số sprint)
const MAX_AI_TASKS_PER_CALL = 50;

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  sprints: SprintVm[];
  members?: Array<{ id: string; name: string; role?: string }>;
  existingTasks?: TaskVm[];
  workflowMetaBySprint?: Record<
    string,
    {
      id: string;
      code: string;
      name: string;
      category: string;
      isDone: boolean;
      order: number;
    }[]
  >;
  // meta giữ lại defaultSprintId (cũ) + thêm selectedSprintIds (mới)
  onGenerated?: (
    tasks: TaskVm[],
    meta: { defaultSprintId: string; selectedSprintIds?: string[] },
  ) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
};

export default function AiGenerateTasksModal({
  open,
  onClose,
  projectId,
  projectName,
  sprints,
  members = [],
  existingTasks = [],
  workflowMetaBySprint = {},
  onGenerated,
  onGeneratingChange,
}: Props) {
  if (!open) return null;

  // Multi-sprint: chọn nhiều sprint
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>(
    sprints[0]?.id ? [sprints[0].id] : [],
  );

  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [workTypes, setWorkTypes] = useState<string[]>(["Feature"]);
  const [modules, setModules] = useState<string[]>([]);

  const [quantity, setQuantity] = useState(3);
  const [granularity, setGranularity] = useState<"Epic" | "Task" | "SubTask">(
    "Task",
  );

  const [estimateUnit, setEstimateUnit] = useState<"StoryPoints" | "Hours">(
    "Hours",
  );
  const [withEstimate, setWithEstimate] = useState(true);
  const [estimateMin, setEstimateMin] = useState(2);
  const [estimateMax, setEstimateMax] = useState(8);
  const [totalEffortHours, setTotalEffortHours] = useState<number | undefined>(
    undefined,
  );

  const [deadline, setDeadline] = useState<string>("");

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [assignStrategy, setAssignStrategy] = useState<
    "Unassigned" | "Balanced" | "ByRole"
  >("Unassigned");
  const [techStack, setTechStack] = useState<string>("");

  const [functionalReq, setFunctionalReq] = useState("");
  const [nonFunctionalReq, setNonFunctionalReq] = useState("");
  const [acceptanceHint, setAcceptanceHint] = useState(
    "Each task should include bullet-point acceptance criteria that are clear and testable.",
  );

  const [outputConfig, setOutputConfig] = useState({
    includeTitle: true,
    includeDescription: true,
    includeType: true,
    includePriority: true,
    includeEstimate: true,
    includeAcceptanceCriteria: true,
    includeDependencies: true,
    includeStatusSuggestion: true,
    includeChecklist: true,
  });

  const [duplicateStrategy, setDuplicateStrategy] = useState({
    includeExistingTasks: true,
    avoidSameTitle: true,
    avoidSameDescription: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const selectedSprints = useMemo(
    () => sprints.filter((sp) => selectedSprintIds.includes(sp.id)),
    [sprints, selectedSprintIds],
  );

  // Sprint chính để show workflow / capacity
  const primarySprint = useMemo(
    () => selectedSprints[0] ?? sprints[0],
    [selectedSprints, sprints],
  );

  // Task thuộc các sprint đang chọn
  const sprintTasks = useMemo(
    () =>
      existingTasks.filter(
        (t) => t.sprintId && selectedSprintIds.includes(t.sprintId),
      ),
    [existingTasks, selectedSprintIds],
  );

  const sprintStats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter((t) => t.statusCategory === "DONE").length;
    return {
      total,
      done,
      remaining: total - done,
    };
  }, [sprintTasks]);

  const handleToggleArrayValue = (
    curr: string[],
    v: string,
    setter: (next: string[]) => void,
  ) => {
    setter(curr.includes(v) ? curr.filter((x) => x !== v) : [...curr, v]);
  };

  const handleToggleOutputConfig = (k: keyof typeof outputConfig) => {
    setOutputConfig((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleChangeDuplicate = (k: keyof typeof duplicateStrategy) => {
    setDuplicateStrategy((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const canSubmit =
    goal.trim().length > 0 &&
    (selectedSprints.length > 0 || sprints.length > 0);

  const boardSprintContext = useMemo(
    () =>
      (selectedSprints.length > 0 ? selectedSprints : sprints).map((sp) => ({
        id: sp.id,
        name: sp.name,
        start: sp.start ?? null,
        end: sp.end ?? null,
        state: (sp as any).state ?? null,
        capacityHours: sp.capacityHours ?? null,
        committedPoints: (sp as any).committedPoints ?? null,
      })),
    [selectedSprints, sprints],
  );

  const boardTasksContext = useMemo(() => {
    if (!existingTasks || existingTasks.length === 0) return [];

    const targetIds =
      selectedSprintIds.length > 0
        ? new Set(selectedSprintIds)
        : new Set(sprints.map((sp) => sp.id));

    const slice = existingTasks
      .filter((t) => t.sprintId && targetIds.has(t.sprintId))
      .slice(0, 80);

    return slice.map((t) => {
      const sprintName =
        sprints.find((sp) => sp.id === t.sprintId)?.name ?? undefined;

      return {
        id: t.id,
        code: (t as any).code ?? null,
        title: t.title,
        type: t.type,
        priority: t.priority,
        severity: t.severity ?? null,
        sprintId: t.sprintId ?? null,
        sprintName: sprintName ?? null,
        statusCode: (t as any).statusCode ?? null,
        statusCategory: t.statusCategory ?? null,
        estimateHours: (t as any).estimateHours ?? null,
        storyPoints:
          (t as any).storyPoints ??
          (t as any).point ??
          null,
      };
    });
  }, [existingTasks, sprints, selectedSprintIds]);

  const buildRequest = (): AiTaskGenerateRequest | null => {
    const targetSprints =
      selectedSprints.length > 0
        ? selectedSprints
        : sprints.length > 0
        ? [sprints[0]]
        : [];

    if (targetSprints.length === 0) return null;

    const mainSprint = targetSprints[0];

    const wf = workflowMetaBySprint[mainSprint.id] ?? [];

    const selectedMembers = members.filter((m) =>
      selectedMemberIds.includes(m.id),
    );
    const effectiveMembers =
      selectedMembers.length > 0 ? selectedMembers : members;

    const roles = Array.from(
      new Set(
        effectiveMembers
          .map((m) => (m.role || "").trim())
          .filter((x) => x.length > 0),
      ),
    );

    const techStackList = techStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const req: AiTaskGenerateRequest = {
      projectId,
      projectName,

      sprint: {
        id: mainSprint.id,
        name: mainSprint.name,
        start: mainSprint.start ?? null,
        end: mainSprint.end ?? null,
        capacityHours: mainSprint.capacityHours ?? null,
      },

      // nếu BE có thêm field targetSprintIds thì truyền luôn,
      // nếu không sẽ bị bỏ qua, không sao.

      workflow: {
        statuses: wf.map((x, idx) => ({
          id: x.id,
          code: x.code,
          name: x.name,
          category: x.category as any,
          isDone: x.isDone,
          order: x.order ?? idx,
        })),
        defaultStatusId:
          wf.find((x) => !x.isDone)?.id ?? wf[0]?.id ?? undefined,
      },

      boardContext:
        boardSprintContext.length || boardTasksContext.length
          ? {
              sprints: boardSprintContext,
              tasks: boardTasksContext,
            }
          : undefined,

      goal: goal.trim(),
      context: context.trim() || undefined,
      workTypes,
      modules,
      quantity,
      granularity,
      estimate: {
        unit: estimateUnit,
        withEstimate,
        min: withEstimate ? estimateMin : undefined,
        max: withEstimate ? estimateMax : undefined,
        totalEffortHours,
      },
      deadline: deadline || undefined,

      teamContext: {
        memberCount: effectiveMembers.length,
        roles,
        techStack: techStackList,
      },
      requirements: {
        functional: functionalReq.trim() || undefined,
        nonFunctional: nonFunctionalReq.trim() || undefined,
        acceptanceHint: acceptanceHint.trim() || undefined,
      },
      outputConfig,
      duplicateStrategy,
      existingTasksSnapshot: duplicateStrategy.includeExistingTasks
        ? sprintTasks.map((t) => ({
            id: t.id,
            code: (t as any).code,
            title: t.title,
            type: t.type,
            module: (t as any).module,
            statusCategory: t.statusCategory,
            priority: t.priority,
            severity: t.severity,
            estimateHours: (t as any).estimateHours ?? null,
            storyPoints:
              (t as any).storyPoints ??
              (t as any).point ??
              null,
          }))
        : undefined,
    };

    return req;
  };

  const handleSubmit = async () => {
    const req = buildRequest();
    if (!req) {
      setErrorText("Please select at least one target sprint.");
      return;
    }

    const sprintCountForLimit =
      selectedSprints.length > 0 ? selectedSprints.length : 1;
    const totalRequested = quantity * sprintCountForLimit;

    if (
      MAX_AI_TASKS_PER_CALL > 0 &&
      totalRequested > MAX_AI_TASKS_PER_CALL
    ) {
      setErrorText(
        `You are requesting ${totalRequested} tasks (${quantity} × ${sprintCountForLimit} sprints). ` +
          `The system limit is ${MAX_AI_TASKS_PER_CALL} tasks per generation. ` +
          "Please reduce the quantity or deselect some sprints.",
      );
      return;
    }

    setSubmitting(true);
    setErrorText(null);
    onGeneratingChange?.(true);

    try {
      console.log("[AI TASK GENERATE] request DTO = ", req);

      const res = await generateAndSaveAiTasks(req);

      const tasks: TaskVm[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.items)
        ? (res as any).items
        : [];

      if (onGenerated) {
        const ids =
          selectedSprints.length > 0
            ? selectedSprints.map((sp) => sp.id)
            : sprints[0]
            ? [sprints[0].id]
            : [];

        const defaultSprintId = ids[0] ?? "";

        onGenerated(tasks, {
          defaultSprintId,
          selectedSprintIds: ids.length > 0 ? ids : undefined,
        });
      }

      onClose();
    } catch (err: any) {
      console.error("[AI TASK GENERATE] failed", err);
      setErrorText(
        err?.message ||
          "Failed to generate & save tasks with AI. Please try again.",
      );
    } finally {
      setSubmitting(false);
      onGeneratingChange?.(false);
    }
  };

  const outputFieldLabels: Record<keyof typeof outputConfig, string> = {
    includeTitle: "Title",
    includeDescription: "Description",
    includeType: "Work type (Feature / Bug / etc.)",
    includePriority: "Priority",
    includeEstimate: "Estimate",
    includeAcceptanceCriteria: "Acceptance criteria",
    includeDependencies: "Dependencies / blockers",
    includeStatusSuggestion: "Suggested initial status",
    includeChecklist: "Checklist items per task",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-[2px] flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, #dbeafe, #eff6ff)",
              }}
            >
              <span className="text-[11px] font-bold tracking-wide text-blue-700">
                AI
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Generate sprint tasks with AI
                </h2>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[2px] text-[10px] font-medium text-slate-600">
                  Experimental
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Describe your goal, scope, and constraints. AI will break it
                down into sprint-ready tasks that fit your workflow and team.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: 2 columns */}
        <div className="flex flex-1 gap-4 overflow-hidden px-6 py-4">
          {/* LEFT: Context */}
          <div className="w-[34%] min-w-[260px] space-y-3 overflow-y-auto pr-1">
            {/* Project & sprint */}
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-700">
                <Target className="h-3.5 w-3.5 text-blue-500" />
                <span>Project & sprint context</span>
              </div>

              <div className="mb-2">
                <div className="text-[11px] text-slate-500">Project</div>
                <div className="text-xs font-semibold text-slate-800">
                  {projectName}
                </div>
              </div>

              {/* Multi-select sprint */}
              <div className="mb-2">
                <label className="mb-1 block text-[11px] text-slate-500">
                  Target sprints
                </label>
                <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                  {sprints.map((sp) => {
                    const checked = selectedSprintIds.includes(sp.id);
                    return (
                      <label
                        key={sp.id}
                        className="flex items-center justify-between gap-2 cursor-pointer rounded-md px-1 py-[2px] text-[11px] text-slate-700 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300"
                            checked={checked}
                            onChange={() =>
                              setSelectedSprintIds((prev) =>
                                prev.includes(sp.id)
                                  ? prev.filter((x) => x !== sp.id)
                                  : [...prev, sp.id],
                              )
                            }
                          />
                          <span className="font-medium">{sp.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {sp.start?.slice(0, 10)} → {sp.end?.slice(0, 10)}
                        </span>
                      </label>
                    );
                  })}

                  {sprints.length === 0 && (
                    <p className="text-[11px] text-slate-400">
                      This project has no sprints yet.
                    </p>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  AI will generate approximately{" "}
                  <span className="font-semibold">{quantity}</span> tasks per
                  selected sprint.
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {selectedSprints.length} sprint(s) selected ·{" "}
                  {sprintStats.total} tasks currently in those sprints.
                </p>
              </div>

              {/* Sprint stats */}
              <div className="mt-2 rounded-lg bg-white px-2.5 py-2">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Current sprint load</span>
                  <span className="font-medium text-slate-700">
                    {sprintStats.total} tasks
                  </span>
                </div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600">Done</span>
                  <span className="font-medium text-emerald-700">
                    {sprintStats.done}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-600">Remaining</span>
                  <span className="font-medium text-amber-700">
                    {sprintStats.remaining}
                  </span>
                </div>
              </div>
            </section>

            {/* Workflow summary (primary sprint) */}
            <section className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-700">
                <ListChecks className="h-3.5 w-3.5 text-blue-500" />
                <span>Workflow</span>
              </div>
              <p className="mb-2 text-[11px] text-slate-500">
                AI will generate tasks that follow your current pipeline. New
                tasks usually start in the first status that is not marked as
                done.
              </p>
              <div className="flex flex-wrap gap-1">
                {(workflowMetaBySprint[primarySprint?.id ?? ""] ?? []).map(
                  (st) => (
                    <span
                      key={st.id}
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] font-medium",
                        st.isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-700",
                      )}
                    >
                      {st.name}
                    </span>
                  ),
                )}
              </div>
            </section>

            {/* Duplicate strategy */}
            <section className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-700">
                <Settings2 className="h-3.5 w-3.5 text-blue-500" />
                <span>Duplicate control</span>
              </div>
              <label className="mb-1 flex items-center gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  checked={duplicateStrategy.includeExistingTasks}
                  onChange={() =>
                    handleChangeDuplicate("includeExistingTasks")
                  }
                />
                <span>Include current sprint tasks in the AI context</span>
              </label>
              <label className="mb-1 flex items-center gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  checked={duplicateStrategy.avoidSameTitle}
                  onChange={() => handleChangeDuplicate("avoidSameTitle")}
                />
                <span>Avoid generating tasks with the same title</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  checked={duplicateStrategy.avoidSameDescription}
                  onChange={() =>
                    handleChangeDuplicate("avoidSameDescription")
                  }
                />
                <span>Avoid generating tasks with the same description</span>
              </label>
            </section>
          </div>

          {/* RIGHT: AI form */}
          <div className="flex-1 space-y-3 overflow-y-auto pb-1">
            {/* Goal & context */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Business goal & scope
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Clearly describe the feature or module you want to build.
                    The more specific you are, the better the generated tasks
                    will be.
                  </p>
                </div>
              </div>

              <label className="mb-1 block text-[11px] text-slate-600">
                Main goal for this sprint / feature{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Build the Subscription module for FUSION: allow companies to purchase plans, renew, and view payment history."
              />

              <label className="mt-2 mb-1 block text-[11px] text-slate-600">
                Context & detailed description (optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Paste any additional specs, business rules, API contracts, or system constraints here."
              />

              {/* Work types & modules */}
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Main work types
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Feature", "Bug", "Refactor", "Spike", "Maintenance"].map(
                      (w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() =>
                            handleToggleArrayValue(workTypes, w, setWorkTypes)
                          }
                          className={cn(
                            "rounded-full border px-2.5 py-[3px] text-[11px]",
                            workTypes.includes(w)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                          )}
                        >
                          {w}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Module / domain
                  </div>
                  <input
                    value={modules.join(", ")}
                    onChange={(e) =>
                      setModules(
                        e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Subscription, Project board, Notification..."
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Use commas to separate multiple modules.
                  </p>
                </div>
              </div>
            </section>

            {/* Effort & estimation */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Effort & estimation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Help AI keep tasks realistic for this sprint and team, not
                    too small and not too large.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Approximate number of tasks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Task size / granularity
                  </div>
                  <div className="space-y-1">
                    {[
                      ["Epic", "Epic-level (fewer but larger items)"],
                      ["Task", "Task-level (recommended)"],
                      ["SubTask", "Sub-task level (very detailed)"],
                    ].map(([val, label]) => (
                      <label
                        key={val}
                        className="flex items-center gap-2 text-[11px] text-slate-600"
                      >
                        <input
                          type="radio"
                          className="h-3.5 w-3.5"
                          checked={granularity === val}
                          onChange={() =>
                            setGranularity(val as typeof granularity)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Estimate per task
                  </div>
                  <label className="mb-1 flex items-center gap-2 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={withEstimate}
                      onChange={() => setWithEstimate((x) => !x)}
                    />
                    <span>Ask AI to suggest estimates</span>
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEstimateUnit("Hours")}
                      className={cn(
                        "rounded-full border px-2 py-[2px]",
                        estimateUnit === "Hours"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    >
                      Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstimateUnit("StoryPoints")}
                      className={cn(
                        "rounded-full border px-2 py-[2px]",
                        estimateUnit === "StoryPoints"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    >
                      Story points
                    </button>
                  </div>

                  {withEstimate && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={estimateMin}
                        onChange={(e) =>
                          setEstimateMin(Number(e.target.value) || 0)
                        }
                        className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-500">→</span>
                      <input
                        type="number"
                        min={estimateMin}
                        value={estimateMax}
                        onChange={(e) =>
                          setEstimateMax(Number(e.target.value) || 0)
                        }
                        className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-500">
                        {estimateUnit.toLowerCase()} / task
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Total development effort for this sprint (hours) – optional
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalEffortHours ?? ""}
                    onChange={(e) =>
                      setTotalEffortHours(
                        e.target.value
                          ? Number(e.target.value) || undefined
                          : undefined,
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 160 (4 devs × 40h)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Business deadline (if any)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Team & assignment */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Team & assignment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Help AI size and assign work based on your team and skills.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Relevant team members
                  </div>
                  <div className="max-h-28 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    {members.length === 0 && (
                      <p className="text-[11px] text-slate-400">
                        No team members are listed. AI will assume a generic
                        development team.
                      </p>
                    )}
                    {members.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center justify-between rounded-md px-1 py-[2px] text-[11px] text-slate-700 hover:bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={selectedMemberIds.includes(m.id)}
                            onChange={() =>
                              handleToggleArrayValue(
                                selectedMemberIds,
                                m.id,
                                setSelectedMemberIds,
                              )
                            }
                          />
                          <span>{m.name}</span>
                        </div>
                        {m.role && (
                          <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] text-slate-500">
                            {m.role}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Default assignment strategy
                  </div>
                  <div className="space-y-1">
                    {[
                      ["Unassigned", "Leave unassigned so the PM can decide"],
                      [
                        "Balanced",
                        "AI suggests a balanced distribution across selected members",
                      ],
                      [
                        "ByRole",
                        "AI suggests assignments based on roles (Dev, QA, Designer, etc.)",
                      ],
                    ].map(([val, label]) => (
                      <label
                        key={val}
                        className="flex items-center gap-2 text-[11px] text-slate-600"
                      >
                        <input
                          type="radio"
                          className="h-3.5 w-3.5"
                          checked={assignStrategy === val}
                          onChange={() =>
                            setAssignStrategy(val as typeof assignStrategy)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-2">
                    <label className="mb-1 block text-[11px] text-slate-600">
                      Primary tech stack
                    </label>
                    <input
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. .NET 8, React, SQL Server, Redis..."
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      AI will generate tasks that match this platform and stack.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Requirements & output format */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Requirements & output format
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Control quality requirements and which fields AI should
                    include for each task.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Functional requirements
                  </label>
                  <textarea
                    value={functionalReq}
                    onChange={(e) => setFunctionalReq(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="List key flows, business rules, and any must-have behaviours."
                  />

                  <label className="mt-2 mb-1 block text-[11px] text-slate-600">
                    Non-functional / quality (optional)
                  </label>
                  <textarea
                    value={nonFunctionalReq}
                    onChange={(e) => setNonFunctionalReq(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. performance, security, UX guidelines, logging..."
                  />
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-slate-600">
                    Output per task
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
                    {(
                      Object.keys(
                        outputConfig,
                      ) as (keyof typeof outputConfig)[]
                    ).map((key) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={outputConfig[key]}
                          onChange={() => handleToggleOutputConfig(key)}
                        />
                        <span>{outputFieldLabels[key]}</span>
                      </label>
                    ))}
                  </div>

                  <label className="mb-1 block text-[11px] text-slate-600">
                    Guidance for writing Acceptance Criteria
                  </label>
                  <textarea
                    value={acceptanceHint}
                    onChange={(e) => setAcceptanceHint(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    AI will follow this guidance when generating acceptance
                    criteria for each task.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <div className="flex flex-col items-start gap-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                AI will generate tasks and add them directly into the selected
                sprint(s). You can edit or delete them later using the normal
                task workflow.
              </span>
            </div>
            {errorText && (
              <span className="text-[11px] text-red-500">{errorText}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-sm",
                canSubmit && !submitting
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-300 cursor-not-allowed",
              )}
            >
              {submitting ? "Generating…" : "Generate tasks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
