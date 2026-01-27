import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  message,
  onCancel,
  onConfirm,
  confirmText = "삭제",
  cancelText = "취소",
}) {
  if (!open) return null;

  return (
    <Modal onClose={onCancel}>
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          backgroundColor: "white",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{message}</div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
