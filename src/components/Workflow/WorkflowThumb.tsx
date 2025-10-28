// src/components/workflow/WorkflowThumb.tsx
import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, MarkerType, Handle, MiniMap, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

type TransitionType = "success" | "failure" | "optional";

// ⚠️ BE trả raw ResponseModel hay thuần DTO đều ok:
// ta unbox nhẹ: const payload = raw.data ?? raw;
type PreviewDto = {
  workflow?: { id?: string; name?: string };
  statuses?: Array<{ id: string; name: string; isStart?: boolean; isEnd?: boolean; x?: number; y?: number; color?: string }>;
  transitions?: Array<{ fromStatusId: string; toStatusId: string; type?: TransitionType; label?: string }>;
};

const EDGE_COLORS: Record<TransitionType, string> = {
  success: "#10b981",
  failure: "#ef4444",
  optional: "#111827",
};

type Props = {
  /** raw từ BE (có thể là ResponseModel hoặc DTO) */
  data: any;
  height?: number;
  onClick?: () => void;
};

export default function WorkflowThumb({ data, height = 180, onClick }: Props) {
  const dto: PreviewDto = (data && (data.data ?? data)) || {};
  const name = dto?.workflow?.name ?? "Workflow";

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // nếu x,y không có -> rải hàng ngang đơn giản
  const fallbackLayout = (n: number, i: number) => ({
    x: 80 + i * 240,
    y: 80 + ((i % 2) * 80),
  });

  useEffect(() => {
    const sts = dto.statuses ?? [];
    const trs = dto.transitions ?? [];

    const ns: Node[] = sts.map((s, i) => ({
      id: s.id,
      type: "miniStatus",
      position: {
        x: Number.isFinite(s.x as number) ? (s.x as number) : fallbackLayout(sts.length, i).x,
        y: Number.isFinite(s.y as number) ? (s.y as number) : fallbackLayout(sts.length, i).y,
      },
      data: { ...s },
      draggable: false,
      selectable: false,
    }));

    const es: Edge[] = trs.map((t, idx) => {
      const tp: TransitionType = (t.type as TransitionType) ?? "optional";
      const color = EDGE_COLORS[tp];
      return {
        id: `e-${idx}-${t.fromStatusId}-${t.toStatusId}`,
        source: t.fromStatusId,
        target: t.toStatusId,
        label: t.label || undefined,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        selectable: false,
      };
    });

    setNodes(ns);
    setEdges(es);
  }, [JSON.stringify(dto)]);

  // node nhỏ để hiển thị Name + chip Start/End
  const MiniNode = useMemo(
    () =>
      function MiniNodeComp({ data }: { data: any }) {
        const accent = data?.color || "#9ca3af";
        return (
          <div
            className="rounded-lg border bg-white text-[12px] shadow-sm w-[180px]"
            style={{ borderColor: "#e5e7eb" }}
          >
            <span
              className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
              style={{ background: accent, opacity: 0.9 }}
            />
            <div className="px-2 py-1.5 flex items-center justify-between">
              <div className="truncate max-w-[120px] font-medium">{data?.name ?? "Status"}</div>
              <div className="flex gap-1 text-[10px]">
                {data?.isStart && (
                  <span className="rounded-full px-1.5 py-0.5 border bg-emerald-50 text-emerald-600">Start</span>
                )}
                {data?.isEnd && (
                  <span className="rounded-full px-1.5 py-0.5 border bg-gray-50 text-gray-700">End</span>
                )}
              </div>
            </div>
            <Handle type="target" position={Position.Left} id="in" style={{ left: -8, width: 12, height: 12 }} />
            <Handle type="source" position={Position.Right} id="out" style={{ right: -8, width: 12, height: 12 }} />
          </div>
        );
      },
    []
  );

  return (
    <div
      className="border rounded-xl overflow-hidden bg-white hover:shadow cursor-pointer"
      style={{ height }}
      onClick={onClick}
    >
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="truncate font-semibold text-sm">{name}</div>
        <div className="text-xs text-gray-500">{(dto.statuses?.length ?? 0)} statuses • {(dto.transitions?.length ?? 0)} transitions</div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ miniStatus: MiniNode as any }}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={16} />
        <MiniMap
          position="bottom-right"
          pannable={false}
          zoomable={false}
          nodeBorderRadius={8}
          maskColor="rgba(17,24,39,0.04)"
        />
      </ReactFlow>
    </div>
  );
}
