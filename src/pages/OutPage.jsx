import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceInputModal from "../components/PriceInputModal";
import {
  lookupItemByBarcode,
  createRecordsBatch,
  getAllRecords,
  updateRecord,
  getItems,
} from "../api/items";

const norm = (s) => String(s ?? "").trim().toLowerCase();
const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export default function OutPage() {
  const navigate = useNavigate();
  const scanRef = useRef(null);
  const manualRef = useRef(null);

  /* -------------------- 오른쪽: 판매 내역 -------------------- */
  const [paidSales, setPaidSales] = useState([]);       // price 있는 OUT
  const [unpricedSales, setUnpricedSales] = useState([]); // price 없는 OUT
  const [loading, setLoading] = useState(true);

  /* -------------------- 아이템 목록 (수기 검색용) -------------------- */
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  /* -------------------- 왼쪽: 스캔 누적 -------------------- */
  const [scanValue, setScanValue] = useState("");
  const [cart, setCart] = useState([]);
  // { itemId, name, size, imageUrl, count }

  // 방금 스캔된 상품 (강조 카드)
  const [lastScanned, setLastScanned] = useState(null);
  const lastTimerRef = useRef(null);

  /* -------------------- 수기 검색 -------------------- */
  const [manualQuery, setManualQuery] = useState("");

  /* -------------------- 가격 모달 -------------------- */
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  /* ==================== 공통 ==================== */
  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getAllRecords({ type: "OUT" });
      const arr = Array.isArray(data) ? data : data?.records;
      const list = Array.isArray(arr) ? arr : [];

      // OUT만 (안전)
      const out = list.filter((r) => String(r.type).toUpperCase() === "OUT");

      setPaidSales(out.filter((r) => r.price != null && Number(r.price) > 0));
      setUnpricedSales(out.filter((r) => r.price == null));
    } catch (e) {
      console.error(e);
      alert("판매 내역을 불러오지 못했어요.");
      setPaidSales([]);
      setUnpricedSales([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadItems() {
    setItemsLoading(true);
    try {
      const data = await getItems();
      const arr = Array.isArray(data) ? data : data?.items;
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    loadItems();
  }, []);

  /* -------------------- 스캔 input 포커스 -------------------- */
  useEffect(() => {
    scanRef.current?.focus();

    const onClick = () => {
      if (document.activeElement === manualRef.current) return;
      scanRef.current?.focus();
    };

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

      setCart((prev) =>
        addOrIncCart(prev, {
          itemId: item.itemId,
          name: item.name,
          size: item.size,
          imageUrl: item.imageUrl,
          count: 1,
        })
      );
    } catch (e) {
      console.error(e);
      alert("바코드 조회 중 오류가 발생했어요.");
    }
  }

  /* ==================== 수기 검색 결과 ==================== */
  const manualResults = useMemo(() => {
    const q = norm(manualQuery);
    if (!q) return [];

    return (Array.isArray(items) ? items : [])
      .filter((it) => {
        const name = norm(it.name);
        const size = norm(it.size);
        return name.includes(q) || size.includes(q);
      })
      .slice(0, 10);
  }, [items, manualQuery]);

  function addManualToCart(item) {
    const itemId = item.id ?? item.itemId;
    if (!itemId) return;

    setCart((prev) =>
      addOrIncCart(prev, {
        itemId,
        name: item.name,
        size: item.size,
        imageUrl: item.imageUrl,
        count: 1,
      })
    );

    setManualQuery("");
    scanRef.current?.focus();
  }

  /* ==================== 수량 조절 ==================== */
  function updateCount(itemId, delta) {
    setCart((prev) =>
      prev
        .map((x) =>
          x.itemId === itemId ? { ...x, count: Math.max(1, x.count + delta) } : x
        )
        .filter((x) => x.count > 0)
    );
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((x) => x.itemId !== itemId));
  }

  /* ==================== 판매 확정 ==================== */
  async function handleConfirmOut() {
    if (cart.length === 0) {
      alert("판매 할 상품이 없습니다.");
      return;
    }

    try {
      await createRecordsBatch({
        type: "OUT",
        items: cart.map((x) => ({
          itemId: x.itemId,
          count: Math.max(1, Math.abs(Number(x.count) || 1)), //  숫자/양수 강제
        })),
      });

      setCart([]);
      await loadRecords();
    } catch (e) {
      console.error(e);
      alert(
        e?.response?.data?.message ||
          "판매 처리에 실패했어요. (재고 부족일 수 있어요)"
      );
    }
  }

  /* ==================== 판매가 입력 ==================== */
  async function handlePriceSubmit(price) {
    if (!selectedRecord) return;

    const p = price === "" || price == null ? null : Number(price);
    if (p == null) {
      alert("판매가를 입력해주세요.");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      alert("판매가는 0보다 큰 숫자여야 해요.");
      return;
    }

    try {
      await updateRecord({
        itemId: selectedRecord.itemId,
        id: selectedRecord.id,
        price: p,
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
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        padding: "40px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 장식 */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          top: "-200px",
          right: "-100px",
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          bottom: "-100px",
          left: "-50px",
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          📤 판매 관리
        </h2>

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
            <div style={{ fontSize: 12, color: "#6b7280" }}>방금 스캔됨</div>
          </div>

          <div style={scanBadge}>+1</div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 24,
        }}
      >
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
            style={{ ...inputStyle, marginBottom: 12, width: "100%" }}
          />

          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>수기 검색 추가</div>

            <input
              ref={manualRef}
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (manualResults[0]) addManualToCart(manualResults[0]);
                }
              }}
              placeholder="이름/옵션(사이즈) 검색 후 Enter"
              autoComplete="off"
              style={{ ...inputStyle, width: "100%" }}
            />

            {manualQuery && (
              <div style={resultBox}>
                {itemsLoading ? (
                  <div style={resultEmpty}>불러오는 중...</div>
                ) : manualResults.length === 0 ? (
                  <div style={resultEmpty}>검색 결과가 없어요.</div>
                ) : (
                  manualResults.map((it) => (
                    <button
                      key={it.id ?? it.itemId}
                      type="button"
                      onClick={() => addManualToCart(it)}
                      style={resultRow}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {it.size ? `(${it.size})` : ""}
                        </div>
                      </div>
                      <div style={resultAdd}>+ 담기</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 카트 */}
          <div style={{ marginTop: 12 }}>
            {cart.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                스캔/추가한 상품이 없습니다.
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
                  판매 확정
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT ==================== */}
        <div style={card}>
          <h3 style={cardTitle}>판매 내역</h3>

          {loading ? (
            <div>불러오는 중...</div>
          ) : (
            <>
              {/* 가격 있는 판매(돈 기록) */}
              {paidSales.length === 0 ? (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  아직 판매 기록(가격 입력 완료)이 없습니다.
                </div>
              ) : (
                paidSales.map((r) => (
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

                    <div style={{ fontWeight: 700 }}>
                      {Number(r.price).toLocaleString()}원
                    </div>

                    <button onClick={() => navigate(`/manage/${r.itemId}`)}>
                      상세
                    </button>
                  </div>
                ))
              )}

              {/* 🟡 가격 미입력 판매 */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                  🟡 판매가 미입력
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>
                    ({unpricedSales.length})
                  </span>
                </div>

                {unpricedSales.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    판매가 미입력 항목이 없습니다.
                  </div>
                ) : (
                  unpricedSales.map((r) => (
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

                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setPriceModalOpen(true);
                        }}
                        style={warnBtn}
                      >
                        판매가 입력
                      </button>

                      <button onClick={() => navigate(`/manage/${r.itemId}`)}>
                        상세
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
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
    </div>
  );
}

/* ==================== helpers ==================== */
function addOrIncCart(prev, row) {
  const itemId = safeNum(row.itemId, 0);
  if (!itemId) return prev;

  const idx = prev.findIndex((x) => x.itemId === itemId);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = {
      ...next[idx],
      count: safeNum(next[idx].count, 1) + safeNum(row.count, 1),
    };
    return next;
  }
  return [{ ...row, itemId, count: safeNum(row.count, 1) }, ...prev];
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
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 13,
  outline: "none",
};

const resultBox = {
  marginTop: 8,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  background: "#ffffff",
};

const resultRow = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTop: "1px solid #f3f4f6",
};

const resultEmpty = {
  padding: 12,
  fontSize: 13,
  color: "#6b7280",
};

const resultAdd = {
  fontSize: 12,
  color: "#2563eb",
  fontWeight: 800,
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
