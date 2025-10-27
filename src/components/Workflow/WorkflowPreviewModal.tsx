import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Handle,       // <- value import
  Position      // <- value import
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { getWorkflowDesigner } from "@/services/workflowService.js";

type TransitionType = "success" | "failure" | "optional";

const EDGE_COLORS: Record<TransitionType, string> = {
  success: "#10b981",
  failure: "#ef4444",
  optional: "#111827",
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const raw = await getWorkflowDesigner(workflowId);
      const payload = raw?.data ?? raw;
      const sts = payload?.statuses ?? [];
      const trs = payload?.transitions ?? [];

      const ns: Node[] = sts.map((s: any, i: number) => ({
        id: s.id,
        type: "previewStatus",
        position: { x: s.x ?? 120 + i * 220, y: s.y ?? 220 },
        data: { ...s },
        draggable: false,
      }));

      const es: Edge[] = trs.map((t: any, i: number) => {
        const tp: TransitionType = (t.type as TransitionType) ?? "optional";
        const color = EDGE_COLORS[tp];
        return {
          id: `e-${i}-${t.fromStatusId}-${t.toStatusId}`,
          source: t.fromStatusId,
          target: t.toStatusId,
          label: t.label || undefined,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      });

      setDto(payload);
      setNodes(ns);
      setEdges(es);
      setLoading(false);
    })();
  }, [open, workflowId]);

  const PreviewNode = useMemo(
    () =>
      function PreviewNodeComp({ data }: { data: any }) {
        const accent = data?.color || "#9ca3af";
        return (
          <div className="rounded-xl border bg-white shadow-sm w-[220px] relative">
            <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: accent }} />
            <div className="px-3 py-2 flex items-center justify-between border-b">
              <div className="truncate font-semibold">{data?.name ?? "Status"}</div>
              <div className="text-[10px] flex gap-1">
                {data?.isStart && (
                  <span className="px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-600">Start</span>
                )}
                {data?.isEnd && <span className="px-1.5 py-0.5 rounded-full border bg-gray-50 text-gray-700">End</span>}
              </div>
            </div>
            <div className="px-3 py-2 text-xs text-gray-600">ID: {String(data?.id).slice(0, 8)}…</div>
            <Handle type="target" position={Position.Left} id="in" style={{ left: -8, width: 12, height: 12 }} />
            <Handle type="source" position={Position.Right} id="out" style={{ right: -8, width: 12, height: 12 }} />
          </div>
        );
      },
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[1080px] h-[680px] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">{dto?.workflow?.name ?? "Workflow"}</div>
            <div className="text-xs text-gray-500">
              {(dto?.statuses?.length ?? 0)} statuses • {(dto?.transitions?.length ?? 0)} transitions • ID:{" "}
              {dto?.workflow?.id}
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
            Close
          </button>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="h-full grid place-items-center text-gray-500">Loading…</div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={{ previewStatus: PreviewNode as any }}
              nodesDraggable={false}
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background gap={18} />
              <MiniMap position="bottom-right" nodeBorderRadius={10} pannable zoomable maskColor="rgba(17,24,39,0.05)" />
              <Controls position="bottom-right" />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
