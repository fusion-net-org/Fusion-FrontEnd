import React from "react";
import Modal from "@/common/Modal";

export default function ConfirmModal({
  isOpen, title = "Confirm", message, busy = false, onCancel, onConfirm
}: { isOpen: boolean; title?: string; message: string | React.ReactNode; busy?: boolean; onCancel: () => void; onConfirm: () => void; }) {
  const footer = (
    <>
      <button className="btn btnGhost" onClick={onCancel} disabled={busy}>Cancel</button>
      <button className="btn btnDanger" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete"}</button>
    </>
  );
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} footer={footer} width={520}>
      <div style={{ paddingTop: 4 }}>{message}</div>
    </Modal>
  );
}
