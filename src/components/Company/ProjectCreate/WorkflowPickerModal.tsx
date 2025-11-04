import React from "react";
import { createPortal } from "react-dom";
import { X, Eye } from "lucide-react";
import WorkflowMini from "@/components/Workflow/WorkflowMini";
import WorkflowPreviewModal from "@/components/Workflow/WorkflowPreviewModal";
import { getWorkflowPreviews } from "@/services/workflowService.js";
import type { WorkflowPreviewVm } from "@/types/workflow";

const isGuid = (s?: string | null) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

export default function WorkflowPickerModal({
  open, companyId, onClose, onSelect,
}: {
  open: boolean;
  companyId: string | null;
  onClose: () => void;
  onSelect: (wf: { id: string; name: string }) => void;
}) {
  const [items, setItems] = React.useState<WorkflowPreviewVm[]>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (!isGuid(companyId)) { setItems([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      try { setItems((await getWorkflowPreviews(companyId as string)) || []); }
      finally { setLoading(false); }
    })();
  }, [open, companyId]);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? items.filter(i => i.name.toLowerCase().includes(t)) : items;
  }, [items, q]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[1000px] rounded-2xl bg-white border shadow-xl h-[-webkit-fill-available] overflow-auto max-h-[86vh]" onClick={(e)=>e.stopPropagation()}>
          <div className="p-4 flex items-center justify-between border-b">
            <div className="font-semibold">Select a Workflow</div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="size-5" /></button>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Search workflows…"
                className="border rounded-lg px-3 py-2 text-sm w-[260px]"
              />
              {!isGuid(companyId) && (
                <span className="text-xs text-rose-600">
                  CompanyId chưa hợp lệ — mở ở URL dạng /companies/:companyId/...
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({length:6}).map((_,i)=>
                  <div key={i} className="rounded-lg border p-3 animate-pulse bg-white">
                    <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                    <div className="h-[160px] bg-gray-100 rounded" />
                  </div>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500 text-sm">No workflows found.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(w => (
                  <div key={w.id} className="rounded-lg border bg-white overflow-hidden">
                    <div className="px-3 py-2 flex items-center justify-between border-b">
                      <div className="font-medium truncate">{w.name}</div>
                      <button onClick={()=>setPreviewId(w.id)} className="p-1 rounded hover:bg-gray-100" title="Preview">
                        <Eye size={16} />
                      </button>
                    </div>
                    <WorkflowMini data={w} />
                    <div className="px-3 py-2 border-t flex items-center justify-end">
                      <button
                        onClick={()=>{ onSelect({id: w.id, name: w.name}); onClose(); }}
                        className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewId && (
            <WorkflowPreviewModal open={!!previewId} workflowId={previewId} onClose={()=>setPreviewId(null)} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
