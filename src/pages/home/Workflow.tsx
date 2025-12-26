import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge, Background, ConnectionMode, Controls, MarkerType,
  MiniMap, Position, Handle, useEdgesState, useNodesState
} from "reactflow";
import type { Node, Edge, NodeProps, Connection, NodeTypes as RFNodeTypes } from "reactflow";
import "reactflow/dist/style.css";
import { Plus, Save, RotateCcw, Trash2, Play, CheckCircle2, Link2 } from "lucide-react";
import { useParams } from "react-router-dom";
import NotFound from "../notfound/NotFound.js";
//khong sai nua
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {
  postWorkflow,
  putWorkflowDesigner as apiPutDesigner,
} from "../../services/workflowService.js";

/* ================= Types ================= */
export type WorkflowVm = { id: string; name: string };
export type TransitionType = "success" | "failure" | "optional";
export type StatusVm = {
  id: string; name: string; isStart: boolean; isEnd: boolean;
  x: number; y: number; roles: string[]; color?: string;
};
export type TransitionVm = {
  id?: number; fromStatusId: string; toStatusId: string; type: TransitionType;
  label?: string; rule?: string; roleNames?: string[]; enforceTransitions?: boolean;
};
export type DesignerDto = { workflow: WorkflowVm; statuses: StatusVm[]; transitions: TransitionVm[] };

/* ================= Utils ================= */
const uid = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2));

const EDGE_COLORS: Record<TransitionType, string> = {
  success: "#10b981", failure: "#ef4444", optional: "#111827",
};
const EDGE_LABEL: Record<TransitionType, string> = {
  success: "Success", failure: "Fail", optional: "Optional",
};
const hexToRgba = (hex: string, alpha = 0.18) => {
  try {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return "rgba(156,163,175,0.18)"; }
};
const makeEdgeId = (t: TransitionVm, i?: number) => `e-${i ?? "x"}-${t.fromStatusId}-${t.toStatusId}`;
export type EdgeData = { type: TransitionType; roleNames?: string[]; rule?: string; label?: string };
const makeEdge = (t: TransitionVm, showLabels: boolean): Edge<EdgeData> => {
  const color = EDGE_COLORS[t.type];
  return {
    id: makeEdgeId(t),
    source: t.fromStatusId,
    target: t.toStatusId,
    label: showLabels ? (t.label || EDGE_LABEL[t.type]) : undefined,
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
    data: { type: t.type, roleNames: t.roleNames ?? [], rule: t.rule, label: t.label },
  } as Edge<EdgeData>;
};
const isDuplicateEdge = (edges: Edge<EdgeData>[], source: string, target: string) =>
  edges.some(e => String(e.source) === source && String(e.target) === target);
const withLabels = (show: boolean, es: Edge<EdgeData>[]) =>
  es.map(e => {
    const t: TransitionType = (e.data?.type as TransitionType) ?? "optional";
    return { ...e, label: show ? (e.data?.label || EDGE_LABEL[t]) : undefined } as Edge<EdgeData>;
  });

/* ================= Default template for NEW workflow ================= */
function makeInitialDto(name = "New Workflow"): DesignerDto {
  const s1: StatusVm = { id: uid(), name: "Start", isStart: true, isEnd: false, x: 200, y: 350, roles: ["Reporter"], color: "#10b981" };
  const s2: StatusVm = { id: uid(), name: "Work",  isStart: false, isEnd: false, x: 520, y: 350, roles: ["Developer"], color: "#4f46e5" };
  const s3: StatusVm = { id: uid(), name: "Done",  isStart: false, isEnd: true,  x: 840, y: 350, roles: ["Reviewer","QA"], color: "#111827" };
  const transitions: TransitionVm[] = [
    { fromStatusId: s1.id, toStatusId: s2.id, type: "success", label: "Go" },
    { fromStatusId: s2.id, toStatusId: s3.id, type: "success", label: "Complete" },
    { fromStatusId: s3.id, toStatusId: s2.id, type: "failure", label: "Rework" },
  ];
  return { workflow: { id: uid(), name }, statuses: [s1, s2, s3], transitions };
}

