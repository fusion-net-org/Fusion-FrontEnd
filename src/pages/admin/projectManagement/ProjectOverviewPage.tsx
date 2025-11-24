/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Card, DatePicker, Input, Button } from "antd";
import {
  TrendingUp,
  CheckCircle2,
  FolderKanban,
  Clock3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ListChecks,
  KanbanSquare,
} from "lucide-react";

import {
  getProjectGrowthAndCompletionOverview,
  getProjectExecutionOverview,
} from "@/services/projectService.js";

import type {
  ProjectGrowthOverview,
  ProjectExecutionOverview,
} from "@/interfaces/Project/project";

import ProjectGrowthChart from "@/pages/admin/projectManagement/Chart/ProjectGrowthChart";
import ProjectCumulativeTrendChart from "@/pages/admin/projectManagement/Chart/ProjectCumulativeTrendChart";
import ProjectStatusBreakdownChart from "@/pages/admin/projectManagement/Chart/ProjectStatusBreakdownChart";
import ProjectTaskFlowChart from "@/pages/admin/projectManagement/Chart/ProjectTaskFlowChart";
import SprintVelocityChart from "@/pages/admin/projectManagement/Chart/SprintVelocityChart";

/* ================= Stat card ================= */

type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  accentGradient: string; // tailwind gradient: "from-... via-... to-..."
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  icon,
  accentGradient,
}) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        {/* Icon capsule với gradient riêng cho từng card */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accentGradient} text-white`}
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {label}
          </div>
          <div className="mt-0.5 text-xl font-semibold leading-tight text-gray-900">
            {value}
          </div>
          <div className="text-[11px] text-gray-500">{description}</div>
        </div>
      </div>
    </div>
  );
};

/* ================= Page ================= */

const ProjectOverviewPage: React.FC = () => {
  const [overview, setOverview] = useState<ProjectGrowthOverview | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

  const [executionOverview, setExecutionOverview] =
    useState<ProjectExecutionOverview | null>(null);
  const [loadingExecution, setLoadingExecution] = useState(false);

  // filter state (match BE: CompanyId, From, To)
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [filterFrom, setFilterFrom] = useState<Date | null>(null);
  const [filterTo, setFilterTo] = useState<Date | null>(null);

  // build params gửi lên BE
  const buildParams = () => {
    const params: any = {};
    if (filterCompanyId.trim()) {
      params.companyId = filterCompanyId.trim();
    }
    if (filterFrom) {
      params.from = filterFrom.toISOString();
    }
    if (filterTo) {
      params.to = filterTo.toISOString();
    }
    return params;
  };

  const loadGrowth = async (params: any = {}) => {
    setLoadingGrowth(true);
    try {
      const data = await getProjectGrowthAndCompletionOverview(params);
      setOverview(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load project growth overview", err);
    } finally {
      setLoadingGrowth(false);
    }
  };

  const loadExecution = async (params: any = {}) => {
    setLoadingExecution(true);
    try {
      const data = await getProjectExecutionOverview(params);
      setExecutionOverview(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load project execution overview", err);
    } finally {
      setLoadingExecution(false);
    }
  };

  const handleApplyFilters = () => {
    const params = buildParams();
    loadGrowth(params);
    loadExecution(params);
  };

  // initial load (default BE behaviour: 12 tháng gần nhất khi from/to null)
  useEffect(() => {
    loadGrowth();
    loadExecution();
  }, []);

  const totalProjects = overview?.totalProjects ?? 0;
  const activeProjects = overview?.activeProjects ?? 0;
  const completedProjects = overview?.completedProjects ?? 0;
  const newLast30 = overview?.newProjectsLast30Days ?? 0;

  const totalTasks = executionOverview?.totalTasks ?? 0;
  const completedTasks = executionOverview?.completedTasks ?? 0;
  const overdueTasks = executionOverview?.overdueTasks ?? 0;
  const totalSprints = executionOverview?.totalSprints ?? 0;
  const activeSprints = executionOverview?.activeSprints ?? 0;

  return (
    <div className="space-y-4">
      {/* Header + filter bar */}
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: title + desc */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E8BFF] to-[#22C55E] text-white shadow-sm">
              <FolderKanban className="h-4 w-4" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-900">
                Project overview
              </h2>
              <p className="text-xs text-gray-500">
                Portfolio-level insight for projects creation, completion and
                execution.
              </p>
            </div>
          </div>

          {/* Right: filters (CompanyId + From/To) */}
          <div className="flex flex-col items-stretch gap-2 text-xs md:flex-row md:items-end">
            <div className="flex flex-col gap-1 md:w-40">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Company ID
              </span>
              <Input
                size="small"
                placeholder="All companies"
                value={filterCompanyId}
                onChange={(e) => setFilterCompanyId(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Range
              </span>
              <DatePicker.RangePicker
                size="small"
                allowClear
                onChange={(dates: any) => {
                  if (!dates || dates.length !== 2) {
                    setFilterFrom(null);
                    setFilterTo(null);
                  } else {
                    const [from, to] = dates;
                    setFilterFrom(from ? from.toDate?.() ?? null : null);
                    setFilterTo(to ? to.toDate?.() ?? null : null);
                  }
                }}
              />
            </div>

            <Button
              size="small"
              type="primary"
              className="mt-1 bg-[#2E8BFF]"
              onClick={handleApplyFilters}
              loading={loadingGrowth || loadingExecution}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Project-level stats ===== */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Portfolio snapshot
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total projects"
          value={totalProjects.toLocaleString()}
          description="All projects in this scope"
          accentGradient="from-[#2E8BFF] via-[#4F46E5] to-[#22C55E]"
          icon={<FolderKanban className="h-4 w-4" />}
        />

        <StatCard
          label="Active"
          value={activeProjects.toLocaleString()}
          description="Projects still in progress"
          accentGradient="from-amber-400 via-orange-400 to-amber-500"
          icon={<Clock3 className="h-4 w-4" />}
        />

        <StatCard
          label="Completed"
          value={completedProjects.toLocaleString()}
          description="Projects with end date set"
          accentGradient="from-emerald-400 via-emerald-500 to-teal-400"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />

        <StatCard
          label="New in last 30 days"
          value={newLast30.toLocaleString()}
          description="Recently created projects"
          accentGradient="from-indigo-500 via-sky-500 to-cyan-400"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* ===== Execution stats ===== */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Execution snapshot
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          label="Total tasks"
          value={totalTasks.toLocaleString()}
          description="All project tasks"
          accentGradient="from-sky-400 via-blue-500 to-sky-400"
          icon={<ListChecks className="h-4 w-4" />}
        />
        <StatCard
          label="Completed tasks"
          value={completedTasks.toLocaleString()}
          description="Tasks moved to done status"
          accentGradient="from-emerald-400 via-emerald-500 to-lime-400"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Overdue tasks"
          value={overdueTasks.toLocaleString()}
          description={`${activeSprints.toLocaleString()} active / ${totalSprints.toLocaleString()} sprints`}
          accentGradient="from-rose-400 via-orange-500 to-amber-400"
          icon={<Clock3 className="h-4 w-4" />}
        />
      </div>

      {/* Main chart: New vs Completed over time */}
      <Card
        bordered={false}
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 shadow-sm"
      >
        <ProjectGrowthChart overview={overview} loading={loadingGrowth} />
      </Card>

      {/* Row 2: Cumulative + Status breakdown */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Cumulative trend */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">
                Cumulative project growth
              </span>
            </div>
          }
          bordered={false}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm"
          bodyStyle={{ padding: 16 }}
        >
          <ProjectCumulativeTrendChart
            overview={overview}
            loading={loadingGrowth}
          />
        </Card>

        {/* Status breakdown */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-medium text-gray-900">
                Project status breakdown
              </span>
            </div>
          }
          bordered={false}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm"
          bodyStyle={{ padding: 16 }}
        >
          <ProjectStatusBreakdownChart
            overview={overview}
            loading={loadingGrowth}
          />
        </Card>
      </div>

      {/* Row 3: Task flow + Sprint velocity */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Task flow */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-sm font-medium text-gray-900">
                Task flow (created vs completed)
              </span>
            </div>
          }
          bordered={false}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm"
          bodyStyle={{ padding: 16 }}
        >
          <ProjectTaskFlowChart
            overview={executionOverview}
            loading={loadingExecution}
          />
        </Card>

        {/* Sprint velocity */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-sm font-medium text-gray-900">
                Sprint velocity
              </span>
            </div>
          }
          bordered={false}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm"
          bodyStyle={{ padding: 16 }}
        >
          <SprintVelocityChart
            overview={executionOverview}
            loading={loadingExecution}
          />
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverviewPage;
