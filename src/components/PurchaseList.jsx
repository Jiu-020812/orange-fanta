import { useMemo, useState } from "react";
import DeleteButton from "./DeleteButton";

function formatNumber(num) {
  if (num == null) return "";
  const n = Number(num);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("ko-KR");
}

/**
 * B안 기준 type normalize
 * - "IN" | "OUT" | "PURCHASE"
 */
function normType(t) {
  const x = String(t || "").toUpperCase();
  if (x === "OUT") return "OUT";
  if (x === "PURCHASE") return "PURCHASE";
  return "IN";
}

function calcUnit(price, count) {
  const p = Number(price);
  const c = Number(count);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= 0) return null;
  return Math.round(p / c); // price는 총액, 단가는 price/count
}

function TypeBadge({ type }) {
  const t = normType(type);

  const label = t === "OUT" ? "판매" : t === "PURCHASE" ? "매입" : "입고";
  const theme =
    t === "OUT"
      ? {
          borderColor: "#fecaca",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
        }
      : t === "PURCHASE"
      ? {
          borderColor: "#bbf7d0",
          backgroundColor: "#dcfce7",
          color: "#166534",
        }
      : {
          borderColor: "#bfdbfe",
          backgroundColor: "#eff6ff",
          color: "#1d4ed8",
        };

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
        ...theme,
      }}
    >
      {label}
    </span>
  );
}

/**
 * props
 * - records: [{ id, itemId, type, price, count, date, memo }]
 * - onDeleteRecord(id)
 * - onUpdateRecord(id, patch)  // { date, price, count, type, memo }
 * - onMarkArrived(record)     // (선택) PURCHASE 옆 "입고 처리" 버튼
 */
function PurchaseList({ records, onDeleteRecord, onUpdateRecord, onMarkArrived }) {
  const safeRecords = Array.isArray(records) ? records : [];

  //  돈 기록만 보여주기: PURCHASE(가격 있음) + OUT(가격 있음)
  const moneyRecords = useMemo(() => {
    return safeRecords
      .filter((r) => {
        const t = normType(r.type);
        const hasPrice = r.price != null && Number(r.price) > 0;
        if (t === "PURCHASE") return hasPrice; // 매입은 가격 필수
        if (t === "OUT") return hasPrice; // 판매는 가격 있을 때만
        return false; // IN(입고)은 숨김
      })
      .sort((a, b) => {
        // 날짜 내림차순 + id 내림차순
        const da = String(a.date || "");
        const db = String(b.date || "");
        if (da === db) return Number(b.id) - Number(a.id);
        return db.localeCompare(da);
      });
  }, [safeRecords]);

  const count = moneyRecords.length;

  const purchaseCount = useMemo(
    () => moneyRecords.filter((r) => normType(r.type) === "PURCHASE").length,
    [moneyRecords]
  );
  const saleCount = useMemo(
    () => moneyRecords.filter((r) => normType(r.type) === "OUT").length,
    [moneyRecords]
  );

  // 수정 중인 기록 정보
  const [editingId, setEditingId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCount, setEditCount] = useState("");
  const [editType, setEditType] = useState("PURCHASE"); 
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
    setEditType("PURCHASE");
    setEditMemo("");
  };

  const saveEdit = () => {
    if (!editingId || !onUpdateRecord) return;

    const t = normType(editType);

    //  매입은 가격 필수
    if (t === "PURCHASE") {
      const p = editPrice === "" || editPrice == null ? null : Number(editPrice);
      if (p == null || !Number.isFinite(p) || p <= 0) {
        alert("매입은 가격을 반드시 입력해야 합니다.");
        return;
      }
    }

    // OUT은 가격이 있을 때만 돈 기록이지만, 수정 시에는 비워도 허용(원하면 막아도 됨)
    if (t === "OUT" && editPrice !== "" && editPrice != null) {
      const p = Number(editPrice);
      if (!Number.isFinite(p) || p < 0) {
        alert("판매 가격이 올바르지 않습니다.");
        return;
      }
    }

    onUpdateRecord(editingId, {
      date: editDate,
      price: editPrice,
      count: editCount,
      type: t,
      memo: editMemo,
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
          · 매입 {purchaseCount} · 판매 {saleCount}
        </span>
      </div>

      {count === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          아직 기록이 없습니다. (가격이 입력된 매입/판매만 표시됩니다)
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {moneyRecords.map((r) => {
            const isEditing = r.id === editingId;
            const type = normType(r.type);
            const isOut = type === "OUT";
            const isPurchase = type === "PURCHASE";

            //  매입(PURCHASE)만 단가 표시
            const unit =
              isPurchase && r.price != null
                ? calcUnit(r.price, r.count ?? 1)
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
                          <option value="PURCHASE">매입</option>
                          <option value="OUT">판매</option>
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
                          placeholder={
                            normType(editType) === "OUT"
                              ? "판매 금액(총액)"
                              : "매입 금액(총액)"
                          }
                          style={{
                            width: 140,
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
                          {r.date} · {isOut ? "판매" : "매입"}{" "}
                          {formatNumber(r.price)}원
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        수량 {r.count ?? 1}개
                        {unit != null ? (
                          <span style={{ color: "#111827", fontWeight: 700 }}>
                            {" "}
                            · 단가 {formatNumber(unit)}원
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
                      {/* PURCHASE일 때만 (선택) 입고 처리 버튼 */}
                      {type === "PURCHASE" && typeof onMarkArrived === "function" ? (
                        <button
                          type="button"
                          onClick={() => onMarkArrived(r)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #16a34a",
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          입고 처리
                        </button>
                      ) : null}

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
