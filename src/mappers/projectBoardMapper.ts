/* eslint-disable @typescript-eslint/no-explicit-any */

// src/mappers/projectBoardMapper.ts
import type { SprintVm, TaskVm, MemberRef, StatusCategory } from "@/types/projectBoard";

type Any = any;

const rid = () => Math.random().toString(36).slice(2, 10);

const iso = (d?: string | Date | null): string => {
  if (!d) return new Date().toISOString();
  const v = typeof d === "string" ? new Date(d) : d;
  return isNaN(v.getTime()) ? new Date().toISOString() : v.toISOString();
};

const asPriority = (x?: string | null): TaskVm["priority"] => {
  const k = String(x ?? "Low").toLowerCase();
  if (k === "urgent") return "Urgent";
  if (k === "high") return "High";
  if (k === "medium") return "Medium";
  return "Low";
};

const toMember = (m: Any): MemberRef => ({
  id: m?.id ?? m?.userId ?? m?.memberId ?? rid(),
  name: m?.name ?? m?.fullName ?? m?.memberName ?? m?.email ?? "Unknown",
  avatarUrl: m?.avatarUrl ?? m?.avatar ?? null,
});

// Suy category từ code/name nếu server không gửi
const inferCategory = (codeOrName: string): StatusCategory => {
  const k = codeOrName.toLowerCase().replace(/[\s_-]/g, "");
  if (k.includes("review")) return "REVIEW";
  if (k.includes("progress") || k === "doing" || k === "work") return "IN_PROGRESS";
  if (k.includes("done") || k === "closed") return "DONE";
  return "TODO";
};

// Parse roles từ m.roles hoặc m.rolesJson (JSON string / comma)
const parseRoles = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(x => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    const txt = raw.trim();
    if (!txt) return [];
    // ưu tiên JSON
    try {
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) {
        return arr.map((x: any) => String(x).trim()).filter(Boolean);
      }
    } catch {
      // ignore
    }
    // fallback: "Dev, QA"
    return txt
      .split(/[;,]/)
      .map(x => x.trim())
      .filter(Boolean);
  }
  return [];
};

// Workflow mặc định 4 cột (có isStart ở cột đầu)
export function defaultStatuses(): {
  statusOrder: SprintVm["statusOrder"];
  statusMeta: SprintVm["statusMeta"];
} {
  const defs = [
    {
      id: "st-todo",
      code: "todo",
      name: "To do",
      order: 1,
      category: "TODO" as StatusCategory,
      color: "#F59E0B",
      isStart: true,
      isFinal: false,
      roles: [] as string[],
    },
    {
      id: "st-inp",
      code: "inprogress",
      name: "In progress",
      order: 2,
      category: "IN_PROGRESS" as StatusCategory,
      color: "#3B82F6",
      isStart: false,
      isFinal: false,
      roles: [] as string[],
    },
    {
      id: "st-rev",
      code: "inreview",
      name: "In review",
      order: 3,
      category: "REVIEW" as StatusCategory,
      color: "#8B5CF6",
      isStart: false,
      isFinal: false,
      roles: [] as string[],
    },
    {
      id: "st-done",
      code: "done",
      name: "Done",
      order: 4,
      category: "DONE" as StatusCategory,
      color: "#10B981",
      isStart: false,
      isFinal: true,
      roles: [] as string[],
    },
  ] as const;

  const statusOrder = defs.map(s => s.id);
  const statusMeta: SprintVm["statusMeta"] = {};
  defs.forEach(s => (statusMeta[s.id] = { ...s }));

  return { statusOrder, statusMeta };
}

// Lấy id status bắt đầu của sprint (ưu tiên flag isStart)
export const getStartStatusId = (s: SprintVm): string => {
  const byFlag = s.statusOrder.find(id => s.statusMeta?.[id]?.isStart === true);
  return byFlag ?? s.statusOrder[0] ?? Object.keys(s.columns ?? {})[0] ?? "";
};

/* ===========================================================
 * Sprint DTO -> SprintVm (workflow động)
 * =========================================================== */
