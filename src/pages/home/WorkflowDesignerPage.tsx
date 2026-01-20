// src/pages/workflow/WorkflowDesignerPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WorkflowDesigner from "@/components/Workflow/WorkflowDesigner";
import type { DesignerDto } from "@/types/workflow";
import {
  getWorkflowDesigner,
  putWorkflowDesigner,
  postWorkflowWithDesigner,
} from "@/services/workflowService.js";
import { toast } from "react-toastify";

const genId = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2);

/** ===== system detect helpers (same rule as UI) ===== */
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const getSystemKey = (st: any) => norm(st?.systemKey ?? st?.name);
const isBacklogStatus = (st: any) => getSystemKey(st) === "backlog";
const isCloseStatus = (st: any) => getSystemKey(st) === "close";
const isSystemStatusVm = (st: any) =>
  !!st && (!!st.locked || isBacklogStatus(st) || isCloseStatus(st));

const isSystemTransitionVm = (t: any) =>
  (t?.type ?? "optional") === "system" || !!t?.locked;

/**
 * UI-only: đảm bảo có Backlog/Close + 2 system edges để UI vẽ.
 * (Không dùng function này để persist!)
 */
const ensureSystemNodesUiOnly = (dto: DesignerDto): DesignerDto => {
  const statuses: any[] = Array.isArray((dto as any).statuses)
    ? [...(((dto as any).statuses as any[]) ?? [])]
    : [];
  const transitions: any[] = Array.isArray((dto as any).transitions)
    ? [...(((dto as any).transitions as any[]) ?? [])]
    : [];

  // remove any system stuff from server (nếu trước đó lỡ lưu)
  const normalStatuses = statuses.filter((s) => !isSystemStatusVm(s));
  const normalTransitions = transitions.filter((t) => t && !isSystemTransitionVm(t));

  // Find Start/End among normal statuses
  const start = normalStatuses.find((s) => !!s?.isStart);
  const end = normalStatuses.find((s) => !!s?.isEnd);
 if (!start || !end) {
  return { ...dto, statuses, transitions: normalTransitions };
}


  // Find or create Backlog
  let backlog = statuses.find(isBacklogStatus);
  if (!backlog) {
    backlog = {
      id: genId(),
      name: "Backlog",
      isStart: false,
      isEnd: false,
      x: (start.x ?? 200) - 280,
      y: start.y ?? 350,
      roles: [],
      color: "#111827",
      systemKey: "backlog",
      locked: true,
    } as any;
  } else {
    backlog = {
      ...backlog,
      name: "Backlog",
      isStart: false,
      isEnd: false,
      roles: Array.isArray(backlog.roles) ? backlog.roles : [],
      color: backlog.color ?? "#111827",
      systemKey: "backlog",
      locked: true,
    };
  }

  // Find or create Close
  let close = statuses.find(isCloseStatus);
  if (!close) {
    close = {
      id: genId(),
      name: "Close",
      isStart: false,
      isEnd: false,
      x: (end.x ?? 840) + 280,
      y: end.y ?? 350,
      roles: [],
      color: "#9ca3af",
      systemKey: "close",
      locked: true,
    } as any;
  } else {
    close = {
      ...close,
      name: "Close",
      isStart: false,
      isEnd: false,
      roles: Array.isArray(close.roles) ? close.roles : [],
      color: close.color ?? "#9ca3af",
      systemKey: "close",
      locked: true,
    };
  }

  // Clean transitions: nobody -> Backlog, Close -> anybody
  const cleaned = normalTransitions.filter((t) => {
    if (!t) return false;
    if (String(t.toStatusId) === String(backlog.id)) return false;
    if (String(t.fromStatusId) === String(close.id)) return false;
    // strip any edge that references backlog/close
    if (String(t.fromStatusId) === String(backlog.id)) return false;
    if (String(t.toStatusId) === String(close.id)) return false;
    return true;
  });

  // Add 2 system edges (UI-only)
  const sysBacklogToStart = {
    fromStatusId: String(backlog.id),
    toStatusId: String(start.id),
    type: "system",
    label: "",
    enforceTransitions: true,
    locked: true,
  } as any;

  const sysEndToClose = {
    fromStatusId: String(end.id),
    toStatusId: String(close.id),
    type: "system",
    label: "",
    enforceTransitions: true,
    locked: true,
  } as any;

  // Ensure they exist exactly once
  const noSysDup = cleaned.filter(
    (t) =>
      !(
        (String(t.fromStatusId) === String(sysBacklogToStart.fromStatusId) &&
          String(t.toStatusId) === String(sysBacklogToStart.toStatusId)) ||
        (String(t.fromStatusId) === String(sysEndToClose.fromStatusId) &&
          String(t.toStatusId) === String(sysEndToClose.toStatusId))
      )
  );

  return {
    ...(dto as any),
    statuses: [backlog, ...normalStatuses, close],
    transitions: [sysBacklogToStart, ...noSysDup, sysEndToClose],
  } as DesignerDto;
};

