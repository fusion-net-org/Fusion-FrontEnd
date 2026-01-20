import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import type { WorkflowPreviewVm } from "@/types/workflow";
import { getWorkflowDesigner } from "@/services/workflowService.js";
import { Play, CheckCircle2, Inbox, XCircle, Lock } from "lucide-react";

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
  isStart: boolean;
  isEnd: boolean;
  roles?: string[];
  systemKey?: "backlog" | "close";
  locked?: boolean;
};

/** ===== System helpers ===== */
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const getSystemKey = (st: any) => norm(st?.systemKey ?? st?.name);
const isBacklogStatus = (st: any) => getSystemKey(st) === "backlog";
const isCloseStatus = (st: any) => getSystemKey(st) === "close";
const isSystemStatusVm = (st: any) =>
  !!st && (!!st.locked || isBacklogStatus(st) || isCloseStatus(st));

const isSystemTransitionVm = (t: any) =>
  (t?.type ?? "optional") === "system" || !!t?.locked;

const SYSTEM_GAP_X = 260;
const SYSTEM_GAP_Y = 0;

/** ===== UI-only ensure Backlog/Close + system edges ===== */
const ensureSystemNodesUiOnly = (dto: any) => {
  const statuses: any[] = Array.isArray(dto?.statuses) ? [...dto.statuses] : [];
  const transitions: any[] = Array.isArray(dto?.transitions) ? [...dto.transitions] : [];

  const normalStatuses = statuses.filter((s) => !isSystemStatusVm(s));
  const normalTransitions = transitions.filter((t) => t && !isSystemTransitionVm(t));

  const start = normalStatuses.find((s) => !!s?.isStart);
  const end = normalStatuses.find((s) => !!s?.isEnd);

  // nếu thiếu start/end: trả nguyên trạng (đừng filter sạch -> trống)
  if (!start || !end) return { ...dto, statuses, transitions: normalTransitions };

  const wfKey = String(dto?.workflow?.id || dto?.workflowId || dto?.id || "wf");
  const mkSysId = (k: "backlog" | "close") => `__sys__${wfKey}__${k}`;

  const sx = typeof start.x === "number" ? start.x : 200;
  const sy = typeof start.y === "number" ? start.y : 120;
  const ex = typeof end.x === "number" ? end.x : sx + 640;
  const ey = typeof end.y === "number" ? end.y : sy;

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
    };
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
    };
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

  const cleaned = normalTransitions.filter((t) => {
    const from = String(t.fromStatusId);
    const to = String(t.toStatusId);
    if (to === String(backlog.id)) return false;
    if (from === String(backlog.id)) return false;
    if (to === String(close.id)) return false;
    if (from === String(close.id)) return false;
    return true;
  });

  const sysBacklogToStart = {
    fromStatusId: String(backlog.id),
    toStatusId: String(start.id),
    type: "system",
    label: "",
    enforceTransitions: true,
    locked: true,
  };

  const sysEndToClose = {
    fromStatusId: String(end.id),
    toStatusId: String(close.id),
    type: "system",
    label: "",
    enforceTransitions: true,
    locked: true,
  };

  const noSysDup = cleaned.filter((t) => {
    const from = String(t.fromStatusId);
    const to = String(t.toStatusId);
    const dup1 = from === sysBacklogToStart.fromStatusId && to === sysBacklogToStart.toStatusId;
    const dup2 = from === sysEndToClose.fromStatusId && to === sysEndToClose.toStatusId;
    return !(dup1 || dup2);
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

  if (isSys) {
    const border = isBacklog ? "#f59e0b" : "#9ca3af";
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

  const accent = data.color || "#9ca3af";
  const roles = data.roles || [];

  return (
    <div className="rounded-xl border bg-white relative" style={{ width: 200 }}>
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

      <div className="px-2 pb-1.5 text-[10px] text-gray-600 truncate">
        {roles.length ? roles.join(", ") : "No roles"}
      </div>
    </div>
  );
};

export default function WorkflowMini({
  data,
  workflowId,
  height = 220,
  autoFetch = false,
}: {
  data?: WorkflowPreviewVm | any;
  workflowId?: string;
  height?: number;
  autoFetch?: boolean;
}) {
  const id = String(
    workflowId ?? (data as any)?.id ?? (data as any)?.workflow?.id ?? ""
  );

  const hasGraph =
    Array.isArray((data as any)?.statuses) && (data as any)?.statuses.length > 0;

  const [resolved, setResolved] = useState<any>(data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResolved(data);
  }, [data]);

  useEffect(() => {
    if (!autoFetch) return;
    if (hasGraph) return;
    if (!id) return;

    let stop = false;
    setLoading(true);

    (async () => {
      try {
        const raw = await getWorkflowDesigner(id);
        const dto = raw?.data ?? raw;
        if (!stop) setResolved(dto);
      } finally {
        if (!stop) setLoading(false);
      }
    })();

    return () => {
      stop = true;
    };
  }, [autoFetch, hasGraph, id]);

  const uiData = useMemo(() => ensureSystemNodesUiOnly(resolved as any), [resolved]);

  const { nodes, edges } = useMemo(() => {
    const sts = (uiData.statuses || []) as any[];
    const trs = (uiData.transitions || []) as any[];

    const ns: Node<MiniData>[] = sts.map((s, i) => ({
      id: s.id,
      type: "mini",
      position: {
        x: typeof s.x === "number" ? s.x : 120 + i * 240,
        y: typeof s.y === "number" ? s.y : 120,
      },
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
    }));

    const es: Edge[] = trs.map((t: any) => {
      const rawType = (t.type || "optional") as EdgeKind;
      const sys = rawType === "system" || !!t.locked;
      const kind: EdgeKind = sys ? "system" : rawType in EDGE_COLORS ? rawType : "optional";

      const color = EDGE_COLORS[kind];
      const label = sys ? undefined : t.label || EDGE_LABEL[kind];

      return {
        id: `e-${t.fromStatusId}-${t.toStatusId}`,
        source: t.fromStatusId,
        target: t.toStatusId,
        animated: sys,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: sys
          ? { stroke: color, strokeWidth: 2, strokeDasharray: "8 6" }
          : { stroke: color, strokeWidth: 2.2 },
        selectable: false,
        label,
        labelStyle: { fontSize: 10, fill: "#374151" },
        labelBgPadding: [3, 2],
        labelBgBorderRadius: 6,
        labelBgStyle: { fill: "rgba(255,255,255,0.9)", stroke: "#e5e7eb" },
      };
    });

    return { nodes: ns, edges: es };
  }, [uiData]);

  if (!Array.isArray(uiData?.statuses) || uiData.statuses.length === 0) {
    return (
      <div className="relative rounded-lg border bg-white overflow-hidden" style={{ height }}>
        <div className="h-full grid place-items-center text-xs text-slate-500">
          {loading ? "Loading preview…" : "No preview"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border bg-white overflow-hidden" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ mini: MiniStatus }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
      </ReactFlow>

      <div className="absolute right-2 bottom-2 flex items-center gap-2 text-[10px] px-2 py-1 rounded-md border bg-white/90">
        <span className="inline-flex items-center gap-1">
          <i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.success }} />
          Success
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.failure }} />
          Fail
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.optional }} />
          Optional
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.system }} />
          System
        </span>
      </div>
    </div>
  );
}
