import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceInputModal from "../components/PriceInputModal";
import {
  createRecord,
  updateRecord,
  getAllRecords, 
} from "../api/items";

export default function InPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 새 입고 입력
  const [selectedItem, setSelectedItem] = useState(null);
  const [count, setCount] = useState(1);
  const [memo, setMemo] = useState("");

  // 가격 입력 모달
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  async function loadRecords() {
    setLoading(true);
    try {
      const list = await getAllRecords({ type: "IN" });
      setRecords(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function handleCreateIn() {
    if (!itemId || count <= 0) {
      alert("itemId와 수량을 확인해주세요");
      return;
    }

    await createRecord({
      itemId: Number(itemId),
      count: Number(count),
      type: "IN",
      memo: memo || null,
    });

    setCount(1);
    setMemo("");
    await loadRecords();
  }

  async function handlePriceSubmit(price) {
    await updateRecord({
      itemId: selectedRecord.itemId,
      id: selectedRecord.id,
      price,
    });
    await loadRecords();
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
        📥 입고 관리
      </h2>

      {/* 입고 추가 */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          새 입고
        </h3>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            
        <ItemPicker
           value={selectedItem}
           onSelect={setSelectedItem}
           style={inputStyle}
          />
          <input
            type="number"
            placeholder="수량"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={inputStyle}
          />
          <input
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />

          <button onClick={handleCreateIn} style={primaryBtn}>
            입고 추가
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          * 가격은 나중에 입력해도 됩니다.
        </div>
      </div>

      {/* 입고 내역 */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          입고 내역
        </h3>

        {loading ? (
          <div>불러오는 중...</div>
        ) : records.length === 0 ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            아직 입고 기록이 없습니다.
          </div>
        ) : (
          records.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {r.item?.name ?? `itemId ${r.itemId}`}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {r.date?.slice(0, 10)} · {r.count}개
                </div>
              </div>

              {r.price != null ? (
                <div style={{ fontWeight: 700 }}>
                  {r.price.toLocaleString()}원
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedRecord(r);
                    setPriceModalOpen(true);
                  }}
                  style={warnBtn}
                >
                  원가 입력
                </button>
              )}

              <button
                onClick={() => navigate(`/manage/${r.itemId}`)}
                style={linkBtn}
              >
                상세
              </button>
            </div>
          ))
        )}
      </div>

      <PriceInputModal
        open={priceModalOpen}
        record={selectedRecord}
        onClose={() => setPriceModalOpen(false)}
        onSubmit={handlePriceSubmit}
      />
    </div>
  );
}

/* ---- styles ---- */

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 14,
};

const primaryBtn = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const warnBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #f59e0b",
  background: "#fffbeb",
  color: "#92400e",
  fontSize: 12,
  cursor: "pointer",
};

const linkBtn = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontSize: 12,
  cursor: "pointer",
};
