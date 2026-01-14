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
} from "lucide-react";
import type {
  DesignerDto,
  StatusVm,
  TransitionVm,
  TransitionType,
} from "@/types/workflow";
import { toast } from "react-toastify";

const uid = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2);

const EDGE_COLORS: Record<TransitionType, string> = {
  success: "#10b981",
  failure: "#ef4444",
  optional: "#111827",
};

const EDGE_LABEL: Record<TransitionType, string> = {
  success: "Success",
  failure: "Fail",
  optional: "Optional",
};

export type EdgeData = {
  type: TransitionType;
  roleNames?: string[];
  rule?: string;
  label?: string;
  enforceTransitions?: boolean; // chỉ có ý nghĩa với non-failure
};

/* =========================
   Enforce rules (business)
   - Fail edges are NOT counted and NOT blocked.
   - If a status has an incoming enforced NON-failure edge => it can have ONLY that 1 incoming non-failure.
   - Cannot enforce a failure edge.
   ========================= */

const getEdgeType = (e: Edge<EdgeData> | { data?: EdgeData }): TransitionType =>
  ((e as any)?.data?.type ?? "optional") as TransitionType;

const isFailureEdge = (e: Edge<EdgeData> | { data?: EdgeData }) =>
  getEdgeType(e) === "failure";

const isEnforcedNonFail = (e: Edge<EdgeData> | { data?: EdgeData }) =>
  !!(e as any)?.data?.enforceTransitions && !isFailureEdge(e);

const outgoingEdges = (
  all: Edge<EdgeData>[],
  sourceId: string,
  opts?: { excludeEdgeId?: string; ignoreFailure?: boolean }
) =>
  all.filter((e) => {
    if (String(e.source) !== String(sourceId)) return false;
    if (opts?.excludeEdgeId && e.id === opts.excludeEdgeId) return false;
    if (opts?.ignoreFailure && isFailureEdge(e)) return false;
    return true;
  });

const hasEnforcedOutgoingNonFail = (
  all: Edge<EdgeData>[],
  sourceId: string,
  opts?: { excludeEdgeId?: string }
) =>
  outgoingEdges(all, sourceId, {
    excludeEdgeId: opts?.excludeEdgeId,
    ignoreFailure: true,
  }).some((e) => isEnforcedNonFail(e));

const isDuplicateEdge = (
  edges: Edge<EdgeData>[],
  source: string,
  target: string
) => edges.some((e) => String(e.source) === source && String(e.target) === target);

