import React from "react";
import { Workflow as WorkflowIcon } from "lucide-react";
import WorkflowMini from "@/components/Workflow/WorkflowMini";
import WorkflowPreviewModal from "@/components/Workflow/WorkflowPreviewModal";

export default function WorkflowStep({
  companyId,
  canUseCompany,
  workflowMode,
  workflowId,
  workflowSelectedName,
  setWorkflowMode,
  setWorkflowId,
  setWorkflowSelectedName,
  errorWorkflowId,
  errorWorkflowName,
  onOpenPicker,
  onOpenCreate,
}: {
  companyId: string | null;
  canUseCompany: boolean;
  workflowMode: "existing" | "new";
  workflowId: string | null;
  workflowSelectedName: string;
  setWorkflowMode: (v: "existing" | "new") => void;
  setWorkflowId: (id: string | null) => void;
  setWorkflowSelectedName: (name: string) => void;
  errorWorkflowId?: string;
  errorWorkflowName?: string;
  onOpenPicker: () => void;
  onOpenCreate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-700">Workflow</div>

      {/* Existing */}
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="wf"
          className="size-4 accent-blue-600"
          checked={workflowMode === "existing"}
          onChange={() => setWorkflowMode("existing")}
        />
        <span className="text-slate-800">Use existing workflow</span>
      </label>

      {workflowMode === "existing" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPicker}
              disabled={!canUseCompany}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <WorkflowIcon className="size-4" /> Browse workflows
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {workflowId ? (
              <SelectedWorkflowPreview
                workflowId={workflowId}
                name={workflowSelectedName || "Workflow"}
                onClear={() => {
                  setWorkflowId(null);
                  setWorkflowSelectedName("");
                }}
              />
            ) : (
              <div className="text-xs text-slate-500">No workflow selected.</div>
            )}
          </div>

          {errorWorkflowId && <p className="text-xs text-rose-500">{errorWorkflowId}</p>}
        </div>
      )}

      {/* New */}
      <label className="mt-3 flex items-center gap-2">
        <input
          type="radio"
          name="wf"
          className="size-4 accent-blue-600"
          checked={workflowMode === "new"}
          onChange={() => setWorkflowMode("new")}
        />
        <span className="text-slate-800">Create new workflow</span>
      </label>

      {workflowMode === "new" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreate}
              disabled={!canUseCompany}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <WorkflowIcon className="size-4" /> Create in Designer
            </button>
          </div>
          {errorWorkflowName && <p className="-mt-2 text-xs text-rose-500">{errorWorkflowName}</p>}
          <div className="text-xs text-slate-500">
            Tip: điền tên rồi mở Designer để chỉnh sửa status/transition. Save xong sẽ tự gán.
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Internal: Selected workflow preview card ====== */
function SelectedWorkflowPreview({
  workflowId,
  name,
  onClear,
}: {
  workflowId: string;
  name: string;
  onClear: () => void;
}) {
  const [openPreview, setOpenPreview] = React.useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between border-b">
        <div className="font-medium truncate">{name || "Workflow"}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenPreview(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            Preview
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm rounded-lg text-rose-600 border border-rose-200 hover:bg-rose-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-2">
        {/* ✅ Mini tự fetch designer + ensure backlog/close */}
        <WorkflowMini workflowId={workflowId} height={180} autoFetch />
      </div>

      <div className="px-3 pb-2 flex items-center gap-4 text-xs text-gray-600">
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

      {openPreview && (
        <WorkflowPreviewModal
          open={openPreview}
          workflowId={workflowId}
          onClose={() => setOpenPreview(false)}
        />
      )}
    </div>
  );
}
