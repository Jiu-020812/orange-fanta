import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceInputModal from "../components/PriceInputModal";
import ItemPicker from "../components/ItemPicker";
import { createRecord, updateRecord, getAllRecords } from "../api/items";

export default function InPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 새 입고 입력
  const [selectedItem, setSelectedItem] = useState(null);
  const [count, setCount] = useState(""); // 문자열로 유지 (010 방지용)
  const [memo, setMemo] = useState("");

  // 가격 입력 모달
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getAllRecords({ type: "IN" });

      // getAllRecords가 []를 주든 { ok, records }를 주든 대응
      const arr = Array.isArray(data) ? data : data?.records;
      setRecords(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error("loadRecords error:", e);
      alert(e?.message || "입고 내역을 불러오지 못했어요.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function handleCreateIn() {
    if (!selectedItem) {
      alert("상품을 선택해주세요");
      return;
    }

    const n = Number(count || 0);
    if (!Number.isFinite(n) || n <= 0) {
      alert("수량을 확인해주세요");
      return;
    }

    try {
      await createRecord({
        itemId: selectedItem.id,
        count: n, // 
        type: "IN",
        memo: memo?.trim() ? memo.trim() : null,
      });

      setSelectedItem(null);
      setCount(""); // ✅ ""로 초기화 (0 고정값 X)
      setMemo("");
      await loadRecords();
    } catch (e) {
      console.error("createRecord error:", e);
      alert(e?.message || "입고 추가에 실패했어요.");
    }
  }

  async function handlePriceSubmit(price) {
    if (!selectedRecord) return;

    try {
      await updateRecord({
        itemId: selectedRecord.itemId,
        id: selectedRecord.id,
        price,
      });

      setPriceModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (e) {
      console.error("updateRecord error:", e);
      alert(e?.message || "가격 저장에 실패했어요.");
    }
  }

  function goDetailByItemId(itemId) {
    if (!itemId) return;
    //  상세 라우트는 itemId 기반으로 통일
    navigate(`/manage/${itemId}`);
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
        📥 입고 관리
      </h2>

      {/* 새 입고 카드 */}
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

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* ItemPicker */}
          <div
            style={{
              flex: "1 1 260px",
              minWidth: 0, // 
              maxWidth: 380,
            }}
          >
            <ItemPicker value={selectedItem} onSelect={setSelectedItem} />
          </div>

          {/* 수량 */}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={count}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              let v = e.target.value;
              if (v === "") return setCount("");
              v = v.replace(/^0+(?=\d)/, ""); // 
              setCount(v);
            }}
            style={{ ...inputStyle, width: 110 }}
          />

          {/* 메모 */}
          <input
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ ...inputStyle, flex: "1 1 220px", minWidth: 180 }}
          />

          <button
            type="button"
            onClick={handleCreateIn}
            style={{ ...primaryBtn, flex: "0 0 auto" }}
          >
            입고 추가
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          * 가격은 나중에 입력해도 됩니다.
        </div>
      </div>

      {/* 입고 내역 카드 */}
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
                  {r.item?.size ? ` (${r.item.size})` : ""}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {r.date?.slice(0, 10)} · {r.count}개
                </div>
              </div>

              {r.price != null ? (
                <div style={{ fontWeight: 700 }}>
                  {Number(r.price).toLocaleString()}원
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(r);
                    setPriceModalOpen(true);
                  }}
                  style={warnBtn}
                >
                  가격 입력
                </button>
              )}
              <button onClick={() => navigate(`/manage/${r.itemId}`)}>상세</button>
            </div>
          ))
        )}
      </div>

      <PriceInputModal
        open={priceModalOpen}
        record={selectedRecord}
        onClose={() => {
          setPriceModalOpen(false);
          setSelectedRecord(null);
        }}
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
