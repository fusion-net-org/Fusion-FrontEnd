/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  Users2,
  CalendarDays,
  Building2,
  Workflow as WorkflowIcon,
  Flag,
  Activity,
  UserPlus,
  Search,
  Trash2,
  Shield,
  Edit3,
  Eye,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  GetProjectByProjectId,
  getCompanyMembersPaged,
  updateProject,
  closeProject,
  reopenProject,
} from "@/services/projectService.js";
import {
  addProjectMember,
  removeProjectMember,
  getProjectMemberByProjectId,
} from "@/services/projectMember.js";
import { fetchSprintBoard } from "@/services/projectBoardService.js";

import { getSelfUser, getUserById } from "@/services/userService.js";

// === Workflow preview bits ===
import WorkflowMini from "@/components/Workflow/WorkflowMini";
import WorkflowPreviewModal from "@/components/Workflow/WorkflowPreviewModal";
import { getWorkflowPreviews } from "@/services/workflowService.js";
import type { WorkflowPreviewVm } from "@/types/workflow";
import { Can } from "@/permission/PermissionProvider";
import ProjectActivityTimeline from "@/components/Company/Projects/ProjectActivityTimeline";

// ===== Local types =====

type ProjectStatus = "Planned" | "InProgress" | "OnHold" | "Completed";

type ProjectMemberVm = {
  userId: string;
  name: string;
  email?: string | null;
  roleName?: string | null;
  isPartner?: boolean;
  isViewAll?: boolean;
  joinedAt?: string | null; // ISO
};

type ProjectDetailVm = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  isHired: boolean;

  companyId: string;
  companyName: string;
  companyHiredId?: string | null;
  companyHiredName?: string | null;

  workflowId: string;
  workflowName: string;

  sprintLengthWeeks: number;
  startDate: string | null; // ISO
  endDate: string | null; // ISO

  isClosed: boolean;
  createdById: string | null;
  createdAt: string;
  createdByName: string;

  stats: {
    totalSprints: number;
    activeSprints: number;
    totalTasks: number;
    doneTasks: number;
    totalStoryPoints: number;
  };

  members: ProjectMemberVm[];
};

type ConfirmState =
  | { kind: "none" }
  | { kind: "closeProject" }
  | { kind: "reopenProject" }
  | { kind: "kickMember"; member: ProjectMemberVm };

// ===== Helpers =====

const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s || "",
  );

const sameId = (a?: string | null, b?: string | null) =>
  !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const initials = (name: string | null | undefined) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const statusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case "Planned":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "InProgress":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "OnHold":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const progressPercent = (stats: ProjectDetailVm["stats"]) => {
  if (!stats.totalTasks) return 0;
  return Math.round((stats.doneTasks / stats.totalTasks) * 100);
};

// map member từ project DTO
const mapProjectMember = (m: any): ProjectMemberVm => ({
  userId: String(m.userId ?? m.memberId ?? m.id ?? ""),
  name:
    m.name ??
    m.memberName ??
    m.fullName ??
    m.userName ??
    m.email ??
    "Unknown",
  email: m.email ?? null,
  roleName: m.roleName ?? m.projectRoleName ?? m.companyRoleName ?? null,
  isPartner: !!(m.isPartner ?? m.isExternal ?? m.isOutsourced),
  isViewAll: !!(m.isViewAll ?? m.canViewAllProjects),
  joinedAt: m.joinedAt ?? m.createdAt ?? null,
});

// map member từ companyMemberPaged DTO
const mapCompanyMemberToVm = (m: any): ProjectMemberVm => ({
  userId: String(m.memberId ?? m.userId ?? m.id ?? ""),
  name: m.memberName ?? m.email ?? "Unknown",
  email: m.email ?? null,
  roleName: m.roleName ?? null,
  isPartner: false,
  isViewAll: false,
  joinedAt: null,
});

// ===== Small components =====

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 shadow-sm">
    <div className="flex size-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-800 break-words">{value}</div>
    </div>
  </div>
);

// stats from sprint-board
type BoardPayload = { sprints: any[]; tasks: any[] };

