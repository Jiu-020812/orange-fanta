import { useEffect, useState } from "react";

/**
 * props
 * - open: boolean (모달 열림 여부)
 * - onClose: () => void
 * - record: {
 *     id,
 *     itemId,
 *     type: "IN" | "OUT",
 *     count,
 *     price,
 *     item?: { name }
 *   }
 * - onSubmit: (price: number) => Promise<void>
 */
export default function PriceInputModal({ open, onClose, record, onSubmit }) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setPrice("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open || !record) return null;

  const isIn = record.type === "IN";
  const title = isIn ? "원가 입력" : "판매가 입력";

  async function handleSubmit() {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("금액은 0보다 큰 숫자여야 해요.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(numericPrice);
      onClose();
    } catch (err) {
      console.error(err);
      setError("저장 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360,
          borderRadius: 16,
          backgroundColor: "#ffffff",
          padding: 20,
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* 제목 */}
        <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 700 }}>
          {title}
        </h3>

        {/* 설명 */}
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
          {record.item?.name && (
            <>
              <b>{record.item.name}</b> ·{" "}
            </>
          )}
          {record.count}개
        </div>

        {/* 입력 */}
        <input
          type="number"
          inputMode="numeric"
          placeholder="총액을 입력하세요 (원)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 15,
            marginBottom: 8,
          }}
        />

        {/* 단가 미리보기 */}
        {price && Number(price) > 0 && (
          <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 8 }}>
            개당&nbsp;
            <b>
              {Math.round(Number(price) / record.count).toLocaleString()}원
            </b>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            취소
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
