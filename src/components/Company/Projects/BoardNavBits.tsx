import React from "react";
const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export function ViewSwitchNav({
  view,
  onChange,
  title,
}: {
  view: "Kanban" | "Sprint" | "List";
  onChange: (v: "Kanban" | "Sprint" | "List") => void;
  title: string;
}) {
  const Pill = ({
    children,
    selected,
    onClick,
  }: {
    children: React.ReactNode;
    selected?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-10 px-4 rounded-lg border text-sm font-medium",
        selected ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      )}
      style={selected ? { backgroundColor: brand } : {}}
    >
      {children}
    </button>
  );

  return (
    <div className="px-8 pt-5">
      <div className="text-[22px] font-semibold text-gray-900">{title}</div>
      <div className="mt-3 inline-flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
        <Pill selected={view === "Kanban"} onClick={() => onChange("Kanban")}>Kanban</Pill>
        <Pill selected={view === "Sprint"} onClick={() => onChange("Sprint")}>Sprint</Pill>
        <Pill selected={view === "List"}   onClick={() => onChange("List")}>List</Pill>
      </div>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search tasks",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-[300px]">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
        <path d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
      />
    </div>
  );
}