const buildStatsFromBoard = (board: BoardPayload): ProjectDetailVm["stats"] => {
  const sprints = Array.isArray(board.sprints) ? board.sprints : [];
  const tasks = Array.isArray(board.tasks) ? board.tasks : [];

  const totalSprints = sprints.length;
  const totalTasks = tasks.length;

  const doneTasks = tasks.filter(
    (t) => t.statusCategory === "DONE" || t.statusName === "Done",
  ).length;

  const totalStoryPoints = tasks.reduce(
    (sum, t) => sum + (t.storyPoints ?? 0),
    0,
  );

  const activeSprints = sprints.filter((s) =>
    ["Active", "InProgress", "Running"].includes(String(s.state)),
  ).length;

  return { totalSprints, activeSprints, totalTasks, doneTasks, totalStoryPoints };
};

async function safeGetUserDisplayName(userId?: string | null) {
  if (!userId || !isGuid(userId)) return "";
  try {
    const res: any = await getUserById(userId);
    const u: any = res?.data ?? res ?? {};
    return (
      u.fullName ??
      u.name ??
      u.userName ??
      u.email ??
      u.user?.fullName ??
      u.user?.name ??
      ""
    );
  } catch {
    return "";
  }
}

// ===== MAIN PAGE =====

export default function ProjectDetailPage() {
  const { companyId, projectId } = useParams<{ companyId: string; projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = React.useState<ProjectDetailVm | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"overview" | "members" | "activity">("overview");

  const [meId, setMeId] = React.useState<string | null>(null);

  const [memberSearch, setMemberSearch] = React.useState("");
  const [availableMembers, setAvailableMembers] = React.useState<ProjectMemberVm[]>([]);

  // edit basic info
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [savingBasic, setSavingBasic] = React.useState(false);

  const [closing, setClosing] = React.useState(false);
  const [reopening, setReopening] = React.useState(false);
  const [actionsOpen, setActionsOpen] = React.useState(false);

  // workflow preview state
  const [workflowPreview, setWorkflowPreview] = React.useState<WorkflowPreviewVm | null>(null);
  const [loadingWorkflowPreview, setLoadingWorkflowPreview] = React.useState(false);
  const [workflowPreviewOpen, setWorkflowPreviewOpen] = React.useState(false);

  // confirm modal state
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({ kind: "none" });

  // Load detail
  React.useEffect(() => {
    let alive = true;

    (async () => {
      if (!projectId) return;
      setLoading(true);

      try {
        // self user (for permission: canClose)
        const selfRaw = await getSelfUser().catch(() => null);
        const selfData: any = selfRaw?.data ?? selfRaw ?? null;
        const currentUserId =
          selfData?.id ?? selfData?.userId ?? selfData?.data?.id ?? null;

        if (alive) setMeId(currentUserId ? String(currentUserId) : null);

        // main payloads
        const [detailRaw, board, memberPaged] = await Promise.all<any>([
          GetProjectByProjectId(projectId),
          fetchSprintBoard(projectId),
          getProjectMemberByProjectId(projectId, "", "", "", 1, 200),
        ]);
        if (!alive) return;

        const detail: any = detailRaw?.data ?? detailRaw ?? {};
        const memberPayload: any = memberPaged?.data ?? memberPaged ?? {};

        // createdBy + createdAt
        const createdById: string | null = String(
          detail.createdBy ??
          detail.createdById ??
          detail.createdByUserId ??
          detail.createdByUser ??
          "",
        ) || null;

        const createdAt: string =
          detail.createdAt ??
          detail.createAt ??
          detail.createdOn ??
          detail.created_time ??
          new Date().toISOString();

        // createdByName ưu tiên field, thiếu thì dùng getUserById
        let createdByName: string =
          detail.createdByName ??
          detail.createByName ??
          detail.createdByUserName ??
          detail.createdByDisplayName ??
          "";

        if ((!createdByName || isGuid(createdByName)) && createdById) {
          const nameFromApi = await safeGetUserDisplayName(createdById);
          if (nameFromApi) createdByName = nameFromApi;
        }

        // members
        const rawMembersFromProject: any[] =
          detail.members ?? detail.projectMembers ?? detail.projectMemberResults ?? [];

        const memberItems: any[] = Array.isArray(memberPayload.items)
          ? memberPayload.items
          : Array.isArray(memberPayload)
            ? memberPayload
            : [];

        const rawMembers: any[] = memberItems.length > 0 ? memberItems : rawMembersFromProject;
        const mappedMembers: ProjectMemberVm[] = Array.isArray(rawMembers)
          ? rawMembers.map(mapProjectMember)
          : [];

        // stats
        const rawStats = detail.stats ?? detail.boardSnapshot ?? detail.boardStats ?? {};
        const statsFromDetail: ProjectDetailVm["stats"] = {
          totalSprints: rawStats.totalSprints ?? rawStats.sprintCount ?? detail.totalSprints ?? 0,
          activeSprints: rawStats.activeSprints ?? rawStats.activeSprintCount ?? detail.activeSprints ?? 0,
          totalTasks: rawStats.totalTasks ?? rawStats.taskCount ?? detail.totalTasks ?? 0,
          doneTasks: rawStats.doneTasks ?? rawStats.doneTaskCount ?? detail.doneTasks ?? 0,
          totalStoryPoints: rawStats.totalStoryPoints ?? rawStats.storyPoints ?? detail.totalStoryPoints ?? 0,
        };

        const statsFromBoard = buildStatsFromBoard(board);
        const stats: ProjectDetailVm["stats"] = {
          totalSprints: statsFromBoard.totalSprints || statsFromDetail.totalSprints,
          activeSprints: statsFromBoard.activeSprints || statsFromDetail.activeSprints,
          totalTasks: statsFromBoard.totalTasks || statsFromDetail.totalTasks,
          doneTasks: statsFromBoard.doneTasks || statsFromDetail.doneTasks,
          totalStoryPoints: statsFromBoard.totalStoryPoints || statsFromDetail.totalStoryPoints,
        };

        // pool availableMembers (company members chưa join project)
        let pool: ProjectMemberVm[] = [];
        if (companyId) {
          const res = await getCompanyMembersPaged(companyId, { pageNumber: 1, pageSize: 100 });
          if (!alive) return;

          const assignedIds = new Set(mappedMembers.map((x) => x.userId.toLowerCase()));
          pool = (res.items || [])
            .filter((m: any) => {
              const mid = String(m.memberId ?? m.userId ?? m.id ?? "").toLowerCase();
              return mid && !assignedIds.has(mid);
            })
            .map(mapCompanyMemberToVm);
        }

        const vm: ProjectDetailVm = {
          id: String(detail.id ?? projectId),
          code: detail.code ?? "",
          name: detail.name ?? "",
          description: detail.description ?? "",
          status: (detail.status as ProjectStatus) ?? "Planned",
          isHired: !!detail.isHired,

          companyId: String(detail.companyId ?? companyId ?? ""),
          companyName:
            detail.companyName ??
            detail.companyExecutorName ??
            detail.ownerCompany ??
            detail.company ??
            "",
          companyHiredId: detail.companyHiredId ?? null,
          companyHiredName: detail.companyHiredName ?? detail.hiredCompanyName ?? null,

          workflowId: String(detail.workflowId ?? ""),
          workflowName: detail.workflowName ?? detail.workflow ?? "",

          sprintLengthWeeks: detail.sprintLengthWeeks ?? 1,
          startDate: detail.startDate ?? null,
          endDate: detail.endDate ?? null,

          isClosed: !!detail.isClosed,
          createdById: createdById,
          createdAt,
          createdByName: createdByName || "",

          stats,
          members: mappedMembers,
        };

        setProject(vm);
        setAvailableMembers(pool);
      } catch (err) {
        console.error("Load project detail failed", err);
        if (alive) {
          setProject(null);
          setAvailableMembers([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId, companyId]);

  // load workflow preview mini card
  React.useEffect(() => {
    let alive = true;

    const loadPreview = async () => {
      if (!companyId || !project?.workflowId || !isGuid(companyId)) {
        if (alive) setWorkflowPreview(null);
        return;
      }

      setLoadingWorkflowPreview(true);
      try {
        const list = (await getWorkflowPreviews(companyId)) as
          | WorkflowPreviewVm[]
          | null
          | undefined;

        if (!alive) return;
        const found = (list ?? []).find((x) => x.id === project.workflowId) ?? null;
        setWorkflowPreview(found);
      } catch (err) {
        console.error("Load workflow preview failed", err);
        if (alive) setWorkflowPreview(null);
      } finally {
        if (alive) setLoadingWorkflowPreview(false);
      }
    };

    loadPreview();
    return () => {
      alive = false;
    };
  }, [companyId, project?.workflowId]);

  // sync edit fields
  React.useEffect(() => {
    if (project) {
      setEditName(project.name);
      setEditDescription(project.description ?? "");
    }
  }, [project]);

  const canCloseProject = React.useMemo(() => {
    return !!project?.createdById && !!meId && sameId(project.createdById, meId);
  }, [project?.createdById, meId]);

  const canKickMember = React.useCallback(
    (memberUserId?: string | null) => {
      if (!project || !memberUserId) return false;
      if (sameId(memberUserId, project.createdById)) return false; // owner
      if (sameId(memberUserId, meId)) return false; // self
      return true;
    },
    [project, meId],
  );

const handleOpenBoard = () => {
  if (!companyId || !projectId) return;
  navigate(`/companies/${companyId}/project/${projectId}`);
};


  const handleViewWorkflow = () => {
    if (!companyId || !project?.workflowId) return;
    navigate(`/companies/${companyId}/workflows/${project.workflowId}`);
  };

  const handleStartEditBasic = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setIsEditing(true);
    setActionsOpen(false);
  };

  const handleCancelEditBasic = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setIsEditing(false);
  };

  const handleSaveBasic = async () => {
    if (!project) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error("Project name is required.");
      return;
    }

    setSavingBasic(true);
    try {
      const payload: any = {
        id: project.id,
        companyId: project.companyId,
        name: trimmedName,
        description: editDescription.trim() || null,
      };

      const res: any = await updateProject(project.id, payload);
      const updated = res?.data ?? res ?? payload;

      setProject((prev) =>
        prev
          ? {
            ...prev,
            name: updated.name ?? trimmedName,
            description: updated.description ?? (editDescription.trim() || null),
          }
          : prev,
      );

      setIsEditing(false);
      toast.success("Project updated.");
    } catch (err) {
      console.error("Update project failed", err);
      toast.error("Failed to update project.");
    } finally {
      setSavingBasic(false);
    }
  };
  const handleOpenClosureReport = React.useCallback(() => {
    if (!companyId || !projectId) return;
    navigate(`/companies/${companyId}/project/${projectId}/closue`);
  }, [companyId, projectId, navigate]);


  const handleReopenProject = async () => {
    if (!project) return;

    if (!canCloseProject) {
      toast.error("Only the creator can reopen this project.");
      return;
    }
    if (!project.isClosed) {
      toast.info("Project is not closed.");
      return;
    }

    setReopening(true);
    try {
      await reopenProject(project.id);

      setProject((prev) => (prev ? { ...prev, isClosed: false } : prev));
      toast.success("Project reopened.");
    } catch (err: any) {
      console.error("Reopen project failed", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to reopen project.");
    } finally {
      setReopening(false);
      setActionsOpen(false);
    }
  };

  const handleCloseProject = async () => {
    if (!project) return;

    if (!canCloseProject) {
      toast.error("Only the creator can close this project.");
      return;
    }
    if (project.isClosed) {
      toast.info("Project is already closed.");
      return;
    }

    setClosing(true);
    try {
      await closeProject(project.id);

      setProject((prev) => (prev ? { ...prev, isClosed: true } : prev));
      toast.success("Project closed.");
    } catch (err: any) {
      console.error("Close project failed", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to close project.");
    } finally {
      setClosing(false);
      setActionsOpen(false);
    }
  };


  const projectStats = project ? project.stats : null;
  const progress = projectStats ? progressPercent(projectStats) : 0;

  const filteredMembers = React.useMemo(() => {
    if (!project) return [];
    const q = memberSearch.trim().toLowerCase();
    if (!q) return project.members;
    return project.members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.roleName?.toLowerCase().includes(q),
    );
  }, [project, memberSearch]);

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;

    if (!canKickMember(userId)) {
      toast.info("You cannot kick the project owner or yourself.");
      return;
    }

    const removed = project.members.find((m) => m.userId === userId);
    if (!removed) return;

    const prevProject = project;
    const prevAvailable = availableMembers;

    setProject({
      ...project,
      members: project.members.filter((m) => m.userId !== userId),
    });
    setAvailableMembers((prev) => [...prev, { ...removed, joinedAt: null }]);

    try {
      await removeProjectMember(project.id, userId);
      toast.success("Member removed.");
    } catch (err) {
      console.error("Remove project member failed", err);
      setProject(prevProject);
      setAvailableMembers(prevAvailable);
      toast.error("Failed to remove member.");
    }
  };

  const handleAddMember = async (m: ProjectMemberVm) => {
    if (!project) return;
    if (project.members.some((x) => x.userId === m.userId)) return;

    const prevProject = project;
    const prevAvailable = availableMembers;

    const newMember: ProjectMemberVm = { ...m, joinedAt: new Date().toISOString() };

    setProject({ ...project, members: [...project.members, newMember] });
    setAvailableMembers((prev) => prev.filter((x) => x.userId !== m.userId));

    try {
      await addProjectMember({
        projectId: project.id,
        companyId: project.companyId,
        userId: m.userId,
        isPartner: m.isPartner ?? false,
        isViewAll: m.isViewAll ?? false,
      });
      toast.success("Member added.");
    } catch (err) {
      console.error("Add project member failed", err);
      setProject(prevProject);
      setAvailableMembers(prevAvailable);
      toast.error("Failed to add member.");
    }
  };

  const handleCancelConfirm = () => {
    if (closing) return;
    setConfirmState({ kind: "none" });
  };

  const handleConfirmAction = async () => {
    if (!project) return;

    if (confirmState.kind === "closeProject") {
      await handleCloseProject();
      setConfirmState({ kind: "none" });
      return;
    }
    if (confirmState.kind === "reopenProject") {
      await handleReopenProject();
      setConfirmState({ kind: "none" });
      return;
    }
    if (confirmState.kind === "kickMember") {
      await handleRemoveMember(confirmState.member.userId);
      setConfirmState({ kind: "none" });
      return;
    }
  };

  if (loading || !project) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <div className="size-5 rounded-full bg-slate-100 animate-pulse" />
          Loading project…
        </div>
        <div className="h-52 rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse" />
      </div>
    );
  }

  const displayCreatorName =
    project.createdByName && !isGuid(project.createdByName) ? project.createdByName : "Unknown user";

  const isCloseProjectConfirm = confirmState.kind === "closeProject";
  const isReopenProjectConfirm = confirmState.kind === "reopenProject";

  const isKickMemberConfirm = confirmState.kind === "kickMember";
  const memberName = confirmState.kind === "kickMember" ? confirmState.member.name : undefined;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">


      {/* Header */}
      <div
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)]"
        style={{
          backgroundImage:
            "radial-gradient(900px 260px at 50% -120px, rgba(37,99,235,0.06), transparent 60%)",
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          {/* LEFT */}
          <div className="flex-1 space-y-3">
            {/* tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                {project.code}
              </span>

              <span
                className={
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium " +
                  statusBadgeClass(project.status)
                }
              >
                {project.status === "InProgress"
                  ? "In progress"
                  : project.status === "OnHold"
                    ? "On hold"
                    : project.status}
              </span>

              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-100">
                {project.isHired ? "Outsourced project" : "Internal product"}
              </span>

              {project.isClosed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  <Lock className="size-3" />
                  Closed
                </span>
              )}
            </div>

            {/* title + desc */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Project name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={200}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Short context so the team understands the scope."
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveBasic}
                      disabled={savingBasic}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingBasic && (
                        <span className="size-3 animate-spin rounded-full border border-white/60 border-t-transparent" />
                      )}
                      Save changes
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEditBasic}
                      disabled={savingBasic}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <h1 className="flex-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      {project.name}
                    </h1>
                    <Can code="PROJECT_UPDATE">
                      <button
                        type="button"
                        onClick={handleStartEditBasic}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 className="size-3.5" />
                        Edit
                      </button>
                    </Can>
                  </div>

                  {project.description && (
                    <p className="max-w-2xl text-sm text-slate-600">{project.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* grid */}
            <div className="grid gap-3 text-xs text-slate-600 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
              {/* Board snapshot */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Board snapshot
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                    {progress}% done
                  </span>
                </div>

                <dl className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Sprints</dt>
                    <dd className="text-slate-900 font-medium">
                      {projectStats?.totalSprints ?? 0}
                      <span className="ml-1 text-[11px] text-emerald-600">
                        {projectStats?.activeSprints ?? 0} active
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Tasks</dt>
                    <dd className="text-slate-900 font-medium">
                      {projectStats?.totalTasks ?? 0}
                      <span className="ml-1 text-[11px] text-emerald-600">
                        {projectStats?.doneTasks ?? 0} done
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Story points</dt>
                    <dd className="text-slate-900 font-medium">
                      {projectStats?.totalStoryPoints ?? 0}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Overall progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow icon={<Building2 className="size-3.5" />} label="Owner company" value={project.companyName} />

                {project.isHired && project.companyHiredName && (
                  <InfoRow
                    icon={<Building2 className="size-3.5" />}
                    label="Hired company"
                    value={project.companyHiredName}
                  />
                )}

                <InfoRow
                  icon={<WorkflowIcon className="size-3.5" />}
                  label="Workflow"
                  value={
                    <div className="flex items-center justify-between gap-2">
                      {project.workflowId && (
                        <button
                          type="button"
                          onClick={() => setWorkflowPreviewOpen(true)}
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          <WorkflowIcon className="size-3" />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                  }
                />

                <InfoRow
                  icon={<CalendarDays className="size-3.5" />}
                  label="Timeline"
                  value={`${formatDate(project.startDate)} → ${formatDate(project.endDate)}`}
                />

                <InfoRow
                  icon={<Flag className="size-3.5" />}
                  label="Sprint length"
                  value={`${project.sprintLengthWeeks} week${project.sprintLengthWeeks > 1 ? "s" : ""}`}
                />

                <InfoRow
                  icon={<Users2 className="size-3.5" />}
                  label="Created by"
                  value={
                    <span>
                      {displayCreatorName} <span className="text-slate-400">• {formatDate(project.createdAt)}</span>
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          {/* RIGHT: actions */}
          <div className="mt-1 flex flex-row gap-2 sm:flex-col xl:mt-0 xl:ml-6 relative">
            {/* <button
              type="button"
              onClick={handleOpenBoard}
              disabled={!companyId || !projectId}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              <Activity className="size-4" />
              Open board
            </button> */}
 <button
    type="button"
    onClick={project.isClosed ? handleOpenClosureReport : handleOpenBoard}
    disabled={!companyId || !projectId}
    className={
      "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-60 " +
      (project.isClosed
        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        : "bg-blue-600 text-white hover:bg-blue-700")
    }
  >
    {project.isClosed ? (
      <>
        <Lock className="size-4 text-slate-600" />
        Project closure
      </>
    ) : (
      <>
        <Activity className="size-4" />
        Open board
      </>
    )}
  </button>
            <button
              type="button"
              onClick={() => setActionsOpen((x) => !x)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <MoreHorizontal className="size-4" />
              Project actions
            </button>

            {project.isClosed && (
              <button
                type="button"
                onClick={handleOpenClosureReport}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Lock className="size-4 text-slate-600" />
                Project closure
              </button>
            )}

            {actionsOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleStartEditBasic}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="size-3.5 text-slate-500" />
                  <span>Edit name & description</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkflowPreviewOpen(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <WorkflowIcon className="size-3.5 text-slate-500" />
                  <span>View workflow</span>
                </button>

                <div className="my-1 border-t border-slate-100" />


                {/* CLOSE / REOPEN PROJECT */}
                {!project.isClosed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false);
                      setConfirmState({ kind: "closeProject" });
                    }}
                    disabled={!canCloseProject || closing}
                    title={canCloseProject ? "Close this project" : "Only the creator can close this project"}
                    className={
                      "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50 " +
                      (canCloseProject ? "text-slate-700" : "text-slate-500")
                    }
                  >
                    <Lock className="size-3.5" />
                    <span>Close project</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false);
                      setConfirmState({ kind: "reopenProject" });
                    }}
                    disabled={!canCloseProject || reopening}
                    title={canCloseProject ? "Reopen this project" : "Only the creator can reopen this project"}
                    className={
                      "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50 " +
                      (canCloseProject ? "text-slate-700" : "text-slate-500")
                    }
                  >
                    <Lock className="size-3.5" />
                    <span>Reopen project</span>
                  </button>
                )}


              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-4 text-sm">
          {[
            { id: "overview", label: "Overview" },
            { id: "members", label: "Members" },
            { id: "activity", label: "Activity" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={
                "border-b-2 px-1.5 pb-2 text-sm font-medium transition " +
                (activeTab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300")
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="mt-5 grid gap-4 md:grid-cols-[2fr,1.4fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-2 text-sm font-semibold text-slate-800">About this project</div>
            <p className="text-sm text-slate-600">
              {project.description ||
                "No description has been provided yet. Use the edit action to add more context for your team."}
            </p>

            <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <InfoRow icon={<CalendarDays className="size-3.5" />} label="Start date" value={formatDate(project.startDate)} />
              <InfoRow icon={<CalendarDays className="size-3.5" />} label="End date" value={formatDate(project.endDate)} />
              <InfoRow
                icon={<Users2 className="size-3.5" />}
                label="Current members"
                value={`${project.members.length} member${project.members.length !== 1 ? "s" : ""}`}
              />
              <InfoRow icon={<Activity className="size-3.5" />} label="Project type" value={project.isHired ? "Outsourced" : "Internal"} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Health snapshot</div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Delivery progress</span>
                  <span className="font-medium text-slate-800">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Done tasks</span>
                  <span>
                    {projectStats?.doneTasks ?? 0} / {projectStats?.totalTasks ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active sprints</span>
                  <span>{projectStats?.activeSprints ?? 0}</span>
                </div>
              </div>
            </div>

            {project.workflowId && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">Workflow</div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-white overflow-hidden">
                    <div className="px-3 py-2 flex items-center justify-between border-b">
                      <div className="font-medium truncate">{project.workflowName || "Workflow"}</div>
                      <button
                        type="button"
                        onClick={() => setWorkflowPreviewOpen(true)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                    {loadingWorkflowPreview ? (
                      <div className="h-[160px] bg-gray-50 animate-pulse" />
                    ) : workflowPreview ? (
                      <WorkflowMini data={workflowPreview} />
                    ) : (
                      <div className="h-[160px] bg-gray-50 flex items-center justify-center text-xs text-slate-400">
                        No workflow preview available
                      </div>
                    )}

                    <div className="px-3 py-2 border-t flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkflowPreviewOpen(true)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleViewWorkflow}
                        className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Open full
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Users2 className="size-4 text-slate-500" />
                Project members
              </div>
              <p className="text-xs text-slate-500">
                Manage who can access this project. You can remove members or assign new members from the company.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name, email, role…"
                  className="w-60 rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500">
                  <th className="px-4 py-2 text-left font-medium">Member</th>
                  <th className="px-4 py-2 text-left font-medium">Role</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Joined</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">
                      No members found for this filter.
                    </td>
                  </tr>
                )}

                {filteredMembers.map((m) => {
                  const isOwner = sameId(m.userId, project.createdById);
                  const isMe = sameId(m.userId, meId);

                  return (
                    <tr key={m.userId} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex size-8 items-center justify-center rounded-full bg-blue-600/10 text-xs font-semibold text-blue-700">
                            {initials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="truncate text-sm font-medium text-slate-900">{m.name}</div>

                              {isOwner && (
                                <span className="shrink-0 inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  Owner
                                </span>
                              )}
                              {isMe && (
                                <span className="shrink-0 inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="truncate text-xs text-slate-500">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-xs text-slate-700">{m.roleName || "—"}</td>

                      <td className="px-4 py-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1">
                          {m.isPartner && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              <Shield className="size-3" />
                              Partner
                            </span>
                          )}
                          {m.isViewAll && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              View all
                            </span>
                          )}
                          {!m.isPartner && !m.isViewAll && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                              Standard
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {m.joinedAt ? formatDate(m.joinedAt) : "—"}
                      </td>

                      <td className="px-4 py-2.5 text-right text-xs">
                        {canKickMember(m.userId) ? (
                          <Can code='PROJECT_KICK_MEMBER'>
                            <button
                              type="button"
                              onClick={() => setConfirmState({ kind: "kickMember", member: m })}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="size-3.5" />
                              Kick
                            </button>
                          </Can>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Can code='PROJECT_INVITE_MEMBER'>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <UserPlus className="size-4 text-blue-600" />
                    Assign member from company
                  </div>
                  <p className="text-xs text-slate-500">
                    Choose people who already belong to this company to add them into the project.
                  </p>
                </div>
              </div>

              {availableMembers.length === 0 ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500">
                  No more available members to add. Invite new members to the company first.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availableMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="inline-flex size-9 items-center justify-center rounded-full bg-blue-600/10 text-sm font-semibold text-blue-700">
                          {initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">{m.name}</div>
                          <div className="truncate text-xs text-slate-500">{m.email}</div>
                          {m.roleName && (
                            <div className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                              {m.roleName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{m.isPartner ? "Partner" : "Company member"}</span>
                        <button
                          type="button"
                          onClick={() => handleAddMember(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <UserPlus className="size-3.5" />
                          Add to project
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Can>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="mt-5">
          <ProjectActivityTimeline projectId={project.id} />
        </div>
      )}

      {/* Workflow Preview Modal */}
      {workflowPreviewOpen && project.workflowId && (
        <WorkflowPreviewModal
          open={workflowPreviewOpen}
          workflowId={project.workflowId}
          onClose={() => setWorkflowPreviewOpen(false)}
        />
      )}

      {/* Confirm Modal */}
      {confirmState.kind !== "none" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div
                className={
                  "mt-1 flex h-8 w-8 items-center justify-center rounded-full " +
                  (isCloseProjectConfirm ? "bg-slate-100 text-slate-700" : "bg-rose-50 text-rose-600")
                }
              >
                {isCloseProjectConfirm ? <Lock className="size-4" /> : <Trash2 className="size-4" />}
              </div>

              <div className="flex-1">
                <h2 className="text-sm font-semibold text-slate-900">
                  {isCloseProjectConfirm
                    ? "Close project?"
                    : isReopenProjectConfirm
                      ? "Reopen project?"
                      : "Remove member from project?"}
                </h2>


                <p className="mt-1 text-xs text-slate-600">
                  {isCloseProjectConfirm && (
                    <>
                      This will mark <span className="font-semibold">"{project.name}"</span> as{" "}
                      <span className="font-semibold">Closed</span>. Only the creator can do this.
                    </>
                  )}

                  {isReopenProjectConfirm && (
                    <>
                      This will mark <span className="font-semibold">"{project.name}"</span> as{" "}
                      <span className="font-semibold">Open</span> again. Only the creator can do this.
                    </>
                  )}

                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={closing}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={
                  (isCloseProjectConfirm && (closing || !canCloseProject)) ||
                  (isReopenProjectConfirm && (reopening || !canCloseProject))
                }
                className={
                  "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 " +
                  (isCloseProjectConfirm || isReopenProjectConfirm
                    ? "bg-slate-800 hover:bg-slate-900"
                    : "bg-rose-600 hover:bg-rose-700")
                }
              >
                {(closing && isCloseProjectConfirm) || (reopening && isReopenProjectConfirm) ? (
                  <span className="size-3 animate-spin rounded-full border border-white/60 border-t-transparent" />
                ) : null}

                {isCloseProjectConfirm
                  ? "Close project"
                  : isReopenProjectConfirm
                    ? "Reopen project"
                    : "Remove member"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
