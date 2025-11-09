// src/pages/project/TaskListPage.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Search, Filter, ChevronDown, X, Download, ArrowLeft, ArrowRight,
  Users2, Tags as TagsIcon, CalendarDays, Flag, Clock, Check, MoveRight, MoveDown, SplitSquareHorizontal,
  ArrowUpDown, UserRoundCheck, ChevronRight, ChevronDown as CDn, AlertTriangle
} from "lucide-react";
import type { TaskVm as CardTaskVm, MemberRef as CardMemberRef } from "@/components/Company/Projects/TaskCard";

/* ================= Types ================= */
type Id = string;
type TaskVm = CardTaskVm;
type MemberRef = CardMemberRef;
type StatusKey = "todo" | "inprogress" | "inreview" | "done";
type GroupBy = "None" | "Sprint" | "Status" | "Assignee";
type SortBy =
  | "Updated desc" | "Due date asc" | "SLA remaining asc"
  | "Priority asc" | "Stage asc" | "Sprint asc"
  | "Assignee count desc" | "Tag count desc";

type Filters = {
  keyword: string;
  statuses: StatusKey[];
  stages: TaskVm["stage"][];
  sprints: string[];
  tags: string[];
  assignees: string[];
  onlyMine: boolean;
  overdueOnly: boolean;
  groupBy: GroupBy;
  sortBy: SortBy;
};
const defaultFilters: Filters = {
  keyword: "", statuses: [], stages: [], sprints: [], tags: [], assignees: [],
  onlyMine: false, overdueOnly: false, groupBy: "None", sortBy: "Updated desc",
};

/* ================= Demo seed (thay bằng API thật) ================= */
const brand = "#2E8BFF";
const demoAvatars = [
  "https://i.pravatar.cc/100?img=11",
  "https://i.pravatar.cc/100?img=22",
  "https://i.pravatar.cc/100?img=33",
  "https://i.pravatar.cc/100?img=44",
  "https://i.pravatar.cc/100?img=55",
];
const me: MemberRef = { id: "u1", name: "Nguyen Duy", avatarUrl: demoAvatars[0] };

function seedTasks(): TaskVm[] {
  const now = new Date();
  const mk = (i: number, o: Partial<TaskVm> = {}): TaskVm => ({
    id: `T-${i}`,
    code: `PRJ-${120 + i}`,
    title: o.title ?? `Task ${i}`,
    type: i % 4 === 0 ? "Bug" : i % 3 === 0 ? "Chore" : "Feature",
    priority: i % 5 === 0 ? "Urgent" : i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low",
    storyPoints: (i % 5) + 1,
    estimateHours: 4 * ((i % 5) + 1),
    remainingHours: 4 * ((i % 5) + 1),
    dueDate: new Date(now.getTime() + 1000 * 3600 * (24 * ((i % 9) + 1) - (i % 3 === 0 ? 3 : 0))).toISOString(),
    openedAt: new Date(now.getTime() - 1000 * 3600 * (2 + i * 5)).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 3600 * (i % 7)).toISOString(),
    createdAt: now.toISOString(),
    sprintId: `spr-${(i % 10) + 1}`, // 10 sprint để test overflow
    status: (["todo", "inprogress", "inreview", "done"] as StatusKey[])[i % 4],
    stage: (["IN_PROGRESS","WAITING_FOR_DEPLOY","CHECK_AGAIN","DEV_DONE","READY_ON_PRODUCTION","CLOSED"] as TaskVm["stage"][])[i % 6],
    severity: (["Low","Medium","High","Critical"] as TaskVm["severity"][])[i % 4],
    assignees: [
      me,
      { id: "u2", name: "Cao Van Dung", avatarUrl: demoAvatars[1] },
      { id: "u3", name: "Nguyen Kien Minh", avatarUrl: demoAvatars[2] },
      { id: "u4", name: "Luong Cong Bang", avatarUrl: demoAvatars[3] },
      { id: "u5", name: "Nguyen Tan Tuong", avatarUrl: demoAvatars[4] },
    ].slice(0, (i % 5) + 1),
    dependsOn: [],
    parentTaskId: null,
    carryOverCount: i % 7 === 0 ? 1 : 0,
    tags: i % 2 === 0
      ? ["Online Booking V3", "Critical flow", "Payments", "Core"]
      : ["Display Error", "UI", "Minor"],
    sourceTicketId: i % 3 === 0 ? "TK-1001" : null,
    sourceTicketCode: i % 3 === 0 ? "TK-1001" : null,
    ...o,
  });
  return Array.from({length: 60}, (_,i)=> mk(i+1));
}

