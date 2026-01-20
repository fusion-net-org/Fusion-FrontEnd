// src/components/workflow/WorkflowDesigner.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  Handle,
  useEdgesState,
  useNodesState,
} from "reactflow";
import type {
  Node,
  Edge,
  NodeProps,
  Connection,
  NodeTypes as RFNodeTypes,
  Edge as RFEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Plus,
  Save,
  RotateCcw,
  Trash2,
  Play,
  CheckCircle2,
  Link2,
  Inbox,
  XCircle,
  Lock,
} from "lucide-react";
import type { DesignerDto, StatusVm, TransitionVm, TransitionType } from "@/types/workflow";
import { toast } from "react-toastify";

const uid = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2);

/** ===== System helpers ===== */
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const getSystemKey = (st: any) => norm(st?.systemKey ?? st?.name);
const isBacklogStatus = (st: any) => getSystemKey(st) === "backlog";
const isCloseStatus = (st: any) => getSystemKey(st) === "close";
const isSystemStatusVm = (st: any) =>
  !!st && (!!st.locked || isBacklogStatus(st) || isCloseStatus(st));

/** Edge kind includes system */
type EdgeKind = TransitionType | "system";

const EDGE_COLORS: Record<EdgeKind, string> = {
  success: "#10b981",
  failure: "#ef4444",
  optional: "#111827",
  system: "#f59e0b",
};

const EDGE_LABEL: Record<EdgeKind, string> = {
  success: "Success",
  failure: "Fail",
  optional: "Optional",
  system: "System",
};

export type EdgeData = {
  type: EdgeKind;
  roleNames?: string[];
  rule?: string;
  label?: string;
  enforceTransitions?: boolean; // only meaningful for non-system + non-failure
  locked?: boolean; // system edge lock
};

/** ===== Enforce rules (UI + validate)
 * - Enforce KHÔNG còn ràng buộc topology (không chặn nhiều incoming vào 1 node).
 * - Không enforce được failure.
 * - System edges locked và không cho sửa/xóa.
 */
const getEdgeType = (e: Edge<EdgeData> | { data?: EdgeData }): EdgeKind =>
  (((e as any)?.data?.type ?? "optional") as EdgeKind);

const isSystemEdge = (e: Edge<EdgeData> | { data?: EdgeData }) =>
  getEdgeType(e) === "system" || !!(e as any)?.data?.locked;

const isFailureEdge = (e: Edge<EdgeData> | { data?: EdgeData }) =>
  getEdgeType(e) === "failure";

const isDuplicateEdge = (edges: Edge<EdgeData>[], source: string, target: string) =>
  edges.some((e) => String(e.source) === source && String(e.target) === target);

/** ===== Validate designer (when saving) ===== */
const validateDesigner = (p: DesignerDto) => {
  const name = (p.workflow?.name ?? "").trim();
  if (!name) return "Workflow name is required.";

  const statuses = (p.statuses ?? []) as any[];
  const transitions = (p.transitions ?? []) as any[];
  if (!statuses.length) return "Workflow must have at least 1 status.";

  const backlog = statuses.find(isBacklogStatus);
  const close = statuses.find(isCloseStatus);
  const backlogId = backlog?.id ? String(backlog.id) : null;
  const closeId = close?.id ? String(close.id) : null;

  if (!backlogId) return 'Workflow must contain a "Backlog" system status.';
  if (!closeId) return 'Workflow must contain a "Close" system status.';

  const normalStatuses = statuses.filter((s) => !isSystemStatusVm(s));
  if (!normalStatuses.length) return "Workflow must have at least 1 normal status.";

  const starts = normalStatuses.filter((s) => !!s.isStart);
  const ends = normalStatuses.filter((s) => !!s.isEnd);
  if (starts.length !== 1) return "A workflow must have exactly one Start status.";
  if (ends.length !== 1) return "A workflow must have exactly one End status.";
  if (String(starts[0].id) === String(ends[0].id))
    return "Start and End cannot be the same status.";

  const startId = String(starts[0].id);
  const endId = String(ends[0].id);

  const statusIds = new Set(statuses.map((s) => String(s.id)));

  // Must have system edges:
  const hasBacklogToStart = transitions.some((t) => {
    const from = String(t.fromStatusId);
    const to = String(t.toStatusId);
    const kind = (t.type ?? "optional") as EdgeKind;
    const sys = kind === "system" || !!t.locked;
    return sys && from === backlogId && to === startId;
  });
  if (!hasBacklogToStart) return 'Missing system transition: "Backlog" → "Start".';

  const hasEndToClose = transitions.some((t) => {
    const from = String(t.fromStatusId);
    const to = String(t.toStatusId);
    const kind = (t.type ?? "optional") as EdgeKind;
    const sys = kind === "system" || !!t.locked;
    return sys && from === endId && to === closeId;
  });
  if (!hasEndToClose) return 'Missing system transition: "End" → "Close".';

  // degree counters
  const inAll = new Map<string, number>();
  const outAll = new Map<string, number>();
  const inNonFail = new Map<string, number>();
  const outNonFail = new Map<string, number>();

  for (const s of statuses) {
    const id = String(s.id);
    inAll.set(id, 0);
    outAll.set(id, 0);
    inNonFail.set(id, 0);
    outNonFail.set(id, 0);
  }

  const adjAll = new Map<string, string[]>();
  const revAll = new Map<string, string[]>();
  const adjNonFail = new Map<string, string[]>();

  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const a = m.get(k);
    if (a) a.push(v);
    else m.set(k, [v]);
  };

  const seen = new Set<string>();

  for (const tr of transitions) {
    const from = String(tr.fromStatusId);
    const to = String(tr.toStatusId);
    const type = ((tr.type ?? "optional") as EdgeKind);
    const sys = type === "system" || !!tr.locked;

    if (!statusIds.has(from)) return `Transition has invalid fromStatusId: ${from}.`;
    if (!statusIds.has(to)) return `Transition has invalid toStatusId: ${to}.`;

    if (from === to) {
      const n = statuses.find((s) => String(s.id) === from)?.name ?? from;
      return `Self-loop transition is not allowed on "${n}".`;
    }

    const key = `${from}|${to}`;
    if (seen.has(key)) return "Duplicate transition is not allowed.";
    seen.add(key);

    // System node rules
    if (to === backlogId) return 'Backlog cannot have incoming transitions.';
    if (from === closeId) return 'Close cannot have outgoing transitions.';

    // Start/End rules
    if (to === startId) {
      if (!(sys && from === backlogId)) {
        return "Start status cannot have incoming transitions (except Backlog → Start).";
      }
    }
    if (from === endId) {
      if (!(sys && to === closeId)) {
        return "End status cannot have outgoing transitions (except End → Close).";
      }
    }

    // Enforce rules
    if (type === "failure" && tr.enforceTransitions) return "Cannot enforce a Fail transition.";
    if (sys && type === "failure") return "System transition cannot be Fail.";

    // counts ALL edges
    outAll.set(from, (outAll.get(from) ?? 0) + 1);
    inAll.set(to, (inAll.get(to) ?? 0) + 1);
    push(adjAll, from, to);
    push(revAll, to, from);

    // counts NON-failure edges (system counts as non-failure)
    if (type !== "failure") {
      outNonFail.set(from, (outNonFail.get(from) ?? 0) + 1);
      inNonFail.set(to, (inNonFail.get(to) ?? 0) + 1);
      push(adjNonFail, from, to);
    }
  }

  if ((outNonFail.get(startId) ?? 0) < 1) {
    const n = statuses.find((s) => String(s.id) === startId)?.name ?? "Start";
    return `Start status "${n}" must have at least 1 outgoing transition (non-failure).`;
  }

  if ((inNonFail.get(endId) ?? 0) < 1) {
    const n = statuses.find((s) => String(s.id) === endId)?.name ?? "End";
    return `End status "${n}" must have at least 1 incoming transition (non-failure).`;
  }

  // Node must not be "open"
  for (const s of statuses) {
    const id = String(s.id);
    const n = s.name ?? id;
    if (id === backlogId || id === closeId) continue;

    if (id !== startId && (inAll.get(id) ?? 0) < 1) return `Status "${n}" must have at least 1 incoming transition.`;
    if (id !== endId && (outAll.get(id) ?? 0) < 1) return `Status "${n}" must have at least 1 outgoing transition.`;
    if (id !== endId && (outNonFail.get(id) ?? 0) < 1)
      return `Status "${n}" must have at least 1 outgoing transition (non-failure).`;
  }

  const bfs = (start: string, adj: Map<string, string[]>) => {
    const visited = new Set<string>();
    const q: string[] = [start];
    visited.add(start);
    while (q.length) {
      const u = q.shift()!;
      const ns = adj.get(u) ?? [];
      for (const v of ns) {
        if (!visited.has(v)) {
          visited.add(v);
          q.push(v);
        }
      }
    }
    return visited;
  };

  // Reachable from Start (Backlog can be unreachable)
  const reachableAll = bfs(startId, adjAll);
  const unreachable = statuses
    .map((s) => String(s.id))
    .filter((id) => id !== backlogId && !reachableAll.has(id));
  if (unreachable.length) {
    const n = statuses.find((s) => String(s.id) === unreachable[0])?.name ?? unreachable[0];
    return `Unreachable status from Start: "${n}".`;
  }

  // Can reach End (Close is after End)
  const canReachEndAll = bfs(endId, revAll);
  const stuck = statuses
    .map((s) => String(s.id))
    .filter((id) => id !== closeId && !canReachEndAll.has(id));
  if (stuck.length) {
    const n = statuses.find((s) => String(s.id) === stuck[0])?.name ?? stuck[0];
    return `Status cannot reach End: "${n}". Add an outgoing path leading to End.`;
  }

  // Must have NON-failure path Start -> End
  const reachableNonFail = bfs(startId, adjNonFail);
  if (!reachableNonFail.has(endId)) {
    const sn = statuses.find((s) => String(s.id) === startId)?.name ?? "Start";
    const en = statuses.find((s) => String(s.id) === endId)?.name ?? "End";
    return `No valid non-failure path from "${sn}" to "${en}". (Success/Optional must lead to End)`;
  }

  return null;
};

