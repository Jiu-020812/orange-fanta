import { useState, useEffect } from "react";
import { calculateReorderPoint, updateReorderSettings } from "../../api/reorder";

export default function ReorderSettingsModal({ item, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [reorderPoint, setReorderPoint] = useState(item.reorderPoint || "");
  const [reorderQuantity, setReorderQuantity] = useState(item.reorderQuantity || "");
  const [leadTimeDays, setLeadTimeDays] = useState(item.leadTimeDays || 7);
  const [safetyStock, setSafetyStock] = useState(item.safetyStock || 0);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(item.autoReorderEnabled || false);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const data = await calculateReorderPoint(item.id);
      setAnalysis(data);

      if (data.suggested) {
        setReorderPoint(data.suggested.reorderPoint);
        setReorderQuantity(data.suggested.reorderQuantity);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateReorderSettings(item.id, {
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : null,
        reorderQuantity: reorderQuantity ? parseInt(reorderQuantity) : null,
        leadTimeDays: parseInt(leadTimeDays),
        safetyStock: parseInt(safetyStock),
        autoReorderEnabled,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 32,
          maxWidth: 600,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, marginBottom: 24, fontSize: 20, fontWeight: 700 }}>
          재주문 포인트 설정
        </h2>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>품목</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            {item.name}
            {item.size && ` (${item.size})`}
          </div>
        </div>

        {/* 자동 계산 버튼 */}
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            🤖 자동 계산
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            최근 판매 데이터를 분석하여 최적의 재주문 포인트를 계산합니다.
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #7c8db5",
              background: "#7c8db5",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: calculating ? "not-allowed" : "pointer",
              opacity: calculating ? 0.6 : 1,
            }}
          >
            {calculating ? "계산 중..." : "자동 계산 실행"}
          </button>

          {analysis && (
            <div style={{ marginTop: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>분석 결과:</div>
              <div style={{ color: "#374151", lineHeight: 1.6 }}>
                • 평균 일일 판매: {analysis.suggested.averageDailySales}개<br />
                • 최대 일일 판매: {analysis.suggested.maxDailySales}개<br />
                • 판매 변동성: {analysis.suggested.salesVariability}<br />
                • 권장 재주문 포인트: {analysis.suggested.reorderPoint}개<br />
                • 권장 재주문 수량: {analysis.suggested.reorderQuantity}개
              </div>
              {analysis.explanation && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                  {analysis.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 설정 폼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              리드 타임 (일)
            </label>
            <input
              type="number"
              min="0"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              주문 후 입고까지 걸리는 일수
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              안전 재고
            </label>
            <input
              type="number"
              min="0"
              value={safetyStock}
              onChange={(e) => setSafetyStock(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              예상치 못한 수요 증가를 대비한 여유 재고
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              재주문 포인트 (개)
            </label>
            <input
              type="number"
              min="0"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              placeholder="재주문 포인트 미설정"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              재고가 이 수량 이하로 떨어지면 재주문 알림 발생
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              재주문 수량 (개)
            </label>
            <input
              type="number"
              min="0"
              value={reorderQuantity}
              onChange={(e) => setReorderQuantity(e.target.value)}
              placeholder="재주문 수량 미설정"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              재주문 시 권장 주문 수량
            </div>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoReorderEnabled}
                onChange={(e) => setAutoReorderEnabled(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                자동 재주문 알림 활성화
              </span>
            </label>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, marginLeft: 24 }}>
              재고가 재주문 포인트에 도달하면 자동으로 알림 표시
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #7c8db5",
              background: "#7c8db5",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
