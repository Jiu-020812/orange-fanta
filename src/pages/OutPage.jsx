import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceInputModal from "../components/PriceInputModal";
import {
  lookupItemByBarcode,
  createRecordsBatch,
  getAllRecords,
  updateRecord,
} from "../api/items";

export default function OutPage() {
  const navigate = useNavigate();
  const scanRef = useRef(null);

  /* -------------------- 오른쪽: 출고 내역 -------------------- */
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------------------- 왼쪽: 스캔 누적 -------------------- */
  const [scanValue, setScanValue] = useState("");
  const [cart, setCart] = useState([]);
  // { itemId, name, size, imageUrl, count }

  // 방금 스캔된 상품 (강조 카드)
  const [lastScanned, setLastScanned] = useState(null);
  const lastTimerRef = useRef(null);

  /* -------------------- 가격 모달 -------------------- */
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  /* ==================== 공통 ==================== */
  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getAllRecords({ type: "OUT" });
      const arr = Array.isArray(data) ? data : data?.records;
      setRecords(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error(e);
      alert("출고 내역을 불러오지 못했어요.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  /* -------------------- 스캔 input 항상 포커스 -------------------- */
  useEffect(() => {
    scanRef.current?.focus();
    const onClick = () => scanRef.current?.focus();
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  /* ==================== 바코드 스캔 ==================== */
async function handleScanEnter() {
    const code = scanValue.trim();
    if (!code) return;
    setScanValue("");
  
    try {
      const res = await lookupItemByBarcode(code);
  
      if (!res?.ok) {
        alert(`미등록 상품입니다.\n바코드: ${code}`);
        return;
      }
  
      const item = res.item;
  
      //  방금 스캔된 상품 강조 카드 띄우기
      setLastScanned({
        itemId: item.itemId,
        name: item.name,
        size: item.size,
        imageUrl: item.imageUrl,
      });
  
      if (lastTimerRef.current) clearTimeout(lastTimerRef.current);
      lastTimerRef.current = setTimeout(() => {
        setLastScanned(null);
      }, 1200);

      //  카트 누적 (같으면 count + 1)
      setCart((prev) => {
        const idx = prev.findIndex((x) => x.itemId === item.itemId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], count: next[idx].count + 1 };
          return next;
        }
        return [
          {
            itemId: item.itemId,
            name: item.name,
            size: item.size,
            imageUrl: item.imageUrl,
            count: 1,
          },
          ...prev,
        ];
      });
    } catch (e) {
      console.error(e);
      alert("바코드 조회 중 오류가 발생했어요.");
    }
  }

  /* ==================== 수량 조절 ==================== */
  function updateCount(itemId, delta) {
    setCart((prev) =>
      prev
        .map((x) =>
          x.itemId === itemId
            ? { ...x, count: Math.max(1, x.count + delta) }
            : x
        )
        .filter((x) => x.count > 0)
    );
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((x) => x.itemId !== itemId));
  }

  /* ==================== 출고 확정 ==================== */
  async function handleConfirmOut() {
    if (cart.length === 0) {
      alert("출고할 상품이 없습니다.");
      return;
    }

    try {
      await createRecordsBatch({
        type: "OUT",
        items: cart.map((x) => ({
          itemId: x.itemId,
          count: x.count,
        })),
      });

      setCart([]);
      await loadRecords();
    } catch (e) {
      console.error(e);
      alert(
        e?.response?.data?.message ||
          "출고 처리에 실패했어요. (재고 부족일 수 있어요)"
      );
    }
  }

  /* ==================== 판매가 입력 ==================== */
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
      console.error(e);
      alert("판매가 저장에 실패했어요.");
    }
  }

  /* ==================== UI ==================== */
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
    📤 출고 관리
  </h2>

  {/*  방금 스캔된 상품 표시 (출고) */}
  {lastScanned && (
    <div style={scanToast}>
      {lastScanned.imageUrl && (
        <img
          src={lastScanned.imageUrl}
          alt=""
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            objectFit: "cover",
          }}
        />
      )}

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>
          {lastScanned.name}
          {lastScanned.size ? ` (${lastScanned.size})` : ""}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          방금 스캔됨
        </div>
      </div>

      <div style={scanBadge}>+1</div>
    </div>
  )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        {/* ==================== LEFT ==================== */}
        <div style={card}>
          <h3 style={cardTitle}>바코드 스캔</h3>

          <input
            ref={scanRef}
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScanEnter();
              }
            }}
            placeholder="바코드 스캔 후 Enter"
            autoComplete="off"
            inputMode="numeric"
            style={{ ...inputStyle, marginBottom: 12 }}
          />

          {cart.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              스캔한 상품이 없습니다.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.map((x) => (
                <div key={x.itemId} style={cartRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {x.name} {x.size ? `(${x.size})` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => updateCount(x.itemId, -1)}>-</button>
                    <div style={{ minWidth: 20, textAlign: "center" }}>
                      {x.count}
                    </div>
                    <button onClick={() => updateCount(x.itemId, +1)}>+</button>
                  </div>

                  <button onClick={() => removeFromCart(x.itemId)}>✕</button>
                </div>
              ))}

              <button onClick={handleConfirmOut} style={dangerBtn}>
                출고 확정
              </button>
            </div>
          )}
        </div>

        {/* ==================== RIGHT ==================== */}
        <div style={card}>
          <h3 style={cardTitle}>출고 내역</h3>

          {loading ? (
            <div>불러오는 중...</div>
          ) : records.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              아직 출고 기록이 없습니다.
            </div>
          ) : (
            records.map((r) => (
              <div key={r.id} style={recordRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {r.item?.name}
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
                    onClick={() => {
                      setSelectedRecord(r);
                      setPriceModalOpen(true);
                    }}
                    style={warnBtn}
                  >
                    판매가 입력
                  </button>
                )}

                <button onClick={() => navigate(`/manage/${r.itemId}`)}>
                  상세
                </button>
              </div>
            ))
          )}
        </div>
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

/* ==================== styles ==================== */

const card = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 12,
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 14,
};

const cartRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 10,
  borderRadius: 12,
  background: "#f9fafb",
};

const recordRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid #f3f4f6",
};

const dangerBtn = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "#ef4444",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const warnBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #2563eb",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 12,
  cursor: "pointer",
};
const scanToast = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    marginBottom: 16,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ecfeff",
  };
  
  const scanBadge = {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#0ea5e9",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
  };
  
