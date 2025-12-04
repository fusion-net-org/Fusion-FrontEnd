/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DropResult } from '@hello-pangea/dnd';
import {
  Info,
  FileText,
  TicketIcon,
  Workflow as WorkflowIcon,
  LayoutGrid,
  Flag,
  ListChecks,
} from 'lucide-react';

import { ProjectBoardProvider, useProjectBoard } from '@/context/ProjectBoardContext';
import { SearchBar } from '@/components/Company/Projects/BoardNavBits';
import KanbanBySprintBoard from '@/components/Company/Projects/KanbanBySprintBoard';
import SprintBoard from '@/components/Company/Projects/SprintBoard';
import ProjectTaskList from '@/components/Company/Projects/ProjectTaskList';

import WorkflowPreviewModal from '@/components/Workflow/WorkflowPreviewModal';

import type { StatusCategory, SprintVm, TaskVm } from '@/types/projectBoard';

// NEW: dùng mapper để chuẩn hoá cả sprints + tasks thật
import { normalizeBoardInput } from '@/mappers/projectBoardMapper';
import { fetchSprintBoard } from '@/services/projectBoardService.js';
import { GetProjectByProjectId } from '@/services/projectService.js';
import TicketPopup from '@/components/ProjectSideCompanyRequest/TicketPopup';
import type { JSX } from '@fullcalendar/core/preact.js';

