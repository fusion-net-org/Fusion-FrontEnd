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

/* Mock – replace with service */

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

export default function ProjectsPage() {
  const nav = useNavigate();

  const [all, setAll] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState({
    q: '',
    companies: [] as string[],
    statuses: [] as string[],
    types: [] as string[],
  });
  const [applied, setApplied] = React.useState(filters);

  const [sort, setSort] = React.useState<'recent' | 'start' | 'name'>('recent');
  const [mode, setMode] = React.useState<ViewMode>('cards');
  const [page, setPage] = React.useState(1);
  const pageSize = 8;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { companyId: routeCompanyId } = useParams();
  const companyId = routeCompanyId || localStorage.getItem('currentCompanyId'); // ✅

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        if (!companyId) throw new Error('Missing companyId'); // ✅ tránh gọi sai route
        const res = await fetchProjects({
          companyId, // ✅ dùng đúng route
          pageSize: 200, // lấy rộng để đủ filter client
        });
        if (!alive) return;
        setAll(res.items); // ✅ đã map đúng shape Project
      } catch (err) {
        console.error('[Projects] load error:', err);
        setAll([]); // tránh crash UI
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [companyId]);
  const uniq = <K extends keyof Project>(k: K) =>
    Array.from(new Set(all.map((p) => (p[k] ?? '') as string))).filter(Boolean);

  // filter + sort
  const filtered = React.useMemo(() => {
    const { q, companies, statuses, types } = applied;
    const s = (v: string) => v.toLowerCase();
    let list = all.filter((p) => {
      const hitQ = !q || s(p.code).includes(s(q)) || s(p.name).includes(s(q));
      const hitC = companies.length === 0 || companies.includes(p.ownerCompany);
      const hitS = statuses.length === 0 || statuses.includes(p.status);
      const hitT = types.length === 0 || types.includes(p.ptype);
      return hitQ && hitC && hitS && hitT;
    });
    if (sort === 'name') list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'start')
      list = list.slice().sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
    return list;
  }, [all, applied, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const current = React.useMemo(() => {
    if (mode === 'kanban') return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, mode]);

  const [openCreate, setOpenCreate] = React.useState(false);
  console.log('current', current);
  // thay createProject:
  const createProject = () => setOpenCreate(true);

  // const openProject = (p: Project) => {
  //   setSelectedId(p.id);
  //   // Navigate directly to project (adjust route to your app)
  //   nav(`/companies/${companyId}/project/${p.id}`);
  // };
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

      {/* Filter card (full-width, like the original) */}
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
              const f = {
                q: '',
                companies: [] as string[],
                statuses: [] as string[],
                types: [] as string[],
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

        {/* Pills rows */}
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
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

          {/* Companies */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-500">Companies:</span>
            <Chip
              active={filters.companies.length === 0}
              onClick={() => setFilters({ ...filters, companies: [] })}
            >
              All
            </Chip>
            {uniq('ownerCompany').map((v) => {
              const active = filters.companies.includes(v);
              return (
                <Chip
                  key={v}
                  active={active}
                  onClick={() => {
                    const s = new Set(filters.companies);
                    s.has(v) ? s.delete(v) : s.add(v);
                    setFilters({ ...filters, companies: Array.from(s) });
                  }}
                >
                  {v}
                </Chip>
              );
            })}
          </div>

          {/* Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-500">Status:</span>
            <Chip
              active={filters.statuses.length === 0}
              onClick={() => setFilters({ ...filters, statuses: [] })}
            >
              All
            </Chip>
            {Array.from(new Set(all.map((p) => p.status))).map((v) => {
              const active = filters.statuses.includes(v);
              return (
                <Chip
                  key={v}
                  active={active}
                  onClick={() => {
                    const s = new Set(filters.statuses);
                    s.has(v) ? s.delete(v) : s.add(v);
                    setFilters({ ...filters, statuses: Array.from(s) });
                  }}
                >
                  {v}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Types in second line to breathe */}
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-500">Types:</span>
            <Chip
              active={filters.types.length === 0}
              onClick={() => setFilters({ ...filters, types: [] })}
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
                    const s = new Set(filters.types);
                    s.has(v) ? s.delete(v) : s.add(v);
                    setFilters({ ...filters, types: Array.from(s) });
                  }}
                >
                  {v}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toolbar (like original) */}
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
                  {current.map((p) => (
                    <tr
                      key={p.id}
                      className={['hover:bg-slate-50', p.isRequest ? 'bg-amber-50/40' : ''].join(
                        ' ',
                      )}
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
                        {p.isRequest && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 align-middle">
                            Project Request
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
                  ))}
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
          // TODO: call your API here
          // await projectService.create(payload);
          console.log('CREATE PROJECT', payload);

          // demo: close + optional navigate
          setOpenCreate(false);
          // nav(`/companies/${encodeURIComponent("YOUR_COMPANY")}/projects/${newId}/overview`);
        }}
      />
    </div>
  );
}
