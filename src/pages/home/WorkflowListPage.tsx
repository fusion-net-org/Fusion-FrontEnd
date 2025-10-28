import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { deleteWorkflow, getWorkflowPreviews } from "@/services/workflowService.js";
import type { WorkflowPreviewVm } from "@/types/workflow";
import WorkflowMini from "@/components/Workflow/WorkflowMini";
import WorkflowPreviewModal from "@/components/Workflow/WorkflowPreviewModal";

export default function WorkflowListPage() {
  const { companyId = "" } = useParams();
  const nav = useNavigate();

  const [items, setItems] = useState<WorkflowPreviewVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getWorkflowPreviews(companyId);
        setItems(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(i => i.name.toLowerCase().includes(t));
  }, [items, q]);

  const onDelete = async (w: WorkflowPreviewVm) => {
    if (!confirm(`Delete workflow "${w.name}"?`)) return;
    await deleteWorkflow(companyId, w.id);
    setItems(prev => prev.filter(x => x.id !== w.id));
  };

  const goCreate = () => nav(`/companies/${companyId}/workflows/new`);
  const goEdit = (w: WorkflowPreviewVm) =>
    nav(`/companies/${companyId}/workflows/${w.id}`);

  return (
    <div className="px-4 py-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">Workflows</div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workflows…"
            className="border rounded-lg px-3 py-2 text-sm w-[260px]"
          />
          <button
            onClick={goCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            <Plus size={16} /> New workflow
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3 animate-pulse bg-white">
              <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
              <div className="h-[180px] bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No workflows found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <div key={w.id} className="rounded-lg border bg-white overflow-hidden">
              {/* Card header */}
              <div className="px-3 py-2 flex items-center justify-between border-b">
                <div className="font-medium truncate">{w.name || "Workflow"}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goEdit(w)}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Edit designer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(w)}
                    className="p-1 rounded hover:bg-gray-100 text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Thumbnail */}
              <WorkflowMini data={w} />

              {/* Legend + actions */}
              <div className="px-3 pb-2 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} /> Success
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} /> Fail
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#111827" }} /> Optional
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 flex items-center justify-end gap-2 border-t">
                <button
                  onClick={() => setPreviewId(w.id)} // mở modal
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={() => goEdit(w)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
                >
                  <Pencil size={16} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview */}
      {previewId && (
        <WorkflowPreviewModal
          workflowId={previewId}
          open={!!previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}
