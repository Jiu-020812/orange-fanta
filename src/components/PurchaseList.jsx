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

// "매입(123) 입고" 에서 123 뽑기
function parseArrivedPurchaseId(memo) {
  const s = String(memo ?? "");
  const m = s.match(/매입\((\d+)\)\s*입고/);
  return m ? Number(m[1]) : null;
}

function TypeBadge({ type }) {
  const t = normType(type);

  //  OUT -> 판매, PURCHASE -> 매입, IN -> 입고
  const label = t === "OUT" ? "판매" : t === "PURCHASE" ? "매입" : "입고";

  const theme =
    t === "OUT"
      ? { borderColor: "#fecaca", backgroundColor: "#fee2e2", color: "#991b1b" }
      : t === "PURCHASE"
      ? { borderColor: "#bbf7d0", backgroundColor: "#dcfce7", color: "#166534" }
      : { borderColor: "#bfdbfe", backgroundColor: "#eff6ff", color: "#1d4ed8" };

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
 * - records: 전체 records (IN 포함 원본)
 * - showIn: boolean (IN 표시 토글)
 * - onDeleteRecord(id)
 * - onUpdateRecord(id, patch)
 * - onMarkArrived(purchaseRecord, arrivedCount)
 */
export default function PurchaseList({
  records,
  showIn,
  onDeleteRecord,
  onUpdateRecord,
  onMarkArrived,
}) {
  const safeRecords = Array.isArray(records) ? records : [];

  //  PURCHASE별로 "이미 입고된 수량" 합계 (IN memo로 연결) — 항상 전체 records로 계산
  const arrivedCountByPurchaseId = useMemo(() => {
    const map = new Map(); // purchaseId -> sum(count)

    for (const r of safeRecords) {
      if (!r) continue;
      if (normType(r.type) !== "IN") continue;

      const pid = parseArrivedPurchaseId(r.memo);
      if (!pid) continue;

      const qty = Number(r.count) || 0;
      if (qty > 0) map.set(pid, (map.get(pid) || 0) + qty);
    }

    return map;
  }, [safeRecords]);

  const getRemain = (purchaseRecord) => {
    const total = Number(purchaseRecord?.count) || 0;
    const arrived = arrivedCountByPurchaseId.get(Number(purchaseRecord?.id)) || 0;
    return Math.max(0, total - arrived);
  };

  //  화면 표시용 필터: showIn에 따라 IN만 토글
  const displayRecords = useMemo(() => {
    return safeRecords
      .filter((r) => {
        const t = normType(r.type);
        const hasPrice = r.price != null && Number(r.price) > 0;

        if (t === "IN") return !!showIn;       // 체크했을 때만 IN 표시
        if (t === "PURCHASE") return hasPrice; // 매입은 가격 있는 것만
        if (t === "OUT") return hasPrice;      // 판매도 가격 있는 것만
        return false;
      })
      .sort((a, b) => {
        const da = String(a.date || "");
        const db = String(b.date || "");
        if (da === db) return Number(b.id) - Number(a.id);
        return db.localeCompare(da); // 최신 날짜 먼저
      });
  }, [safeRecords, showIn]);

  const count = displayRecords.length;

  const purchaseCount = useMemo(
    () => displayRecords.filter((r) => normType(r.type) === "PURCHASE").length,
    [displayRecords]
  );
  const saleCount = useMemo(
    () => displayRecords.filter((r) => normType(r.type) === "OUT").length,
    [displayRecords]
  );

  // 수정 상태
  const [editingId, setEditingId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCount, setEditCount] = useState("");
  const [editType, setEditType] = useState("PURCHASE");
  const [editMemo, setEditMemo] = useState("");

  // 부분입고 모달
  const [arriveModal, setArriveModal] = useState(null);
  // { record, maxRemain, value }

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

    // PURCHASE는 price 필수
    if (t === "PURCHASE") {
      const p = editPrice === "" || editPrice == null ? null : Number(editPrice);
      if (p == null || !Number.isFinite(p) || p <= 0) {
        alert("매입은 가격을 반드시 입력해야 합니다.");
        return;
      }
    }

    // OUT은 price 선택(있으면 >=0)
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

  // 입고 처리 실행 (전량/부분)
  const doArrive = (purchaseRecord, arrivedCount) => {
    if (typeof onMarkArrived !== "function") return;

    const remain = getRemain(purchaseRecord);
    const n = Number(arrivedCount);

    if (!Number.isFinite(n) || n <= 0) {
      alert("입고 수량을 1 이상으로 입력해 주세요.");
      return;
    }
    if (n > remain) {
      alert(`남은 수량(${remain}개)보다 많이 입고할 수 없어요.`);
      return;
    }

    onMarkArrived(purchaseRecord, n);
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
          아직 기록이 없습니다. (가격이 입력된 매입/판매{showIn ? "/입고" : ""}만 표시됩니다)
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {displayRecords.map((r) => {
            const isEditing = r.id === editingId;
            const type = normType(r.type);
            const isOut = type === "OUT";
            const isPurchase = type === "PURCHASE";

            const unit = isPurchase && r.price != null ? calcUnit(r.price, r.count ?? 1) : null;

            const remain = isPurchase ? getRemain(r) : 0;
            const total = isPurchase ? (Number(r.count) || 0) : 0;
            const arrived = isPurchase ? Math.max(0, total - remain) : 0;
            const done = isPurchase && remain === 0;

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
                {/* 왼쪽 */}
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
                          {/* IN은 여기서 수정 선택지로 안 둠 */}
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
                          placeholder={normType(editType) === "OUT" ? "판매 금액(총액)" : "매입 금액(총액)"}
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
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
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
                          {r.date} · {isOut ? "판매" : isPurchase ? "매입" : "입고"}{" "}
                          {type === "IN" ? "" : `${formatNumber(r.price)}원`}
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

                        {/* PURCHASE 진행 상태 표시 */}
                        {isPurchase ? (
                          <span style={{ color: done ? "#166534" : "#d97706", fontWeight: 700 }}>
                            {" "}
                            · 입고 {arrived} / {total} ( 남은 수량 {remain})
                          </span>
                        ) : null}

                        {r.memo ? <span style={{ color: "#374151" }}> · 메모: {r.memo}</span> : null}
                      </div>
                    </>
                  )}
                </div>

                {/* 오른쪽 버튼 */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
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
                      {/* PURCHASE일 때만: remaining > 0 이면 입고 버튼 */}
                      {type === "PURCHASE" && typeof onMarkArrived === "function" && remain > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => doArrive(r, remain)} // 일괄입고
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
                            일괄입고
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setArriveModal({
                                record: r,
                                maxRemain: remain,
                                value: "1",
                              })
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #16a34a",
                              backgroundColor: "#ffffff",
                              color: "#166534",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            부분입고
                          </button>
                        </>
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

                      <DeleteButton onClick={() => onDeleteRecord(r.id)}>삭제</DeleteButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 부분입고 모달 */}
      {arriveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
          onClick={() => setArriveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "white",
              borderRadius: 14,
              padding: 18,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>부분 입고</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
              남은 수량: <b>{arriveModal.maxRemain}</b>개
            </div>

            <input
              type="number"
              min={1}
              max={arriveModal.maxRemain}
              value={arriveModal.value}
              onChange={(e) =>
                setArriveModal((prev) => (prev ? { ...prev, value: e.target.value } : prev))
              }
              style={{
                width: "100%",
                height: 34,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setArriveModal(null)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => {
                  const n = Number(arriveModal.value);
                  doArrive(arriveModal.record, n);
                  setArriveModal(null);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#16a34a",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                입고 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
