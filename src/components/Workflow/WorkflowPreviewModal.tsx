// src/components/workflow/WorkflowPreviewModal.tsx
import React, { useEffect, useState } from "react";
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
import { Play, CheckCircle2 } from "lucide-react";

import { getWorkflowDesigner } from "@/services/workflowService.js";

type TransitionType = "success" | "failure" | "optional";

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

type MiniData = {
  name: string;
  color?: string | null;
  isStart?: boolean;
  isEnd?: boolean;
  roles?: string[];
};

/** Node giống hệt “thực tế” (WorkflowMini / Designer) */
const MiniStatus: React.FC<NodeProps<MiniData>> = ({ data }) => {
  const accent = data.color || "#9ca3af";
  const roles = data.roles || [];
  const shown = roles.slice(0, 2);
  const more = roles.length - shown.length;

  return (
    <div
      className="rounded-xl border bg-white relative"
      style={{ width: 200, boxShadow: "0 1px 1px rgba(0,0,0,0.03)" }}
    >
      {/* Handle ẩn để line bám đúng nhưng không thấy chấm trắng như ở Designer */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, left: -6, width: 12, height: 12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, right: -6, width: 12, height: 12 }}
      />

      <span
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ background: accent }}
      />
      <div className="px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
          <div className="font-medium text-sm truncate max-w-[120px]">
            {data.name}
          </div>
        </div>
        <div className="text-gray-700 flex gap-1">
          {data.isStart && <Play size={14} />}
          {data.isEnd && <CheckCircle2 size={14} />}
        </div>
      </div>

      <div className="px-2 pb-1.5">
        <div className="text-[10px] uppercase tracking-wide font-medium opacity-60">
          Assigned roles
        </div>
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {shown.map((r, i) => (
            <span
              key={`${r}-${i}`}
              className="px-1.5 py-[1px] text-[10px] rounded-full border bg-white/80"
            >
              {r}
            </span>
          ))}
          {more > 0 && (
            <span className="px-1.5 py-[1px] text-[10px] rounded-full border bg-white/80">
              +{more}
            </span>
          )}
          {roles.length === 0 && (
            <span className="text-[10px] text-gray-400">No roles</span>
          )}
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

        const sts = payload?.statuses ?? [];
        const trs = payload?.transitions ?? [];

        const ns: Node<MiniData>[] = sts.map((s: any, i: number) => ({
          id: s.id,
          type: "mini",
          position: {
            x:
              typeof s.x === "number"
                ? s.x
                : 120 + i * 240,
            y:
              typeof s.y === "number"
                ? s.y
                : 220,
          },
          data: {
            name: s.name,
            color: s.color,
            isStart: !!s.isStart,
            isEnd: !!s.isEnd,
            roles: s.roles ?? [],
          },
          draggable: false,
          selectable: false,
        }));

        const es: Edge[] = trs.map((t: any, i: number) => {
          const tp: TransitionType = (t.type as TransitionType) ?? "optional";
          const color = EDGE_COLORS[tp];
          const label = t.label || EDGE_LABEL[tp];

          return {
            id: `e-${i}-${t.fromStatusId}-${t.toStatusId}`,
            source: t.fromStatusId,
            target: t.toStatusId,
            style: { stroke: color, strokeWidth: 2.2 },
            markerEnd: { type: MarkerType.ArrowClosed, color },
            label,
            labelStyle: { fontSize: 10, fill: "#374151" },
            labelBgPadding: [3, 2],
            labelBgBorderRadius: 6,
            labelBgStyle: {
              fill: "rgba(255,255,255,0.9)",
              stroke: "#e5e7eb",
            },
          };
        });

        setDto(payload);
        setNodes(ns);
        setEdges(es);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, workflowId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[1080px] h-[680px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">
              {dto?.workflow?.name ?? "Workflow"}
            </div>
            <div className="text-xs text-gray-500">
              {(dto?.statuses?.length ?? 0)} statuses •{" "}
              {(dto?.transitions?.length ?? 0)} transitions • ID:{" "}
              {dto?.workflow?.id}
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
            <div className="h-full grid place-items-center text-gray-500">
              Loading…
            </div>
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
