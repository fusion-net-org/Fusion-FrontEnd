// src/components/common/Modal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean; title?: string; children?: React.ReactNode;
  footer?: React.ReactNode; onClose: () => void; width?: number | string;
};

export default function Modal({ isOpen, title, children, footer, onClose, width = 640 }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Tự tạo #modal-root nếu chưa có
  const portalRoot = useMemo(() => {
    let el = document.getElementById("modal-root") as HTMLDivElement | null;
    if (!el) { el = document.createElement("div"); el.id = "modal-root"; document.body.appendChild(el); }
    return el;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // khoá scroll nền
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onBackdrop = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
  };

  const content = (
    <div className="modalBackdrop" onMouseDown={onBackdrop} role="dialog" aria-modal="true" aria-label={title ?? "Dialog"}>
      <div className="modalPanel" style={{ width }} ref={panelRef}>
        <div className="modalHeader">
          <span className="modalTitle">{title}</span>
          <button className="modalClose" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
  return createPortal(content, portalRoot);
}