const validateDesigner = (p: DesignerDto) => {
  const name = (p.workflow?.name ?? "").trim();
  if (!name) return "Workflow name is required.";

  const statuses = p.statuses ?? [];
  const transitions = p.transitions ?? [];

  if (!statuses.length) return "Workflow must have at least 1 status.";

  const starts = statuses.filter((s) => !!s.isStart);
  const ends = statuses.filter((s) => !!s.isEnd);

  if (starts.length !== 1) return "A workflow must have exactly one Start status.";
  if (ends.length !== 1) return "A workflow must have exactly one End status.";
  if (starts[0].id === ends[0].id) return "Start and End cannot be the same status.";

  const startId = String(starts[0].id);
  const endId = String(ends[0].id);

  const statusIds = new Set(statuses.map((s) => String(s.id)));

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
    const type = (tr.type ?? "optional") as TransitionType;

    if (!statusIds.has(from)) return `Transition has invalid fromStatusId: ${from}.`;
    if (!statusIds.has(to)) return `Transition has invalid toStatusId: ${to}.`;

    if (from === to) {
      const n = statuses.find((s) => String(s.id) === from)?.name ?? from;
      return `Self-loop transition is not allowed on "${n}".`;
    }

    const key = `${from}|${to}`;
    if (seen.has(key)) return "Duplicate transition is not allowed.";
    seen.add(key);

    // Start cannot have incoming (kể cả Fail)
    if (to === startId) return "Start status cannot have incoming transitions.";

    // End cannot have outgoing (kể cả Fail)
    if (from === endId) return "End status cannot have outgoing transitions.";

    // Cannot enforce a failure edge
    if (type === "failure" && tr.enforceTransitions) {
      return "Cannot enforce a Fail transition.";
    }

    // counts ALL edges
    outAll.set(from, (outAll.get(from) ?? 0) + 1);
    inAll.set(to, (inAll.get(to) ?? 0) + 1);

    push(adjAll, from, to);
    push(revAll, to, from);

    // counts NON-failure only (Fail NOT counted)
    if (type !== "failure") {
      outNonFail.set(from, (outNonFail.get(from) ?? 0) + 1);
      inNonFail.set(to, (inNonFail.get(to) ?? 0) + 1);
      push(adjNonFail, from, to);
    }
  }

  // ===== REQUIRE: node thường không được "hở" (Fail NOT counted) =====
  if ((outNonFail.get(startId) ?? 0) < 1) {
    const n = statuses.find((s) => String(s.id) === startId)?.name ?? "Start";
    return `Start status "${n}" must have at least 1 outgoing transition (non-failure).`;
  }

  if ((inNonFail.get(endId) ?? 0) < 1) {
    const n = statuses.find((s) => String(s.id) === endId)?.name ?? "End";
    return `End status "${n}" must have at least 1 incoming transition (non-failure).`;
  }

for (const s of statuses) {
  const id = String(s.id);
  const n = s.name ?? id;

  // node không được hở: tính mọi loại transition (kể cả Fail)
  if (id !== startId && (inAll.get(id) ?? 0) < 1) {
    return `Status "${n}" must have at least 1 incoming transition.`;
  }
  if (id !== endId && (outAll.get(id) ?? 0) < 1) {
    return `Status "${n}" must have at least 1 outgoing transition.`;
  }

  // nhưng để workflow không bị "chỉ toàn đường trả về", vẫn cần ít nhất 1 outgoing non-failure
  if (id !== endId && (outNonFail.get(id) ?? 0) < 1) {
    return `Status "${n}" must have at least 1 outgoing transition (non-failure).`;
  }
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

  const reachableAll = bfs(startId, adjAll);
  const unreachable = statuses
    .map((s) => String(s.id))
    .filter((id) => !reachableAll.has(id));
  if (unreachable.length) {
    const n = statuses.find((s) => String(s.id) === unreachable[0])?.name ?? unreachable[0];
    return `Unreachable status from Start: "${n}".`;
  }

  const canReachEndAll = bfs(endId, revAll); // reverse graph
  const stuck = statuses
    .map((s) => String(s.id))
    .filter((id) => !canReachEndAll.has(id));
  if (stuck.length) {
    const n = statuses.find((s) => String(s.id) === stuck[0])?.name ?? stuck[0];
    return `Status cannot reach End: "${n}". Add an outgoing path leading to End.`;
  }

  // ===== Must have NON-failure path Start -> End =====
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
    const n = parseInt(
      h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
      16
    );
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return "rgba(156,163,175,0.18)";
  }
};

const makeEdge = (t: TransitionVm, showLabels: boolean): Edge<EdgeData> => {
  const color = EDGE_COLORS[t.type];
  return {
    id: `e-${t.fromStatusId}-${t.toStatusId}`,
    source: t.fromStatusId,
    target: t.toStatusId,
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
    label: showLabels ? t.label || EDGE_LABEL[t.type] : undefined,
    data: {
      type: t.type,
      roleNames: t.roleNames ?? [],
      rule: t.rule ?? undefined,
      label: t.label ?? undefined,
      enforceTransitions: t.enforceTransitions ?? false,
    },
  };
};

