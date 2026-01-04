import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import WorkflowDesigner from "@/components/Workflow/WorkflowDesigner";
import { postWorkflowWithDesigner } from "@/services/workflowService.js";
import type { DesignerDto } from "@/types/workflow";

/* helper tạo dto demo ban đầu */
const makeInitialDto = (name = "New Workflow"): DesignerDto => {
  const uid = () =>
    (typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2));

 const s1 = {
    id: uid(),
    name: "To Do",
    isStart: true,
    isEnd: false,
    x: 200,
    y: 350,
    roles: ["Developer"],
    color: "#6b7280",
  };

  const s2 = {
    id: uid(),
    name: "In Review",
    isStart: false,
    isEnd: false,
    x: 520,
    y: 350,
    roles: ["Reviewer"],
    color: "#4f46e5",
  };

  const s3 = {
    id: uid(),
    name: "Done",
    isStart: false,
    isEnd: true,
    x: 840,
    y: 350,
    roles: ["QA"],
    color: "#16a34a",
  };
  return {
    workflow: { id: uid(), name },
    statuses: [s1, s2, s3],
    transitions: [
      { fromStatusId: s1.id, toStatusId: s2.id, type: 'success', label: 'Go' },
      { fromStatusId: s2.id, toStatusId: s3.id, type: 'success', label: 'Complete' },
      { fromStatusId: s3.id, toStatusId: s2.id, type: 'failure', label: 'Rework' },
    ],
  };
};

const isGuid = (s?: string | null) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

export default function CreateWorkflowModal({
  open, companyId, onClose, onCreated,
}: {
  open: boolean;
  companyId: string | null;
  onClose: () => void;
  onCreated: (wf: { id: string; name: string }) => void;
}) {
  const [dto] = React.useState<DesignerDto>(() => makeInitialDto());

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async (payload: DesignerDto) => {
    if (!isGuid(companyId)) throw new Error("Invalid companyId — cannot create workflow.");
    const result = await postWorkflowWithDesigner(companyId as string, payload);
    const wfId = typeof result === "string" ? result : (result as any)?.id;
    if (!wfId) throw new Error("Cannot get workflowId from POST response");
    onCreated({ id: wfId, name: payload.workflow.name });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
        <div
          className="relative w-full max-w-[1200px] h-[88vh] rounded-2xl bg-white border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-white/85 backdrop-blur">
            <div className="font-semibold">Create workflow</div>
            <button type="button" aria-label="Close" onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100">
              <X className="size-5" />
            </button>
          </div>

          <div className="h-full pt-[52px] overflow-auto">
            <WorkflowDesigner initialDto={dto} onSave={handleSave} title="Create workflow" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