/* ========== Inner: logic view board ========== */
function Inner() {
  const {
    sprints,
    tasks,
    loading,
    changeStatus,
    moveToNextSprint,
    reorder,
    done,
    split,
    reloadBoard,
  } = useProjectBoard();

  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const effectiveProjectId = projectId || (window as any).__projectId;
  const { companyId } = useParams<{ companyId: string }>();

  // config tabs cho view
  const viewTabs: { id: 'Kanban' | 'Sprint' | 'List'; label: string; icon: JSX.Element }[] = [
    { id: 'Kanban', label: 'Kanban', icon: <LayoutGrid className="size-3.5" /> },
    { id: 'Sprint', label: 'Sprint', icon: <Flag className="size-3.5" /> },
    { id: 'List', label: 'List', icon: <ListChecks className="size-3.5" /> },
  ];

  // id của ProjectRequest (nếu project đến từ request)
  const [projectRequestId, setProjectRequestId] = React.useState<string | null>(null);
  const hasProjectRequest = !!projectRequestId;

  const [view, setView] = React.useState<'Kanban' | 'Sprint' | 'List'>('Kanban');
  const [query, setQuery] = React.useState('');
  const [kanbanFilter, setKanbanFilter] = React.useState<'ALL' | StatusCategory>('ALL');

  // ticket popup
  const [openTicketPopup, setOpenTicketPopup] = useState(false);

  // meta cho header
  const [projectTitle, setProjectTitle] = React.useState('Project board');
  const [workflowId, setWorkflowId] = React.useState<string | null>(null);
  const [workflowPreviewOpen, setWorkflowPreviewOpen] = React.useState(false);
  const [projectDescription, setProjectDescription] = React.useState<string>(''); 

  // Load meta project (tên + workflowId + projectRequestId)
     React.useEffect(() => {
    let alive = true;

    (async () => {
      if (!projectId) return;
      try {
        const detailRaw: any = await GetProjectByProjectId(projectId);
        console.log('Project detail', detailRaw.data);
        const detail: any = detailRaw?.data ?? detailRaw ?? {};
        if (!alive) return;

        setProjectTitle(detail.name ?? detail.code ?? 'Project board');
        setProjectDescription(detail.description ?? ''); // NEW: lấy description
        setWorkflowId(detail.workflowId ? String(detail.workflowId) : null);
        setProjectRequestId(detail.projectRequestId ? String(detail.projectRequestId) : null);
      } catch (err) {
        console.error('Load project meta failed', err);
        if (!alive) return;
        setProjectTitle('Project board');
        setProjectDescription(''); // NEW: clear nếu lỗi
        setWorkflowId(null);
        setProjectRequestId(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId]);



  // DnD — Sprint view: đổi cột trong cùng sprint (dùng statusId động)
  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // droppableId format: "col:<sprintId>:<statusId>"
    const [, sprintIdSrc, statusIdSrc] = source.droppableId.split(':');
    const [, sprintIdDst, statusIdDst] = destination.droppableId.split(':');

    if (sprintIdSrc !== sprintIdDst) return;
    if (statusIdSrc === statusIdDst && source.index === destination.index) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t)
      await reorder((window as any).__projectId, sprintIdDst, t, statusIdDst, destination.index);
  };

  // DnD — Kanban view: kéo task giữa các sprint (giữ nguyên statusId)
  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // droppableId format: "spr:<sprintId>"
    const [, fromSprintId] = source.droppableId.split(':');
    const [, toSprintId] = destination.droppableId.split(':');
    if (fromSprintId === toSprintId) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t && effectiveProjectId) {
      await moveToNextSprint(effectiveProjectId, t, toSprintId);
    }
  };

  // Nghiệp vụ theo workflow động
  const eventApi = {
    onMarkDone: async (t: TaskVm) => {
      if (!effectiveProjectId) return;
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const finalId =
        sp.statusOrder.find((id) => sp.statusMeta[id]?.isFinal) ??
        sp.statusOrder[sp.statusOrder.length - 1];
      if (t.workflowStatusId !== finalId) {
        return changeStatus(effectiveProjectId, t, finalId);
      }
      return done(effectiveProjectId, t);
    },
    onNext: async (t: TaskVm) => {
      if (!effectiveProjectId) return;
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const idx = sp.statusOrder.indexOf(t.workflowStatusId);
      const nextId = sp.statusOrder[Math.min(idx + 1, sp.statusOrder.length - 1)];
      if (nextId && nextId !== t.workflowStatusId) {
        return changeStatus(effectiveProjectId, t, nextId);
      }
    },
    onSplit: (t: TaskVm) => {
      if (!effectiveProjectId) return;
      return split(effectiveProjectId, t);
    },
    onMoveNext: (t: TaskVm) => {
      if (!effectiveProjectId) return;
      const idx = sprints.findIndex((s) => s.id === (t.sprintId ?? ''));
      const next = sprints[idx + 1];
      if (next) return moveToNextSprint(effectiveProjectId, t, next.id);
    },
  };

  // List view: filter theo search
  const listTasks = React.useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return tasks;
    return tasks.filter((t) => `${t.code} ${t.title}`.toLowerCase().includes(k));
  }, [tasks, query]);

  return (
    <div className="w-full min-h-screen bg-50 overflow-x-hidden">
      {/* ========== HEADER GRADIENT: project info + actions ========== */}
      <div className="relative mx-4 mt-4 mb-2 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 px-8 py-5 text-white border border-blue-300/40">
        {/* overlay nhẹ */}
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.7),transparent_60%)]" />
        </div>

             <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 max-w-[50%]">
          <h1 className="text-2xl font-semibold leading-tight">{projectTitle}</h1>
          <p className="text-sm text-white/85 line-clamp-2">
            {projectDescription?.trim()
              ? projectDescription
              : 'Connect sprints, tickets and workflows into one unified project board.'}
          </p>
        </div>


          {/* actions */}
          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
            {hasProjectRequest && (
              <button
                type="button"
                onClick={() => setOpenTicketPopup(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-white/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <TicketIcon className="size-4" />
                <span>Tickets</span>
              </button>
            )}

            {workflowId && (
              <button
                type="button"
                onClick={() => setWorkflowPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                title="View workflow"
              >
                <WorkflowIcon className="size-3.5" />
                <span className="hidden sm:inline">Workflow</span>
              </button>
            )}

            {hasProjectRequest && companyId && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => {
                  navigate(`/company/${companyId}/project-request/${projectRequestId}`, {
                    state: { viewMode: 'AsExecutor' },
                  });
                }}
              >
                <FileText className="size-3.5" />
                <span className="hidden sm:inline">Project Request</span>
              </button>
            )}

            {companyId && projectId && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() =>
                  navigate(`/companies/${companyId}/project/${projectId}/detail`)
                }
              >
                <Info className="size-3.5" />
                <span className="hidden sm:inline">Detail</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========== TAB BAR: Kanban / Sprint / List (kiểu Jira) ========== */}
      <div className="border-b border-slate-200 bg-white/90">
        <nav className="flex gap-6 px-8 text-sm font-medium">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`inline-flex items-center gap-1 pb-2 pt-3 border-b-2 transition-colors ${
                view === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ========== BOARD WRAPPER ========== */}
      <section className="">
        <div className="rounded-3xl border border-slate-200/80 bg-50/90 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          {/* Top bar tuỳ view */}

          {/* List view: search */}
          {view === 'List' && (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            
             
            </div>
          )}

          {/* Kanban view: filter theo StatusCategory */}
       
          {/* Body: board theo view */}
          <div className="mt-1">
            {view === 'Kanban' && (
              <KanbanBySprintBoard
                sprints={sprints}
                filterCategory={kanbanFilter}
                onDragEnd={onDragEndKanban}
                onReloadBoard={reloadBoard}
                {...eventApi}
              />
            )}

            {view === 'Sprint' && (
              <SprintBoard onDragEnd={onDragEndSprint} {...eventApi} />
            )}

            {view === 'List' && <ProjectTaskList tasks={listTasks} {...eventApi} />}
          </div>
        </div>
      </section>

      {/* Ticket popup – chỉ mount nếu có ProjectRequest */}
      {hasProjectRequest && (
        <TicketPopup
          visible={openTicketPopup}
          projectId={projectId}
          onClose={() => setOpenTicketPopup(false)}
        />
      )}

      {/* Modal preview workflow lớn */}
      {workflowPreviewOpen && workflowId && (
        <WorkflowPreviewModal
          open={workflowPreviewOpen}
          workflowId={workflowId}
          onClose={() => setWorkflowPreviewOpen(false)}
        />
      )}
    </div>
  );
}

/* ========== Page: load từ BE, không còn demo ========== */
export default function ProjectBoardPage() {
  const { projectId = 'project-1' } = useParams<{ projectId: string }>();
  (window as any).__projectId = projectId;

  const [init, setInit] = React.useState<{ sprints: SprintVm[]; tasks: TaskVm[] } | null>(null);

  React.useEffect(() => {
    let dead = false;

    (async () => {
      try {
        const res = await fetchSprintBoard(projectId);
        // res giờ là { sprints:[], tasks:[] }
        const normalized = normalizeBoardInput(res ?? {});
        if (!dead) setInit(normalized);
      } catch (err) {
        console.error('Failed to load sprint board', err);
        if (!dead) setInit({ sprints: [], tasks: [] }); // hết sạch demo, lỗi thì board trống
      }
    })();

    return () => {
      dead = true;
    };
  }, [projectId]);

  if (!init) {
    return <div className="p-8 text-sm text-gray-600">Loading board…</div>;
  }

  // Remount khi đổi projectId để lấy initialData mới
  return (
    <ProjectBoardProvider key={projectId} projectId={projectId} initialData={init}>
      <Inner />
    </ProjectBoardProvider>
  );
}
