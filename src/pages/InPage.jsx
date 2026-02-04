import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useMobile from "../hooks/useMobile";
import {
  lookupItemByBarcode,
  createRecordsBatch,
  getAllRecords,
  getItems,
} from "../api/items";

const norm = (s) => String(s ?? "").trim().toLowerCase();
const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export default function InPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const scanRef = useRef(null);
  const manualRef = useRef(null);

  /* -------------------- 오른쪽: 입고 내역 -------------------- */
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------------------- 필터링 -------------------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 빠른 날짜 필터 프리셋
  const applyDatePreset = (days) => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.setDate(today.getDate() - days)).toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);
  };

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

  /* ==================== 공통 ==================== */
  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getAllRecords({ type: "IN" });
      const arr = Array.isArray(data) ? data : data?.records;
      const list = Array.isArray(arr) ? arr : [];
      setRecords(list.filter((r) => String(r.type).toUpperCase() === "IN"));
    } catch (e) {
      console.error(e);
      alert("입고 내역을 불러오지 못했어요.");
      setRecords([]);
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

      // 방금 스캔된 상품 강조 카드
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

      // 카트 누적 (같으면 count + 1)
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

  /* ==================== 필터링 ==================== */
  const filteredRecords = useMemo(() => {
    let result = records;

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = norm(searchQuery);
      result = result.filter((r) => {
        const name = norm(r.item?.name);
        const size = norm(r.item?.size);
        return name.includes(q) || size.includes(q);
      });
    }

    // 날짜 범위 필터
    if (startDate) {
      result = result.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      result = result.filter((r) => r.date <= endDate);
    }

    return result;
  }, [records, searchQuery, startDate, endDate]);

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

  /* ==================== 입고 확정 ==================== */
  async function handleConfirmIn() {
    if (cart.length === 0) {
      alert("입고 할 상품이 없습니다.");
      return;
    }

    try {
      await createRecordsBatch({
        type: "IN",
        items: cart.map((x) => ({
          itemId: x.itemId,
          count: Math.max(1, Math.abs(Number(x.count) || 1)), 
        })),
      });

      setCart([]);
      await loadRecords();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "입고 처리에 실패했어요.");
    }
  }

  /* ==================== UI ==================== */
  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #b8c5f2 0%, #c5b3d9 50%, #e8d4f0 100%)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "16px",
          padding: isMobile ? "16px" : "40px",
          boxShadow: "0 2px 8px rgba(123, 97, 255, 0.08)",
          border: "1px solid rgba(184, 197, 242, 0.3)",
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? 20 : 28,
            fontWeight: 800,
            marginBottom: 16,
            color: "#7c8db5",
          }}
        >
          📥 입고 관리
        </h2>

      {/* 방금 스캔된 상품 표시 */}
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
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr",
          gap: isMobile ? 16 : 24,
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

          {/*  수기 추가 섹션 */}
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

                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button onClick={() => updateCount(x.itemId, -1)} style={countBtn}>-</button>
                      <div style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>{x.count}</div>
                      <button onClick={() => updateCount(x.itemId, +1)} style={countBtn}>+</button>
                    </div>

                    <button onClick={() => removeFromCart(x.itemId)} style={removeBtn}>✕</button>
                  </div>
                ))}

                <button onClick={handleConfirmIn} style={primaryBtn}>
                  입고 확정
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT ==================== */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ ...cardTitle, marginBottom: 0 }}>입고 내역</h3>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {filteredRecords.length !== records.length && `${filteredRecords.length}/${records.length}건`}
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="품목명/사이즈 검색"
              style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
            />

            {/* 빠른 날짜 선택 버튼 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => applyDatePreset(7)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                최근 7일
              </button>
              <button
                onClick={() => applyDatePreset(30)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                최근 30일
              </button>
              <button
                onClick={() => applyDatePreset(90)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                최근 3개월
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ alignSelf: "center", fontSize: 13, color: "#6b7280" }}>~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              {(searchQuery || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    cursor: "pointer",
                  }}
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div>불러오는 중...</div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {records.length === 0 ? "아직 입고 기록이 없습니다." : "검색 결과가 없습니다."}
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {filteredRecords.map((r) => (
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

                  <button onClick={() => navigate(`/manage/${r.itemId}`)}>
                    상세
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  boxSizing: "border-box",
  maxWidth: "100%",
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

const primaryBtn = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const countBtn = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#374151",
};

const removeBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #ef4444",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 14,
  color: "#ef4444",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