export function mapSprint(dto: Any): SprintVm {
  const ws: Any[] = dto?.workflow?.statuses ?? [];
  let statusOrder: string[] = [];
  let statusMeta: SprintVm["statusMeta"] = {};

  // 🔹 lấy transitions từ dto hoặc dto.workflow (nếu có)
  const transitions: Any[] =
    Array.isArray(dto?.transitions)
      ? dto.transitions
      : Array.isArray(dto?.workflow?.transitions)
      ? dto.workflow.transitions
      : [];

  // Trường hợp API đã trả thẳng statusOrder + statusMeta
  if (Array.isArray(dto?.statusOrder) && dto?.statusMeta) {
    statusOrder = dto.statusOrder.map(String);
    statusMeta = {};
    for (const id of statusOrder) {
      const m = dto.statusMeta[id];
      if (!m) continue;
      const codeOrName = String(m.code ?? m.name ?? id);
      statusMeta[id] = {
        id: String(m.id ?? id),
        code: codeOrName.toLowerCase(),
        name: String(m.name ?? m.code ?? id),
        category:
          (m.category as StatusCategory) ?? inferCategory(codeOrName),
        order: Number(m.order ?? 0),
        color: m.color ?? undefined,
        wipLimit: m.wipLimit ?? undefined,
        isFinal: !!m.isFinal,
        isStart: !!m.isStart,
        roles: parseRoles((m as any).roles ?? (m as any).rolesJson),
      };
    }
  } else if (ws.length) {
    const metas = ws.map((s: Any, i: number) => {
      const codeOrName = String(s.code ?? s.name ?? `status-${i + 1}`);
      return {
        id: String(s.id ?? `st-${i + 1}`),
        code: codeOrName.toLowerCase(),
        name: String(s.name ?? s.code ?? `Status ${i + 1}`),
        category:
          (s.category as StatusCategory) ?? inferCategory(codeOrName),
        order: Number(s.order ?? i + 1),
        color: s.color ?? undefined,
        wipLimit: s.wipLimit ?? undefined,
        isFinal: !!s.isFinal,
        isStart: !!s.isStart,
        roles: parseRoles(s.roles ?? s.rolesJson),
      };
    });

    statusOrder = [...metas]
      .sort((a, b) => a.order - b.order)
      .map(m => m.id);

    statusMeta = {};
    metas.forEach(m => (statusMeta[m.id] = m));
  } else {
    ({ statusOrder, statusMeta } = defaultStatuses());
  }

  const emptyCols = Object.fromEntries(
    statusOrder.map(id => [id, [] as TaskVm[]])
  );

  // 🔹 base sprint
  const base: SprintVm = {
    id: String(dto?.id ?? dto?.sprintId ?? rid()),
    name: String(dto?.name ?? dto?.title ?? "Sprint"),
    start: dto?.start ?? dto?.startDate ? iso(dto?.start ?? dto?.startDate) : undefined,
    end: dto?.end ?? dto?.endDate ? iso(dto?.end ?? dto?.endDate) : undefined,
    state: dto?.state,
    capacityHours:
      dto?.capacityHours ??
      dto?.teamCapacityHours ??
      dto?.capacity ??
      undefined,
    committedPoints: dto?.committedPoints ?? undefined,

    workflowId: dto?.workflowId ?? dto?.workflow?.id ?? undefined,
    statusOrder,
    statusMeta,
    columns: emptyCols,
  };

  // 🔹 đính transitions nếu có (dạng any, SprintVm không cần sửa type)
  if (transitions.length) {
    (base as any).transitions = transitions;
  }

  return base;
}


/* ===========================================================
 * Task DTO -> TaskVm (dựa theo sprint.workflow)
 * =========================================================== */
