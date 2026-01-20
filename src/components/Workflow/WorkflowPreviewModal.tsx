import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Play, CheckCircle2, Inbox, XCircle, Lock } from "lucide-react";

import { getWorkflowDesigner } from "@/services/workflowService.js";

type EdgeKind = "success" | "failure" | "optional" | "system";

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

type MiniData = {
  name: string;
  color?: string | null;
  isStart?: boolean;
  isEnd?: boolean;
  roles?: string[];
  systemKey?: "backlog" | "close";
  locked?: boolean;
};

/** ===== System helpers (same rule as DesignerPage) ===== */
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const getSystemKey = (st: any) => norm(st?.systemKey ?? st?.name);
const isBacklogStatus = (st: any) => getSystemKey(st) === "backlog";
const isCloseStatus = (st: any) => getSystemKey(st) === "close";
const isSystemStatusVm = (st: any) =>
  !!st && (!!st.locked || isBacklogStatus(st) || isCloseStatus(st));

const isSystemTransitionVm = (t: any) =>
  (t?.type ?? "optional") === "system" || !!t?.locked;

/** ===== UI-only ensure Backlog/Close + system edges ===== */
const SYSTEM_GAP_X = 320;
const SYSTEM_GAP_Y = 0;

const ensureSystemNodesUiOnly = (dto: any, workflowId?: string) => {
  const statuses: any[] = Array.isArray(dto?.statuses) ? [...dto.statuses] : [];
  const transitions: any[] = Array.isArray(dto?.transitions) ? [...dto.transitions] : [];

  // remove any system stuff from server (nếu trước đó lỡ lưu)
  const normalStatuses = statuses.filter((s) => !isSystemStatusVm(s));
  const normalTransitions = transitions.filter((t) => t && !isSystemTransitionVm(t));

  const start = normalStatuses.find((s) => !!s?.isStart);
  const end = normalStatuses.find((s) => !!s?.isEnd);

  // nếu chưa đủ start/end thì vẫn trả về “clean”
if (!start || !end) {
  return { ...dto, statuses, transitions: normalTransitions };
}


  const wfKey =
    String(workflowId || dto?.workflow?.id || dto?.workflowId || dto?.id || "wf");

  const mkSysId = (k: "backlog" | "close") => `__sys__${wfKey}__${k}`;

  const sx = typeof start.x === "number" ? start.x : 200;
  const sy = typeof start.y === "number" ? start.y : 350;
  const ex = typeof end.x === "number" ? end.x : sx + 640;
  const ey = typeof end.y === "number" ? end.y : sy;

  // Find or create Backlog
  let backlog = statuses.find(isBacklogStatus);
  if (!backlog) {
    backlog = {
      id: mkSysId("backlog"),
      name: "Backlog",
      isStart: false,
      isEnd: false,
      x: sx - SYSTEM_GAP_X,
      y: sy + SYSTEM_GAP_Y,
      roles: [],
      color: "#111827",
      systemKey: "backlog",
      locked: true,
    } as any;
  } else {
    backlog = {
      ...backlog,
      id: backlog.id ?? mkSysId("backlog"),
      name: "Backlog",
      isStart: false,
      isEnd: false,
      x: typeof backlog.x === "number" ? backlog.x : sx - SYSTEM_GAP_X,
      y: typeof backlog.y === "number" ? backlog.y : sy + SYSTEM_GAP_Y,
      roles: Array.isArray(backlog.roles) ? backlog.roles : [],
      color: backlog.color ?? "#111827",
      systemKey: "backlog",
      locked: true,
    };
  }

  // Find or create Close
  let close = statuses.find(isCloseStatus);
  if (!close) {
    close = {
      id: mkSysId("close"),
      name: "Close",
      isStart: false,
      isEnd: false,
      x: ex + SYSTEM_GAP_X,
      y: ey + SYSTEM_GAP_Y,
      roles: [],
      color: "#9ca3af",
      systemKey: "close",
      locked: true,
    } as any;
  } else {
    close = {
      ...close,
      id: close.id ?? mkSysId("close"),
      name: "Close",
      isStart: false,
      isEnd: false,
      x: typeof close.x === "number" ? close.x : ex + SYSTEM_GAP_X,
      y: typeof close.y === "number" ? close.y : ey + SYSTEM_GAP_Y,
      roles: Array.isArray(close.roles) ? close.roles : [],
      color: close.color ?? "#9ca3af",
      systemKey: "close",
      locked: true,
    };
  }

  // Clean transitions: nobody -> Backlog, Close -> anybody, and strip any reference to backlog/close
  const cleaned = normalTransitions.filter((t) => {
    if (!t) return false;
    const from = String(t.fromStatusId);
    const to = String(t.toStatusId);
    if (to === String(backlog.id)) return false;
    if (from === String(close.id)) return false;
    if (from === String(backlog.id)) return false;
    if (to === String(close.id)) return false;
    return true;
  });

  const sysBacklogToStart = {
    fromStatusId: String(backlog.id),
    toStatusId: String(start.id),
    type: "system",
    label: "",
    enforceTransitions: true,
    locked: true,
  } as any;

  const sysEndToClose = {
    fromStatusId: String(end.id),
    toStatusId: String(close.id),
    type: "system",
    label: "",
    enforceTransitions: true,
    locked: true,
  } as any;

  // Ensure they exist exactly once
  const noSysDup = cleaned.filter((t) => {
    const from = String(t.fromStatusId);
    const to = String(t.toStatusId);
    const isDup1 =
      from === String(sysBacklogToStart.fromStatusId) && to === String(sysBacklogToStart.toStatusId);
    const isDup2 =
      from === String(sysEndToClose.fromStatusId) && to === String(sysEndToClose.toStatusId);
    return !(isDup1 || isDup2);
  });

  return {
    ...dto,
    statuses: [backlog, ...normalStatuses, close],
    transitions: [sysBacklogToStart, ...noSysDup, sysEndToClose],
  };
};

