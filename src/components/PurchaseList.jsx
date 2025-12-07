import { useState } from "react";
import DeleteButton from "./DeleteButton";

function formatNumber(num) {
  if (num == null) return "";
  return num.toLocaleString("ko-KR");
}

function PurchaseList({ records, onDeleteRecord, onUpdateRecord }) {
  const count = records?.length || 0;
  const safeRecords = Array.isArray(records) ? records : [];

  // 수정 중인 기록 정보
  const [editingId, setEditingId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCount, setEditCount] = useState("");

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditDate(record.date || "");
    setEditPrice(
      record.price != null && record.price !== undefined
        ? String(record.price)
        : ""
    );
    setEditCount(
      record.count != null && record.count !== undefined
        ? String(record.count)
        : ""
    );
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditDate("");
    setEditPrice("");
    setEditCount("");
  };

  const saveEdit = () => {
    if (!editingId || !onUpdateRecord) return;
    onUpdateRecord(editingId, {
      date: editDate,
      price: editPrice,
      count: editCount,
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
      <div
        style={{
          marginBottom: 8,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        매입 기록 ({count}건)
      </div>

      {count === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          아직 기록이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {safeRecords.map((r) => {
            const isEditing = r.id === editingId;

            return (
              <div
                key={r.id}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#fafafa",
                  gap: 8,
                }}
              >
                {/* 왼쪽: 내용 or 입력폼 */}
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
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
                          placeholder="금액"
                          style={{
                            width: 100,
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
                          placeholder="개수"
                          style={{
                            width: 60,
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, marginBottom: 2 }}>
                        {r.date} {formatNumber(r.price)}원
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        {r.count ?? 1}개
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