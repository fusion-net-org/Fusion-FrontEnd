// tiny DOM helper để “nổi” 1 card task theo id (dựa vào data-task-id trên TaskCard)
let __flashStyleInjected = false;

function ensureFlashStyles() {
  if (__flashStyleInjected || typeof document === "undefined") return;
  __flashStyleInjected = true;
  const css = `
@keyframes fusePop { 0% {transform:scale(.96)} 55%{transform:scale(1.04)} 100%{transform:scale(1)} }
@keyframes fuseStatusFade { 0% { background-color: var(--status-bg); } 100% { background-color: #fff; } }
.fuse-flash {
  --status-bg: rgba(46,139,255,.18);
  border-color: transparent !important;
  background-color: var(--status-bg);
  animation: fusePop 420ms cubic-bezier(.2,.8,.2,1), fuseStatusFade 1400ms ease-out forwards;
  will-change: transform, background-color;
}
`;
  const el = document.createElement("style");
  el.id = "fuse-flash-style";
  el.textContent = css;
  document.head.appendChild(el);
}

export function hexToRgba(hex?: string, alpha = 0.18) {
  if (!hex) return `rgba(46,139,255,${alpha})`;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return `rgba(46,139,255,${alpha})`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function flashTaskCard(taskId: string, opts?: { colorHex?: string }) {
  ensureFlashStyles();
  const el = document.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`);
  if (!el) return;

  // đặt màu nền mềm theo status (nếu có)
  const soft = hexToRgba(opts?.colorHex, 0.18);
  el.style.setProperty("--status-bg", soft);

  // gắn class flash, tự gỡ sau khi fade xong
  el.classList.add("fuse-flash");
  const off = (e: AnimationEvent) => {
    if (e.animationName === "fuseStatusFade") {
      el.classList.remove("fuse-flash");
      el.style.removeProperty("--status-bg");
      el.removeEventListener("animationend", off);
    }
  };
  el.addEventListener("animationend", off, { once: true });
}