const withLabels = (show: boolean, es: Edge<EdgeData>[]) =>
  es.map((e) => {
    const t: TransitionType = (e.data?.type as TransitionType) ?? "optional";
    return {
      ...e,
      label: show ? e.data?.label || EDGE_LABEL[t] : undefined,
    } as Edge<EdgeData>;
  });

/** Node card */
type StatusNodeData = {
  status: StatusVm;
  onEdit: (id: string, patch: Partial<StatusVm>) => void;
};

const StatusNode: React.FC<NodeProps<StatusNodeData>> = ({ data, selected }) => {
  const st = data.status;
  const accent = st.color || "#9ca3af";
   const showTarget = !st.isStart;
  const showSource = !st.isEnd;
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
         {showTarget && (
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
      )}

      {showSource && (
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
      )}

      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: accent }}
          />
          <div className="font-semibold truncate max-w-[140px]">{st.name}</div>
        </div>
        <div className="flex gap-1 opacity-90 text-gray-700">
          {st.isStart && <Play size={16} />}{" "}
          {st.isEnd && <CheckCircle2 size={16} />}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide font-medium mb-1 opacity-70">
          Assigned Roles
        </div>
        <div className="flex flex-wrap gap-1 min-h-[26px]">
          {(st.roles?.length ?? 0) > 0 ? (
            st.roles!.map((r, i) => (
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

const nodeTypes: RFNodeTypes = { statusNode: StatusNode };

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
            <button
              className="ml-1 text-gray-500 hover:text-gray-700"
              onClick={() => remove(i)}
            >
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

const StatusPanel: React.FC<StatusPanelProps> = ({
  status,
  onEditStatus,
  onDeleteStatus,
}) => {
  const [nameDraft, setNameDraft] = useState(status.name ?? "");

  useEffect(() => {
    setNameDraft(status.name ?? "");
  }, [status.id, status.name]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Status</div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Name</label>
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => onEditStatus(status.id, { name: nameDraft })}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Accent color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={status.color || "#9ca3af"}
            onChange={(e) => onEditStatus(status.id, { color: e.target.value })}
          />
          <input
            className="border rounded px-2 py-1 text-xs w-[120px]"
            value={status.color || "#9ca3af"}
            onChange={(e) => onEditStatus(status.id, { color: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-600"
            checked={!!status.isStart}
            onChange={(e) => onEditStatus(status.id, { isStart: e.target.checked })}
          />
          Start
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-600"
            checked={!!status.isEnd}
            onChange={(e) => onEditStatus(status.id, { isEnd: e.target.checked })}
          />
          End
        </label>
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Assign roles</label>
        <TagsInput
          value={status.roles || []}
          onChange={(next) => onEditStatus(status.id, { roles: next })}
          placeholder="Type a role and press Enter"
        />
      </div>

      <div className="pt-2 border-t flex items-center justify-between">
        <button
          onClick={() => onDeleteStatus(status.id)}
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
        >
          <Trash2 size={16} />
          Delete status
        </button>
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

const EdgePanel: React.FC<EdgePanelProps> = ({
  edge,
  dto,
  showLabels,
  onUpdateEdge,
  onDeleteEdge,
}) => {
  const type: TransitionType = edge.data?.type ?? "optional";
  const fromName =
    dto.statuses.find((s) => s.id === edge.source)?.name || (edge.source as string);
  const toName =
    dto.statuses.find((s) => s.id === edge.target)?.name || (edge.target as string);

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
                type === t
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white hover:bg-gray-50"
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
          Enforce this transition (only 1 incoming non-fail allowed)
        </label>
        {type === "failure" && (
          <div className="text-xs text-amber-600">
            Fail transitions cannot be enforced.
          </div>
        )}
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

  // RF states
  const [nodes, setNodes, onNodesChange] = useNodesState<StatusNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>([]);

  // keep latest edges to avoid race/stale closures
  const edgesRef = useRef<Edge<EdgeData>[]>([]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
const getStartId = React.useCallback(() => {
  const s = (dto.statuses ?? []).find((x) => !!x.isStart);
  return s?.id ? String(s.id) : null;
}, [dto.statuses]);

const getEndId = React.useCallback(() => {
  const s = (dto.statuses ?? []).find((x) => !!x.isEnd);
  return s?.id ? String(s.id) : null;
}, [dto.statuses]);

const isStartId = React.useCallback(
  (id?: string | null) => !!id && getStartId() === String(id),
  [getStartId]
);

const isEndId = React.useCallback(
  (id?: string | null) => !!id && getEndId() === String(id),
  [getEndId]
);
const removeInvalidEdgesForStartEnd = useCallback(
  (nextStatuses: StatusVm[]) => {
    const start = nextStatuses.find((s) => !!s.isStart)?.id ?? null;
    const end = nextStatuses.find((s) => !!s.isEnd)?.id ?? null;

    const startId = start ? String(start) : null;
    const endId = end ? String(end) : null;

    const curEdges = edgesRef.current;

    const removeIds = new Set<string>();
    let removedIncomingToStart = 0;
    let removedOutgoingFromEnd = 0;

    if (startId) {
      for (const e of curEdges) {
        if (String(e.target) === startId) {
          removeIds.add(e.id);
          removedIncomingToStart++;
        }
      }
    }
    if (endId) {
      for (const e of curEdges) {
        if (String(e.source) === endId) {
          removeIds.add(e.id);
          removedOutgoingFromEnd++;
        }
      }
    }

    if (!removeIds.size) return { startId, endId, removedIncomingToStart: 0, removedOutgoingFromEnd: 0 };

    // remove edges in ReactFlow
    setEdges((es) => es.filter((e) => !removeIds.has(e.id)));
    setSelectedEdgeId((cur) => (cur && removeIds.has(cur) ? null : cur));

    // warn
    const parts: string[] = [];
    if (removedIncomingToStart) parts.push(`${removedIncomingToStart} incoming → Start`);
    if (removedOutgoingFromEnd) parts.push(`${removedOutgoingFromEnd} outgoing ← End`);
    toast.warn(`Removed invalid transitions: ${parts.join(", ")}.`);

    return { startId, endId, removedIncomingToStart, removedOutgoingFromEnd };
  },
  [setEdges]
);

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

  const handleEditStatus = useCallback(
  (id: string, patch: Partial<StatusVm>) => {
    setDto((prev) => {
      let nextStatuses = prev.statuses.map((s) => (s.id === id ? { ...s, ...patch } : s));

      if (patch.isStart === true) {
        nextStatuses = nextStatuses.map((s) => {
          if (s.id === id) return { ...s, isStart: true, isEnd: false };
          return { ...s, isStart: false };
        });
      }

      if (patch.isEnd === true) {
        nextStatuses = nextStatuses.map((s) => {
          if (s.id === id) return { ...s, isEnd: true, isStart: false };
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

      // ✅ only when user touches start/end checkbox -> cleanup invalid transitions
      const touchedStartEnd = patch.isStart !== undefined || patch.isEnd !== undefined;
      if (!touchedStartEnd) {
        return { ...prev, statuses: nextStatuses };
      }

      const startId = nextStatuses.find((s) => !!s.isStart)?.id ? String(nextStatuses.find((s) => !!s.isStart)!.id) : null;
      const endId = nextStatuses.find((s) => !!s.isEnd)?.id ? String(nextStatuses.find((s) => !!s.isEnd)!.id) : null;

      // remove edges in UI + toast
      removeInvalidEdgesForStartEnd(nextStatuses);

      // remove transitions in DTO (keep in sync)
      let nextTransitions = prev.transitions;

      if (startId) nextTransitions = nextTransitions.filter((t) => String(t.toStatusId) !== startId);
      if (endId) nextTransitions = nextTransitions.filter((t) => String(t.fromStatusId) !== endId);

      return { ...prev, statuses: nextStatuses, transitions: nextTransitions };
    });
  },
  [setNodes, removeInvalidEdgesForStartEnd]
);


  // init graph
  useEffect(() => {
    const ns: Node<StatusNodeData>[] = (initialDto.statuses ?? []).map((s) => ({
      id: s.id,
      type: "statusNode",
      data: { status: s, onEdit: handleEditStatus },
      position: { x: s.x ?? 200, y: s.y ?? 320 },
    }));

    const es: Edge<EdgeData>[] = (initialDto.transitions ?? []).map((t) => makeEdge(t, showLabels));

    setNodes(ns);
    setEdges(es);
    setDto(initialDto);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialDto)]);

  // toggle labels
  useEffect(() => {
    setEdges((eds) => withLabels(showLabels, eds));
  }, [showLabels, setEdges]);

  const isValidConnection = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return false;
      if (c.source === c.target) return false;

      const cur = edgesRef.current;
 if (isStartId(c.target)) return false;

    if (isEndId(c.source)) return false;
      // duplicate
      if (isDuplicateEdge(cur, c.source, c.target)) return false;

      // if target has enforced non-fail incoming => block new non-fail
// if (edgeMode !== "failure" && hasEnforcedOutgoingNonFail(cur, c.source)) return false;

      return true;
    },
    [edgeMode]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge<EdgeData>, newConnection: Connection) => {
      const ns = newConnection.source;
      const nt = newConnection.target;
      if (!ns || !nt) return;
      if (ns === nt) return;

      const cur = edgesRef.current;
      const withoutOld = cur.filter((e) => e.id !== oldEdge.id);

      // duplicate
      if (isDuplicateEdge(withoutOld, ns, nt)) {
        toast.error("Duplicate transition is not allowed.");
        return;
      }

      const movingType = getEdgeType(oldEdge);
      const movingIsFailure = movingType === "failure";
      const movingIsEnforced = isEnforcedNonFail(oldEdge);

   // moving a NON-fail edge FROM a locked source => block
// if (!movingIsFailure && hasEnforcedOutgoingNonFail(withoutOld, ns)) {
//   toast.error("Cannot move: source is locked by an enforced transition (excluding Fail).");
//   return;
// }

// // moving an ENFORCED non-fail edge => new SOURCE must have NO other outgoing non-fail (excluding Fail)
// if (movingIsEnforced) {
//   const otherOutgoingNonFail = outgoingEdges(withoutOld, ns, { ignoreFailure: true });
//   if (otherOutgoingNonFail.length > 0) {
//     toast.error(
//       "Cannot move enforced transition: source already has other outgoing transitions (excluding Fail)."
//     );
//     return;
//   }
// }


      setEdges((es) =>
        es.map((e) => (e.id === oldEdge.id ? { ...e, source: ns, target: nt } : e))
      );

      setDto((prev) => {
        const i = prev.transitions.findIndex(
          (t) => t.fromStatusId === oldEdge.source && t.toStatusId === oldEdge.target
        );
        if (i === -1) return prev;
        const next = { ...prev, transitions: [...prev.transitions] };
        next.transitions[i] = {
          ...next.transitions[i],
          fromStatusId: ns,
          toStatusId: nt,
        };
        return next;
      });
    },
    []
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const s = connection.source;
      const t = connection.target;
      if (!s || !t) return;
      if (s === t) return;

      const cur = edgesRef.current;

      if (isDuplicateEdge(cur, s, t)) {
        toast.error("Duplicate transition is not allowed.");
        return;
      }

      // block non-fail into enforced target
//     if (edgeMode !== "failure" && hasEnforcedOutgoingNonFail(cur, s)) {
//   toast.error("Cannot connect: source is locked by an enforced transition (excluding Fail).");
//   return;
// }

      const tr: TransitionVm = {
        fromStatusId: s,
        toStatusId: t,
        type: edgeMode,
        label: EDGE_LABEL[edgeMode],
  enforceTransitions: edgeMode === "failure" ? false : true, // ✅ new transitions default enforce
      };

      const e = makeEdge(tr, showLabels);

      setEdges((eds) => addEdge(e, eds));
      setDto((prev) => ({ ...prev, transitions: [...prev.transitions, tr] }));
    },
    [edgeMode, showLabels]
  );

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    setDto((prev) => ({
      ...prev,
      statuses: prev.statuses.map((s) =>
        s.id === node.id
          ? { ...s, x: Math.round(node.position.x), y: Math.round(node.position.y) }
          : s
      ),
    }));
  }, []);

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeId(selNodes?.[0]?.id ?? null);
      setSelectedEdgeId(selEdges?.[0]?.id ?? null);
    },
    []
  );

  // delete helpers
  const deleteNodeById = useCallback((id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    setDto((prev) => ({
      ...prev,
      statuses: prev.statuses.filter((s) => s.id !== id),
      transitions: prev.transitions.filter((t) => t.fromStatusId !== id && t.toStatusId !== id),
    }));
    setSelectedNodeId((cur) => (cur === id ? null : cur));
  }, []);

  const deleteEdge = useCallback((edgeToDelete: Edge<EdgeData>) => {
    const { id, source, target } = edgeToDelete;
    setEdges((es) => es.filter((e) => e.id !== id));
    setDto((prev) => ({
      ...prev,
      transitions: prev.transitions.filter(
        (t) => !(t.fromStatusId === source && t.toStatusId === target)
      ),
    }));
    setSelectedEdgeId((cur) => (cur === id ? null : cur));
  }, []);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    deleteNodeById(selectedNodeId);
  }, [selectedNodeId, deleteNodeById]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    const e = edges.find((x) => x.id === selectedEdgeId);
    if (!e) return;
    deleteEdge(e);
  }, [selectedEdgeId, edges, deleteEdge]);

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    if (!deleted.length) return;
    setDto((prev) => {
      const rm = new Set(deleted.map((d) => `${d.source}|${d.target}`));
      return {
        ...prev,
        transitions: prev.transitions.filter((t) => !rm.has(`${t.fromStatusId}|${t.toStatusId}`)),
      };
    });
  }, []);

  const onNodesDelete = useCallback((deleted: Node[]) => {
    if (!deleted.length) return;
    const ids = new Set(deleted.map((n) => n.id));
    setDto((prev) => ({
      ...prev,
      statuses: prev.statuses.filter((s) => !ids.has(s.id)),
      transitions: prev.transitions.filter((t) => !(ids.has(t.fromStatusId) || ids.has(t.toStatusId))),
    }));
  }, []);

  // delete hotkey
  useEffect(() => {
    const isTyping = () => {
      const ae = document.activeElement as HTMLElement | null;
      if (!ae) return false;
      const tag = (ae.tagName || "").toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        (ae as any).isContentEditable ||
        ae.getAttribute?.("role") === "textbox"
      );
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e as any).isComposing) return;
      if (isTyping()) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedEdgeId) deleteSelectedEdge();
        else if (selectedNodeId) deleteSelectedNode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEdgeId, selectedNodeId, deleteSelectedEdge, deleteSelectedNode]);

  // update edge props (type/label/rule/roles/enforce)
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
      const cur = edgesRef.current;
      const existingType = (edge.data?.type ?? "optional") as TransitionType;
      const nextType = (patch.type ?? existingType) as TransitionType;

      const existingEnforce = !!edge.data?.enforceTransitions;
      const wantsEnforce = patch.enforceTransitions; // boolean | undefined
      let nextEnforce = wantsEnforce ?? existingEnforce;

      // cannot enforce Fail
      if (nextType === "failure" && nextEnforce) {
        toast.error("Cannot enforce a Fail transition.");
        nextEnforce = false; // auto-off
      }