/** ===== Mini node ===== */
const MiniStatus: React.FC<NodeProps<MiniData>> = ({ data }) => {
  const isBacklog = data.systemKey === "backlog";
  const isClose = data.systemKey === "close";
  const isSys = !!data.locked || isBacklog || isClose;

  // ===== System nodes (Backlog / Close) =====
  if (isSys) {
    const border = isBacklog ? "#f59e0b" : "#9ca3af"; // Close gray
    const bg = isBacklog ? "rgba(245,158,11,0.10)" : "rgba(156,163,175,0.12)";
    const Icon = isBacklog ? Inbox : XCircle;

    return (
      <div
        className="rounded-xl border-2 relative"
        style={{
          width: 200,
          borderColor: border,
          background: bg,
          boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
        }}
      >
        {/* Handle ẩn */}
        <Handle type="target" position={Position.Left} style={{ opacity: 0, left: -6, width: 12, height: 12 }} />
        <Handle type="source" position={Position.Right} style={{ opacity: 0, right: -6, width: 12, height: 12 }} />

        <div className="px-2 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={16} style={{ color: border }} />
            <div className="font-semibold text-sm truncate">{data.name}</div>
          </div>
          <Lock size={14} className="text-gray-700" />
        </div>
      </div>
    );
  }

  // ===== Normal nodes =====
  const accent = data.color || "#9ca3af";
  const roles = data.roles || [];
  const shown = roles.slice(0, 2);
  const more = roles.length - shown.length;

  return (
    <div
      className="rounded-xl border bg-white relative"
      style={{ width: 200, boxShadow: "0 1px 1px rgba(0,0,0,0.03)" }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, left: -6, width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, right: -6, width: 12, height: 12 }} />

      <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: accent }} />

      <div className="px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: accent }} />
          <div className="font-medium text-sm truncate max-w-[120px]">{data.name}</div>
        </div>
        <div className="text-gray-700 flex gap-1">
          {data.isStart && <Play size={14} />}
          {data.isEnd && <CheckCircle2 size={14} />}
        </div>
      </div>

      <div className="px-2 pb-1.5">
        <div className="text-[10px] uppercase tracking-wide font-medium opacity-60">Assigned roles</div>
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {shown.map((r, i) => (
            <span key={`${r}-${i}`} className="px-1.5 py-[1px] text-[10px] rounded-full border bg-white/80">
              {r}
            </span>
          ))}
          {more > 0 && (
            <span className="px-1.5 py-[1px] text-[10px] rounded-full border bg-white/80">+{more}</span>
          )}
          {roles.length === 0 && <span className="text-[10px] text-gray-400">No roles</span>}
        </div>
      </div>
    </div>
  );
};



