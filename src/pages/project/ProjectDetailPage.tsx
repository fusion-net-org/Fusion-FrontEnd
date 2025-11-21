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
} from "lucide-react";

import {
  GetProjectByProjectId,
  getCompanyMembersPaged,
} from "@/services/projectService.js";
import {
  addProjectMember,
  removeProjectMember,
} from "@/services/projectMember.js";
import { getProjectMemberByProjectId } from "@/services/projectMember.js"; 

import { fetchSprintBoard } from "@/services/projectBoardService.js";

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

// ===== Helpers =====

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

const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s || "",
  );

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
// tính stats từ sprint-board
type BoardPayload = {
  sprints: any[];
  tasks: any[];
};

const buildStatsFromBoard = (board: BoardPayload): ProjectDetailVm["stats"] => {
  const sprints = Array.isArray(board.sprints) ? board.sprints : [];
  const tasks = Array.isArray(board.tasks) ? board.tasks : [];

  const totalSprints = sprints.length;
  const totalTasks = tasks.length;

  const doneTasks = tasks.filter(
    (t) => t.statusCategory === "DONE" || t.statusName === "Done"
  ).length;

  const totalStoryPoints = tasks.reduce(
    (sum, t) => sum + (t.storyPoints ?? 0),
    0
  );

  // activeSprint: tuỳ state bạn dùng, tạm coi "Active" / "InProgress" là sprint đang chạy
  const activeSprints = sprints.filter((s) =>
    ["Active", "InProgress", "Running"].includes(String(s.state))
  ).length;

  return {
    totalSprints,
    activeSprints,
    totalTasks,
    doneTasks,
    totalStoryPoints,
  };
};

// ===== MAIN PAGE =====

