/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DropResult } from '@hello-pangea/dnd';
import { FileText, TicketIcon, Workflow as WorkflowIcon, Info } from 'lucide-react';

import { ProjectBoardProvider, useProjectBoard } from '@/context/ProjectBoardContext';
import { ViewSwitchNav, SearchBar } from '@/components/Company/Projects/BoardNavBits';
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
        setWorkflowId(detail.workflowId ? String(detail.workflowId) : null);
        setProjectRequestId(detail.projectRequestId ? String(detail.projectRequestId) : null);
      } catch (err) {
        console.error('Load project meta failed', err);
        if (!alive) return;
        setProjectTitle('Project board');
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
    <div className="w-full min-h-screen bg-[#F7F8FA] overflow-x-hidden">
      {/* Header + icon workflow */}
      <div className="sticky top-0 z-30 bg-[#F7F8FA] border-b border-gray-100">
        <div className="flex items-center justify-between">
          <ViewSwitchNav title={projectTitle} view={view} onChange={setView} />

          <div className="flex items-center gap-2">
            {/* Detail button – luôn có nếu có companyId + projectId */}
            {companyId && projectId && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-gray-50"
                onClick={() =>
                  navigate(`/companies/${companyId}/project/${projectId}/detail`)
                }
              >
                <Info className="size-3.5 text-slate-500" />
                <span>Detail</span>
              </button>
            )}

            {/* Project Request button – chỉ hiện khi có projectRequestId */}
            {hasProjectRequest && companyId && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-gray-50"
                onClick={() => {
                  navigate(`/company/${companyId}/project-request/${projectRequestId}`, {
                    state: { viewMode: 'AsExecutor' },
                  });
                }}
              >
                <FileText className="size-3.5 text-slate-500" />
                <span>Project Request</span>
              </button>
            )}

            {/* Ticket button – chỉ hiện khi có projectRequestId */}
            {hasProjectRequest && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-gray-50"
                onClick={() => setOpenTicketPopup(true)}
              >
                <TicketIcon className="size-3.5 text-slate-500" />
                <span>Ticket</span>
              </button>
            )}

            {/* Workflow button */}
            {workflowId && (
              <button
                type="button"
                onClick={() => setWorkflowPreviewOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-gray-50"
                title="View workflow"
              >
                <WorkflowIcon className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Workflow</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List có search */}
      {view === 'List' && (
        <div className="px-8 mt-5 flex items-center justify-between">
          <SearchBar value={query} onChange={setQuery} />
          <div className="text-sm text-gray-600">
            {loading ? 'Loading…' : `${listTasks.length} tasks`}
          </div>
        </div>
      )}

      {/* Kanban: filter theo StatusCategory */}
      {view === 'Kanban' && (
        <>
          <div className="px-8 mt-5 flex items-center gap-2 flex-wrap">
            {(['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKanbanFilter(k)}
                className={`h-8 px-3 rounded-full border text-xs shadow-sm ${
                  kanbanFilter === k
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                style={kanbanFilter === k ? { backgroundColor: '#2E8BFF' } : {}}
              >
                {k === 'ALL'
                  ? 'All'
                  : k === 'TODO'
                  ? 'To do'
                  : k === 'IN_PROGRESS'
                  ? 'In progress'
                  : k === 'REVIEW'
                  ? 'In review'
                  : 'Done'}
              </button>
            ))}
          </div>
          <KanbanBySprintBoard
            sprints={sprints}
            filterCategory={kanbanFilter}
            onDragEnd={onDragEndKanban}
            onReloadBoard={reloadBoard}
            {...eventApi}
          />
        </>
      )}

      {/* Sprint view */}
      {view === 'Sprint' && <SprintBoard onDragEnd={onDragEndSprint} {...eventApi} />}

      {/* List view */}
      {view === 'List' && <ProjectTaskList tasks={listTasks} {...eventApi} />}

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
