import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  Users,
  ArrowUpDown,
  Filter as FilterIcon,
  CalendarDays,
  X as XIcon,
} from "lucide-react";

export type SimpleOption = {
  value: string;
  label: string;
};

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/** ==== Props ==== */
export type TaskFilterBarProps = {
  /* search */
  search: string;
  onSearchChange: (val: string) => void;

  /* sort */
  sortValue?: string;
  sortOptions?: SimpleOption[];
  onSortChange?: (val: string) => void;

  /* dropdown filter chính, vd: Status, Type... */
  primaryFilterLabel?: string;
  primaryFilterValue?: string;
  primaryFilterOptions?: SimpleOption[];
  onPrimaryFilterChange?: (val: string) => void;

  /* Assigned to (multi-select) */
  assigneeOptions?: SimpleOption[];
  assigneeValues?: string[];
  onAssigneeValuesChange?: (vals: string[]) => void;

  /* Date range (due date) */
  dateFrom?: string | null;
  dateTo?: string | null;
  onDateFromChange?: (val: string | null) => void;
  onDateToChange?: (val: string | null) => void;

  /* Priority / Severity / Tag filters */
  priorityOptions?: SimpleOption[];
  priorityValue?: string;
  onPriorityChange?: (val: string) => void;

  severityOptions?: SimpleOption[];
  severityValue?: string;
  onSeverityChange?: (val: string) => void;

  tagOptions?: SimpleOption[];
  tagValue?: string;
  onTagChange?: (val: string) => void;

  onClearAllFilters?: () => void;

  /* extra left/right */
  leftExtra?: React.ReactNode;
  rightExtra?: React.ReactNode;

  totalText?: string; // “26 tasks”
};

export default function TaskFilterBar({
  search,
  onSearchChange,
  sortValue,
  sortOptions,
  onSortChange,
  primaryFilterLabel = "Filter",
  primaryFilterValue,
  primaryFilterOptions,
  onPrimaryFilterChange,
  assigneeOptions,
  assigneeValues = [],
  onAssigneeValuesChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  priorityOptions,
  priorityValue,
  onPriorityChange,
  severityOptions,
  severityValue,
  onSeverityChange,
  tagOptions,
  tagValue,
  onTagChange,
  onClearAllFilters,
  leftExtra,
  rightExtra,
  totalText,
}: TaskFilterBarProps) {
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const selectedAssignees = useMemo(
    () =>
      (assigneeOptions ?? []).filter((o) =>
        assigneeValues.includes(o.value),
      ),
    [assigneeOptions, assigneeValues],
  );

  const toggleAssignee = (value: string) => {
    if (!onAssigneeValuesChange) return;
    const exists = assigneeValues.includes(value);
    const next = exists
      ? assigneeValues.filter((x) => x !== value)
      : [...assigneeValues, value];
    onAssigneeValuesChange(next);
  };

  const formatDateLabel = () => {
    if (!dateFrom && !dateTo) return "All dates";
    const fmt = (v: string) =>
      new Date(v).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (dateFrom && dateTo) return `${fmt(dateFrom)} - ${fmt(dateTo)}`;
    if (dateFrom) return `From ${fmt(dateFrom)}`;
    return `Until ${fmt(dateTo as string)}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3 space-y-2">
      {/* === HÀNG 1: Search + Status + Sort + total + New task === */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {leftExtra}

          {/* search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search code / title…"
              className="h-9 w-[220px] sm:w-[260px] pl-9 pr-3 rounded-full border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>

          {/* primary filter (Status) */}
          {primaryFilterOptions && primaryFilterOptions.length > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                {primaryFilterLabel}
              </span>
              <div className="relative inline-flex">
                <select
                  value={primaryFilterValue ?? ""}
                  onChange={(e) => onPrimaryFilterChange?.(e.target.value)}
                  className="h-9 pl-2 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 appearance-none"
                >
                  {primaryFilterOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* sort + total + rightExtra */}
        <div className="flex items-center gap-3">
          {sortOptions && sortOptions.length > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Sort</span>
              <select
                value={sortValue ?? ""}
                onChange={(e) => onSortChange?.(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 px-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {totalText && (
            <div className="hidden sm:block text-xs text-slate-500">
              {totalText}
            </div>
          )}

          {rightExtra}
        </div>
      </div>

      {/* === HÀNG 2: Filters / Assigned To / Date / Priority / Severity / Tags === */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* "Filters" label */}
        <div className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
          <FilterIcon className="w-3 h-3" />
          Filters
        </div>

        {/* Assigned To */}
        {assigneeOptions && assigneeOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Assigned To</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAssigneeOpen((o) => !o)}
                className="flex items-center h-8 min-w-[180px] max-w-[260px] rounded-lg border border-slate-300 bg-white px-2 text-[11px] text-slate-700 hover:bg-slate-50"
              >
                <Users className="w-3 h-3 mr-1 text-slate-400" />
                <div className="flex-1 flex flex-wrap items-center gap-1">
                  {selectedAssignees.length === 0 && (
                    <span className="text-[11px] text-slate-400">
                      Any assignee
                    </span>
                  )}
                  {selectedAssignees.map((o) => (
                    <span
                      key={o.value}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-[11px] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAssignee(o.value);
                      }}
                    >
                      {o.label}
                      <XIcon className="w-3 h-3 opacity-80" />
                    </span>
                  ))}
                </div>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </button>

              {assigneeOpen && (
                <div className="absolute z-30 mt-1 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-64 overflow-auto">
                  {assigneeOptions.map((o) => {
                    const active = assigneeValues.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleAssignee(o.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-left hover:bg-slate-50",
                          active && "bg-slate-50",
                        )}
                      >
                        <span>{o.label}</span>
                        {active && (
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                            selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date range (due date) */}
        {(onDateFromChange || onDateToChange) && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <CalendarDays className="w-3 h-3" />
              Date
            </span>
            <div className="flex items-center h-8 px-2 rounded-lg border border-slate-300 bg-white text-[11px] text-slate-700 gap-1">
              <input
                type="date"
                value={dateFrom ?? ""}
                onChange={(e) =>
                  onDateFromChange?.(e.target.value || null)
                }
                className="h-6 border-0 text-[11px] text-slate-700 focus:outline-none focus:ring-0 bg-transparent"
              />
              <span className="text-slate-400 mx-1">-</span>
              <input
                type="date"
                value={dateTo ?? ""}
                onChange={(e) =>
                  onDateToChange?.(e.target.value || null)
                }
                className="h-6 border-0 text-[11px] text-slate-700 focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {formatDateLabel()}
            </span>
          </div>
        )}

        {/* Priority */}
        {priorityOptions && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">Priority</span>
            <select
              value={priorityValue ?? ""}
              onChange={(e) => onPriorityChange?.(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Severity */}
        {/* {severityOptions && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">Severity</span>
            <select
              value={severityValue ?? ""}
              onChange={(e) => onSeverityChange?.(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              {severityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )} */}

        {/* Tags */}
        {/* {tagOptions && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">Tags</span>
            <select
              value={tagValue ?? ""}
              onChange={(e) => onTagChange?.(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              {tagOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )} */}

        {/* Clear filter */}
        {onClearAllFilters && (
          <button
            type="button"
            onClick={onClearAllFilters}
            className="text-[11px] text-sky-600 hover:text-sky-700 ml-auto"
          >
            &lt; Clear filter &gt;
          </button>
        )}
      </div>
    </div>
  );
}
