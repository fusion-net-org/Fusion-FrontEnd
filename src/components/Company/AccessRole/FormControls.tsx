import React from "react";

export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <label className={["block text-xs font-semibold text-slate-500", className].join(" ")}>
    {children}
  </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...props
}) => (
  <input
    {...props}
    className={[
      "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none",
      "placeholder:text-slate-400",
      "focus:border-[#2e8bff] focus:ring-4 focus:ring-[rgba(46,139,255,0.16)]",
      "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
      className,
    ].join(" ")}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = "",
  ...props
}) => (
  <select
    {...props}
    className={[
      "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-900 shadow-sm outline-none",
      "focus:border-[#2e8bff] focus:ring-4 focus:ring-[rgba(46,139,255,0.16)]",
      "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
      className,
    ].join(" ")}
  />
);

export const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <button
    {...rest}
    className={[
      "h-11 px-5 rounded-full font-semibold text-sm text-white",
      "bg-[#2e8bff] shadow-[0_8px_18px_-10px_rgba(46,139,255,0.7)]",
      "hover:bg-[#1e6fde] active:translate-y-[1px]",
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

export const BtnGhost: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <button
    {...rest}
    className={[
      "h-11 px-5 rounded-full font-semibold text-sm",
      "border border-slate-300 bg-white text-slate-800",
      "hover:bg-slate-50 active:translate-y-[1px]",
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

export const BtnDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <button
    {...rest}
    className={[
      "h-11 px-5 rounded-full font-semibold text-sm",
      "border border-red-200 bg-red-50 text-red-600",
      "hover:bg-red-100 active:translate-y-[1px]",
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);
