import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  ConnectionMode,   // là value (runtime)
  Controls,
  MarkerType,
  MiniMap,
  Position,         // là value (dùng Position.Left/Right)
  Handle,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import type {
  Node,            // type
  Edge,            // type
  NodeProps,       // type
  Connection,      // type
  NodeTypes as RFNodeTypes
} from "reactflow";
import "reactflow/dist/style.css";
import { Plus, Save, RotateCcw, Trash2, Play, CheckCircle2, Link2 } from "lucide-react";

/* =========================================================
   Types - simplified per user request (no category, free-form roles)
   ========================================================= */
export type WorkflowVm = { id: string; name: string };
export type TransitionType = "success" | "failure" | "optional"; // success=green, failure=red, optional=black

export type StatusVm = {
  id: string;
  name: string;
  isStart: boolean;
  isEnd: boolean;
  x: number;
  y: number;
  roles: string[]; // free text roles assigned to this status
  color?: string;  // subtle accent color (hex)
};

export type TransitionVm = {
  id?: number;
  fromStatusId: string;
  toStatusId: string;
  type: TransitionType; // color fixed by type
  label?: string; // custom label
  rule?: string; // guard/rule expression (optional)
  roleNames?: string[]; // free text roles allowed to perform this transition
};

export type DesignerDto = {
  workflow: WorkflowVm;
  statuses: StatusVm[];
  transitions: TransitionVm[];
};

/* =========================================================
   Utilities
   ========================================================= */
const uid = () => (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2));

/* =========================================================
   Demo API - replace with real endpoints
   ========================================================= */
async function fetchDesigner(workflowId: string): Promise<DesignerDto> {
  const dto: DesignerDto = {
    workflow: { id: workflowId, name: "Workflow Sample" },
    statuses: [
      { id: uid(), name: "Start", isStart: true, isEnd: false, x: 200, y: 350, roles: ["Reporter"], color: "#10b981" },
      { id: uid(), name: "Work", isStart: false, isEnd: false, x: 520, y: 350, roles: ["Developer"], color: "#4f46e5" },
      { id: uid(), name: "Done", isStart: false, isEnd: true, x: 840, y: 350, roles: ["Reviewer", "QA"], color: "#111827" },
    ],
    transitions: [],
  };
  dto.transitions = [
    { fromStatusId: dto.statuses[0].id, toStatusId: dto.statuses[1].id, type: "success", label: "Go" },
    { fromStatusId: dto.statuses[1].id, toStatusId: dto.statuses[2].id, type: "success", label: "Complete" },
    { fromStatusId: dto.statuses[2].id, toStatusId: dto.statuses[1].id, type: "failure", label: "Rework" },
  ];
  return Promise.resolve(dto);
}

async function saveDesigner(workflowId: string, payload: DesignerDto) {
  console.log("[OK] Save payload", payload);
  return Promise.resolve({ ok: true });
}

/* =========================================================
   Edge styles - fixed colors by type only (success=green, failure=red, optional=black)
   ========================================================= */
const EDGE_COLORS: Record<TransitionType, string> = {
  success: "#10b981", // green-500
  failure: "#ef4444", // red-500
  optional: "#111827", // near-black
};
const EDGE_LABEL: Record<TransitionType, string> = {
  success: "Success",
  failure: "Fail",
  optional: "Optional",
};

// Helper: convert hex color to rgba with alpha for subtle MiniMap fills
function hexToRgba(hex: string, alpha = 0.18) {
  try {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return 'rgba(156,163,175,0.18)'; // fallback gray-400
  }
}

function makeEdgeId(t: TransitionVm, i?: number) {
  return `e-${i ?? "x"}-${t.fromStatusId}-${t.toStatusId}`;
}

/* =========================================================
   Edge data type for TSX
   ========================================================= */
export type EdgeData = { type: TransitionType; roleNames?: string[]; rule?: string; label?: string };

function makeEdge(t: TransitionVm, showLabels: boolean): Edge<EdgeData> {
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
}