export default function ProjectDetailPage() {
  const { companyId, projectId } = useParams<{
    companyId: string;
    projectId: string;
  }>();
  const navigate = useNavigate();

  const [project, setProject] = React.useState<ProjectDetailVm | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "members" | "activity"
  >("overview");

  const [memberSearch, setMemberSearch] = React.useState("");
  const [availableMembers, setAvailableMembers] = React.useState<
    ProjectMemberVm[]
  >([]);

React.useEffect(() => {
  let alive = true;

  (async () => {
    if (!projectId) return;
    setLoading(true);

    try {
      // 1) Gọi song song: project detail + sprint-board + project members
      const [detailRaw, board, memberPaged] = await Promise.all<any>([
        GetProjectByProjectId(projectId),
        fetchSprintBoard(projectId),
        getProjectMemberByProjectId(projectId, "", "", "", 1, 200),
      ]);
      if (!alive) return;

      // 2) Chuẩn hóa payload project detail (cũ)
      const detail: any = detailRaw?.data ?? detailRaw ?? {};

      // 3) Raw members từ project detail
      const rawMembersFromProject: any[] =
        detail.members ??
        detail.projectMembers ??
        detail.projectMemberResults ??
        [];

      // 4) Raw members từ API projectmember/paged
      const memberPayload: any = memberPaged?.data ?? memberPaged ?? {};
      const memberItems: any[] = Array.isArray(memberPayload.items)
        ? memberPayload.items
        : Array.isArray(memberPayload)
        ? memberPayload
        : [];

      // Ưu tiên dùng list từ projectmember service, fallback sang detail.members
      const rawMembers: any[] =
        memberItems.length > 0 ? memberItems : rawMembersFromProject;

      const mappedMembers: ProjectMemberVm[] = Array.isArray(rawMembers)
        ? rawMembers.map(mapProjectMember)
        : [];

      // 5) Stats từ project-detail (nếu BE có)
      const rawStats =
        detail.stats ?? detail.boardSnapshot ?? detail.boardStats ?? {};

      const statsFromDetail: ProjectDetailVm["stats"] = {
        totalSprints:
          rawStats.totalSprints ??
          rawStats.sprintCount ??
          detail.totalSprints ??
          detail.sprintCount ??
          0,
        activeSprints:
          rawStats.activeSprints ??
          rawStats.activeSprintCount ??
          detail.activeSprints ??
          detail.activeSprintCount ??
          0,
        totalTasks:
          rawStats.totalTasks ??
          rawStats.taskCount ??
          detail.totalTasks ??
          detail.taskCount ??
          0,
        doneTasks:
          rawStats.doneTasks ??
          rawStats.doneTaskCount ??
          detail.doneTasks ??
          detail.doneTaskCount ??
          0,
        totalStoryPoints:
          rawStats.totalStoryPoints ??
          rawStats.storyPoints ??
          detail.totalStoryPoints ??
          detail.storyPoints ??
          0,
      };

      // 6) Stats từ sprint-board
      const statsFromBoard = buildStatsFromBoard(board);

      // Ưu tiên số liệu từ board, nếu = 0 thì fallback statsFromDetail
      const stats: ProjectDetailVm["stats"] = {
        totalSprints:
          statsFromBoard.totalSprints || statsFromDetail.totalSprints,
        activeSprints:
          statsFromBoard.activeSprints || statsFromDetail.activeSprints,
        totalTasks: statsFromBoard.totalTasks || statsFromDetail.totalTasks,
        doneTasks: statsFromBoard.doneTasks || statsFromDetail.doneTasks,
        totalStoryPoints:
          statsFromBoard.totalStoryPoints ||
          statsFromDetail.totalStoryPoints,
      };

      // 7) Creator + pool availableMembers (company members chưa join project)
      const creatorIdRaw =
        detail.createdById ?? detail.createdByUserId ?? detail.createdBy ?? null;

      let createdByName: string =
        detail.createdByName ??
        detail.createdByUserName ??
        detail.createdByDisplayName ??
        "";

      let pool: ProjectMemberVm[] = [];

      if (companyId) {
        const res = await getCompanyMembersPaged(companyId, {
          pageNumber: 1,
          pageSize: 100,
        });
        if (!alive) return;

        const assignedIds = new Set(
          mappedMembers.map((x) => x.userId.toLowerCase())
        );

        // build pool từ company members (loại những người đã nằm trong project)
        pool = (res.items || [])
          .filter((m: any) => {
            const mid = String(
              m.memberId ?? m.userId ?? m.id ?? ""
            ).toLowerCase();
            return mid && !assignedIds.has(mid);
          })
          .map(mapCompanyMemberToVm);

        // lookup creator nếu currently là GUID hoặc rỗng
        if (!createdByName || isGuid(createdByName)) {
          const creatorKey = (creatorIdRaw ?? createdByName) as string | null;
          if (creatorKey) {
            const lower = creatorKey.toLowerCase();
            const found = (res.items || []).find((m: any) => {
              const mid = String(
                m.memberId ?? m.userId ?? m.id ?? ""
              ).toLowerCase();
              return mid === lower;
            });
            if (found) {
              createdByName =
                found.memberName || found.email || createdByName || "";
            }
          }
        }
      }

      const vm: ProjectDetailVm = {
        id: String(detail.id),
        code: detail.code ?? "",
        name: detail.name ?? "",
        description: detail.description ?? "",
        status: (detail.status as ProjectStatus) ?? "Planned",
        isHired: !!detail.isHired,
        companyId: String(detail.companyId ?? companyId ?? ""),
        companyName:
          detail.companyName ?? detail.ownerCompany ?? detail.company ?? "",
        companyHiredId: detail.companyHiredId ?? null,
        companyHiredName:
          detail.companyHiredName ?? detail.hiredCompanyName ?? null,
        workflowId: String(detail.workflowId ?? ""),
        workflowName: detail.workflowName ?? detail.workflow ?? "",
        sprintLengthWeeks: detail.sprintLengthWeeks ?? 1,
        startDate: detail.startDate ?? null,
        endDate: detail.endDate ?? null,
        createdAt: detail.createdAt ?? new Date().toISOString(),
        createdByName:
          (!isGuid(createdByName) && createdByName) || "",
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
  const removed = project.members.find((m) => m.userId === userId);
  if (!removed) return;

  const prevProject = project;
  const prevAvailable = availableMembers;

  // Optimistic UI
  setProject({
    ...project,
    members: project.members.filter((m) => m.userId !== userId),
  });
  setAvailableMembers((prev) => [
    ...prev,
    { ...removed, joinedAt: null }, // trả về pool
  ]);

  try {
    await removeProjectMember(project.id, userId);
  } catch (err) {
    console.error("Remove project member failed", err);
    // rollback nếu lỗi
    setProject(prevProject);
    setAvailableMembers(prevAvailable);
  }
};

const handleAddMember = async (m: ProjectMemberVm) => {
  if (!project) return;
  if (project.members.some((x) => x.userId === m.userId)) return;

  const prevProject = project;
  const prevAvailable = availableMembers;

  const newMember: ProjectMemberVm = {
    ...m,
    joinedAt: new Date().toISOString(),
  };

  // Optimistic UI
  setProject({
    ...project,
    members: [...project.members, newMember],
  });
  setAvailableMembers((prev) => prev.filter((x) => x.userId !== m.userId));

  try {
    await addProjectMember({
      projectId: project.id,
      companyId: project.companyId,
      userId: m.userId,
      isPartner: m.isPartner ?? false,
      isViewAll: m.isViewAll ?? false,
    });
  } catch (err) {
    console.error("Add project member failed", err);
    // rollback nếu lỗi
    setProject(prevProject);
    setAvailableMembers(prevAvailable);
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
    project.createdByName && !isGuid(project.createdByName)
      ? project.createdByName
      : "Unknown user";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* === Breadcrumb / Back === */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm hover:bg-slate-50"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      {/* === Header card === */}
      <div
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)]"
        style={{
          backgroundImage:
            "radial-gradient(900px 260px at 50% -120px, rgba(37,99,235,0.06), transparent 60%)",
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          {/* LEFT: info + board snapshot */}
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
            </div>

            {/* title + desc */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="max-w-2xl text-sm text-slate-600">
                  {project.description}
                </p>
              )}
            </div>

            {/* grid: Board snapshot + info cards */}
            <div className="grid gap-3 text-xs text-slate-600 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
              {/* Board snapshot (dashboard nhỏ bên trái) */}
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
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow
                  icon={<Building2 className="size-3.5" />}
                  label="Owner company"
                  value={project.companyName}
                />
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
                  value={project.workflowName}
                />
                <InfoRow
                  icon={<CalendarDays className="size-3.5" />}
                  label="Timeline"
                  value={`${formatDate(project.startDate)} → ${formatDate(
                    project.endDate,
                  )}`}
                />
                <InfoRow
                  icon={<Flag className="size-3.5" />}
                  label="Sprint length"
                  value={`${project.sprintLengthWeeks} week${
                    project.sprintLengthWeeks > 1 ? "s" : ""
                  }`}
                />
                <InfoRow
                  icon={<Users2 className="size-3.5" />}
                  label="Created by"
                  value={
                    <span>
                      {displayCreatorName}{" "}
                      <span className="text-slate-400">
                        • {formatDate(project.createdAt)}
                      </span>
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          {/* RIGHT: actions */}
          <div className="mt-1 flex flex-row gap-2 sm:flex-col xl:mt-0 xl:ml-6">
            <button
              type="button"
              onClick={() => {
                // TODO: điều hướng sang board thật
                // navigate(`/companies/${companyId}/projects/${projectId}/board`);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Activity className="size-4" />
              Open board
            </button>
            <button
              type="button"
              onClick={() => {
                // TODO: mở modal edit project
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <MoreHorizontal className="size-4" />
              Project actions
            </button>
          </div>
        </div>
      </div>

      {/* === Tabs === */}
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

      {/* === Tab content === */}
      {activeTab === "overview" && (
        <div className="mt-5 grid gap-4 md:grid-cols-[2fr,1.4fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-2 text-sm font-semibold text-slate-800">
              About this project
            </div>
            <p className="text-sm text-slate-600">
              {project.description ||
                "No description has been provided yet. Use the edit action to add more context for your team."}
            </p>

            <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <InfoRow
                icon={<CalendarDays className="size-3.5" />}
                label="Start date"
                value={formatDate(project.startDate)}
              />
              <InfoRow
                icon={<CalendarDays className="size-3.5" />}
                label="End date"
                value={formatDate(project.endDate)}
              />
              <InfoRow
                icon={<Users2 className="size-3.5" />}
                label="Current members"
                value={`${project.members.length} member${
                  project.members.length !== 1 ? "s" : ""
                }`}
              />
              <InfoRow
                icon={<Activity className="size-3.5" />}
                label="Project type"
                value={project.isHired ? "Outsourced" : "Internal"}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  Health snapshot
                </div>
              </div>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Delivery progress</span>
                  <span className="font-medium text-slate-800">
                    {progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Done tasks</span>
                  <span>
                    {projectStats?.doneTasks ?? 0} /{" "}
                    {projectStats?.totalTasks ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active sprints</span>
                  <span>{projectStats?.activeSprints ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 text-xs text-slate-600">
              <div className="mb-1 text-sm font-semibold text-slate-800">
                Tips for better project detail
              </div>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Giữ description rõ ràng để member mới hiểu scope trong vài
                  phút.
                </li>
                <li>
                  Khai báo workflow đúng thực tế để board phản ánh pipeline
                  chuẩn.
                </li>
                <li>
                  Chia nhỏ sprint (1–2 tuần) để velocity dễ đo và tránh task kéo
                  dài quá lâu.
                </li>
              </ul>
            </div>
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
                Manage who can access this project. You can kick members or
                assign new members from the company.
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

          {/* Current members table */}
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
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-xs text-slate-500"
                    >
                      No members found for this filter.
                    </td>
                  </tr>
                )}
                {filteredMembers.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex size-8 items-center justify-center rounded-full bg-blue-600/10 text-xs font-semibold text-blue-700">
                          {initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {m.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-700">
                      {m.roleName || "—"}
                    </td>
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
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="size-3.5" />
                        Kick
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Assign new member from company */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <UserPlus className="size-4 text-blue-600" />
                  Assign member from company
                </div>
                <p className="text-xs text-slate-500">
                  Choose people who already belong to this company to add them
                  into the project.
                </p>
              </div>
            </div>

            {availableMembers.length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500">
                No more available members to add. Invite new members to the
                company first.
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
                        <div className="truncate text-sm font-medium text-slate-900">
                          {m.name}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {m.email}
                        </div>
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
        </div>
      )}

      {activeTab === "activity" && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-sm text-slate-600">
          <p className="text-xs text-slate-500 mb-2">
            Activity timeline will be wired to audit logs / ticket events later.
          </p>
          <p className="text-xs text-slate-500">No activity data yet.</p>
        </div>
      )}
    </div>
  );
}
