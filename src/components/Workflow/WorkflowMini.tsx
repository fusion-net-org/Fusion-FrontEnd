// src/components/Workflow/WorkflowMini.tsx
import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps
} from "reactflow";
import "reactflow/dist/style.css";
import type { WorkflowPreviewVm } from "@/types/workflow";
import { Play, CheckCircle2 } from "lucide-react";

const EDGE_COLORS = { success: "#10b981", failure: "#ef4444", optional: "#111827" } as const;
const EDGE_LABEL  = { success: "Success",   failure: "Fail",   optional: "Optional" } as const;

type MiniData = {
  name: string;
  color?: string | null;
  isStart: boolean;
  isEnd: boolean;
  roles?: string[];
};

const MiniStatus: React.FC<NodeProps<MiniData>> = ({ data }) => {
  const accent = data.color || "#9ca3af";
  const roles = data.roles || [];
  const shown = roles.slice(0, 2);
  const more  = roles.length - shown.length;

  return (
    <div
      className="rounded-xl border bg-white relative"
      style={{ width: 200, boxShadow: "0 1px 1px rgba(0,0,0,0.03)" }}
    >
      {/* Handle ẩn để cạnh bám đúng */}
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, left: -6, width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, right: -6, width: 12, height: 12 }} />

      <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: accent }} />
      <div className="px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: accent }} />
          <div className="font-medium text-sm truncate max-w-[120px]">{data.name}</div>
        </div>
        <div className="text-gray-700 flex gap-1">
          {data.isStart && <Play size={14} />}
          {data.isEnd   && <CheckCircle2 size={14} />}
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
          {more > 0 && <span className="px-1.5 py-[1px] text-[10px] rounded-full border bg-white/80">+{more}</span>}
          {roles.length === 0 && <span className="text-[10px] text-gray-400">No roles</span>}
        </div>
      </div>
    </div>
  );
};

export default function WorkflowMini({ data, height = 220 }: { data: WorkflowPreviewVm; height?: number }) {
  const { nodes, edges } = useMemo(() => {
    const ns: Node<MiniData>[] = (data.statuses || []).map((s) => ({
      id: s.id,
      type: "mini",
      position: { x: s.x, y: s.y },
      data: {
        name: s.name,
        color: s.color,
        isStart: !!s.isStart,
        isEnd: !!s.isEnd,
        roles: (s as any).roles ?? [],   // nếu BE chưa trả roles thì để []
      },
      draggable: false,
      selectable: false,
    }));

    const es: Edge[] = (data.transitions || []).map((t) => {
      const typ   = (t.type || "optional") as keyof typeof EDGE_COLORS;
      const color = EDGE_COLORS[typ] || "#111827";
      const label = t.label || EDGE_LABEL[typ];
      return {
        id: `e-${t.fromStatusId}-${t.toStatusId}`,
        source: t.fromStatusId,
        target: t.toStatusId,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: { stroke: color, strokeWidth: 2.2 },
        selectable: false,
        label,
        labelStyle: { fontSize: 10, fill: "#374151" },
        labelBgPadding: [3, 2],
        labelBgBorderRadius: 6,
        labelBgStyle: { fill: "rgba(255,255,255,0.9)", stroke: "#e5e7eb" },
      };
    });

    return { nodes: ns, edges: es };
  }, [data]);

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

      {/* Legend */}
      <div className="absolute right-2 bottom-2 flex items-center gap-2 text-[10px] px-2 py-1 rounded-md border bg-white/90">
        <span className="inline-flex items-center gap-1"><i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.success }} />Success</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.failure }} />Fail</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-2 rounded" style={{ background: EDGE_COLORS.optional }} />Optional</span>
      </div>
    </div>
  );
}