// if (
//   nextType !== "failure" &&
//   hasEnforcedOutgoingNonFail(cur, edge.source as string, { excludeEdgeId: edge.id })
// ) {
//   toast.error("This source is locked by another enforced transition (excluding Fail).");
//   return;
// }
// if (!existingEnforce && wantsEnforce === true) {
//   const others = outgoingEdges(cur, edge.source as string, {
//     excludeEdgeId: edge.id,
//     ignoreFailure: true,
//   });
//   if (others.length > 0) {
//     toast.error("Cannot enforce: source already has other outgoing transitions (excluding Fail).");
//     return;
//   }
// }


     if (nextType !== "failure") {
  const lockedByOther = hasEnforcedOutgoingNonFail(cur, edge.source as string, {
    excludeEdgeId: edge.id,
  });
  // if (lockedByOther && nextEnforce) {
  //   toast.error("This source is locked by another enforced transition.");
  //   return;
  // }
}


      setEdges((es) =>
        es.map((e) => {
          if (e.id !== edge.id) return e;

          const finalType = (patch.type ?? (e.data?.type ?? "optional")) as TransitionType;
          const color = EDGE_COLORS[finalType];

          const finalEnforce =
            finalType === "failure" ? false : (patch.enforceTransitions ?? e.data?.enforceTransitions ?? false);

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
        const next = { ...prev };
        next.transitions = next.transitions.map((t) =>
          t.fromStatusId === edge.source && t.toStatusId === edge.target
            ? ({
                ...t,
                ...patch,
                type: (patch.type ?? t.type ?? "optional") as TransitionType,
                enforceTransitions: nextType === "failure" ? false : (patch.enforceTransitions ?? t.enforceTransitions ?? false),
              } as TransitionVm)
            : t
        );
        return next;
      });
    },
    [showLabels]
  );

  // save
  const handleSave = async () => {
    if (externalSaving) return;
    setSaving(true);
    try {
      const payload: DesignerDto = {
        ...dto,
        transitions: edges.map((e) => ({
          fromStatusId: String(e.source),
          toStatusId: String(e.target),
          type: (e.data?.type as TransitionType) || "optional",
          label: typeof e.label === "string" ? e.label : e.data?.label,
          rule: e.data?.rule,
          roleNames: e.data?.roleNames ?? [],
          enforceTransitions:
            ((e.data?.type as TransitionType) === "failure")
              ? false
              : (e.data?.enforceTransitions ?? false),
        })),
     statuses: nodes.map((n) => {
  const s = n.data.status;
  return { ...s, x: Math.round(n.position.x), y: Math.round(n.position.y) };
}),

      };

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

  const resetLocal = () => setDto(initialDto);

  const addStatus = () => {
    const s: StatusVm = {
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

  return (
    <div className="h-[calc(100vh-40px)] w-full flex overflow-hidden">
      <div className="flex-1 relative">
        <div className="absolute z-50 left-4 top-3 flex flex-wrap gap-2 items-center bg-white/90 backdrop-blur rounded-xl border shadow px-3 py-2">
          <div className="text-sm text-gray-600">{title}</div>
          <input
            className="ml-2 border rounded-lg px-2 py-1 text-sm"
            value={dto.workflow.name}
            onChange={(e) =>
              setDto((prev) => ({
                ...prev,
                workflow: { ...prev.workflow, name: e.target.value },
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
            nodeColor={(n) => hexToRgba((n as any)?.data?.status?.color, 0.18)}
            nodeStrokeColor={(n) => {
              const st = (n as any)?.data?.status as StatusVm | undefined;
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
          </div>
        </div>

        {selectedStatus && !selectedEdge ? (
          <StatusPanel
            status={selectedStatus}
            onEditStatus={handleEditStatus}
            onDeleteStatus={deleteNodeById}
          />
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