/* =========================================================
   Small testable helpers (ASCII-only)
   ========================================================= */
function assertTest(name: string, cond: boolean) {
  if (!cond) console.error("[TEST FAILED]", name);
  else console.log("[TEST PASSED]", name);
}

const isDuplicateEdge = (edges: Edge<EdgeData>[], source: string, target: string) =>
  edges.some((e) => String(e.source) === source && String(e.target) === target);

const withLabels = (show: boolean, es: Edge<EdgeData>[]) =>
  es.map((e) => {
    const type: TransitionType = (e.data?.type as TransitionType) ?? "optional";
    return { ...e, label: show ? (e.data?.label || EDGE_LABEL[type]) : undefined } as Edge<EdgeData>;
  });

/* =========================================================
   Reusable Tags input (free text chips) - IME safe
   ========================================================= */
const TagsInput: React.FC<{
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.includes(v)) return;
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
        onChange={(e)=>setText(e.target.value)}
        onKeyDown={(e)=>{
          const nativeAny = (e as any).nativeEvent;
          const composing = Boolean(nativeAny && nativeAny.isComposing) || isComposing;
          if (composing) return; // do not intercept keys while IME composing
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
          if (e.key === 'Backspace' && !text && value.length) { remove(value.length - 1); }
        }}
      />
    </div>
  );
};

/* =========================================================
   Custom node: StatusNode (subtle accent, keep background & border)
   ========================================================= */
export type StatusNodeData = {
  status: StatusVm;
  onEdit: (id: string, patch: Partial<StatusVm>) => void;
};