const hexToRgba = (hex?: string | null, alpha = 0.18) => {
  if (!hex) return "rgba(156,163,175,0.18)";
  try {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return "rgba(156,163,175,0.18)";
  }
};

const makeEdge = (t: any, showLabels: boolean): Edge<EdgeData> => {
  const kind: EdgeKind = ((t?.type ?? "optional") as EdgeKind);
  const sys = kind === "system" || !!t?.locked;

  const color = sys ? EDGE_COLORS.system : EDGE_COLORS[kind];
  const label = sys ? undefined : showLabels ? (t.label || EDGE_LABEL[kind]) : undefined;

  return {
    id: `e-${t.fromStatusId}-${t.toStatusId}`,
    source: t.fromStatusId,
    target: t.toStatusId,
    animated: sys,
    style: sys ? { stroke: color, strokeWidth: 2, strokeDasharray: "8 6" } : { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
    label,
    selectable: !sys,
    deletable: !sys,
    data: {
      type: sys ? "system" : kind,
      roleNames: t.roleNames ?? [],
      rule: t.rule ?? undefined,
      label: t.label ?? undefined,
      enforceTransitions: sys ? true : (t.enforceTransitions ?? false),
      locked: sys ? true : (t.locked ?? false),
    },
  };
};

const withLabels = (show: boolean, es: Edge<EdgeData>[]) =>
  es.map((e) => {
    const k: EdgeKind = (e.data?.type as EdgeKind) ?? "optional";
    if (k === "system" || e.data?.locked) return { ...e, label: undefined } as Edge<EdgeData>;
    return { ...e, label: show ? e.data?.label || EDGE_LABEL[k] : undefined } as Edge<EdgeData>;
  });

/** Node card */
type StatusNodeData = {
  status: StatusVm;
  onEdit: (id: string, patch: Partial<StatusVm>) => void;
};

/** ===== NORMAL node ===== */
const StatusNode: React.FC<NodeProps<StatusNodeData>> = ({ data, selected }) => {
  const st: any = data.status;
  const accent = st.color || "#9ca3af";

  return (
    <div
      className={`rounded-xl border shadow-sm w-[220px] bg-white relative ${
        selected ? "ring-2 ring-emerald-500" : ""
      }`}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ background: accent, opacity: 0.9 }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          left: -8,
          background: "#fff",
          border: "1px solid #e5e7eb",
          width: 14,
          height: 14,
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          right: -8,
          background: "#fff",
          border: "1px solid #e5e7eb",
          width: 14,
          height: 14,
        }}
      />

      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
          <div className="font-semibold truncate max-w-[140px]">{st.name}</div>
        </div>
        <div className="flex gap-1 opacity-90 text-gray-700">
          {st.isStart && <Play size={16} />}
          {st.isEnd && <CheckCircle2 size={16} />}
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide font-medium mb-1 opacity-70">
          Assigned Roles
        </div>
        <div className="flex flex-wrap gap-1 min-h-[26px]">
          {(st.roles?.length ?? 0) > 0 ? (
            st.roles!.map((r: string, i: number) => (
              <span
                key={`${r}-${i}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-white/70 shadow-sm"
              >
                {r}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No roles</span>
          )}
        </div>
      </div>
    </div>
  );
};

/** ===== SYSTEM node (Backlog / Close) =====
 * yêu cầu: "hình khác", "không cần chú thích", chỉ hiển thị UI.
 */
const SystemNode: React.FC<NodeProps<StatusNodeData>> = ({ data, selected }) => {
  const st: any = data.status;
  const isBacklog = isBacklogStatus(st);
  const isClose = isCloseStatus(st);

  const border = isBacklog ? "#f59e0b" : "#9ca3af"; // Close gray
  const bg = isBacklog ? "rgba(245,158,11,0.10)" : "rgba(156,163,175,0.12)";
  const Icon = isBacklog ? Inbox : XCircle;

  return (
    <div
      className={`rounded-2xl border-2 shadow-sm w-[220px] bg-white relative ${
        selected ? "ring-2 ring-offset-1" : ""
      }`}
      style={{
        borderColor: border,
        background: bg,
        ...(selected ? { boxShadow: "0 0 0 2px rgba(0,0,0,0.08)" } : {}),
      }}
    >
      {/* Backlog chỉ có source, Close chỉ có target */}
      {isBacklog && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            right: -8,
            background: "#fff",
            border: `2px solid ${border}`,
            width: 14,
            height: 14,
          }}
        />
      )}

      {isClose && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            left: -8,
            background: "#fff",
            border: `2px solid ${border}`,
            width: 14,
            height: 14,
          }}
        />
      )}

      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={16} style={{ color: border }} />
          <div className="font-semibold truncate">{isBacklog ? "Backlog" : "Close"}</div>
        </div>
        <div className="inline-flex items-center gap-1 text-xs text-gray-700">
          <Lock size={14} />
        </div>
      </div>
    </div>
  );
};


const nodeTypes: RFNodeTypes = { statusNode: StatusNode, systemNode: SystemNode };

/** Tags input (tiny) */
const TagsInput: React.FC<{
  value: string[];
  onChange: (n: string[]) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setText("");
  };

  const remove = (i: number) => {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className="border rounded-lg px-2 py-2 text-sm">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border"
          >
            {t}
            <button className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => remove(i)}>
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        className="outline-none w-full"
        value={text}
        placeholder={placeholder || "Type and press Enter"}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => {
          setIsComposing(false);
          setText((e.target as HTMLInputElement).value);
        }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          const composing = (e as any).nativeEvent?.isComposing || isComposing;
          if (composing) return;
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          }
          if (e.key === "Backspace" && !text && value.length) {
            remove(value.length - 1);
          }
        }}
      />
    </div>
  );
};

/** ===== Status panel ===== */
type StatusPanelProps = {
  status: StatusVm;
  onEditStatus: (id: string, patch: Partial<StatusVm>) => void;
  onDeleteStatus: (id: string) => void;
};

const StatusPanel: React.FC<StatusPanelProps> = ({ status, onEditStatus, onDeleteStatus }) => {
  const st: any = status;
  const [nameDraft, setNameDraft] = useState(status.name ?? "");
  const isSystem = isSystemStatusVm(st);

  useEffect(() => setNameDraft(status.name ?? ""), [status.id, status.name]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Status</div>

      {isSystem && (
        <div className="rounded-lg border px-3 py-2 text-sm bg-amber-50/60">
          <div className="flex items-center gap-2 font-medium">
            <Lock size={16} />
            System status
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Name</label>
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={nameDraft}
          disabled={isSystem}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => !isSystem && onEditStatus(status.id, { name: nameDraft })}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Accent color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={status.color || "#9ca3af"}
            disabled={isSystem}
            onChange={(e) => !isSystem && onEditStatus(status.id, { color: e.target.value })}
          />
          <input
            className="border rounded px-2 py-1 text-xs w-[120px]"
            value={status.color || "#9ca3af"}
            disabled={isSystem}
            onChange={(e) => !isSystem && onEditStatus(status.id, { color: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-600"
            checked={!!status.isStart}
            disabled={isSystem}
            onChange={(e) => !isSystem && onEditStatus(status.id, { isStart: e.target.checked })}
          />
          Start
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-600"
            checked={!!status.isEnd}
            disabled={isSystem}
            onChange={(e) => !isSystem && onEditStatus(status.id, { isEnd: e.target.checked })}
          />
          End
        </label>
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Assign roles</label>
        <TagsInput
          value={status.roles || []}
          onChange={(next) => !isSystem && onEditStatus(status.id, { roles: next })}
          placeholder="Type a role and press Enter"
        />
      </div>

      <div className="pt-2 border-t flex items-center justify-between">
        {!isSystem ? (
          <button
            onClick={() => onDeleteStatus(status.id)}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
          >
            <Trash2 size={16} />
            Delete status
          </button>
        ) : (
          <div className="text-xs text-gray-500">System status cannot be deleted.</div>
        )}
        <div className="text-xs text-gray-400">ID: {status.id.slice(0, 8)}...</div>
      </div>
    </div>
  );
};

/** ===== Edge panel ===== */
type EdgePanelProps = {
  edge: Edge<EdgeData>;
  dto: DesignerDto;
  showLabels: boolean;
  onUpdateEdge: (
    edge: Edge<EdgeData>,
    patch: Partial<{
      type: TransitionType;
      label: string;
      rule: string;
      roleNames: string[];
      enforceTransitions: boolean;
    }>
  ) => void;
  onDeleteEdge: (edge: Edge<EdgeData>) => void;
};

const EdgePanel: React.FC<EdgePanelProps> = ({ edge, dto, showLabels, onUpdateEdge, onDeleteEdge }) => {
  const kind: EdgeKind = (edge.data?.type ?? "optional") as EdgeKind;
  const sys = kind === "system" || edge.data?.locked;

  const fromName = dto.statuses.find((s) => s.id === edge.source)?.name || (edge.source as string);
  const toName = dto.statuses.find((s) => s.id === edge.target)?.name || (edge.target as string);

  if (sys) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold">Transition</div>
        <div className="rounded-lg border px-3 py-2 text-sm bg-amber-50/60">
          <div className="flex items-center gap-2 font-medium">
            <Lock size={16} />
            System transition
          </div>
        </div>
        <div className="text-xs text-gray-500">From</div>
        <div className="text-sm font-medium">{fromName}</div>
        <div className="text-xs text-gray-500">To</div>
        <div className="text-sm font-medium">{toName}</div>
      </div>
    );
  }

  const type: TransitionType = (edge.data?.type as any) ?? "optional";
  const edgeData: Partial<EdgeData> = edge.data ?? {};
  const [labelDraft, setLabelDraft] = useState<string>(edgeData.label ?? "");
  const [ruleDraft, setRuleDraft] = useState<string>(edgeData.rule ?? "");

  useEffect(() => {
    setLabelDraft(edgeData.label ?? "");
    setRuleDraft(edgeData.rule ?? "");
  }, [edge.id, edgeData.label, edgeData.rule]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Transition</div>
      <div className="text-xs text-gray-500">From</div>
      <div className="text-sm font-medium">{fromName}</div>
      <div className="text-xs text-gray-500">To</div>
      <div className="text-sm font-medium">{toName}</div>

      <div className="grid gap-2 mt-2">
        <label className="text-xs text-gray-500">Type</label>
        <div className="flex gap-2">
          {(["success", "failure", "optional"] as TransitionType[]).map((t) => (
            <button
              key={t}
              className={`px-3 py-1.5 rounded-lg text-sm border inline-flex items-center gap-2 ${
                type === t ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => onUpdateEdge(edge, { type: t })}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS[t] }} />
              {EDGE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Label (optional)</label>
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={labelDraft}
          placeholder={EDGE_LABEL[type]}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={() => onUpdateEdge(edge, { label: labelDraft })}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Guard/Rule</label>
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={ruleDraft}
          onChange={(e) => setRuleDraft(e.target.value)}
          onBlur={() => onUpdateEdge(edge, { rule: ruleDraft })}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Roles allowed</label>
        <TagsInput
          value={edgeData.roleNames || []}
          onChange={(next) => onUpdateEdge(edge, { roleNames: next })}
          placeholder="Type a role and press Enter"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Enforce</label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-600"
            checked={!!edgeData.enforceTransitions}
            onChange={(e) => onUpdateEdge(edge, { enforceTransitions: e.target.checked })}
          />
          Enforce this transition
        </label>
        {type === "failure" && <div className="text-xs text-amber-600">Fail transitions cannot be enforced.</div>}
      </div>

      <div className="pt-2 border-t flex items-center justify-between">
        <button
          onClick={() => onDeleteEdge(edge)}
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
        >
          <Trash2 size={16} />
          Delete transition
        </button>
      </div>
    </div>
  );
};

/** ===== System-node layout (UI only, not saved)
 * yêu cầu: backlog/close không khóa 1 chỗ, mà "giữ khoảng cách" theo Start/End.
 */
const SYSTEM_GAP_X = 260; // distance from Start/End
const SYSTEM_GAP_Y = 0;

const placeSystemNodesUIOnly = (
  nodes: Node<StatusNodeData>[],
  statuses: StatusVm[]
): Node<StatusNodeData>[] => {
  const backlogId = statuses.find(isBacklogStatus)?.id ? String(statuses.find(isBacklogStatus)!.id) : null;
  const closeId = statuses.find(isCloseStatus)?.id ? String(statuses.find(isCloseStatus)!.id) : null;

  const startId = statuses.find((s: any) => !!s.isStart && !isSystemStatusVm(s))?.id
    ? String(statuses.find((s: any) => !!s.isStart && !isSystemStatusVm(s))!.id)
    : null;

  const endId = statuses.find((s: any) => !!s.isEnd && !isSystemStatusVm(s))?.id
    ? String(statuses.find((s: any) => !!s.isEnd && !isSystemStatusVm(s))!.id)
    : null;

  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const startNode = startId ? byId.get(startId) : undefined;
  const endNode = endId ? byId.get(endId) : undefined;

  return nodes.map((n) => {
    const id = String(n.id);

    if (backlogId && id === backlogId && startNode) {
      return {
        ...n,
        position: {
          x: Math.round(startNode.position.x - SYSTEM_GAP_X),
          y: Math.round(startNode.position.y + SYSTEM_GAP_Y),
        },
      };
    }

    if (closeId && id === closeId && endNode) {
      return {
        ...n,
        position: {
          x: Math.round(endNode.position.x + SYSTEM_GAP_X),
          y: Math.round(endNode.position.y + SYSTEM_GAP_Y),
        },
      };
    }

    return n;
  });
};

/** ===== Main designer ===== */
export type WorkflowDesignerProps = {
  initialDto: DesignerDto;
  onSave: (payload: DesignerDto) => Promise<void>;
  title?: string;
  externalSaving?: boolean;
};

export default function WorkflowDesigner({
  initialDto,
  onSave,
  title = "Workflow designer",
  externalSaving,
}: WorkflowDesignerProps) {
  const [dto, setDto] = useState<DesignerDto>(initialDto);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [edgeMode, setEdgeMode] = useState<TransitionType>("success");

  const [nodes, setNodes, onNodesChange] = useNodesState<StatusNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>([]);

  // latest edges
  const edgesRef = useRef<Edge<EdgeData>[]>([]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const selectedEdge = useMemo(
    () => edges.find((e): e is Edge<EdgeData> => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  const selectedStatus = useMemo(
    () => (dto?.statuses ?? []).find((s) => s.id === selectedNodeId) ?? null,
    [dto?.statuses, selectedNodeId]
  );

  const systemIds = useMemo(() => {
    const sts: any[] = (dto.statuses ?? []) as any[];
    const b = sts.find(isBacklogStatus);
    const c = sts.find(isCloseStatus);
    return {
      backlogId: b?.id ? String(b.id) : null,
      closeId: c?.id ? String(c.id) : null,
    };
  }, [dto.statuses]);

  const isSystemNodeId = useCallback(
    (id?: string | null) => {
      if (!id) return false;
      const sid = String(id);
      if (systemIds.backlogId && sid === systemIds.backlogId) return true;
      if (systemIds.closeId && sid === systemIds.closeId) return true;
      const st: any = (dto.statuses ?? []).find((x: any) => String(x.id) === sid);
      return !!st?.locked;
    },
    [systemIds.backlogId, systemIds.closeId, dto.statuses]
  );

  const getStartId = useCallback(() => {
    const s: any = (dto.statuses ?? []).find((x: any) => !!x.isStart && !isSystemStatusVm(x));
    return s?.id ? String(s.id) : null;
  }, [dto.statuses]);

  const getEndId = useCallback(() => {
    const s: any = (dto.statuses ?? []).find((x: any) => !!x.isEnd && !isSystemStatusVm(x));
    return s?.id ? String(s.id) : null;
  }, [dto.statuses]);

  const syncSystemNodes = useCallback(
    (nextStatuses?: StatusVm[]) => {
      const sts = (nextStatuses ?? dto.statuses) as StatusVm[];
      setNodes((ns) => placeSystemNodesUIOnly(ns, sts));
    },
    [dto.statuses, setNodes]
  );

  const ensureSystemEdges = useCallback(
    (nextStatuses: any[]) => {
      const startId = nextStatuses.find((s: any) => !!s.isStart && !isSystemStatusVm(s))?.id
        ? String(nextStatuses.find((s: any) => !!s.isStart && !isSystemStatusVm(s))!.id)
        : null;
      const endId = nextStatuses.find((s: any) => !!s.isEnd && !isSystemStatusVm(s))?.id
        ? String(nextStatuses.find((s: any) => !!s.isEnd && !isSystemStatusVm(s))!.id)
        : null;

      const backlogId = nextStatuses.find(isBacklogStatus)?.id ? String(nextStatuses.find(isBacklogStatus)!.id) : null;
      const closeId = nextStatuses.find(isCloseStatus)?.id ? String(nextStatuses.find(isCloseStatus)!.id) : null;

      // UI edges
      setEdges((es) => {
        let next = [...es];

        // Remove all into backlog & all out of close
        if (backlogId) next = next.filter((e) => String(e.target) !== backlogId);
        if (closeId) next = next.filter((e) => String(e.source) !== closeId);

        // Start incoming only backlog->start system
        if (startId) {
          next = next.filter((e) => {
            if (String(e.target) !== startId) return true;
            return backlogId && String(e.source) === backlogId && isSystemEdge(e);
          });
        }

        // End outgoing only end->close system
        if (endId) {
          next = next.filter((e) => {
            if (String(e.source) !== endId) return true;
            return closeId && String(e.target) === closeId && isSystemEdge(e);
          });
        }

        // Keep only one backlog->start system
        if (backlogId) {
          next = next.filter((e) => {
            if (String(e.source) !== backlogId) return true;
            if (!isSystemEdge(e)) return true;
            return startId ? String(e.target) === startId : false;
          });
        }

        // Keep only one end->close system
        if (closeId) {
          next = next.filter((e) => {
            if (String(e.target) !== closeId) return true;
            if (!isSystemEdge(e)) return true;
            return endId ? String(e.source) === endId : false;
          });
        }

        // Ensure backlog->start
        if (backlogId && startId) {
          const exists = next.some((e) => String(e.source) === backlogId && String(e.target) === startId && isSystemEdge(e));
          if (!exists) {
            next.unshift(
              makeEdge(
                { fromStatusId: backlogId, toStatusId: startId, type: "system", label: "", enforceTransitions: true, locked: true },
                false
              )
            );
          }
        }

        // Ensure end->close
        if (endId && closeId) {
          const exists = next.some((e) => String(e.source) === endId && String(e.target) === closeId && isSystemEdge(e));
          if (!exists) {
            next.push(
              makeEdge(
                { fromStatusId: endId, toStatusId: closeId, type: "system", label: "", enforceTransitions: true, locked: true },
                false
              )
            );
          }
        }

        return next;
      });

      // DTO transitions (keep in sync)
      setDto((prev) => {
        let nextTransitions: any[] = [...(prev.transitions as any[])];

        if (backlogId) nextTransitions = nextTransitions.filter((t) => String(t.toStatusId) !== backlogId);
        if (closeId) nextTransitions = nextTransitions.filter((t) => String(t.fromStatusId) !== closeId);

        if (startId) {
          nextTransitions = nextTransitions.filter((t) => {
            if (String(t.toStatusId) !== startId) return true;
            const kind = (t.type ?? "optional") as EdgeKind;
            const sys = kind === "system" || !!t.locked;
            return backlogId ? (sys && String(t.fromStatusId) === backlogId) : false;
          });
        }

        if (endId) {
          nextTransitions = nextTransitions.filter((t) => {
            if (String(t.fromStatusId) !== endId) return true;
            const kind = (t.type ?? "optional") as EdgeKind;
            const sys = kind === "system" || !!t.locked;
            return closeId ? (sys && String(t.toStatusId) === closeId) : false;
          });
        }

        // Keep only one backlog->start system
        if (backlogId) {
          nextTransitions = nextTransitions.filter((t) => {
            if (String(t.fromStatusId) !== backlogId) return true;
            const kind = (t.type ?? "optional") as EdgeKind;
            const sys = kind === "system" || !!t.locked;
            if (!sys) return true;
            return startId ? String(t.toStatusId) === startId : false;
          });
        }

        // Keep only one end->close system
        if (closeId) {
          nextTransitions = nextTransitions.filter((t) => {
            if (String(t.toStatusId) !== closeId) return true;
            const kind = (t.type ?? "optional") as EdgeKind;
            const sys = kind === "system" || !!t.locked;
            if (!sys) return true;
            return endId ? String(t.fromStatusId) === endId : false;
          });
        }

        if (backlogId && startId) {
          const exists = nextTransitions.some(
            (t) =>
              String(t.fromStatusId) === backlogId &&
              String(t.toStatusId) === startId &&
              ((((t.type ?? "optional") as EdgeKind) === "system") || !!t.locked)
          );
          if (!exists) {
            nextTransitions.unshift({
              fromStatusId: backlogId,
              toStatusId: startId,
              type: "system",
              label: "",
              enforceTransitions: true,
              locked: true,
            });
          }
        }

        if (endId && closeId) {
          const exists = nextTransitions.some(
            (t) =>
              String(t.fromStatusId) === endId &&
              String(t.toStatusId) === closeId &&
              ((((t.type ?? "optional") as EdgeKind) === "system") || !!t.locked)
          );
          if (!exists) {
            nextTransitions.push({
              fromStatusId: endId,
              toStatusId: closeId,
              type: "system",
              label: "",
              enforceTransitions: true,
              locked: true,
            });
          }
        }

        return { ...prev, transitions: nextTransitions };
      });
    },
    [setEdges, setDto]
  );

  const handleEditStatus = useCallback(
    (id: string, patch: Partial<StatusVm>) => {
      if (isSystemNodeId(id)) {
        toast.info("This is a system status and cannot be edited.");
        return;
      }

      setDto((prev) => {
        let nextStatuses: any[] = prev.statuses.map((s: any) => (s.id === id ? { ...s, ...patch } : s));

        if (patch.isStart === true) {
          nextStatuses = nextStatuses.map((s: any) => {
            if (s.id === id) return { ...s, isStart: true, isEnd: false };
            if (isSystemStatusVm(s)) return s;
            return { ...s, isStart: false };
          });
        }

        if (patch.isEnd === true) {
          nextStatuses = nextStatuses.map((s: any) => {
            if (s.id === id) return { ...s, isEnd: true, isStart: false };
            if (isSystemStatusVm(s)) return s;
            return { ...s, isEnd: false };
          });
        }

        // update node data
        setNodes((ns) =>
          ns.map((n) => {
            const st = nextStatuses.find((x) => x.id === n.id);
            if (!st) return n;
            return { ...n, data: { ...(n.data as StatusNodeData), status: st } };
          })
        );

        const touchedStartEnd = patch.isStart !== undefined || patch.isEnd !== undefined;
        const nextDto = { ...prev, statuses: nextStatuses };

        if (touchedStartEnd) {
          ensureSystemEdges(nextStatuses);
          queueMicrotask(() => syncSystemNodes(nextStatuses as any));
        }

        return nextDto;
      });
    },
    [isSystemNodeId, setNodes, ensureSystemEdges, syncSystemNodes]
  );

  /** ===== init graph ===== */
  const buildFromDto = useCallback(
    (d: DesignerDto) => {
      const ns0: Node<StatusNodeData>[] = (d.statuses ?? []).map((s: any) => {
        const sys = isSystemStatusVm(s);
        return {
          id: s.id,
          type: sys ? "systemNode" : "statusNode",
          data: { status: s, onEdit: handleEditStatus },
          position: { x: s.x ?? 200, y: s.y ?? 320 },
          draggable: !sys,
          deletable: !sys,
        };
      });

      const ns = placeSystemNodesUIOnly(ns0, d.statuses as any);
      const es: Edge<EdgeData>[] = (d.transitions ?? []).map((t: any) => makeEdge(t, showLabels));

      return { ns, es };
    },
    [handleEditStatus, showLabels]
  );

  useEffect(() => {
    const { ns, es } = buildFromDto(initialDto);
    setNodes(ns);
    setEdges(es);
    setDto(initialDto);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialDto)]);

  useEffect(() => {
    setEdges((eds) => withLabels(showLabels, eds));
  }, [showLabels, setEdges]);

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: RFEdge[] }) => {
      setSelectedNodeId(selNodes?.[0]?.id ?? null);
      setSelectedEdgeId(selEdges?.[0]?.id ?? null);
    },
    []
  );

  /** ===== Connection rules ===== */
  const isValidConnection = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return false;
      const s = String(c.source);
      const t = String(c.target);
      if (s === t) return false;

      const cur = edgesRef.current;
      if (isDuplicateEdge(cur, s, t)) return false;

      const startId = getStartId();
      const endId = getEndId();
      const backlogId = systemIds.backlogId;
      const closeId = systemIds.closeId;

      if (backlogId && t === backlogId) return false;
      if (closeId && s === closeId) return false;

      if (backlogId && s === backlogId) return !!startId && t === startId;
      if (closeId && t === closeId) return !!endId && s === endId;

      if (startId && t === startId) return !!backlogId && s === backlogId;
      if (endId && s === endId) return !!closeId && t === closeId;

      return true;
    },
    [getStartId, getEndId, systemIds.backlogId, systemIds.closeId]
  );

  /** ===== Edge update (dragging edge endpoints) ===== */
  const onEdgeUpdate = useCallback(
    (oldEdge: Edge<EdgeData>, newConnection: Connection) => {
      if (isSystemEdge(oldEdge)) {
        toast.error("System transition cannot be moved.");
        return;
      }

      const ns = newConnection.source;
      const nt = newConnection.target;
      if (!ns || !nt) return;
      const s = String(ns);
      const t = String(nt);
      if (s === t) return;

      const cur = edgesRef.current;
      const withoutOld = cur.filter((e) => e.id !== oldEdge.id);

      if (isDuplicateEdge(withoutOld, s, t)) {
        toast.error("Duplicate transition is not allowed.");
        return;
      }

      const startId = getStartId();
      const endId = getEndId();
      const backlogId = systemIds.backlogId;
      const closeId = systemIds.closeId;

      if (backlogId && t === backlogId) return toast.error("Cannot connect into Backlog.");
      if (closeId && s === closeId) return toast.error("Close cannot have outgoing transitions.");

      if (backlogId && s === backlogId && (!startId || t !== startId)) return toast.error("Backlog can only connect to Start.");
      if (closeId && t === closeId && (!endId || s !== endId)) return toast.error("Only End can connect to Close.");

      if (startId && t === startId && (!backlogId || s !== backlogId)) return toast.error("Start can only receive from Backlog.");
      if (endId && s === endId && (!closeId || t !== closeId)) return toast.error("End can only connect to Close.");

      const oldKind = (oldEdge.data?.type ?? "optional") as EdgeKind;
      const nextData =
        oldKind === "failure" ? { ...oldEdge.data, enforceTransitions: false } : oldEdge.data;

      setEdges((es) =>
        es.map((e) => {
          if (e.id !== oldEdge.id) return e;
          return { ...e, source: s, target: t, data: nextData } as Edge<EdgeData>;
        })
      );

      setDto((prev) => {
        const i = prev.transitions.findIndex(
          (tr: any) => tr.fromStatusId === (oldEdge.source as any) && tr.toStatusId === (oldEdge.target as any)
        );
        if (i === -1) return prev;
        const next: any = { ...prev, transitions: [...(prev.transitions as any[])] };
        next.transitions[i] = {
          ...next.transitions[i],
          fromStatusId: s,
          toStatusId: t,
          ...(oldKind === "failure" ? { enforceTransitions: false } : {}),
        };
        return next;
      });
    },
    [getStartId, getEndId, systemIds.backlogId, systemIds.closeId]
  );

  /** ===== Add new edge ===== */
  const handleConnect = useCallback(
    (connection: Connection) => {
      const s0 = connection.source;
      const t0 = connection.target;
      if (!s0 || !t0) return;

      const s = String(s0);
      const t = String(t0);
      if (s === t) return;

      const cur = edgesRef.current;
      if (isDuplicateEdge(cur, s, t)) {
        toast.error("Duplicate transition is not allowed.");
        return;
      }

      const startId = getStartId();
      const endId = getEndId();
      const backlogId = systemIds.backlogId;
      const closeId = systemIds.closeId;

      if (backlogId && t === backlogId) return;
      if (closeId && s === closeId) return;

      if (backlogId && s === backlogId && (!startId || t !== startId)) return;
      if (closeId && t === closeId && (!endId || s !== endId)) return;

      if (startId && t === startId && (!backlogId || s !== backlogId)) return;
      if (endId && s === endId && (!closeId || t !== closeId)) return;

      const enforceDefault = edgeMode === "failure" ? false : true;

      const tr: TransitionVm = {
        fromStatusId: s,
        toStatusId: t,
        type: edgeMode,
        label: EDGE_LABEL[edgeMode],
        enforceTransitions: enforceDefault,
      };

      const e = makeEdge(tr, showLabels);
      setEdges((eds) => addEdge(e, eds));
      setDto((prev) => ({ ...prev, transitions: [...prev.transitions, tr] }));
    },
    [edgeMode, showLabels, getStartId, getEndId, systemIds.backlogId, systemIds.closeId]
  );

  /** ===== Drag stop: save positions for normal nodes, then re-place system nodes (UI only) ===== */
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (isSystemNodeId(node.id)) return;

      setDto((prev) => ({
        ...prev,
        statuses: (prev.statuses as any[]).map((s: any) =>
          s.id === node.id ? { ...s, x: Math.round(node.position.x), y: Math.round(node.position.y) } : s
        ),
      }));

      const movedId = String(node.id);
      const startId = getStartId();
      const endId = getEndId();
      if ((startId && movedId === startId) || (endId && movedId === endId)) {
        setNodes((ns) => placeSystemNodesUIOnly(ns, dto.statuses as any));
      }
    },
    [isSystemNodeId, getStartId, getEndId, setNodes, dto.statuses]
  );

  /** ===== delete helpers ===== */
  const deleteNodeById = useCallback(
    (id: string) => {
      if (isSystemNodeId(id)) {
        toast.error("System status cannot be deleted.");
        return;
      }
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
      setDto((prev) => ({
        ...prev,
        statuses: (prev.statuses as any[]).filter((s: any) => s.id !== id),
        transitions: (prev.transitions as any[]).filter((t: any) => t.fromStatusId !== id && t.toStatusId !== id),
      }));
      setSelectedNodeId((cur) => (cur === id ? null : cur));
    },
    [isSystemNodeId, setNodes, setEdges]
  );

  const deleteEdge = useCallback(
    (edgeToDelete: Edge<EdgeData>) => {
      if (isSystemEdge(edgeToDelete)) {
        toast.error("System transition cannot be deleted.");
        return;
      }
      const { id, source, target } = edgeToDelete;
      setEdges((es) => es.filter((e) => e.id !== id));
      setDto((prev) => ({
        ...prev,
        transitions: (prev.transitions as any[]).filter(
          (t: any) => !(String(t.fromStatusId) === String(source) && String(t.toStatusId) === String(target))
        ),
      }));
      setSelectedEdgeId((cur) => (cur === id ? null : cur));
    },
    [setEdges]
  );

  const onEdgesDelete = useCallback((deleted: RFEdge[]) => {
    if (!deleted.length) return;
    const real = (deleted as any[]).filter((d) => !isSystemEdge(d));
    if (!real.length) return;

    setDto((prev) => {
      const rm = new Set(real.map((d) => `${d.source}|${d.target}`));
      return { ...prev, transitions: (prev.transitions as any[]).filter((t: any) => !rm.has(`${t.fromStatusId}|${t.toStatusId}`)) };
    });
  }, []);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (!deleted.length) return;
      const real = deleted.filter((n) => !isSystemNodeId(n.id));
      if (!real.length) return;

      const ids = new Set(real.map((n) => n.id));
      setDto((prev) => ({
        ...prev,
        statuses: (prev.statuses as any[]).filter((s: any) => !ids.has(s.id)),
        transitions: (prev.transitions as any[]).filter((t: any) => !(ids.has(t.fromStatusId) || ids.has(t.toStatusId))),
      }));

      queueMicrotask(() => syncSystemNodes());
    },
    [isSystemNodeId, syncSystemNodes]
  );

  /** ===== delete hotkey ===== */
  useEffect(() => {
    const isTyping = () => {
      const ae = document.activeElement as HTMLElement | null;
      if (!ae) return false;
      const tag = (ae.tagName || "").toLowerCase();
      return tag === "input" || tag === "textarea" || (ae as any).isContentEditable || ae.getAttribute?.("role") === "textbox";
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e as any).isComposing) return;
      if (isTyping()) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedEdgeId) {
          const e0 = edges.find((x) => x.id === selectedEdgeId);
          if (e0) deleteEdge(e0);
        } else if (selectedNodeId) {
          deleteNodeById(selectedNodeId);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEdgeId, selectedNodeId, edges, deleteEdge, deleteNodeById]);

  /** ===== update edge props (type/label/rule/roles/enforce) ===== */
  const handleUpdateEdge = useCallback(
    (
      edge: Edge<EdgeData>,
      patch: Partial<{
        type: TransitionType;
        label: string;
        rule: string;
        roleNames: string[];
        enforceTransitions: boolean;
      }>
    ) => {
      if (isSystemEdge(edge)) {
        toast.error("System transition cannot be edited.");
        return;
      }

      const existingType = (edge.data?.type ?? "optional") as TransitionType;
      const nextType = (patch.type ?? existingType) as TransitionType;

      const wantsEnforce = patch.enforceTransitions;
      const currentEnforce = !!edge.data?.enforceTransitions;
      let nextEnforce = wantsEnforce ?? currentEnforce;

      if (nextType === "failure" && nextEnforce) {
        toast.error("Cannot enforce a Fail transition.");
        nextEnforce = false;
      }

      setEdges((es) =>
        es.map((e) => {
          if (e.id !== edge.id) return e;

          const finalType = (patch.type ?? (e.data?.type ?? "optional")) as TransitionType;
          const color = EDGE_COLORS[finalType];

          const finalEnforce = finalType === "failure" ? false : (nextEnforce ?? false);

          return {
            ...e,
            data: { ...e.data, ...patch, type: finalType, enforceTransitions: finalEnforce },
            style: { ...(e.style || {}), stroke: color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color },
            label: showLabels ? (patch.label ?? e.data?.label ?? EDGE_LABEL[finalType]) : undefined,
          } as Edge<EdgeData>;
        })
      );

      setDto((prev) => {
        const next: any = { ...prev };
        next.transitions = (next.transitions as any[]).map((t: any) =>
          String(t.fromStatusId) === String(edge.source) && String(t.toStatusId) === String(edge.target)
            ? ({
                ...t,
                ...patch,
                type: (patch.type ?? t.type ?? "optional") as TransitionType,
                enforceTransitions: nextType === "failure" ? false : (nextEnforce ?? false),
              } as any)
            : t
        );
        return next;
      });
    },
    [showLabels]
  );

  /** ===== save ===== */
  const handleSave = async () => {
    if (externalSaving) return;

    setSaving(true);
    try {
      const statusById = new Map((dto.statuses ?? []).map((s: any) => [String(s.id), s]));

      const payload: any = {
        ...dto,
        transitions: edges.map((e) => {
          const kind: EdgeKind = (e.data?.type ?? "optional") as EdgeKind;
          const sys = kind === "system" || e.data?.locked;

          return {
            fromStatusId: String(e.source),
            toStatusId: String(e.target),
            type: sys ? "system" : ((kind as any) || "optional"),
            locked: sys ? true : (e.data?.locked ?? false),
            label: sys ? "" : (typeof e.label === "string" ? e.label : e.data?.label),
            rule: sys ? undefined : e.data?.rule,
            roleNames: sys ? [] : (e.data?.roleNames ?? []),
            enforceTransitions: sys ? true : kind === "failure" ? false : (e.data?.enforceTransitions ?? false),
          };
        }),
        statuses: nodes.map((n) => {
          const base: any = statusById.get(String(n.id)) ?? (n.data as any).status ?? {};
          const sys = isSystemStatusVm(base);

          if (sys && base?.x != null && base?.y != null) return base;

          const s: any = (n.data as any).status;
          return { ...base, ...s, x: Math.round(n.position.x), y: Math.round(n.position.y) };
        }),
      } as DesignerDto;

      const err = validateDesigner(payload);
      if (err) {
        toast.error(err);
        return;
      }

      await onSave(payload);
    } catch (e: any) {
      console.error("WorkflowDesigner save failed:", e);
      toast.error(e?.response?.data?.message || e?.message || "Save workflow failed");
    } finally {
      setSaving(false);
    }
  };

  /** ===== reset ===== */
  const resetLocal = () => {
    const { ns, es } = buildFromDto(initialDto);
    setNodes(ns);
    setEdges(es);
    setDto(initialDto);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  /** ===== add status ===== */
  const addStatus = () => {
    const s: any = {
      id: uid(),
      name: "New Status",
      isStart: false,
      isEnd: false,
      x: 200 + Math.random() * 200,
      y: 160 + Math.random() * 180,
      roles: [],
      color: "#6366f1",
    };
    const node: Node<StatusNodeData> = {
      id: s.id,
      type: "statusNode",
      position: { x: s.x, y: s.y },
      data: { status: s, onEdit: handleEditStatus },
    };
    setNodes((ns) => [...ns, node]);
    setDto((prev) => ({ ...prev, statuses: [...prev.statuses, s] }));
  };

  if (loading) {
    return <div className="h-[80vh] grid place-items-center text-gray-500">Loading...</div>;
  }

  const currentColor = EDGE_COLORS[edgeMode];
  const workflowName = dto.workflow?.name ?? "";

  return (
    <div className="h-[calc(100vh-40px)] w-full flex overflow-hidden">
      <div className="flex-1 relative">
        <div className="absolute z-50 left-4 top-3 flex flex-wrap gap-2 items-center bg-white/90 backdrop-blur rounded-xl border shadow px-3 py-2">
          <div className="text-sm text-gray-600">{title}</div>

          <input
            className="ml-2 border rounded-lg px-2 py-1 text-sm"
            value={workflowName}
            onChange={(e) =>
              setDto((prev) => ({
                ...prev,
                workflow: { ...(prev.workflow as any), name: e.target.value },
              }))
            }
            placeholder="Workflow name"
          />

          <div className="mx-2 w-px h-5 bg-gray-200" />

          <button
            onClick={addStatus}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          >
            <Plus size={16} /> Add status
          </button>

          <div className="mx-2 w-px h-5 bg-gray-200" />

          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600 mr-1">Create edge as:</span>
            {(["success", "failure", "optional"] as TransitionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setEdgeMode(t)}
                className={`px-2 py-1 rounded-md border inline-flex items-center gap-2 ${
                  edgeMode === t ? "ring-2 ring-offset-1 ring-gray-900" : ""
                }`}
                title={`New edges will be ${EDGE_LABEL[t]}`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS[t] }} />
                {EDGE_LABEL[t]}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 ml-2">
            <input
              type="checkbox"
              className="accent-emerald-600"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            Show labels
          </label>

          <div className="mx-2 w-px h-5 bg-gray-200" />

          <button
            onClick={handleSave}
            disabled={saving || externalSaving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60 hover:bg-emerald-700"
          >
            <Save size={16} />
            Save
          </button>

          <button
            onClick={resetLocal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Discard
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          onEdgeUpdate={onEdgeUpdate}
          onConnect={handleConnect}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          panOnScroll
          selectionOnDrag
          connectionLineStyle={{ stroke: currentColor, strokeWidth: 2 }}
          connectionMode={ConnectionMode.Loose}
        >
          <Background gap={18} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeBorderRadius={12}
            maskColor="rgba(17,24,39,0.05)"
            nodeColor={(n) => {
              const st: any = (n as any)?.data?.status;
              if (isBacklogStatus(st)) return "rgba(245,158,11,0.15)";
              if (isCloseStatus(st)) return "rgba(251,113,133,0.15)";
              return hexToRgba(st?.color, 0.18);
            }}
            nodeStrokeColor={(n) => {
              const st: any = (n as any)?.data?.status;
              if (isBacklogStatus(st)) return "#f59e0b";
              if (isCloseStatus(st)) return "#fb7185";
              if (!st) return "#cbd5e1";
              if (st.isStart) return "#10b981";
              if (st.isEnd) return "#111827";
              return st.color || "#9ca3af";
            }}
          />
          <Controls position="bottom-right" />
        </ReactFlow>
      </div>

      {/* Properties panel */}
      <aside className="w-[360px] border-l bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Properties</div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.success }} />
              Success
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.failure }} />
              Fail
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.optional }} />
              Optional
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.system }} />
              System
            </div>
          </div>
        </div>

        {selectedStatus && !selectedEdge ? (
          <StatusPanel status={selectedStatus} onEditStatus={handleEditStatus} onDeleteStatus={deleteNodeById} />
        ) : selectedEdge ? (
          <EdgePanel
            edge={selectedEdge}
            dto={dto}
            showLabels={showLabels}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={deleteEdge}
          />
        ) : (
          <div className="text-sm text-gray-500">
            Select a status or an edge to edit its properties. Drag between nodes to add a transition.
            <div className="mt-3 inline-flex items-center gap-2 text-gray-700">
              <Link2 size={16} /> Tip: choose edge type first then connect.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
