// src/pages/workflow/WorkflowDesignerPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WorkflowDesigner from "@/components/Workflow/WorkflowDesigner";
import type { DesignerDto } from "@/types/workflow";
import { getWorkflowDesigner, postWorkflow, putWorkflowDesigner, postWorkflowWithDesigner } from "@/services/workflowService.js";
import { toast } from "react-toastify";

const makeInitialDto = (name = "New Workflow"): DesignerDto => {
  const uid = () => (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2));
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
      { fromStatusId: s1.id, toStatusId: s2.id, type: "success", label: "Go" },
      { fromStatusId: s2.id, toStatusId: s3.id, type: "success", label: "Complete" },
      { fromStatusId: s3.id, toStatusId: s2.id, type: "failure", label: "Rework" },
    ],
  };
};

export default function WorkflowDesignerPage() {
  const { companyId = "", workflowId } = useParams();
  const isEdit = !!workflowId;
  const nav = useNavigate();

  const [initialDto, setInitialDto] = useState<DesignerDto>(makeInitialDto());
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      const dto = await getWorkflowDesigner(workflowId!);
      setInitialDto(dto);
      setLoading(false);
    })();
  }, [isEdit, workflowId]);

  const title = isEdit ? "Edit workflow" : "Create workflow";

  const onSave = async (payload: DesignerDto) => {
    let wfId = workflowId;
    if (!isEdit) {
      const created = await postWorkflowWithDesigner(companyId, payload);
      wfId = typeof created === "string" ? created : (created as any)?.id;
      if (!wfId) throw new Error("Cannot get workflowId from POST response");
    }
    await putWorkflowDesigner(companyId, wfId!, {
      ...payload,
      workflow: { id: wfId!, name: payload.workflow.name },
    });
    // điều hướng về list hoặc trang chi tiết
    // nav(`/companies/${companyId}/workflows/${wfId}`);
    toast("Workflow saved successfully!");
    nav(-1);
  };

  if (loading) return <div className="h-[80vh] grid place-items-center text-gray-500">Loading...</div>;

  return (
    <WorkflowDesigner
      initialDto={initialDto}
      onSave={onSave}
      title={title}
    />
  );
}