const StatusNode: React.FC<NodeProps<StatusNodeData>> = ({ data, selected }) => {
  const st = data.status;
  const accent = st.color || "#9ca3af"; // default gray-400 if missing
  return (
    <div className={`rounded-xl border shadow-sm w-[220px] bg-white relative ${selected ? "ring-2 ring-emerald-500" : ""}`}>
      {/* subtle left accent bar (keeps original background & outer border) */}
      <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: accent, opacity: 0.9 }} />

      <Handle type="target" position={Position.Left} id="in" style={{ left: -8, background: "#fff", border: "1px solid #e5e7eb", width: 14, height: 14 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ right: -8, background: "#fff", border: "1px solid #e5e7eb", width: 14, height: 14 }} />

      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
          <div
            className="font-semibold truncate max-w-[140px] cursor-text"
            title={st.name}
            onDoubleClick={() => {
              const name = window.prompt("Rename status", st.name);
              if (name && name.trim()) data.onEdit(st.id, { name: name.trim() });
            }}
          >
            {st.name}
          </div>
        </div>
        <div className="flex gap-1 opacity-90 text-gray-700">
          {st.isStart && <Play size={16} />}
          {st.isEnd && <CheckCircle2 size={16} />}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide font-medium mb-1 opacity-70">Assigned Roles</div>
        <div className="flex flex-wrap gap-1 min-h-[26px]">
          {st.roles?.length ? st.roles.map((r, idx) => (
            <span key={`${r}-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-white/70 shadow-sm">{r}</span>
          )) : (
            <span className="text-xs text-gray-400">No roles</span>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes: RFNodeTypes = { statusNode: StatusNode };

/* =========================================================
   Main Component
   ========================================================= */
export default function WorkflowDesigner({ workflowId }: { workflowId?: string }) {
  const [loading, setLoading] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [dto, setDto] = useState<DesignerDto | null>(null);

  // edge creation mode (controls color & type for new edges)
  const [edgeMode, setEdgeMode] = useState<TransitionType>("success");

  // ReactFlow state
const [nodes, setNodes, onNodesChange] = useNodesState<StatusNodeData>([]);
const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>([]);

  // selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
const selectedEdge = useMemo(
  () => edges.find((e): e is Edge<EdgeData> => e.id === selectedEdgeId) ?? null,
  [edges, selectedEdgeId]
);
  // load
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchDesigner(workflowId ?? uid());
      setDto(data);
      const ns: Node<StatusNodeData>[] = data.statuses.map((s) => ({
        id: s.id,
        type: "statusNode",
        data: { status: s, onEdit: handleEditStatus },
        position: { x: s.x ?? 120, y: s.y ?? 300 },
      }));
      const es: Edge<EdgeData>[] = data.transitions.map((t, idx) => ({ ...makeEdge(t, showLabels), id: makeEdgeId(t, idx) }));
      setNodes(ns);
      setEdges(es);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // dev tests (run once after initial render)
  useEffect(() => {
    const tmp: TransitionVm = { fromStatusId: "a", toStatusId: "b", type: "success" };
    const e = makeEdge(tmp, true);
    assertTest("makeEdge sets success color", (e.style as any)?.stroke === EDGE_COLORS.success);
    const e2 = makeEdge({ fromStatusId: "b", toStatusId: "c", type: "failure" }, true);
    assertTest("makeEdge sets marker color", (e2 as any)?.markerEnd?.color === EDGE_COLORS.failure);
    const dupEdges: Edge<EdgeData>[] = [
      { id: "1", source: "a", target: "b" } as Edge<EdgeData>,
      { id: "2", source: "b", target: "c" } as Edge<EdgeData>,
    ];
    assertTest("isDuplicateEdge detects duplicate", isDuplicateEdge(dupEdges, "a", "b") === true);
    assertTest("isDuplicateEdge detects non-duplicate", isDuplicateEdge(dupEdges, "b", "a") === false);

    // additional tests
    const labeled = withLabels(true, [e, e2]);
    assertTest("withLabels adds default label when missing", typeof labeled[0].label === "string" && labeled[1].label === "Fail");
    const unlabeled = withLabels(false, labeled);
    assertTest("withLabels removes label when show=false", unlabeled[0].label === undefined && unlabeled[1].label === undefined);
  }, []);

  // keep labels in sync with toggle
  useEffect(() => {
    setEdges((eds) => withLabels(showLabels, eds));
  }, [showLabels, setEdges]);

  // validation rules - minimal: allow any direction, just block self-loop & duplicates
  const isValidConnection = useCallback((c: Connection) => {
    if (!c.source || !c.target) return false;
    if (c.source === c.target) return false; // no self-loop
    if (isDuplicateEdge(edges, c.source, c.target)) return false;
    return true;
  }, [edges]);

  // reconnect edge (drag endpoint), keep metadata
  const onEdgeUpdate = useCallback((oldEdge: Edge<EdgeData>, newConnection: Connection) => {
    if (!newConnection.source || !newConnection.target) return;
    if (!isValidConnection({ ...newConnection })) return;

    setEdges((es) => es.map(e => e.id === oldEdge.id ? ({
      ...e,
      source: newConnection.source!,
      target: newConnection.target!,
    }) : e));

    setDto((prev) => {
      if (!prev) return prev;
      const idx = prev.transitions.findIndex(t => t.fromStatusId === oldEdge.source && t.toStatusId === oldEdge.target);
      if (idx === -1) return prev;
      const next = { ...prev, transitions: [...prev.transitions] };
      next.transitions[idx] = { ...next.transitions[idx], fromStatusId: newConnection.source!, toStatusId: newConnection.target! };
      return next;
    });
  }, [isValidConnection]);

  // connect new edge
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const t: TransitionVm = {
      fromStatusId: connection.source,
      toStatusId: connection.target,
      type: edgeMode,
      label: EDGE_LABEL[edgeMode],
    };
    const e = makeEdge(t, showLabels);
    setEdges((eds) => addEdge(e, eds));
    setDto((prev) => (prev ? { ...prev, transitions: [...prev.transitions, t] } : prev));
  }, [edgeMode, showLabels]);

  // edit status (keep only one Start flag, but do not enforce flow constraints)
  const handleEditStatus = useCallback((id: string, patch: Partial<StatusVm>) => {
    setDto((prev) => {
      if (!prev) return prev;
      let nextStatuses = prev.statuses.map((s) => (s.id === id ? { ...s, ...patch } : s));
      if (patch.isStart === true) {
        nextStatuses = nextStatuses.map((s) => (s.id !== id ? { ...s, isStart: false } : s));
      }
      return { ...prev, statuses: nextStatuses };
    });
    setNodes((ns) => ns.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, status: { ...n.data.status, ...patch } } }) : n)));
  }, [setNodes]);

  // persist layout
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    setDto((prev) => {
      if (!prev) return prev;
      const nextStatuses = prev.statuses.map((s) => s.id === node.id ? { ...s, x: Math.round(node.position.x), y: Math.round(node.position.y) } : s);
      return { ...prev, statuses: nextStatuses };
    });
  }, []);

  const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeId(selNodes?.[0]?.id ?? null);
    setSelectedEdgeId(selEdges?.[0]?.id ?? null);
  }, []);

  const selectedStatus = useMemo(() => dto?.statuses.find((s) => s.id === selectedNodeId) ?? null, [dto, selectedNodeId]);

  // draft state for Vietnamese-friendly inputs
  const [statusNameDraft, setStatusNameDraft] = useState("");
  useEffect(() => {
    setStatusNameDraft(selectedStatus?.name ?? "");
  }, [selectedStatus?.id]);

  // add/delete status
  const addStatus = () => {
    if (!dto) return;
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
    const node: Node<StatusNodeData> = { id: s.id, type: "statusNode", position: { x: s.x, y: s.y }, data: { status: s, onEdit: handleEditStatus } };
    setNodes((ns) => [...ns, node]);
    setDto((prev) => (prev ? { ...prev, statuses: [...prev.statuses, s] } : prev));
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((ns) => ns.filter((n) => n.id !== selectedNodeId));
    setEdges((es) => es.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setDto((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        statuses: prev.statuses.filter((s) => s.id !== selectedNodeId),
        transitions: prev.transitions.filter((t) => t.fromStatusId !== selectedNodeId && t.toStatusId !== selectedNodeId),
      };
    });
    setSelectedNodeId(null);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    const edge = edges.find(e => e.id === selectedEdgeId);
    if (!edge) return;
    setEdges((es) => es.filter((e) => e.id !== selectedEdgeId));
    setDto((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        transitions: prev.transitions.filter((t) => !(t.fromStatusId === edge.source && t.toStatusId === edge.target)),
      };
    });
    setSelectedEdgeId(null);
  };

  // sync deletions via keyboard/toolbar with DTO mirror
  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    if (!deleted.length) return;
    setDto(prev => {
      if (!prev) return prev;
      const toRemove = new Set(deleted.map(d => `${d.source}|${d.target}`));
      return { ...prev, transitions: prev.transitions.filter(t => !toRemove.has(`${t.fromStatusId}|${t.toStatusId}`)) };
    });
  }, []);

  const onNodesDelete = useCallback((deleted: Node[]) => {
    if (!deleted.length) return;
    const ids = new Set(deleted.map(n => n.id));
    setDto(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        statuses: prev.statuses.filter(s => !ids.has(s.id)),
        transitions: prev.transitions.filter(t => !(ids.has(t.fromStatusId) || ids.has(t.toStatusId)))
      };
    });
  }, []);

  // keyboard: Delete / Backspace (IME + input-safe)
  useEffect(() => {
    const isTypingInInput = () => {
      const ae = document.activeElement as HTMLElement | null;
      if (!ae) return false;
      const tag = (ae.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || (ae as any).isContentEditable) return true;
      if (ae.getAttribute && ae.getAttribute("role") === "textbox") return true;
      return false;
    };
    const onKey = (e: KeyboardEvent) => {
      // ignore when composing Vietnamese (IME) or when typing in any input/textarea/contentEditable
      if ((e as any).isComposing) return;
      if (isTypingInInput()) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedEdgeId) deleteSelectedEdge();
        else if (selectedNodeId) deleteSelectedNode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEdgeId, selectedNodeId]);

  // save
  const handleSave = async () => {
    if (!dto) return;
    const payload: DesignerDto = {
      ...dto,
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
    await saveDesigner(dto.workflow.id, payload);
  };

  const resetLocal = () => {
    if (!dto) return;
    setDto({ ...dto });
  };

  if (loading || !dto) {
    return <div className="h-[80vh] grid place-items-center text-gray-500">Loading designer...</div>;
  }

  // UI helpers
  const currentColor = EDGE_COLORS[edgeMode];

  return (
    <div className="h-[calc(100vh-40px)] w-full flex overflow-hidden">
      {/* Canvas */}
      <div className="flex-1 relative">
        {/* Top bar */}
        <div className="absolute z-50 left-4 top-3 flex flex-wrap gap-2 items-center bg-white/90 backdrop-blur rounded-xl border shadow px-3 py-2">
          <div className="text-sm text-gray-600">Workflow for</div>
          <div className="font-semibold">{dto.workflow.name}</div>
          <div className="mx-2 w-px h-5 bg-gray-200" />
          <button onClick={addStatus} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus size={16}/>Add status</button>

          {/* Edge mode switcher */}
          <div className="mx-2 w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600 mr-1">Create edge as:</span>
            {(["success","failure","optional"] as TransitionType[]).map(t => (
              <button key={t}
                onClick={()=>setEdgeMode(t)}
                className={`px-2 py-1 rounded-md border inline-flex items-center gap-2 ${edgeMode===t?"ring-2 ring-offset-1 ring-gray-900" : ""}`}
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
          <button onClick={handleSave} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"><Save size={16}/>Update workflow</button>
          <button onClick={resetLocal} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"><RotateCcw size={16}/>Discard changes</button>
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
            nodeColor={(n)=>{
              const c = (n as any)?.data?.status?.color || '#9ca3af';
              return hexToRgba(c, 0.18);
            }}
            nodeStrokeColor={(n)=>{
              const st = (n as any)?.data?.status;
              if (!st) return '#cbd5e1';
              if (st.isStart) return '#10b981'; // green outline for Start
              if (st.isEnd) return '#111827';   // dark outline for End
              return st.color || '#9ca3af';     // accent outline otherwise
            }}
          />
          <Controls position="bottom-right" />
        </ReactFlow>
      </div>

      {/* Properties panel */}
      <aside className="w-[360px] border-l bg-white p-4 space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Properties</div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{backgroundColor:EDGE_COLORS.success}} />Success</div>
            <div className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{backgroundColor:EDGE_COLORS.failure}} />Fail</div>
            <div className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{backgroundColor:EDGE_COLORS.optional}} />Optional</div>
          </div>
        </div>

        {selectedStatus && !selectedEdge ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold">Status</div>
            <div className="grid gap-2">
              <label className="text-xs text-gray-500">Name</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                value={statusNameDraft}
                onChange={(e)=>setStatusNameDraft(e.target.value)}
                onCompositionEnd={(e)=>handleEditStatus(selectedStatus.id, { name: (e.target as HTMLInputElement).value })}
                onBlur={(e)=>handleEditStatus(selectedStatus.id, { name: (e.target as HTMLInputElement).value })}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-gray-500">Accent color (subtle)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedStatus.color || "#9ca3af"}
                  onChange={(e)=>handleEditStatus(selectedStatus.id, { color: e.target.value })}
                />
                <input
                  className="border rounded px-2 py-1 text-xs w-[120px]"
                  value={selectedStatus.color || "#9ca3af"}
                  onChange={(e)=>handleEditStatus(selectedStatus.id, { color: e.target.value })}
                />
              </div>
              <div className="text-[11px] text-gray-500">Note: Background and border of the node are kept original. The color only affects the left accent bar and the small dot in the title.</div>
            </div>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald-600" checked={selectedStatus.isStart} onChange={(e)=>handleEditStatus(selectedStatus.id,{isStart:e.target.checked})}/>Start</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald-600" checked={selectedStatus.isEnd} onChange={(e)=>handleEditStatus(selectedStatus.id,{isEnd:e.target.checked})}/>End</label>
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-gray-500">Assign roles (free text)</label>
              <TagsInput
                value={selectedStatus.roles || []}
                onChange={(next)=>handleEditStatus(selectedStatus.id, { roles: next })}
                placeholder="Type a role and press Enter"
              />
            </div>
            <div className="pt-2 border-t flex items-center justify-between">
              <button onClick={deleteSelectedNode} className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"><Trash2 size={16}/>Delete status</button>
              <div className="text-xs text-gray-400">ID: {selectedStatus.id.slice(0,8)}...</div>
            </div>
          </div>
        ) : selectedEdge ? (
          <EdgePanel />
        ) : (
          <div className="text-sm text-gray-500">
            Select a status or an edge to edit its properties. Drag between nodes to add a transition.
            <div className="mt-3 inline-flex items-center gap-2 text-gray-700"><Link2 size={16}/> Tip: choose edge type first (Success=green, Fail=red, Optional=black) then connect.</div>
          </div>
        )}
      </aside>
    </div>
  );

  // Inner component so it can access closure states
  function EdgePanel() {
    if (!selectedEdge) return null;
    const type: TransitionType = selectedEdge.data?.type ?? "optional";
    const fromName = dto!.statuses.find(s=>s.id===selectedEdge.source)?.name || (selectedEdge.source as string);
    const toName = dto!.statuses.find(s=>s.id===selectedEdge.target)?.name || (selectedEdge.target as string);

    const updateEdge = (patch: Partial<{ type: TransitionType; label: string; rule: string; roleNames: string[] }>) => {
      // update visual edge
      setEdges((es) => es.map(e => {
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
      // update dto mirror
      setDto((prev)=>{
        if (!prev) return prev;
        const next = { ...prev };
        next.transitions = next.transitions.map(t => {
          if (t.fromStatusId === selectedEdge.source && t.toStatusId === selectedEdge.target) {
            return { ...t, ...patch, type: (patch.type ?? t.type ?? "optional") } as TransitionVm;
          }
          return t;
        });
        return next;
      });
    };

const edgeData: Partial<EdgeData> = (selectedEdge.data as EdgeData | undefined) ?? {};

    // local drafts for IME-friendly typing
    const [labelDraft, setLabelDraft] = useState<string>(edgeData.label ?? "");
    const [ruleDraft, setRuleDraft] = useState<string>(edgeData.rule ?? "");

    useEffect(() => {
      setLabelDraft(edgeData.label ?? "");
      setRuleDraft(edgeData.rule ?? "");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEdge?.id, edgeData.label, edgeData.rule]);

    const commitLabel = (v: string) => updateEdge({ label: v });
    const commitRule = (v: string) => updateEdge({ rule: v });

    const selectedRoleNames: string[] = edgeData.roleNames || [];

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
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            value={labelDraft}
            placeholder={EDGE_LABEL[type]}
            onChange={(e)=>setLabelDraft(e.target.value)}
            onCompositionEnd={(e)=>commitLabel((e.target as HTMLInputElement).value)}
            onBlur={(e)=>commitLabel((e.target as HTMLInputElement).value)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Guard/Rule (JSON or expression)</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            value={ruleDraft}
            onChange={(e)=>setRuleDraft(e.target.value)}
            onCompositionEnd={(e)=>commitRule((e.target as HTMLInputElement).value)}
            onBlur={(e)=>commitRule((e.target as HTMLInputElement).value)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-500">Roles allowed to perform (free text)</label>
          <TagsInput
            value={selectedRoleNames}
            onChange={(next)=>updateEdge({ roleNames: next })}
            placeholder="Type a role and press Enter"
          />
        </div>

        <div className="pt-2 border-t flex items-center justify-between">
          <button onClick={deleteSelectedEdge} className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"><Trash2 size={16}/>Delete transition</button>
          <div className="text-xs text-gray-400">ID: {selectedEdge.id}</div>
        </div>
      </div>
    );
  }
}
