// src/hooks/useClickOutside.ts
import * as React from "react";

export default function useClickOutside<T extends HTMLElement>(
  active: boolean,
  onOutside: () => void
) {
  const ref = React.useRef<T | null>(null);
  React.useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) onOutside();
    };
    // dùng capture để bắt cả click trong portal gần đó
    document.addEventListener("mousedown", handler, { capture: true });
    document.addEventListener("touchstart", handler, { capture: true });
    return () => {
      document.removeEventListener("mousedown", handler, { capture: true } as any);
      document.removeEventListener("touchstart", handler, { capture: true } as any);
    };
  }, [active, onOutside]);
  return ref;
}