/* ================= Reusable components ================= */
const TagsInput: React.FC<{ value: string[]; onChange: (n: string[]) => void; placeholder?: string; }> = ({ value, onChange, placeholder }) => {
  const [text, setText] = useState(""); const [isComposing, setIsComposing] = useState(false);
  const add = (raw: string) => { const v = raw.trim(); if (!v || value.includes(v)) return; onChange([...value, v]); setText(""); };
  const remove = (i: number) => { const next = [...value]; next.splice(i, 1); onChange(next); };
  return (
    <div className="border rounded-lg px-2 py-2 text-sm">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((t, i) => (
          <span key={`${t}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border">
            {t}
            <button className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => remove(i)} aria-label={`remove ${t}`}>&times;</button>
          </span>
        ))}
      </div>
      <input
        className="outline-none w-full"
        value={text}
        placeholder={placeholder || "Type and press Enter"}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => { setIsComposing(false); setText((e.target as HTMLInputElement).value); }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          const composing = (e as any).nativeEvent?.isComposing || isComposing;
          if (composing) return;
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
          if (e.key === "Backspace" && !text && value.length) { remove(value.length - 1); }
        }}
      />
    </div>
  );
};

export type StatusNodeData = { status: StatusVm; onEdit: (id: string, patch: Partial<StatusVm>) => void; };
const StatusNode: React.FC<NodeProps<StatusNodeData>> = ({ data, selected }) => {
  const st = data.status; const accent = st.color || "#9ca3af";
  return (
    <div className={`rounded-xl border shadow-sm w-[220px] bg-white relative ${selected ? "ring-2 ring-emerald-500" : ""}`}>
      <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: accent, opacity: 0.9 }} />
      <Handle type="target" position={Position.Left} id="in"  style={{ left: -8,  background: "#fff", border: "1px solid #e5e7eb", width: 14, height: 14 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ right: -8, background: "#fff", border: "1px solid #e5e7eb", width: 14, height: 14 }} />
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
          <div className="font-semibold truncate max-w-[140px]">{st.name}</div>
        </div>
        <div className="flex gap-1 opacity-90 text-gray-700">
          {st.isStart && <Play size={16} />} {st.isEnd && <CheckCircle2 size={16} />}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide font-medium mb-1 opacity-70">Assigned Roles</div>
        <div className="flex flex-wrap gap-1 min-h-[26px]">
          {st.roles?.length ? st.roles.map((r, i) =>
            <span key={`${r}-${i}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-white/70 shadow-sm">{r}</span>
          ) : <span className="text-xs text-gray-400">No roles</span>}
        </div>
      </div>
    </div>
  );
};
const nodeTypes: RFNodeTypes = { statusNode: StatusNode };

/* ================= Page (CREATE) ================= */
export default function WorkflowCreatePage() {
  const { companyId: companyIdRaw } = useParams();
  const companyId = (companyIdRaw || "").trim();
  if (!companyId) return <NotFound />;

  return <WorkflowDesignerNew companyId={companyId} />;
}

/* ================= Main Designer (Create Mode) ================= */
export function WorkflowDesignerNew( { companyId, workflowId }: { companyId: string; workflowId?: string }) {
  const [loading, setLoading] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [dto, setDto] = useState<DesignerDto>(() => makeInitialDto());
  const [edgeMode, setEdgeMode] = useState<TransitionType>("success");

  // lưu id được tạo sau POST lần đầu
  const createdWorkflowIdRef = useRef<string | null>(null);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState<StatusNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>([]);

  // selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedEdge = useMemo(
    () => edges.find((e): e is Edge<EdgeData> => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  // init from default DTO
  useEffect(() => {
    setLoading(true);
    const ns: Node<StatusNodeData>[] = dto.statuses.map((s) => ({
      id: s.id, type: "statusNode",
      data: { status: s, onEdit: handleEditStatus },
      position: { x: s.x ?? 120, y: s.y ?? 300 },
    }));
    const es: Edge<EdgeData>[] = dto.transitions.map((t, idx) => ({ ...makeEdge(t, showLabels), id: makeEdgeId(t, idx) }));
    setNodes(ns); setEdges(es); setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  useEffect(() => { setEdges(eds => withLabels(showLabels, eds)); }, [showLabels]);

  const isValidConnection = useCallback((c: Connection) => {
    if (!c.source || !c.target) return false;
    if (c.source === c.target) return false;
    if (isDuplicateEdge(edges, c.source, c.target)) return false;
    return true;
  }, [edges]);

  const onEdgeUpdate = useCallback((oldEdge: Edge<EdgeData>, newConnection: Connection) => {
    if (!newConnection.source || !newConnection.target) return;
    if (!isValidConnection({ ...newConnection })) return;
    setEdges(es => es.map(e => e.id === oldEdge.id ? { ...e, source: newConnection.source!, target: newConnection.target! } : e));
    setDto(prev => {
      const i = prev.transitions.findIndex(t => t.fromStatusId === oldEdge.source && t.toStatusId === oldEdge.target);
      if (i === -1) return prev;
      const next = { ...prev, transitions: [...prev.transitions] };
      next.transitions[i] = { ...next.transitions[i], fromStatusId: newConnection.source!, toStatusId: newConnection.target! };
      return next;
    });
  }, [isValidConnection]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const t: TransitionVm = { fromStatusId: connection.source, toStatusId: connection.target, type: edgeMode, label: EDGE_LABEL[edgeMode] };
    const e = makeEdge(t, showLabels);
    setEdges(eds => addEdge(e, eds));
    setDto(prev => ({ ...prev, transitions: [...prev.transitions, t] }));
  }, [edgeMode, showLabels]);

 const handleEditStatus = useCallback(
  (id: string, patch: Partial<StatusVm>) => {
    setDto((prev) => {
      // apply patch
      let nextStatuses = prev.statuses.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      );

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

      setNodes((ns) =>
        ns.map((n) => {
          const st = nextStatuses.find((x) => x.id === n.id);
          if (!st) return n;
          return {
            ...n,
            data: { ...(n.data as StatusNodeData), status: st },
          };
        })
      );

      return { ...prev, statuses: nextStatuses };
    });
  },
  [setNodes]
);


  const onNodeDragStop = useCallback((_: any, node: Node) => {
    setDto(prev => ({ ...prev, statuses: prev.statuses.map(s => s.id === node.id ? { ...s, x: Math.round(node.position.x), y: Math.round(node.position.y) } : s) }));
  }, []);

  const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeId(selNodes?.[0]?.id ?? null);
    setSelectedEdgeId(selEdges?.[0]?.id ?? null);
  }, []);

  const selectedStatus = useMemo(
    () => dto.statuses.find(s => s.id === selectedNodeId) ?? null,
    [dto.statuses, selectedNodeId]
  );

  // name draft
  const [statusNameDraft, setStatusNameDraft] = useState("");
  useEffect(() => { setStatusNameDraft(selectedStatus?.name ?? ""); }, [selectedStatus?.id]);

  const addStatus = () => {
    const s: StatusVm = {
      id: uid(), name: "New Status", isStart: false, isEnd: false,
      x: 200 + Math.random() * 200, y: 160 + Math.random() * 180, roles: [], color: "#6366f1",
    };
    const node: Node<StatusNodeData> = { id: s.id, type: "statusNode", position: { x: s.x, y: s.y }, data: { status: s, onEdit: handleEditStatus } };
    setNodes(ns => [...ns, node]);
    setDto(prev => ({ ...prev, statuses: [...prev.statuses, s] }));
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNodeId));
    setEdges(es => es.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setDto(prev => ({
      ...prev,
      statuses: prev.statuses.filter(s => s.id !== selectedNodeId),
      transitions: prev.transitions.filter(t => t.fromStatusId !== selectedNodeId && t.toStatusId !== selectedNodeId),
    }));
    setSelectedNodeId(null);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    const edge = edges.find(e => e.id === selectedEdgeId); if (!edge) return;
    setEdges(es => es.filter(e => e.id !== selectedEdgeId));
    setDto(prev => ({ ...prev, transitions: prev.transitions.filter(t => !(t.fromStatusId === edge.source && t.toStatusId === edge.target)) }));
    setSelectedEdgeId(null);
  };

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    if (!deleted.length) return;
    setDto(prev => {
      const rm = new Set(deleted.map(d => `${d.source}|${d.target}`));
      return { ...prev, transitions: prev.transitions.filter(t => !rm.has(`${t.fromStatusId}|${t.toStatusId}`)) };
    });
  }, []);
  const onNodesDelete = useCallback((deleted: Node[]) => {
    if (!deleted.length) return;
    const ids = new Set(deleted.map(n => n.id));
    setDto(prev => ({
      ...prev,
      statuses: prev.statuses.filter(s => !ids.has(s.id)),
      transitions: prev.transitions.filter(t => !(ids.has(t.fromStatusId) || ids.has(t.toStatusId))),
    }));
  }, []);

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
        if (selectedEdgeId) deleteSelectedEdge(); else if (selectedNodeId) deleteSelectedNode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEdgeId, selectedNodeId]);

  /* ====== CREATE then PUT designer ====== */
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!dto || saving) return;
    setSaving(true);
    try {
      // 1) nếu chưa có id từ server => tạo workflow
      let wfId = createdWorkflowIdRef.current;
      if (!wfId) {
        const created = await postWorkflow(companyId, (dto.workflow.name || "New Workflow").trim());
        wfId = typeof created === "string" ? created : created?.id;
        if (!wfId) throw new Error("Cannot get workflowId from POST response");
        createdWorkflowIdRef.current = wfId;
      }

      // 2) build payload và PUT designer
      const payload: DesignerDto = {
        ...dto,
        workflow: { id: wfId, name: dto.workflow.name },
        transitions: edges.map((e) => ({
          fromStatusId: String(e.source),
          toStatusId: String(e.target),
          type: (e.data?.type as TransitionType) || "optional",
          label: typeof e.label === "string" ? e.label : e.data?.label,
          rule: e.data?.rule,
          roleNames: e.data?.roleNames ?? [],
        })),
        statuses: nodes.map((n) => {
          const s = dto.statuses.find((x) => x.id === n.id)!;
          return { ...s, x: Math.round(n.position.x), y: Math.round(n.position.y) };
        }),
      };

      await apiPutDesigner(companyId, wfId, payload);
      // bạn có thể điều hướng về trang list hoặc hiển thị toast ở đây
      // navigate(`/companies/${companyId}/workflow/${wfId}`)  // nếu muốn
    } finally {
      setSaving(false);
    }
  };

  const resetLocal = () => setDto(makeInitialDto(dto.workflow.name || "New Workflow"));

  if (loading) return <div className="h-[80vh] grid place-items-center text-gray-500">Loading...</div>;

  const currentColor = EDGE_COLORS[edgeMode];

  return (
    <div className="h-[calc(100vh-40px)] w-full flex overflow-hidden">
      {/* Canvas */}
      <div className="flex-1 relative">
        {/* Top bar */}
        <div className="absolute z-50 left-4 top-3 flex flex-wrap gap-2 items-center bg-white/90 backdrop-blur rounded-xl border shadow px-3 py-2">
          <div className="text-sm text-gray-600">Create workflow</div>
          <input
            className="ml-2 border rounded-lg px-2 py-1 text-sm"
            value={dto.workflow.name}
            onChange={(e) => setDto(prev => ({ ...prev, workflow: { ...prev.workflow, name: e.target.value } }))}
            placeholder="Workflow name"
          />
          <div className="mx-2 w-px h-5 bg-gray-200" />
          <button onClick={addStatus} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm">
            <Plus size={16} /> Add status
          </button>

          {/* Edge mode */}
          <div className="mx-2 w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600 mr-1">Create edge as:</span>
            {(["success","failure","optional"] as TransitionType[]).map(t => (
              <button key={t}
                onClick={()=>setEdgeMode(t)}
                className={`px-2 py-1 rounded-md border inline-flex items-center gap-2 ${edgeMode===t?"ring-2 ring-offset-1 ring-gray-900":""}`}
                title={`New edges will be ${EDGE_LABEL[t]}`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS[t] }} />
                {EDGE_LABEL[t]}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 ml-2">
            <input type="checkbox" className="accent-emerald-600" checked={showLabels} onChange={(e)=>setShowLabels(e.target.checked)} />
            Show labels
          </label>

          <div className="mx-2 w-px h-5 bg-gray-200" />
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60 hover:bg-emerald-700">
            <Save size={16}/>{createdWorkflowIdRef.current ? "Save changes" : "Create workflow"}
          </button>
          <button onClick={resetLocal} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
            <RotateCcw size={16}/>Discard changes
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
            pannable zoomable nodeBorderRadius={12}
            maskColor="rgba(17,24,39,0.05)"
            nodeColor={(n)=>hexToRgba((n as any)?.data?.status?.color || "#9ca3af", 0.18)}
            nodeStrokeColor={(n)=>{
              const st = (n as any)?.data?.status;
              if (!st) return "#cbd5e1";
              if (st.isStart) return "#10b981";
              if (st.isEnd)   return "#111827";
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
            <div className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{backgroundColor:EDGE_COLORS.success}}/>Success</div>
            <div className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{backgroundColor:EDGE_COLORS.failure}}/>Fail</div>
            <div className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{backgroundColor:EDGE_COLORS.optional}}/>Optional</div>
          </div>
        </div>

        {selectedStatus && !selectedEdge ? (
          <StatusPanel />
        ) : selectedEdge ? (
          <EdgePanel />
        ) : (
          <div className="text-sm text-gray-500">
            Select a status or an edge to edit its properties. Drag between nodes to add a transition.
            <div className="mt-3 inline-flex items-center gap-2 text-gray-700"><Link2 size={16}/> Tip: choose edge type first then connect.</div>
          </div>
        )}
      </aside>
    </div>
  );

  function StatusPanel() {
    if (!selectedStatus) return null;
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold">Status</div>
        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Name</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusNameDraft}
            onChange={(e)=>setStatusNameDraft(e.target.value)}
            onBlur={(e)=>handleEditStatus(selectedStatus.id, { name: (e.target as HTMLInputElement).value })}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Accent color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={selectedStatus.color || "#9ca3af"}
                   onChange={(e)=>handleEditStatus(selectedStatus.id, { color: e.target.value })}/>
            <input className="border rounded px-2 py-1 text-xs w-[120px]"
                   value={selectedStatus.color || "#9ca3af"}
                   onChange={(e)=>handleEditStatus(selectedStatus.id, { color: e.target.value })}/>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-emerald-600" checked={selectedStatus.isStart}
                   onChange={(e)=>handleEditStatus(selectedStatus.id,{isStart:e.target.checked})}/>Start
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-emerald-600" checked={selectedStatus.isEnd}
                   onChange={(e)=>handleEditStatus(selectedStatus.id,{isEnd:e.target.checked})}/>End
          </label>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Assign roles</label>
          <TagsInput
            value={selectedStatus.roles || []}
            onChange={(next)=>handleEditStatus(selectedStatus.id, { roles: next })}
            placeholder="Type a role and press Enter"
          />
        </div>
        <div className="pt-2 border-t flex items-center justify-between">
          <button onClick={deleteSelectedNode} className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm">
            <Trash2 size={16}/>Delete status
          </button>
          <div className="text-xs text-gray-400">ID: {selectedStatus.id.slice(0,8)}...</div>
        </div>
      </div>
    );
  }

  function EdgePanel() {
    if (!selectedEdge) return null;
    const type: TransitionType = selectedEdge.data?.type ?? "optional";
    const fromName = dto.statuses.find(s=>s.id===selectedEdge.source)?.name || (selectedEdge.source as string);
    const toName   = dto.statuses.find(s=>s.id===selectedEdge.target)?.name || (selectedEdge.target as string);

    const updateEdge = (patch: Partial<{ type: TransitionType; label: string; rule: string; roleNames: string[] }>) => {
      setEdges(es => es.map(e => {
        if (e.id !== selectedEdge.id) return e;
        const nextType = (patch.type ?? (e.data?.type as TransitionType) ?? "optional");
        const color = EDGE_COLORS[nextType];
        return {
          ...e,
          data: { ...e.data, ...patch, type: nextType },
          style: { ...(e.style||{}), stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          label: showLabels ? (patch.label ?? e.data?.label ?? EDGE_LABEL[nextType]) : undefined,
        } as Edge<EdgeData>;
      }));
      setDto(prev => {
        const next = { ...prev };
        next.transitions = next.transitions.map(t =>
          (t.fromStatusId === selectedEdge.source && t.toStatusId === selectedEdge.target)
            ? { ...t, ...patch, type: (patch.type ?? t.type ?? "optional") } as TransitionVm
            : t
        );
        return next;
      });
    };

    const edgeData: Partial<EdgeData> = (selectedEdge.data as EdgeData | undefined) ?? {};
    const [labelDraft, setLabelDraft] = useState<string>(edgeData.label ?? "");
    const [ruleDraft,  setRuleDraft]  = useState<string>(edgeData.rule ?? "");
    useEffect(() => { setLabelDraft(edgeData.label ?? ""); setRuleDraft(edgeData.rule ?? ""); },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedEdge?.id, edgeData.label, edgeData.rule]);

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
            {(["success","failure","optional"] as TransitionType[]).map(t => (
              <button key={t}
                className={`px-3 py-1.5 rounded-lg text-sm border inline-flex items-center gap-2 ${type===t?"bg-gray-900 text-white border-gray-900":"bg-white hover:bg-gray-50"}`}
                onClick={()=>updateEdge({ type: t })}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS[t] }} /> {EDGE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Label (optional)</label>
          <input className="border rounded-lg px-3 py-2 text-sm"
                 value={labelDraft} placeholder={EDGE_LABEL[type]}
                 onChange={(e)=>setLabelDraft(e.target.value)}
                 onBlur={(e)=>updateEdge({ label: (e.target as HTMLInputElement).value })}/>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Guard/Rule</label>
          <input className="border rounded-lg px-3 py-2 text-sm"
                 value={ruleDraft}
                 onChange={(e)=>setRuleDraft(e.target.value)}
                 onBlur={(e)=>updateEdge({ rule: (e.target as HTMLInputElement).value })}/>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Roles allowed</label>
          <TagsInput
            value={edgeData.roleNames || []}
            onChange={(next)=>updateEdge({ roleNames: next })}
            placeholder="Type a role and press Enter"
          />
        </div>

        <div className="pt-2 border-t flex items-center justify-between">
          <button onClick={deleteSelectedEdge} className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm">
            <Trash2 size={16}/>Delete transition
          </button>
          <div className="text-xs text-gray-400">ID: {selectedEdge.id}</div>
        </div>
      </div>
    );
  }
}