export default function WorkflowPreviewModal({
  workflowId,
  open,
  onClose,
}: {
  workflowId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [dto, setDto] = useState<any>(null);
  const [nodes, setNodes] = useState<Node<MiniData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      try {
        const raw = await getWorkflowDesigner(workflowId);
        const payload = raw?.data ?? raw;

        const baseDto = {
          ...payload,
          statuses: payload?.statuses ?? [],
          transitions: payload?.transitions ?? [],
        };

        const uiDto = ensureSystemNodesUiOnly(baseDto, workflowId);

        const sts = uiDto?.statuses ?? [];
        const trs = uiDto?.transitions ?? [];

        const ns: Node<MiniData>[] = sts.map((s: any, i: number) => {
          const px =
            typeof s.x === "number" ? s.x : 120 + i * 240;
          const py =
            typeof s.y === "number" ? s.y : 220;

          return {
            id: s.id,
            type: "mini",
            position: { x: px, y: py },
            data: {
              name: s.name,
              color: s.color,
              isStart: !!s.isStart,
              isEnd: !!s.isEnd,
              roles: s.roles ?? [],
              systemKey: isBacklogStatus(s) ? "backlog" : isCloseStatus(s) ? "close" : undefined,
              locked: !!s.locked || isSystemStatusVm(s),
            },
            draggable: false,
            selectable: false,
          };
        });

        const es: Edge[] = trs.map((t: any, i: number) => {
          const rawType = (t.type ?? "optional") as EdgeKind;
          const sys = rawType === "system" || !!t.locked;
          const kind: EdgeKind = sys ? "system" : (rawType in EDGE_COLORS ? rawType : "optional");

          const color = EDGE_COLORS[kind];
          const label = sys ? undefined : (t.label || EDGE_LABEL[kind]);

          return {
            id: `e-${i}-${t.fromStatusId}-${t.toStatusId}`,
            source: t.fromStatusId,
            target: t.toStatusId,
            animated: sys,
            style: sys
              ? { stroke: color, strokeWidth: 2, strokeDasharray: "8 6" }
              : { stroke: color, strokeWidth: 2.2 },
            markerEnd: { type: MarkerType.ArrowClosed, color },
            label,
            labelStyle: { fontSize: 10, fill: "#374151" },
            labelBgPadding: [3, 2],
            labelBgBorderRadius: 6,
            labelBgStyle: { fill: "rgba(255,255,255,0.9)", stroke: "#e5e7eb" },
          };
        });

        setDto(uiDto);
        setNodes(ns);
        setEdges(es);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, workflowId]);

  if (!open) return null;

  const headerName = dto?.workflow?.name ?? dto?.name ?? "Workflow";

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[1080px] h-[680px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">{headerName}</div>
            <div className="text-xs text-gray-500">
              {(dto?.statuses?.length ?? 0)} statuses •{" "}
              {(dto?.transitions?.length ?? 0)} transitions • ID:{" "}
              {dto?.workflow?.id ?? dto?.id ?? workflowId}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1">
          {loading ? (
            <div className="h-full grid place-items-center text-gray-500">Loading…</div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={{ mini: MiniStatus }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              panOnScroll
            >
              <Background gap={18} />
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                nodeBorderRadius={10}
                maskColor="rgba(17,24,39,0.05)"
              />
              <Controls position="bottom-right" />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