/* ================= SLA helpers ================= */
const SLA_POLICIES: Array<{ type: TaskVm["type"]; priority: TaskVm["priority"]; targetHours: number }> = [
  { type: "Bug",     priority: "Urgent", targetHours: 24 },
  { type: "Bug",     priority: "High",   targetHours: 48 },
  { type: "Bug",     priority: "Medium", targetHours: 72 },
  { type: "Feature", priority: "Urgent", targetHours: 72 },
  { type: "Feature", priority: "High",   targetHours: 120 },
  { type: "Feature", priority: "Medium", targetHours: 168 },
  { type: "Feature", priority: "Low",    targetHours: 336 },
  { type: "Chore",   priority: "Low",    targetHours: 336 },
];
const getSlaTarget = (type: TaskVm["type"], priority: TaskVm["priority"]) =>
  SLA_POLICIES.find(p => p.type === type && p.priority === priority)?.targetHours ?? null;
const hoursBetween = (aIso: string, bIso: string) => (new Date(bIso).getTime() - new Date(aIso).getTime()) / 36e5;
const timeAgo = (iso: string) => {
  const diffH = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 36e5));
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH} hours ago`;
  const d = Math.floor(diffH / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/* ================= Atoms ================= */
const Pill = ({ tone="slate", children }:{tone?:"slate"|"blue"|"green"|"amber"|"rose"|"violet"; children:React.ReactNode})=>{
  const m:Record<string,string>={
    slate:"bg-slate-50 text-slate-700 border-slate-200",
    blue:"bg-blue-50 text-blue-700 border-blue-200",
    green:"bg-emerald-50 text-emerald-700 border-emerald-200",
    amber:"bg-amber-50 text-amber-700 border-amber-200",
    rose:"bg-rose-50 text-rose-700 border-rose-200",
    violet:"bg-violet-50 text-violet-700 border-violet-200",
  };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", m[tone])}>{children}</span>;
};
const Avatar = ({ m }: { m: MemberRef }) => (
  <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-700">
    {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} /> : <span>{m.name.slice(0,1)}</span>}
  </div>
);

/* ===== Popover helper ===== */
function useClickOutside<T extends HTMLElement>(onClose: ()=>void) {
  const ref = useRef<T|null>(null);
  useEffect(()=>{
    const h = (e: MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h); return ()=>document.removeEventListener("mousedown", h);
  },[onClose]);
  return ref;
}

/* ===== Overflow components ===== */
function AvatarOverflow({ members }: { members: MemberRef[] }) {
  const max = 4;
  const shown = members.slice(0, max);
  const more = members.length - shown.length;
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(()=>setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center">
        {shown.map((m,i)=>(<div key={m.id} className={cn(i>0 && "-ml-1")}><Avatar m={m}/></div>))}
        {more>0 && (
          <button
            onClick={()=>setOpen(v=>!v)}
            className="-ml-1 w-6 h-6 rounded-full ring-2 ring-white bg-slate-300 text-[11px] font-semibold text-slate-700"
            title={`${more} more`}
          >+{more}</button>
        )}
      </div>
      {open && (
        <div className="absolute z-40 mt-2 w-[220px] rounded-xl border border-slate-200 bg-white shadow-xl p-2">
          <div className="max-h-56 overflow-auto">
            {members.map(m=>(
              <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50">
                <Avatar m={m}/><div className="text-sm">{m.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function ChipOverflow({
  items, tone="slate", max=2,
}: { items: string[]; tone?: "slate"|"blue"|"green"|"amber"|"rose"|"violet"; max?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(()=>setOpen(false));
  const shown = items.slice(0, max);
  const more = Math.max(0, items.length - shown.length);
  return (
    <div className="relative inline-block" ref={ref}>
      {shown.map(s => <Pill key={s} tone={tone}>{s}</Pill>)}
      {more>0 && (
        <button onClick={()=>setOpen(v=>!v)} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200">
          +{more} more
        </button>
      )}
      {open && (
        <div className="absolute z-40 mt-2 w-[260px] rounded-xl border border-slate-200 bg-white shadow-xl p-2">
          <div className="max-h-56 overflow-auto space-x-1 space-y-1">
            {items.map(s=><Pill key={s} tone={tone}>{s}</Pill>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Page ================= */
export default function TaskListPage() {
  // data
  const [all, setAll] = useState<TaskVm[]>([]);
  useEffect(()=>{ setAll(seedTasks()); }, []);

  // filters/sort/group
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  // selection + pagination
  const [selected, setSelected] = useState<Record<Id, boolean>>({});
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // dictionaries
  const dict = useMemo(()=>{
    const sprints:Record<string,string>={};
    const tags = new Set<string>();
    const members = new Map<string, MemberRef>();
    all.forEach(t=>{
      if (t.sprintId) sprints[t.sprintId] ||= `Week ${t.sprintId.split("-")[1]}: Name task`;
      (t.tags??[]).forEach(x=>tags.add(x));
      (t.assignees??[]).forEach(a=>members.set(a.id,a));
    });
    return {
      sprints,
      sprintOptions:Object.keys(sprints).map(id=>({id,label:sprints[id]})),
      tagOptions:Array.from(tags).map(x=>({id:x,label:x})),
      memberOptions:Array.from(members.values()),
    };
  },[all]);

  // filtering & sorting
  const filtered = useMemo(()=>{
    const nowIso = new Date().toISOString();
    const kw = filters.keyword.trim().toLowerCase();
    let list = all.filter(t=>{
      if (kw && !`${t.code} ${t.title}`.toLowerCase().includes(kw)) return false;
      if (filters.statuses.length && !filters.statuses.includes(t.status)) return false;
      if (filters.stages.length && !filters.stages.includes(t.stage)) return false;
      if (filters.sprints.length && (!t.sprintId || !filters.sprints.includes(t.sprintId))) return false;
      if (filters.tags.length && !(t.tags??[]).some(x=>filters.tags.includes(x))) return false;
      if (filters.assignees.length && !(t.assignees??[]).some(a=>filters.assignees.includes(a.id))) return false;
      if (filters.onlyMine && !(t.assignees??[]).some(a=>a.id===me.id)) return false;
      if (filters.overdueOnly){
        const tgt = getSlaTarget(t.type, t.priority);
        const rem = tgt==null ? Infinity : Math.ceil(tgt - Math.max(0, hoursBetween(t.openedAt, nowIso)));
        if (!(rem < 0)) return false;
      }
      return true;
    });

    const priRank:Record<TaskVm["priority"],number>={Urgent:1,High:2,Medium:3,Low:4};
    const slaRem = (t:TaskVm)=>{
      const tgt = getSlaTarget(t.type,t.priority);
      return tgt==null ? Number.POSITIVE_INFINITY : Math.ceil(tgt - Math.max(0, hoursBetween(t.openedAt, new Date().toISOString())));
    };
    list.sort((a,b)=>{
      switch(filters.sortBy){
        case "Updated desc": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "Due date asc": return new Date(a.dueDate??0).getTime() - new Date(b.dueDate??0).getTime();
        case "SLA remaining asc": return slaRem(a) - slaRem(b);
        case "Priority asc": return priRank[a.priority]-priRank[b.priority];
        case "Stage asc": return a.stage.localeCompare(b.stage);
        case "Sprint asc": return (a.sprintId??"").localeCompare(b.sprintId??"");
        case "Assignee count desc": return (b.assignees?.length||0)-(a.assignees?.length||0);
        case "Tag count desc": return (b.tags?.length||0)-(a.tags?.length||0);
      }
    });
    return list;
  },[all,filters]);

  // grouping
  const groups = useMemo(()=>{
    if (filters.groupBy==="None") return { "": filtered };
    const m = new Map<string, TaskVm[]>();
    const keyOf = (t:TaskVm)=>
      filters.groupBy==="Sprint" ? (t.sprintId ? dict.sprints[t.sprintId] ?? "—" : "—")
      : filters.groupBy==="Status" ? t.status
      : (t.assignees&&t.assignees[0] ? t.assignees[0].name : "Unassigned");
    filtered.forEach(t=>m.set(keyOf(t), [ ...(m.get(keyOf(t))??[]), t ]));
    return Object.fromEntries(m);
  },[filtered,filters.groupBy,dict.sprints]);

  // pagination global
  type PageSlice = { items: TaskVm[]; total: number };
  const pageData: PageSlice = useMemo(()=>{
    const flat:TaskVm[] = filters.groupBy==="None"
      ? filtered
      : Object.entries(groups).flatMap(([g,items]) => items.map(x=>({...x, __group:g})) as any);
    const total = flat.length;
    const start = (pageIndex-1)*pageSize;
    return { items: flat.slice(start, start+pageSize), total };
  },[filtered,groups,filters.groupBy,pageIndex,pageSize]);
  useEffect(()=>{ setPageIndex(1); }, [filters, filters.groupBy, pageSize]);

  // selection
  const toggleAllCurrentPage = (checked:boolean)=>{
    const ids = pageData.items.map(t=>t.id);
    setSelected(prev=>{
      const clone = {...prev}; ids.forEach(id=>clone[id]=checked); return clone;
    });
  };
  const clearSelection = ()=> setSelected({});

  // actions (demo local)
  const patchTask = (id:Id, p:Partial<TaskVm>) => setAll(prev=>prev.map(t=>t.id===id ? ({...t, ...p, updatedAt:new Date().toISOString()}) : t));
  const markDone = (id:Id)=> patchTask(id, { status:"done", stage:"CLOSED" });
  const moveNext = (id:Id, cur?:string|null)=>{
    const n = (Number((cur||"spr-1").split("-")[1])||1)+1;
    patchTask(id, { sprintId:`spr-${n}`, status:"todo", carryOverCount: (all.find(x=>x.id===id)?.carryOverCount||0)+1 });
  };
  const nextStatus = (s:StatusKey):StatusKey => s==="todo"?"inprogress": s==="inprogress"?"inreview":"done";
  const goNext = (id:Id) => {
    const t = all.find(x=>x.id===id)!; patchTask(id, { status: nextStatus(t.status) });
  };
  const splitTask = (t:TaskVm)=>{
    const sp = Math.max(0,t.storyPoints||0); const rh = Math.max(0,t.remainingHours||0);
    if (sp<2 && rh<2) { alert("Task quá nhỏ để tách"); return; }
    const base = t.title.replace(/(\s*\(Part [AB]\)\s*)+$/g,"").trim();
    const bPts = sp>=2 ? Math.max(1,Math.floor(sp/2)) : 0; const aPts = sp-bPts;
    const bHrs = rh>=2 ? Math.max(1,Math.floor(rh/2)) : 0; const aHrs = Math.max(0,rh-bHrs);
    patchTask(t.id, { title: base+" (Part A)", storyPoints:aPts, remainingHours:aHrs });
    setAll(prev=>[...prev, { ...t, id: `${t.id}-B`, title: base+" (Part B)", storyPoints:bPts, remainingHours:bHrs, status:"todo", createdAt:new Date().toISOString() }]);
  };
  const bulkDone = ()=>{ Object.keys(selected).filter(id=>selected[id]).forEach(id=>markDone(id)); clearSelection(); };
  const bulkMoveNext = ()=>{ Object.keys(selected).filter(id=>selected[id]).forEach(id=>moveNext(id, all.find(t=>t.id===id)?.sprintId)); clearSelection(); };
  const exportCsv = ()=>{
    const headers = ["Code","Title","Type","Priority","Status","Stage","Sprint","Assignees","SP","Est(h)","Remain(h)","Due","Updated"];
    const lines = filtered.map(t => [
      t.code, t.title, t.type, t.priority, t.status, t.stage, t.sprintId ?? "",
      (t.assignees||[]).map(a=>a.name).join("; "),
      t.storyPoints, t.estimateHours, t.remainingHours, t.dueDate ? new Date(t.dueDate).toISOString() : "", t.updatedAt
    ].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href=url; a.download="tasks.csv"; a.click(); URL.revokeObjectURL(url);
  };

  /* ================= Toolbar ================= */
  const StatusPill = ({val,label}:{val:StatusKey;label:string})=>{
    const active = filters.statuses.includes(val);
    return (
      <button
        className={cn("px-2.5 h-7 rounded-full text-xs border", active?"bg-blue-600 text-white border-blue-600":"border-slate-300 text-slate-700 hover:bg-slate-50")}
        onClick={()=>setFilters(f=>({...f, statuses: active? f.statuses.filter(x=>x!==val) : [...f.statuses, val]}))}
      >{label}</button>
    );
  };

  // Sprint QUICK BAR (ngang, overflow-scroll)
  const SprintQuickBar = (
    <div className="px-6 py-2 border-y bg-white sticky top-[90px] z-20">
      <div className="relative">
        <div className="overflow-x-auto no-scrollbar">
          <div className="inline-flex gap-2 pr-6">
            {Object.entries(dict.sprints).map(([id,label])=>{
              const active = filters.sprints.includes(id);
              return (
                <button key={id}
                  onClick={()=>setFilters(f=>({...f, sprints: active ? f.sprints.filter(x=>x!==id) : [...f.sprints, id]}))}
                  className={cn("px-3 h-8 rounded-full border text-sm shrink-0",
                    active? "bg-blue-600 text-white border-blue-600":"border-slate-300 text-slate-700 hover:bg-slate-50")}
                  title={label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white" />
      </div>
    </div>
  );

  // Filter drawer (sprint có search + scroll)
  const [sprintSearch, setSprintSearch] = useState("");
  const FilterSheet = ()=>{
    const toggle = (arr:string[], id:string)=> arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id];
    const stages: TaskVm["stage"][] = ["IN_PROGRESS","WAITING_FOR_DEPLOY","CHECK_AGAIN","DEV_DONE","READY_ON_PRODUCTION","CLOSED"];
    const sprintEntries = Object.entries(dict.sprints)
      .filter(([,label]) => label.toLowerCase().includes(sprintSearch.toLowerCase()));

    return (
      <div className="relative">
        <button onClick={()=>setFilterOpen(v=>!v)} className="px-3 h-9 rounded-full border text-sm border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters <ChevronDown className="w-4 h-4" />
        </button>
        {filterOpen && (
          <div className="absolute z-40 mt-2 w-[860px] max-w-[96vw] rounded-2xl border border-slate-200 bg-white shadow-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2"><Users2 className="w-4 h-4" /> Assignees</div>
                <div className="space-y-1 max-h-48 overflow-auto pr-1">
                  {dict.memberOptions.map(m=>(
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={filters.assignees.includes(m.id)} onChange={()=>setFilters(f=>({...f, assignees: toggle(f.assignees, m.id)}))}/>
                      <div className="w-5 h-5 rounded-full overflow-hidden">{m.avatarUrl && <img src={m.avatarUrl} alt="" />}</div>
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
                <button
                  className={cn("mt-2 px-2 h-7 rounded-full text-xs border", filters.onlyMine ? "bg-blue-600 text-white border-blue-600":"border-slate-300 text-slate-700")}
                  onClick={()=>setFilters(f=>({...f, onlyMine: !f.onlyMine}))}
                ><UserRoundCheck className="w-4 h-4 inline mr-1" /> Assigned to me</button>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2"><TagsIcon className="w-4 h-4" /> Tags</div>
                <div className="space-y-1 max-h-48 overflow-auto pr-1">
                  {dict.tagOptions.map(t=>(
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={filters.tags.includes(t.id)} onChange={()=>setFilters(f=>({...f, tags: toggle(f.tags, t.id)}))}/>
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Sprints</div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={sprintSearch}
                    onChange={(e)=>setSprintSearch(e.target.value)}
                    placeholder="Search sprint…"
                    className="h-8 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                  <button className="h-8 px-2 text-xs rounded-lg border border-slate-300" onClick={()=>setFilters(f=>({...f, sprints: []}))}>Clear</button>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto pr-1">
                  {sprintEntries.map(([id,label])=>(
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={filters.sprints.includes(id)} onChange={()=>setFilters(f=>({...f, sprints: toggle(f.sprints, id)}))}/>
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                  {sprintEntries.length===0 && <div className="text-xs text-slate-500">No sprint</div>}
                </div>
              </div>

              <div className="col-span-4">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2"><Flag className="w-4 h-4" /> Workflow stage</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
                  {(["IN_PROGRESS","WAITING_FOR_DEPLOY","CHECK_AGAIN","DEV_DONE","READY_ON_PRODUCTION","CLOSED"] as TaskVm["stage"][])
                    .map(s=>(
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={filters.stages.includes(s)} onChange={()=>setFilters(f=>({...f, stages: f.stages.includes(s)? f.stages.filter(x=>x!==s):[...f.stages, s]}))}/>
                      <span>{s.replaceAll("_"," ")}</span>
                    </label>
                  ))}
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={filters.overdueOnly} onChange={()=>setFilters(f=>({...f, overdueOnly: !f.overdueOnly}))}/>
                  <span>Only overdue (SLA &lt; 0)</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">Kết hợp filter + group để soi tải theo sprint/assignee.</div>
              <div className="flex items-center gap-2">
                <button className="px-3 h-8 text-sm rounded-xl border border-slate-300 hover:bg-slate-50" onClick={()=>setFilters(defaultFilters)}>Reset</button>
                <button className="px-3 h-8 text-sm rounded-xl bg-blue-600 text-white" onClick={()=>setFilterOpen(false)}>Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Toolbar = (
    <div className="sticky top-0 z-30 bg-[#F7F8FA] border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="px-6 pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.keyword}
                onChange={(e)=>setFilters(f=>({...f, keyword:e.target.value }))}
                className="h-9 pl-9 pr-3 rounded-full border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-[280px]"
                placeholder="Search code/title…"
              />
            </div>
            <FilterSheet />
            <div className="hidden md:flex items-center gap-2">
              <StatusPill val="todo" label="To do" />
              <StatusPill val="inprogress" label="In progress" />
              <StatusPill val="inreview" label="In review" />
              <StatusPill val="done" label="Done" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filters.groupBy}
              onChange={(e)=>setFilters(f=>({...f, groupBy: e.target.value as GroupBy }))}
              className="h-9 rounded-full border border-slate-300 bg-white text-sm pl-3 pr-8"
            >
              {(["None","Sprint","Status","Assignee"] as GroupBy[]).map(x=><option key={x} value={x}>Group: {x}</option>)}
            </select>
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e)=>setFilters(f=>({...f, sortBy: e.target.value as SortBy }))}
                className="h-9 rounded-full border border-slate-300 bg-white text-sm pl-3 pr-8"
              >
                {(["Updated desc","Due date asc","SLA remaining asc","Priority asc","Stage asc","Sprint asc","Assignee count desc","Tag count desc"] as SortBy[])
                  .map(x=><option key={x} value={x}>Sort: {x}</option>)}
              </select>
              <ArrowUpDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button onClick={exportCsv} className="px-3 h-9 rounded-full border text-sm flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[12px]">
          {filters.keyword && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Search: {filters.keyword} <X className="w-3 h-3 cursor-pointer" onClick={()=>setFilters(f=>({...f, keyword:""}))}/>
            </span>
          )}
          {filters.onlyMine && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              Assigned to me <X className="w-3 h-3 cursor-pointer" onClick={()=>setFilters(f=>({...f, onlyMine:false}))}/>
            </span>
          )}
          {filters.overdueOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
              Overdue only <X className="w-3 h-3 cursor-pointer" onClick={()=>setFilters(f=>({...f, overdueOnly:false}))}/>
            </span>
          )}
        </div>
      </div>
      {SprintQuickBar}
    </div>
  );

  /* ================= Table ================= */
  const HeaderRow = (
    <tr className="text-left text-[12px] text-slate-500">
      <th className="px-3 py-2 w-9"><input type="checkbox"
        onChange={(e)=>toggleAllCurrentPage(e.target.checked)}
        checked={pageData.items.length>0 && pageData.items.every(t=>selected[t.id])}
      /></th>
      <th className="px-3 py-2">#</th>
      <th className="px-3 py-2">Opened</th>
      <th className="px-3 py-2">Title / Tags</th>
      <th className="px-3 py-2">Assigned</th>
      <th className="px-3 py-2">Status / Stage</th>
      <th className="px-3 py-2">SP</th>
      <th className="px-3 py-2">Progress</th>
      <th className="px-3 py-2">Due / SLA</th>
      <th className="px-3 py-2">Last updated</th>
      <th className="px-3 py-2"></th>
    </tr>
  );

  const [openRow, setOpenRow] = useState<Record<Id, boolean>>({});
  const Row = ({ t }: { t: TaskVm }) => {
    const nowIso = new Date().toISOString();
    const target = getSlaTarget(t.type, t.priority);
    const remaining = target!=null ? Math.ceil(target - Math.max(0, hoursBetween(t.openedAt, nowIso))) : null;
    const overdue = remaining!=null && remaining < 0;
    const urgent = t.priority === "Urgent";
    const ratio = Math.max(0, Math.min(1, (t.estimateHours||0)===0 ? 0 : 1 - (t.remainingHours/(t.estimateHours||1)) ));

    return (
      <>
      <tr className={cn("border-b last:border-0 odd:bg-slate-50/20", t.status==="done" && "opacity-70")}>
        <td className="px-3 py-3 align-top">
          <input type="checkbox" checked={!!selected[t.id]} onChange={(e)=>setSelected(p=>({...p, [t.id]: e.target.checked}))}/>
        </td>

        {/* Code + urgency strip */}
        <td className="px-3 py-3 align-top">
          <div className="relative pl-3">
            {(urgent || overdue) && <span className={cn("absolute left-0 top-0 bottom-0 w-1 rounded", urgent?"bg-rose-600":"bg-amber-500")} />}
            <div className="font-semibold text-slate-700 flex items-center gap-1">
              <button onClick={()=>setOpenRow(p=>({...p, [t.id]: !p[t.id]}))}
                className="text-slate-400 hover:text-slate-600">
                {openRow[t.id] ? <CDn className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>
              {t.code}
            </div>
            <div className="text-[11px] text-slate-500">Sprint {t.sprintId?.split("-")[1] ?? "—"}</div>
          </div>
        </td>

        {/* Opened */}
        <td className="px-3 py-3 align-top text-sm text-slate-600 whitespace-nowrap">
          <div>Opened: {fmtDate(t.openedAt)}</div>
          <div className="text-[11px] text-slate-500">opened {timeAgo(t.openedAt)}</div>
        </td>

        {/* Title + tags (overflow) */}
        <td className="px-3 py-3 align-top">
          <div className="font-medium">{t.title}</div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Pill tone={t.priority==="Urgent"?"rose":t.priority==="High"?"amber":"slate"}>{t.priority}</Pill>
            <Pill tone="slate">{t.type}</Pill>
            <ChipOverflow items={t.tags ?? []} tone="green" max={2} />
            {t.carryOverCount>0 && <Pill tone="blue">Spillover ×{t.carryOverCount}</Pill>}
            {t.sourceTicketCode && <Pill tone="violet">From {t.sourceTicketCode}</Pill>}
          </div>
        </td>

        {/* Assigned (overflow) */}
        <td className="px-3 py-3 align-top">
          <AvatarOverflow members={t.assignees || []} />
          <div className="text-[11px] text-slate-500 truncate max-w-[240px] mt-1">
            {(t.assignees||[]).map(a=>a.name).join(", ") || "Unassigned"}
          </div>
        </td>

        {/* Status / Stage */}
        <td className="px-3 py-3 align-top">
          <div className="capitalize text-sm">{t.status.replace("in","in ")}</div>
          <div className="text-[11px] text-slate-500">{t.stage.replaceAll("_"," ")}</div>
        </td>

        {/* SP */}
        <td className="px-3 py-3 align-top text-sm text-slate-600 whitespace-nowrap">{Math.max(0, t.storyPoints)} pts</td>

        {/* Progress */}
        <td className="px-3 py-3 align-top w-[160px]">
          <div className="h-2 w-[150px] bg-slate-100 rounded">
            <div className="h-2 rounded" style={{width:`${Math.round(ratio*100)}%`, background: brand}}/>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{Math.max(0,t.estimateHours - t.remainingHours)}/{t.estimateHours}h</div>
        </td>

        {/* Due / SLA */}
        <td className="px-3 py-3 align-top text-sm">
          <div className="text-slate-700">{fmtDate(t.dueDate)}</div>
          {target!=null && t.status!=="done" && (
            <div className={cn(
              "text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border mt-1",
              overdue ? "text-rose-700 bg-rose-50 border-rose-200"
                      : remaining!<=12 ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-slate-600 bg-slate-50 border-slate-200"
            )}>
              <Clock className="w-3 h-3" />
              {overdue ? `Overdue ${Math.abs(remaining!)}h` : `SLA ${remaining}h left`}
            </div>
          )}
        </td>

        {/* Last updated */}
        <td className="px-3 py-3 align-top text-sm text-slate-600 whitespace-nowrap">
          {new Date(t.updatedAt).toLocaleString()}
          <div className="mt-1 text-[11px] text-slate-500">by System</div>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 align-top whitespace-nowrap">
          <div className="flex items-center gap-1">
            {t.status!=="done" && (
              <button className="px-2 py-1 rounded-lg border text-xs hover:bg-emerald-50 border-emerald-300 text-emerald-700"
                      onClick={()=>markDone(t.id)}><Check className="w-3 h-3 inline mr-1" />Done</button>
            )}
            {t.status!=="done" && (
              <button className="px-2 py-1 rounded-lg border text-xs hover:bg-blue-50 border-blue-300 text-blue-700"
                      onClick={()=>goNext(t.id)}><MoveRight className="w-3 h-3 inline mr-1" />Next</button>
            )}
            <button className="px-2 py-1 rounded-lg border text-xs hover:bg-violet-50 border-violet-300 text-violet-700"
                    onClick={()=>splitTask(t)}><SplitSquareHorizontal className="w-3 h-3 inline mr-1" />Split</button>
            <button className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50 border-slate-300 text-slate-600"
                    onClick={()=>moveNext(t.id, t.sprintId)}><MoveDown className="w-3 h-3 inline mr-1" />Move next</button>
          </div>
        </td>
      </tr>

      {/* Row details (mở rộng) */}
      {openRow[t.id] && (
        <tr className="border-b bg-slate-50/40">
          <td></td>
          <td colSpan={10} className="px-4 py-3">
            <div className="grid md:grid-cols-[1fr_320px] gap-4">
              <div>
                <div className="text-[12px] text-slate-500 mb-1">Last comment</div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  - Description: Hi team. Please verify scenario…<br/>
                  1. Chọn Service / Staff / Time tới Confirm Booking → Nhấn Edit… (demo text)
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500 mb-1">Activity</div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" /> Moved to <b>{t.status}</b> · {timeAgo(t.updatedAt)}</div>
                  <div className="flex items-start gap-2 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" /> Assigned to {(t.assignees||[]).map(a=>a.name).join(", ") || "—"}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      </>
    );
  };

  /* ================= Pagination ================= */
  const totalPages = Math.max(1, Math.ceil(pageData.total / pageSize));
  const goto = (p:number)=> setPageIndex(Math.min(totalPages, Math.max(1, p)));
  const Pager = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-slate-600">
        Showing <span className="font-semibold">{pageData.items.length ? (pageIndex-1)*pageSize + 1 : 0}</span>–
        <span className="font-semibold">{Math.min(pageIndex*pageSize, pageData.total)}</span> of
        <span className="font-semibold"> {pageData.total}</span>
      </div>
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}
                className="h-9 rounded-xl border border-slate-300 bg-white text-sm pl-3 pr-2">
          {[10,25,50,100].map(n=><option key={n} value={n}>{n}/page</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50" onClick={()=>goto(pageIndex-1)} disabled={pageIndex===1}>
            <ArrowLeft className="w-4 h-4 mx-auto" />
          </button>
          {Array.from({length:Math.min(7,totalPages)}).map((_,i)=>{
            const start = Math.max(1, Math.min(pageIndex-3, totalPages-6));
            const n = start + i; if (n>totalPages) return null;
            const active = n===pageIndex;
            return (
              <button key={n} onClick={()=>goto(n)}
                className={cn("h-9 min-w-9 px-2 rounded-xl border text-sm",
                  active?"bg-blue-600 text-white border-blue-600":"border-slate-300 text-slate-700 hover:bg-slate-50")}>
                {n}
              </button>
            );
          })}
          <button className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50" onClick={()=>goto(pageIndex+1)} disabled={pageIndex===totalPages}>
            <ArrowRight className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );

  /* ================= Render ================= */
  return (
    <div className="w-full min-h-screen bg-[#F7F8FA]">
      {Toolbar}

      <div className="px-6 py-4 space-y-4">
        {/* bulk bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="text-slate-500">Selected:</span>
            <span className="font-semibold">{Object.values(selected).filter(Boolean).length}</span>
            <button className="px-2 h-8 rounded-lg border text-xs hover:bg-emerald-50 border-emerald-300 text-emerald-700"
                    onClick={bulkDone}><Check className="w-3 h-3 inline mr-1" /> Mark done</button>
            <button className="px-2 h-8 rounded-lg border text-xs hover:bg-slate-50 border-slate-300 text-slate-700"
                    onClick={bulkMoveNext}><MoveDown className="w-3 h-3 inline mr-1" /> Move next sprint</button>
            <button className="px-2 h-8 rounded-lg border text-xs hover:bg-slate-50 border-slate-300 text-slate-700"
                    onClick={()=>setSelected({})}>Clear</button>
          </div>
          <div className="text-[12px] text-slate-500">Tip: click mũi tên ở cột # để mở “last comment / activity”.</div>
        </div>

        {/* table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="top-[140px] bg-white/95 backdrop-blur border-b">{HeaderRow}</thead>
              <tbody>
                {filters.groupBy!=="None"
                  ? pageData.items.map((t, idx, arr) => {
                      const prev = (arr[idx-1] as any)?.__group;
                      const cur = (t as any).__group as string;
                      const showGroup = idx===0 || cur!==prev;
                      return (
                        <React.Fragment key={t.id}>
                          {showGroup && (
                            <tr>
                              <td colSpan={11} className="bg-slate-50/70 border-b text-[12px] text-slate-600 px-3 py-1.5">{filters.groupBy}: <span className="font-medium">{cur || "—"}</span></td>
                            </tr>
                          )}
                          <Row t={t} />
                        </React.Fragment>
                      );
                    })
                  : pageData.items.map(t => <Row key={t.id} t={t} />)
                }
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t bg-white">{Pager}</div>
        </div>

        <div className="text-[12px] text-slate-500">
          Filtered <span className="font-semibold">{filtered.length}</span> / {all.length} tasks
        </div>
      </div>

      {/* bottom accent */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${brand}22, transparent)` }} />
    </div>
  );
}
