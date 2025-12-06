/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/pages/home/ProjectsPage.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, X, LayoutGrid, Table2, KanbanSquare } from 'lucide-react';
import ProjectCard from '@/components/Company/Projects/ProjectCard';
import type { Project, ProjectStatus } from '@/components/Company/Projects/ProjectCard';
import KanbanColumn from '@/components/Company/Projects/KanbanColumn';
import CreateProjectModal from '@/components/Company/ProjectCreate/CreateProjectModal';
import type { ProjectCreatePayload } from '@/components/Company/ProjectCreate/CreateProjectModal';
import { loadProjects as fetchProjects } from '@/services/projectService.js';

/* Small inline atoms (keep page self-contained) */
const Chip: React.FC<React.ComponentProps<'button'> & { active?: boolean }> = ({
  active,
  className = '',
  ...rest
}) => (
  <button
    {...rest}
    className={[
      'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
      active
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
      className,
    ].join(' ')}
  />
);

type ViewMode = 'cards' | 'table' | 'kanban';

const ViewToggle: React.FC<{ mode: ViewMode; onChange: (m: ViewMode) => void }> = ({
  mode,
  onChange,
}) => {
  const Btn: React.FC<{ id: ViewMode; label: string; icon: React.ReactNode }> = ({
    id,
    label,
    icon,
  }) => {
    const active = mode === id;
    return (
      <button
        onClick={() => onChange(id)}
        className={[
          'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition',
          active
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
        ].join(' ')}
        aria-pressed={active}
      >
        {icon}
        {label}
      </button>
    );
  };
  return (
    <div className="flex items-center gap-2">
      <Btn id="cards" label="Cards" icon={<LayoutGrid className="size-4" />} />
      <Btn id="table" label="Table" icon={<Table2 className="size-4" />} />
      <Btn id="kanban" label="Kanban" icon={<KanbanSquare className="size-4" />} />
    </div>
  );
};