/**
 * Persist-only: loại bỏ Backlog/Close + system transitions khỏi payload trước khi gọi API.
 */
const stripSystemForPersist = (dto: DesignerDto): DesignerDto => {
  const statuses: any[] = Array.isArray((dto as any).statuses)
    ? [...(((dto as any).statuses as any[]) ?? [])]
    : [];
  const transitions: any[] = Array.isArray((dto as any).transitions)
    ? [...(((dto as any).transitions as any[]) ?? [])]
    : [];

  const systemIds = new Set(
    statuses.filter((s) => isSystemStatusVm(s)).map((s) => String(s.id))
  );

  const keptStatuses = statuses.filter((s) => !isSystemStatusVm(s));

  const keptTransitions = transitions
    .filter((t) => t && !isSystemTransitionVm(t))
    .filter((t) => !systemIds.has(String(t.fromStatusId)) && !systemIds.has(String(t.toStatusId)))
    .map((t) => {
      // backend thường không cần locked của UI
      const { locked, ...rest } = t;
      return rest;
    });

  return {
    ...(dto as any),
    statuses: keptStatuses,
    transitions: keptTransitions,
  } as DesignerDto;
};

const makeInitialDto = (name = "New Workflow"): DesignerDto => {
  const uid = genId;

   const s1 = {
    id: uid(),
    name: "Development",
    isStart: true,
    isEnd: false,
    x: 200,
    y: 350,
    roles: ["Developer"],
    color: "#6b7280",
  };

  // 2) Code Review
  const s2 = {
    id: uid(),
    name: "Code Review",
    isStart: false,
    isEnd: false,
    x: 520,
    y: 350,
    roles: ["Reviewer"], // (Peer Dev / Tech Lead)
    color: "#4f46e5",
  };

  // 3) QA Testing
  const s3 = {
    id: uid(),
    name: "QA Testing",
    isStart: false,
    isEnd: false,
    x: 840,
    y: 350,
    roles: ["QA"],
    color: "#f59e0b",
  };

  // 4) UAT / PO Acceptance
  const s4 = {
    id: uid(),
    name: "UAT / PO Acceptance",
    isStart: false,
    isEnd: false,
    x: 1160,
    y: 350,
    roles: ["Product Owner"],
    color: "#2563eb",
  };

  // 5) Done (End)
  const s5 = {
    id: uid(),
    name: "Done",
    isStart: false,
    isEnd: true,
    x: 1480,
    y: 350,
    roles: ["Product Owner"], // hoặc [] nếu bạn muốn Done không assign ai
    color: "#16a34a",
  };

  return {
    workflow: { id: uid(), name },
    statuses: [s1, s2, s3, s4, s5] as any,
    transitions: [
      // happy path (enforced)
      { fromStatusId: s1.id, toStatusId: s2.id, type: "success", label: "Submit for review", enforceTransitions: true } as any,
      { fromStatusId: s2.id, toStatusId: s3.id, type: "success", label: "Approved", enforceTransitions: true } as any,
      { fromStatusId: s3.id, toStatusId: s4.id, type: "success", label: "QA passed", enforceTransitions: true } as any,
      { fromStatusId: s4.id, toStatusId: s5.id, type: "success", label: "Accepted", enforceTransitions: true } as any,

     
    ] as any,
  } as DesignerDto;
};

export default function WorkflowDesignerPage() {
  const { companyId = "", workflowId } = useParams();
  const isEdit = !!workflowId;
  const nav = useNavigate();

  const [initialDto, setInitialDto] = useState<DesignerDto>(() =>
    ensureSystemNodesUiOnly(makeInitialDto())
  );
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      const dto = await getWorkflowDesigner(workflowId!);

      // UI needs backlog/close, but server payload should remain clean
      setInitialDto(ensureSystemNodesUiOnly(dto));
      setLoading(false);
    })();
  }, [isEdit, workflowId]);

  const title = isEdit ? "Edit workflow" : "Create workflow";

  const onSave = async (payloadFromDesigner: DesignerDto) => {
    // ✅ ALWAYS sanitize before calling API
    const persistPayload = stripSystemForPersist(
      ensureSystemNodesUiOnly(payloadFromDesigner) // idempotent
    );

    let wfId = workflowId;

    if (!isEdit) {
      const created = await postWorkflowWithDesigner(companyId, persistPayload);
      wfId = typeof created === "string" ? created : (created as any)?.id;
      if (!wfId) throw new Error("Cannot get workflowId from POST response");
    }

    await putWorkflowDesigner(companyId, wfId!, {
      ...persistPayload,
      workflow: { id: wfId!, name: persistPayload.workflow.name },
    });

    toast("Workflow saved successfully!");
    nav(-1);
  };

  if (loading) return <div className="h-[80vh] grid place-items-center text-gray-500">Loading...</div>;

  return <WorkflowDesigner initialDto={initialDto} onSave={onSave} title={title} />;
}