export function mapTask(dto: Any, sprint?: SprintVm): TaskVm {
  // Meta theo id (nếu có)
  const incomingIdRaw = dto?.workflowStatusId ?? dto?.statusId ?? "";
  const incomingId = incomingIdRaw ? String(incomingIdRaw) : "";
  const stMetaById = incomingId && sprint?.statusMeta
    ? sprint.statusMeta[incomingId]
    : undefined;

  // API cũ trả status string -> normalize code
  const legacyStatusStr = String(dto?.status ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  const codeGuess = stMetaById?.code || legacyStatusStr || "todo";

  // Tìm id theo code
  let statusIdFinal = "";
  if (stMetaById) {
    statusIdFinal = stMetaById.id;
  } else if (sprint && sprint.statusOrder?.length) {
    const byCode = sprint.statusOrder.find(
      id => sprint.statusMeta[id]?.code === codeGuess
    );
    statusIdFinal = byCode ?? getStartStatusId(sprint);
  } else {
    statusIdFinal = "st-todo";
  }

  const metaFinal = sprint?.statusMeta?.[statusIdFinal];

  const est = Number(dto?.estimateHours ?? dto?.estimate ?? 0) || 0;
  const rem = Number(dto?.remainingHours ?? dto?.remaining ?? est) || 0;
  const story = Number(dto?.storyPoints ?? dto?.points ?? 0) || 0;

  const ticketId: string | null =
    dto?.sourceTicketId ??
    dto?.ticketId ??
    dto?.sourceTaskId ??
    null;

  const ticketCode: string | null =
    dto?.sourceTicketCode ??
    dto?.ticketName ??
    dto?.sourceTaskCode ??
    null;

  const openedAtRaw =
    dto?.openedAt ??
    dto?.createdAt ??
    dto?.createAt ??
    null;

  const createdAtRaw = dto?.createdAt ?? dto?.createAt ?? openedAtRaw;
  const updatedAtRaw =
    dto?.updatedAt ??
    dto?.updateAt ??
    createdAtRaw;

  const vm: TaskVm = {
    id: String(dto?.id ?? dto?.taskId ?? rid()),
    code: String(dto?.code ?? dto?.key ?? dto?.number ?? "T-UNKNOWN"),
    title: String(dto?.title ?? dto?.name ?? "Untitled"),

    type: (dto?.type ?? "Feature") as TaskVm["type"],
    priority: asPriority(dto?.priority),
    severity: dto?.severity as TaskVm["severity"] | undefined,

    storyPoints: story,
    estimateHours: est,
    remainingHours: rem,
    dueDate: dto?.dueDate ? iso(dto.dueDate) : undefined,

    sprintId: dto?.sprintId ?? dto?.weekId ?? null,
    workflowStatusId: statusIdFinal,
    statusCode: metaFinal?.code ?? codeGuess,
    statusCategory: metaFinal?.category ?? inferCategory(codeGuess),
    StatusName: metaFinal?.name ?? "",

    assignees: Array.isArray(dto?.assignees)
      ? dto.assignees.map(toMember)
      : dto?.assignee
      ? [toMember(dto.assignee)]
      : [],
    dependsOn: Array.isArray(dto?.dependsOn)
      ? dto.dependsOn.map(String)
      : [],
    parentTaskId: dto?.parentTaskId ?? null,
    carryOverCount: Number(dto?.carryOverCount ?? 0) || 0,

    openedAt: iso(openedAtRaw),
    updatedAt: iso(updatedAtRaw),
    createdAt: iso(createdAtRaw),

    ticketId,
    ticketName: ticketCode,
    sourceTicketId: ticketId,
    sourceTicketCode: ticketId ? ticketCode : null,
  };

  return vm;
}

/* ===========================================================
 * Chuẩn hoá input board
 * =========================================================== */
export function normalizeBoardInput(
  input: Any
): { sprints: SprintVm[]; tasks: TaskVm[] } {
  const rawSprints: Any[] = input?.sprints ?? input?.weeks ?? [];
  const rawTasks: Any[] = input?.tasks ?? [];

  // 🔹 workflow board trả ở root
  const wf: Any | undefined = input?.workflow;

  // map sprint trước (có workflow)
  const sprints: SprintVm[] = rawSprints.map((dto: Any) => {
    // Nếu sprint chưa có statusOrder/statusMeta riêng
    // nhưng có workflowId trùng với workflow root -> bơm meta từ workflow vào
  if (
      wf &&
      dto?.workflowId &&
      String(dto.workflowId) === String(wf.id) &&
      !dto.statusOrder &&
      !dto.statusMeta
    ) {
      return mapSprint({
        ...dto,
        statusOrder: wf.statusOrder,
        statusMeta: wf.statusMeta,
        transitions: wf.transitions, 
      });
    }

    // Các case còn lại giữ nguyên logic cũ
    return mapSprint(dto);
  });

  const sprintById = new Map<string, SprintVm>(sprints.map(s => [s.id, s]));

  // nếu sprint có embed tasks → gom ra ngoài
  const embedded: Any[] = [];
  rawSprints.forEach(s => {
    if (Array.isArray(s?.tasks)) embedded.push(...s.tasks);
  });

  const allRawTasks = rawTasks.length ? rawTasks : embedded;

  // map task (cần biết sprint để lấy statusMeta)
  const tasks: TaskVm[] = allRawTasks.map((t: Any) => {
    const sid = t?.sprintId ?? t?.weekId ?? null;
    return mapTask(t, sid ? sprintById.get(String(sid)) : undefined);
  });

  // nếu chưa có sprint list nhưng task có sprintId ⇒ sinh sprint “ảo” + workflow mặc định
  if (!sprints.length && tasks.some(t => t.sprintId)) {
    const fakeMap = new Map<string, SprintVm>();
    for (const t of tasks) {
      if (!t.sprintId) continue;
      if (!fakeMap.has(t.sprintId)) {
        const { statusOrder, statusMeta } = defaultStatuses();
        fakeMap.set(t.sprintId, {
          id: t.sprintId,
          name: `Week ${t.sprintId}`,
          statusOrder,
          statusMeta,
          columns: Object.fromEntries(
            statusOrder.map(id => [id, [] as TaskVm[]])
          ),
        } as SprintVm);
      }
    }
    return { sprints: [...fakeMap.values()], tasks };
  }

  return { sprints, tasks };
}

/* ===========================================================
 * Đổ tasks vào sprint.columns (cho các view khác nếu cần)
 * =========================================================== */
export function fillSprintColumns(
  sprints: SprintVm[],
  tasks: TaskVm[]
): SprintVm[] {
  const byId = new Map<string, SprintVm>(
    sprints.map(s => [
      s.id,
      {
        ...s,
        columns: Object.fromEntries(
          s.statusOrder.map(id => [id, [] as TaskVm[]])
        ),
      },
    ])
  );

  for (const t of tasks) {
    if (!t.sprintId) continue;
    const s = byId.get(t.sprintId);
    if (!s) continue;

    // statusId hợp lệ? nếu không, đẩy về start (isStart) rồi mới tới cột đầu
    const fallbackStart = getStartStatusId(s);
    const stId = s.statusMeta[t.workflowStatusId]
      ? t.workflowStatusId
      : fallbackStart || s.statusOrder[0];

    (s.columns[stId] ||= []).push(t);
  }

  return [...byId.values()];
}