const Pagination: React.FC<{ page: number; totalPages: number; onChange: (p: number) => void }> = ({
  page,
  totalPages,
  onChange,
}) => {
  if (totalPages <= 1) return null;
  const go = (p: number) => onChange(Math.max(1, Math.min(p, totalPages)));
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
      <button
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        onClick={() => go(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>
      <div className="text-sm text-slate-600">
        Page <span className="font-semibold">{page}</span> of{' '}
        <span className="font-semibold">{totalPages}</span>
      </div>
      <button
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
};

type DatePreset = 'any' | 'thisWeek' | 'thisMonth' | 'last3m' | 'custom';

type FiltersState = {
  q: string;
  types: string[];
  datePreset: DatePreset;
  dateFrom: string; // yyyy-MM-dd (input type="date")
  dateTo: string;
};

export default function ProjectsPage() {
  const nav = useNavigate();

  const [all, setAll] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<FiltersState>({
    q: '',
    types: [],
    datePreset: 'any',
    dateFrom: '',
    dateTo: '',
  });

  const [applied, setApplied] = React.useState<FiltersState>(filters);

  const [sort, setSort] = React.useState<'recent' | 'start' | 'name'>('recent');
  const [mode, setMode] = React.useState<ViewMode>('cards');
  const [page, setPage] = React.useState(1);
  const pageSize = 8;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { companyId: routeCompanyId } = useParams();
  const companyId = routeCompanyId || localStorage.getItem('currentCompanyId'); // ✅

  const loadProjectsList = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!companyId) throw new Error('Missing companyId');
      const res = await fetchProjects({
        companyId,
        pageSize: 200, // lấy rộng để đủ filter client
      });
      setAll(res.items);
    } catch (err) {
      console.error('[Projects] load error:', err);
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    loadProjectsList();
  }, [loadProjectsList]);

  const isProjectRequest = (p: Project) => p.isRequest === true;

  const isOutsourceExecutor = (p: Project) =>
    !p.isRequest && p.ptype === 'Outsourced';

  // filter + sort
  const filtered = React.useMemo(() => {
    const { q, types, datePreset, dateFrom, dateTo } = applied;
    const s = (v: string) => v.toLowerCase();

    // map preset -> from/to
    let from: Date | null = null;
    let to: Date | null = null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (datePreset === 'thisWeek') {
      const day = startOfToday.getDay(); // 0..6
      const diffToMonday = (day + 6) % 7; // Monday = 0
      from = new Date(startOfToday);
      from.setDate(startOfToday.getDate() - diffToMonday);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
    } else if (datePreset === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (datePreset === 'last3m') {
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (datePreset === 'custom' && dateFrom && dateTo) {
      from = new Date(dateFrom);
      to = new Date(dateTo);
    }

    const inDateRange = (p: Project) => {
      if (!from && !to) return true;
      if (!p.startDate) return false;

      const sd = new Date(p.startDate);
      if (Number.isNaN(sd.getTime())) return false;

      if (from && sd < from) return false;
      if (to) {
        const tEnd = new Date(to);
        tEnd.setHours(23, 59, 59, 999);
        if (sd > tEnd) return false;
      }
      return true;
    };

    let list = all.filter((p) => {
      const hitQ = !q || s(p.code).includes(s(q)) || s(p.name).includes(s(q));
      const hitT = types.length === 0 || types.includes(p.ptype);
      const hitD = inDateRange(p);
      return hitQ && hitT && hitD;
    });

    if (sort === 'name') {
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'start') {
      list = list
        .slice()
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
    } else if (sort === 'recent') {
      list = list
        .slice()
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
    }

    return list;
  }, [all, applied, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const current = React.useMemo(() => {
    if (mode === 'kanban') return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, mode]);

  const [openCreate, setOpenCreate] = React.useState(false);

  const createProject = () => setOpenCreate(true);

  const openProject = (p: Project) => {
    setSelectedId(p.id);

    if (p.isRequest) {
      nav(`/companies/${companyId}/projectRequest/${p.id}`);
    } else {
      nav(`/companies/${companyId}/project/${p.id}`);
    }
  };

  // Kanban groups
  const groups = React.useMemo(() => {
    const map: Record<ProjectStatus, Project[]> = {
      Planned: [],
      InProgress: [],
      OnHold: [],
      Completed: [],
    };
    filtered.forEach((p) => map[p.status].push(p));
    return map;
  }, [filtered]);

  return (
    <div
      className="mx-auto w-full max-w-[1240px] px-4 py-6"
      style={{
        backgroundImage:
          'radial-gradient(900px 220px at 50% -70px, rgba(37,99,235,0.07), transparent 70%), radial-gradient(600px 180px at 95% 15%, rgba(14,165,233,0.05), transparent 60%)',
      }}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            ✓
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">Projects</div>
            <div className="text-sm text-slate-500">
              Browse, filter, and jump back into your work.
            </div>
          </div>
        </div>
        <button
          onClick={createProject}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:brightness-105"
        >
          <Plus className="size-4" /> Create Project
        </button>
      </div>

      {/* Filter card */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(30,58,138,0.25)]">
        {/* Search row */}
        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search code or name..."
              className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {filters.q && (
              <button
                onClick={() => setFilters({ ...filters, q: '' })}
                className="absolute right-2 top-2.5 rounded-md p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setApplied(filters);
              setPage(1);
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Apply
          </button>
          <button
            onClick={() => {
              const f: FiltersState = {
                q: '',
                types: [],
                datePreset: 'any',
                dateFrom: '',
                dateTo: '',
              };
              setFilters(f);
              setApplied(f);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        {/* Pills rows: Sort / Type / Date */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-500">Sort:</span>
            <Chip active={sort === 'recent'} onClick={() => setSort('recent')}>
              Recent
            </Chip>
            <Chip active={sort === 'start'} onClick={() => setSort('start')}>
              Start date
            </Chip>
            <Chip active={sort === 'name'} onClick={() => setSort('name')}>
              Name A–Z
            </Chip>
          </div>

          {/* Types */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-500">Type:</span>
            <Chip
              active={filters.types.length === 0}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  types: [],
                }))
              }
            >
              All
            </Chip>
            {Array.from(new Set(all.map((p) => p.ptype))).map((v) => {
              const active = filters.types.includes(v);
              return (
                <Chip
                  key={v}
                  active={active}
                  onClick={() => {
                    setFilters((prev) => {
                      const set = new Set(prev.types);
                      set.has(v) ? set.delete(v) : set.add(v);
                      return { ...prev, types: Array.from(set) };
                    });
                  }}
                >
                  {v}
                </Chip>
              );
            })}
          </div>

          {/* Date filter */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-slate-500">Date:</span>
              <Chip
                active={filters.datePreset === 'any'}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, datePreset: 'any', dateFrom: '', dateTo: '' }))
                }
              >
                Any time
              </Chip>
              <Chip
                active={filters.datePreset === 'thisWeek'}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, datePreset: 'thisWeek' }))
                }
              >
                This week
              </Chip>
              <Chip
                active={filters.datePreset === 'thisMonth'}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, datePreset: 'thisMonth' }))
                }
              >
                This month
              </Chip>
              <Chip
                active={filters.datePreset === 'last3m'}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, datePreset: 'last3m' }))
                }
              >
                Last 3 months
              </Chip>
              <Chip
                active={filters.datePreset === 'custom'}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, datePreset: 'custom' }))
                }
              >
                Custom
              </Chip>
            </div>

            {filters.datePreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 pl-1 text-xs text-slate-600">
                <span className="font-medium">Range:</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      datePreset: 'custom',
                      dateFrom: e.target.value,
                    }))
                  }
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      datePreset: 'custom',
                      dateTo: e.target.value,
                    }))
                  }
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex items-center justify-between">
        <ViewToggle mode={mode} onChange={setMode} />
        {mode !== 'kanban' && (
          <div className="text-sm text-slate-500">{filtered.length} result(s)</div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white/70 shadow-sm"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="font-semibold text-slate-800">No projects found</div>
            <div className="text-sm text-slate-500">
              Try adjusting filters or create a new project.
            </div>
            <div className="mt-4">
              <button
                onClick={createProject}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </div>
        ) : mode === 'cards' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {current.map((p) => (
                <ProjectCard
                  key={p.id}
                  data={p}
                  selected={selectedId === p.id}
                  onOpen={openProject}
                  onManage={openProject}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        ) : mode === 'table' ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="w-10 px-4 py-2 text-left"></th>
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Owner</th>
                    <th className="px-4 py-2 text-left">Hired Company</th>
                    <th className="px-4 py-2 text-left">Workflow</th>
                    <th className="px-4 py-2 text-left">Start</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {current.map((p) => {
                    const isReq = isProjectRequest(p);
                    const isExec = isOutsourceExecutor(p);
                    return (
                      <tr
                        key={p.id}
                        className={[
                          'hover:bg-slate-50',
                          isReq ? 'bg-amber-50/40 ring-1 ring-amber-200' : '',
                          !isReq && isExec ? 'bg-emerald-50/40 ring-1 ring-emerald-200' : '',
                        ].join(' ')}
                      >
                        <td className="px-4">
                          <input
                            type="radio"
                            readOnly
                            checked={selectedId === p.id}
                            className="size-4 accent-blue-600"
                          />
                        </td>

                        <td className="px-4 py-2 font-semibold text-blue-600 underline underline-offset-2">
                          <button onClick={() => openProject(p)}>{p.code}</button>

                          {isReq && (
                            <span className="ml-2 align-middle rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              Project Request
                            </span>
                          )}

                          {!isReq && isExec && (
                            <span className="ml-2 align-middle rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              Outsourced (Executor)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.ownerCompany}</td>
                        <td className="px-4 py-2">{p.hiredCompany || '—'}</td>
                        <td className="px-4 py-2">{p.workflow}</td>
                        <td className="px-4 py-2">{p.startDate || '—'}</td>
                        <td className="px-4 py-2">
                          <span className="text-xs">{p.status}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-xs">{p.ptype}</span>
                        </td>
                        <td className="px-4 py-2 pr-5 text-right">
                          <button
                            onClick={() => openProject(p)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KanbanColumn
              title="Planned"
              color="#f59e0b"
              items={groups.Planned}
              selectedId={selectedId}
              onOpen={openProject}
            />
            <KanbanColumn
              title="InProgress"
              color="#3b82f6"
              items={groups.InProgress}
              selectedId={selectedId}
              onOpen={openProject}
            />
            <KanbanColumn
              title="OnHold"
              color="#8b5cf6"
              items={groups.OnHold}
              selectedId={selectedId}
              onOpen={openProject}
            />
            <KanbanColumn
              title="Completed"
              color="#22c55e"
              items={groups.Completed}
              selectedId={selectedId}
              onOpen={openProject}
            />
          </div>
        )}
      </div>

      {/* Notes (dev only) */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 backdrop-blur shadow-sm">
        <div className="mb-1 font-semibold text-slate-800">Integration Notes</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Replace <code>loadProjects()</code> with your real <code>projectService</code> (fetch,
            pagination, filters).
          </li>
          <li>
            Open project → <code>/companies/:companyId/projects/:projectId/overview</code>.
          </li>
          <li>
            No <code>&lt;select&gt;</code> — filters use clickable pills.
          </li>
        </ul>
      </div>

      <CreateProjectModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={async (payload: ProjectCreatePayload) => {
          console.log('CREATE PROJECT', payload);
          await loadProjectsList();
          setOpenCreate(false);
        }}
      />
    </div>
  );
}
