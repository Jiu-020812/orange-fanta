import { useState } from "react";
import DeleteButton from "./DeleteButton";

function formatNumber(num) {
  if (num == null) return "";
  const n = Number(num);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("ko-KR");
}

function normType(t) {
  return t === "OUT" ? "OUT" : "IN";
}

function TypeBadge({ type }) {
  const isOut = normType(type) === "OUT";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: "1px solid",
        borderColor: isOut ? "#fecaca" : "#bfdbfe",
        backgroundColor: isOut ? "#fee2e2" : "#eff6ff",
        color: isOut ? "#991b1b" : "#1d4ed8",
      }}
    >
      {isOut ? "출고" : "매입"}
    </span>
  );
}

//  (추가) 입고 단가 계산: 총액(price) ÷ 수량(count)
function calcUnitPrice(price, count) {
  const p = Number(price);
  const c = Number(count);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= 0) return null;
  return Math.round(p / c);
}

function PurchaseList({ records, onDeleteRecord, onUpdateRecord }) {
  const safeRecords = Array.isArray(records) ? records : [];
  const count = safeRecords.length;

  const inCount = safeRecords.filter((r) => normType(r.type) === "IN").length;
  const outCount = safeRecords.filter((r) => normType(r.type) === "OUT").length;

  // 수정 중인 기록 정보
  const [editingId, setEditingId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCount, setEditCount] = useState("");
  const [editType, setEditType] = useState("IN");
  const [editMemo, setEditMemo] = useState("");

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditDate(record.date || "");
    setEditPrice(record.price != null ? String(record.price) : "");
    setEditCount(record.count != null ? String(record.count) : "");
    setEditType(normType(record.type));
    setEditMemo(record.memo != null ? String(record.memo) : "");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditDate("");
    setEditPrice("");
    setEditCount("");
    setEditType("IN");
    setEditMemo("");
  };

  const saveEdit = () => {
    if (!editingId || !onUpdateRecord) return;

    onUpdateRecord(editingId, {
      date: editDate,
      price: editPrice,
      count: editCount,
      type: editType, // IN/OUT 수정 가능
      memo: editMemo, // memo 수정 가능
    });

    cancelEdit();
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600, color: "#111827" }}>
        기록 ({count}건){" "}
        <span style={{ color: "#6b7280", fontWeight: 500, fontSize: 13 }}>
          · 매입 {inCount} · 출고 {outCount}
        </span>
      </div>

      {count === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 14 }}>아직 기록이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {safeRecords.map((r) => {
            const isEditing = r.id === editingId;
            const type = normType(r.type);
            const isOut = type === "OUT";

            //  (추가) “입고(IN)만” 단가 계산해서 표시
            // - price가 null/""이면 단가 없음
            // - count가 없으면 1로 취급(원래 UI가 수량 기본 1이라)
            const qty = r.count ?? 1;
            const unit =
              !isOut && r.price != null && r.price !== ""
                ? calcUnitPrice(r.price, qty)
                : null;

            return (
              <div
                key={r.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#fafafa",
                  gap: 10,
                }}
              >
                {/* 왼쪽: 내용 or 입력폼 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <select
                          value={editType}
                          onChange={(e) => setEditType(normType(e.target.value))}
                          style={{
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                            backgroundColor: "white",
                          }}
                        >
                          <option value="IN">매입</option>
                          <option value="OUT">출고</option>
                        </select>

                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          style={{
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                          }}
                        />

                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder={editType === "OUT" ? "판매가" : "매입가"}
                          style={{
                            width: 110,
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                          }}
                        />

                        <input
                          type="number"
                          value={editCount}
                          onChange={(e) => setEditCount(e.target.value)}
                          placeholder="수량"
                          style={{
                            width: 70,
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                          }}
                        />
                      </div>

                      <input
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        placeholder="메모(선택)"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          fontSize: 12,
                          backgroundColor: "white",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <TypeBadge type={type} />

                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#111827",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.date} · {isOut ? "판매" : "매입"} {formatNumber(r.price)}원
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        수량 {qty}개
                        {!isOut && unit != null ? (
                          <span style={{ color: "#111827", fontWeight: 700 }}>
                            {" "}
                            · 단가 {formatNumber(unit)}원/개
                          </span>
                        ) : null}

                        {r.memo ? (
                          <span style={{ color: "#374151" }}> · 메모: {r.memo}</span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>

                {/* 오른쪽: 버튼들 */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveEdit}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: "#3b82f6",
                          color: "#ffffff",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          backgroundColor: "#ffffff",
                          fontSize: 12,
                          cursor: "pointer",
                          color: "black",
                        }}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #3b82f6",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        수정
                      </button>
                      <DeleteButton onClick={() => onDeleteRecord(r.id)}>
                        삭제
                      </DeleteButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PurchaseList;
