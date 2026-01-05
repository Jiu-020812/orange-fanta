import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatsSection from "../components/StatsSection";
import PurchaseForm from "../components/PurchaseForm";
import PurchaseList from "../components/PurchaseList";
import {
  getItems as fetchItems,
  getItemDetail,
  createItem,
  updateItem as updateServerItem,
  createRecord,
  updateRecord as updateServerRecord,
  deleteRecord as deleteServerRecord,
  deleteItem as deleteServerItem,
} from "../api/items";

const norm = (s) => String(s ?? "").trim();

/* ======================= 이미지 자동 압축 유틸 ======================= */
async function compressImage(file, maxW = 900, maxH = 900, quality = 0.75) {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  return canvas.toDataURL("image/jpeg", quality);
}

function toYmd(d) {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function parseRecordsResponse(data) {
  if (Array.isArray(data)) return { item: null, records: data, stock: null };
  if (data && Array.isArray(data.records)) {
    return {
      item: data.item ?? null,
      records: data.records,
      stock: data.stock ?? null,
    };
  }
  return { item: null, records: [], stock: null };
}


export default function ManageDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const numericItemId = Number(itemId);

  //  itemId가 이상하면 공백 대신 안내
  if (!Number.isFinite(numericItemId) || numericItemId <= 0) {
    return <div style={{ padding: 24 }}>잘못된 접근입니다. (itemId가 없습니다)</div>;
  }

  const [items, setItems] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const [toast, setToast] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [memoText, setMemoText] = useState("");

  // 기간 필터
  const [rangeMode, setRangeMode] = useState("ALL"); // ALL | 7 | 30 | 90 | CUSTOM
  const [fromDate, setFromDate] = useState(() => "");
  const [toDate, setToDate] = useState(() => toYmd(new Date()));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ---------------- 서버에서 아이템 목록 불러오기 ---------------- */
  useEffect(() => {
    let alive = true;
  
    async function boot() {
      try {
        // 1) 현재 item + records + stock (v2 API)
        const detail = await getItemDetail(numericItemId); 
        // detail: { ok:true, item, records, stock }
  
        const itemFromApi = detail?.item ?? null;
        const rawRecords = Array.isArray(detail?.records) ? detail.records : [];
        const stockFromApi = detail?.stock ?? null;
  
        if (!alive) return;
  
        // selectedOptionId는 URL itemId로 고정
        setSelectedOptionId(numericItemId);
  
        // records 세팅
        setRecords(
          rawRecords.map((rec) => ({
            id: rec.id,
            itemId: rec.itemId,
            type: (rec.type || "IN").toUpperCase(),
            price: rec.price,
            count: rec.count,
            date: String(rec.date || "").slice(0, 10),
            memo: rec.memo ?? "",
          }))
        );
  
        // item이 없으면 404 등
        if (!itemFromApi?.id) {
          // item not found면 /manage로 보내도 됨
          return;
        }
  
        // 2) 같은 categoryId의 items만 불러오기 (카테고리 섞임 방지 핵심)
        const catId = itemFromApi.categoryId;
        const list = await fetchItems(catId);
  
        if (!alive) return;
  
        // items에 "현재 item" 정보(categoryId 포함)가 확실히 들어가도록 merge
        const safeList = Array.isArray(list) ? list : [];
        const merged = (() => {
          const map = new Map(safeList.map((x) => [x.id, x]));
          map.set(itemFromApi.id, { ...(map.get(itemFromApi.id) || {}), ...itemFromApi });
          return Array.from(map.values());
        })();
  
        setItems(merged);
      } catch (err) {
        console.error("detail boot failed:", err);
        if (!alive) return;
        setItems([]);
        setRecords([]);
      }
    }
  
    boot();
    return () => {
      alive = false;
    };
  }, [numericItemId]);

  /* ---------------- 현재 선택 옵션(= item row) ---------------- */
  const selectedOption = useMemo(() => {
    if (!selectedOptionId) return null;
    return items.find((it) => it.id === selectedOptionId) || null;
  }, [items, selectedOptionId]);

  const looksLikeShoeSize = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return true; // 비어있으면 기본은 신발
    const n = Number(s);
    return Number.isFinite(n) && n >= 180 && n <= 400;
  };
  const isShoes = looksLikeShoeSize(selectedOption?.size);

  /*  검색/정렬 상태 — 반드시 필요 */
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState("ASC"); // ASC | DESC

  /*  최종 품목명 (name 라우팅 제거) */
  const decodedName = selectedOption?.name ?? "";

  /* ---------------- 옵션 리스트 (같은 name 묶음) ---------------- */
  const options = useMemo(() => {
    const groupName = norm(selectedOption?.name);
    if (!groupName) return [];
    return items.filter((i) => norm(i.name) === groupName);
  }, [items, selectedOption?.name]);

  const representativeImageUrl = useMemo(() => {
    return options.find((opt) => opt.imageUrl)?.imageUrl || null;
  }, [options]);

  /*  옵션 중복 체크 */
  const isOptionExists = (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return false;
    return options.some((opt) => norm(opt.size) === trimmed);
  };

  /* ---------------- 선택 옵션 바뀌면 기록 로드 ---------------- */
  const handleSelectOption = async (nextId) => {
    setSelectedOptionId(nextId);
    navigate(`/manage/${nextId}`, { replace: true });
  
    try {
      const detail = await getItemDetail(nextId);
      const rawRecords = Array.isArray(detail?.records) ? detail.records : [];
      setRecords(
        rawRecords.map((rec) => ({
          id: rec.id,
          itemId: rec.itemId,
          type: (rec.type || "IN").toUpperCase(),
          price: rec.price,
          count: rec.count,
          date: String(rec.date || "").slice(0, 10),
          memo: rec.memo ?? "",
        }))
      );
  
      // item 정보도 반영
      const itemFromApi = detail?.item ?? null;
      if (itemFromApi?.id) {
        setItems((prev) =>
          prev.map((it) => (it.id === itemFromApi.id ? { ...it, ...itemFromApi } : it))
        );
      }
    } catch (err) {
      console.error("option detail load failed:", err);
      setRecords([]);
    }
  };
  

  /* ---------------- 메모: 서버 Item.memo 기반 ---------------- */
  useEffect(() => {
    if (selectedOption && typeof selectedOption.memo === "string") setMemoText(selectedOption.memo);
    else setMemoText("");
  }, [selectedOption]);

  const handleSaveMemo = async () => {
    if (!selectedOption) return;
    try {
      const updated = await updateServerItem(selectedOption.id, {
        memo: memoText,
      });
      setItems((prev) => prev.map((it) => (it.id === selectedOption.id ? { ...it, ...updated } : it)));
      showToast("메모 저장 완료!");
    } catch (err) {
      console.error("메모 서버 저장 실패", err);
      window.alert("메모 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 추가 ---------------- */
  // ⭐ barcode 추가
  const handleAddOption = async ({ value, image, barcode }) => {
    const trimmed = String(value ?? "").trim();
    const trimmedBarcode = String(barcode ?? "").trim();

    if (!trimmed) return;

    if (!decodedName) {
      window.alert("품목명이 비어있어요. 옵션을 추가할 수 없습니다.");
      return;
    }

    if (isOptionExists(trimmed)) {
      window.alert("이미 등록된 옵션입니다.");
      return;
    }

    // ⭐ 바코드 중복 체크(같은 name 옵션들 안에서)
    if (trimmedBarcode) {
      const dup = options.some((opt) => String(opt.barcode ?? "").trim() === trimmedBarcode);
      if (dup) {
        window.alert("이미 등록된 바코드입니다.");
        return;
      }
    }

    try {
      const created = await createItem({
        name: decodedName,
        size: trimmed,
        imageUrl: image || null,
        categoryId: selectedOption?.categoryId ?? null,
        barcode: trimmedBarcode || null,
      });

      setItems((prev) => [...prev, created]);
      handleSelectOption(created.id);
      showToast("옵션 추가 완료");
    } catch (err) {
      console.error("옵션 서버 저장 실패", err);
      window.alert("서버에 옵션 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 수정 ---------------- */
  const handleSaveEditOption = async () => {
    if (!editModal) return;

    // ⭐ barcode 포함
    const { id, value, image, barcode } = editModal;
    const trimmed = String(value ?? "").trim();
    const trimmedBarcode = String(barcode ?? "").trim();

    if (!trimmed) return;

    if (options.some((opt) => opt.id !== id && norm(opt.size) === trimmed)) {
      window.alert("이미 존재하는 옵션입니다.");
      return;
    }

    // ⭐ 바코드 중복 체크(같은 name 옵션들 안에서, 자기 자신 제외)
    if (trimmedBarcode) {
      const dup = options.some((opt) => opt.id !== id && String(opt.barcode ?? "").trim() === trimmedBarcode);
      if (dup) {
        window.alert("이미 등록된 바코드입니다.");
        return;
      }
    }

    try {
      const updated = await updateServerItem(id, {
        size: trimmed,
        imageUrl: image || null,
        barcode: trimmedBarcode || null, // ⭐ 추가
      });

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));
      setEditModal(null);
      showToast("옵션 수정 완료");
    } catch (err) {
      console.error("옵션 서버 수정 실패", err);
      window.alert("서버에 옵션 수정 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 삭제 ---------------- */
  const handleDeleteOption = async () => {
    const id = deleteModal;
    if (!id) return;

    try {
      await deleteServerItem(id);
    } catch (err) {
      console.error("옵션 서버 삭제 실패", err);
      window.alert("서버에서 옵션 삭제에 실패했을 수 있어요.\n화면에서는 삭제합니다.");
    }

    setItems((prev) => prev.filter((it) => it.id !== id));
    setRecords([]);
    if (selectedOptionId === id) setSelectedOptionId(null);
    setDeleteModal(null);
    showToast("옵션 삭제 완료");
  };

  /* ---------------- 품목 전체 삭제 ---------------- */
  const handleDeleteItem = async () => {
    if (!window.confirm("정말 이 품목을 전체 삭제할까요?")) return;

    const ids = options.map((it) => it.id);

    try {
      await Promise.all(ids.map((id) => deleteServerItem(id)));
    } catch (err) {
      console.error("품목 전체 삭제 실패", err);
      window.alert("서버에서 일부 옵션 삭제에 실패했을 수 있어요.\n다시 확인해 주세요.");
    }

    setItems((prev) => prev.filter((it) => norm(it.name) !== norm(decodedName)));
    setRecords([]);
    setSelectedOptionId(null);
    showToast("품목 전체 삭제 완료");
    navigate("/manage");
  };

/* ======================= 재고 계산 ======================= */
const stock = useMemo(() => {
  const safe = Array.isArray(records) ? records : [];
  return safe.reduce((sum, r) => {
    const count = Number(r.count) || 0;

    //  방어막: price가 있으면 구매로 간주하고 재고 계산에서 제외
    // (레거시 데이터/실수로 type이 IN으로 저장된 구매 기록도 차단)
    if (r.price != null && Number(r.price) >= 0) return sum;

    if (r.type === "IN") return sum + count;
    if (r.type === "OUT") return sum - count;
    return sum; // PURCHASE / 기타는 제외
  }, 0);
}, [records]);

/* ======================= 매입했는데 미입고 수량 ======================= */
const pendingIn = useMemo(() => {
  const safe = Array.isArray(records) ? records : [];

  const purchased = safe
    .filter((r) => r.type === "PURCHASE")
    .reduce((acc, r) => acc + (Number(r.count) || 0), 0);

  const inSum = safe
    .filter((r) => r.type === "IN")
    .reduce((acc, r) => acc + (Number(r.count) || 0), 0);

  return Math.max(0, purchased - inSum);
}, [records]);



  /* ======================= 기간 필터 계산 ======================= */
  const effectiveRange = useMemo(() => {
    if (rangeMode === "CUSTOM") return { from: fromDate || null, to: toDate || null };
    if (rangeMode === "ALL") return { from: null, to: null };

    const days = Number(rangeMode);
    const end = toDate || toYmd(new Date());
    const endDate = new Date(end + "T00:00:00");
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    return { from: toYmd(startDate), to: end };
  }, [rangeMode, fromDate, toDate]);

  /* ======================= 검색/정렬 + 기간필터 적용 ======================= */
  const filteredRecords = useMemo(() => {
    let arr = Array.isArray(records) ? [...records] : [];

    if (effectiveRange.from) arr = arr.filter((r) => (r.date || "") >= effectiveRange.from);
    if (effectiveRange.to) arr = arr.filter((r) => (r.date || "") <= effectiveRange.to);

    const q = norm(searchText).toLowerCase();
    if (q) {
      arr = arr.filter((r) => {
        const hay = [r.date, String(r.price ?? ""), String(r.count ?? ""), r.type || "IN", r.memo || ""]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    arr.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      if (da !== db)
        return sortMode === "DESC" ? (db > da ? 1 : -1) : da > db ? 1 : -1;
      return sortMode === "DESC" ? b.id - a.id : a.id - b.id;
    });

    return arr;
  }, [records, effectiveRange, searchText, sortMode]);

  const recordsForStats = useMemo(() => filteredRecords, [filteredRecords]);

  return (
    <div style={{ padding: 24, width: "100%" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(59,130,246,0.95)",
            color: "white",
            fontSize: 13,
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}

      {/* 상단 헤더 */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <button
          onClick={() => navigate("/manage")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#e2e8f0",
            color: "#1e293b",
            cursor: "pointer",
          }}
        >
          ← 뒤로
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{decodedName || "(품목)"}</h2>

        <button
          onClick={handleDeleteItem}
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            backgroundColor: "#dc2626",
            borderRadius: 8,
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          품목 전체 삭제
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 24 }}>
        {/* 좌측: 옵션 목록 */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>옵션 목록</h3>

          {options.length === 0 && (
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>옵션이 없습니다.</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {options.map((opt) => {
              const displayImageUrl = opt.imageUrl || representativeImageUrl;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  style={{
                    border: selectedOptionId === opt.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    cursor: "pointer",
                    backgroundColor: "white",
                  }}
                >
                  {displayImageUrl ? (
                    <img
                      src={displayImageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        borderRadius: 10,
                        marginBottom: 8,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: 110,
                        borderRadius: 10,
                        backgroundColor: "#f3f4f6",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                        fontSize: 12,
                      }}
                    >
                      이미지 없음
                    </div>
                  )}

                  <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.size || "(옵션)"}</div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModal({
                          id: opt.id,
                          value: opt.size ?? "",
                          image: opt.imageUrl ?? "",
                          barcode: opt.barcode ?? "", // ⭐ 추가
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #1F51B7",
                        background: "#8BBDFF",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      수정
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal(opt.id);
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #fecaca",
                        background: "#fee2e2",
                        color: "#991b1b",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <OptionAddBox isShoes={isShoes} onAdd={handleAddOption} />
        </div>

        {/* 우측 */}
        <div>
          {!selectedOptionId ? (
            <div style={{ color: "#9ca3af", fontSize: 14, marginTop: 20 }}>
              왼쪽에서 옵션을 선택하면 그래프와 기록이 표시됩니다.
            </div>
          ) : (
            <>
              {/* 재고 표시 */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  현재 재고:{" "}
                  <span style={{ color: stock <= 0 ? "#dc2626" : "#111827" }}>
                    {stock}
                    </span>
                    
                    {/* 미입고 표시 */}
                    <span
                     style={{
                    marginLeft: 10,
                    fontSize: 13,
                    ontWeight: 600,
                    color: pendingIn > 0 ? "#d97706" : "#6b7280",
                   }}
                   >
                    미입고: {pendingIn}
                    </span>
                    </div>

              </div>

              {/* 기간/검색/정렬 컨트롤 */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
                  <label style={{ fontSize: 12 }}>
                    기간
                    <select
                      value={rangeMode}
                      onChange={(e) => setRangeMode(e.target.value)}
                      style={{
                        width: "100%",
                        height: 34,
                        marginTop: 6,
                        padding: "0 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <option value="ALL">전체</option>
                      <option value="7">최근 7일</option>
                      <option value="30">최근 30일</option>
                      <option value="90">최근 90일</option>
                      <option value="CUSTOM">직접 선택</option>
                    </select>
                  </label>

                  <label style={{ fontSize: 12 }}>
                    정렬
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value)}
                      style={{
                        width: "100%",
                        height: 34,
                        marginTop: 6,
                        padding: "0 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <option value="ASC">오래된 순</option>
                      <option value="DESC">최신 순</option>
                    </select>
                  </label>

                  <label style={{ fontSize: 12 }}>
                    검색
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="메모/가격/수량/날짜"
                      style={{
                        width: "100%",
                        height: 34,
                        marginTop: 6,
                        padding: "0 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </label>
                </div>

                {rangeMode === "CUSTOM" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    <label style={{ fontSize: 12 }}>
                      시작일
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{
                          width: "100%",
                          height: 34,
                          marginTop: 6,
                          padding: "0 10px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                    </label>
                    <label style={{ fontSize: 12 }}>
                      종료일
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={{
                          width: "100%",
                          height: 34,
                          marginTop: 6,
                          padding: "0 10px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <StatsSection records={recordsForStats} itemName={`${decodedName} (${selectedOption?.size ?? ""})`} />

              {/* 기록 추가 */}
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>🧾 기록 추가</div>

                <PurchaseForm
                  onAddRecord={async (info) => {
                    if (!selectedOptionId) return;

                    const dateValue = info.date || new Date().toISOString().slice(0, 10);
                    const countValue = info.count === "" || info.count == null ? 1 : Number(info.count);

                    try {
                      const created = await createRecord({
                        itemId: selectedOptionId,
                        type: "PURCHASE",
                        price: info.price === "" || info.price == null ? null : Number(info.price),
                        count: countValue,
                        date: dateValue,
                        memo: info.memo ?? null,
                      });

                      const newRecord = {
                        id: created?.id ?? Math.random(),
                        itemId: created?.itemId ?? selectedOptionId,
                        type: (created?.type || info.type || "IN").toUpperCase(),
                        price: created?.price ?? (info.price ?? null),
                        count: created?.count ?? countValue,
                        date: String(created?.date ?? dateValue).slice(0, 10),
                        memo: created?.memo ?? (info.memo ?? ""),
                      };

                      setRecords((prev) => [...prev, newRecord]);
                      showToast("기록 추가 완료");
                    } catch (err) {
                      console.error("백엔드 기록 저장 실패", err);
                      window.alert("서버에 기록 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
                    }
                  }}
                />
              </div>

              {/* 기록 리스트 */}
              <PurchaseList
                records={filteredRecords}
                onDeleteRecord={async (id) => {
                  setRecords((prev) => prev.filter((r) => r.id !== id));

                  try {
                    await deleteServerRecord({ itemId: selectedOptionId, id });
                  } catch (err) {
                    console.error("백엔드 기록 삭제 실패", err);
                    window.alert("서버에서 기록 삭제 실패 😢\n화면만 먼저 반영됐을 수 있어요.");
                  }

                  showToast("기록 삭제 완료");
                }}
                onUpdateRecord={async (id, info) => {
                  if (!selectedOptionId) return;

                  const dateValue = info.date || undefined;
                  const priceValue = info.price === "" || info.price == null ? undefined : Number(info.price);
                  const countValue = info.count === "" || info.count == null ? undefined : Number(info.count);

                  try {
                    const updated = await updateServerRecord({
                      itemId: selectedOptionId,
                      id,
                      price: priceValue ?? null,
                      count: countValue ?? null,
                      date: dateValue ?? null,
                      type: info.type ?? null,
                      memo: info.memo ?? null,
                    });

                    setRecords((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              price: updated?.price ?? (priceValue ?? r.price),
                              count: updated?.count ?? (countValue ?? r.count),
                              date: String(updated?.date ?? dateValue ?? r.date ?? "").slice(0, 10),
                              type: String(updated?.type ?? r.type ?? "IN").toUpperCase(),
                              memo: updated?.memo ?? r.memo ?? "",
                            }
                          : r
                      )
                    );

                    showToast("기록 수정 완료");
                  } catch (err) {
                    console.error("백엔드 기록 수정 실패", err);
                    window.alert("서버에 기록 수정 실패 😢\n잠시 후 다시 시도해 주세요.");
                  }
                }}
              />

              {/* 메모 */}
              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  backgroundColor: "#ffffff",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>옵션 메모</div>

                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="이 옵션에 대한 메모를 적어주세요."
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />

                <button
                  onClick={handleSaveMemo}
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    fontSize: 13,
                    float: "right",
                    cursor: "pointer",
                  }}
                >
                  메모 저장
                </button>
                <div style={{ clear: "both" }} />
              </div>
            </>
          )}
        </div>
      </div>

      {editModal && (
        <EditOptionModal
          isShoes={isShoes}
          editModal={editModal}
          setEditModal={setEditModal}
          onSave={handleSaveEditOption}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          message="정말 이 옵션을 삭제할까요?"
          onCancel={() => setDeleteModal(null)}
          onConfirm={handleDeleteOption}
        />
      )}
    </div>
  );
}

/* ======================= 옵션 추가 박스 ======================= */
function OptionAddBox({ isShoes, onAdd }) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState("");
  const [barcode, setBarcode] = useState(""); // ⭐ 추가

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setImage(compressed);
    } catch (err) {
      console.error("이미지 압축 실패", err);
      alert("이미지 처리 중 오류가 발생했어요 😢");
    }
  };

  const submit = () => {
    onAdd({ value, image, barcode }); // ⭐ barcode 같이 전달
    setValue("");
    setImage("");
    setBarcode(""); // ⭐ 초기화
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        backgroundColor: "#fafafa",
      }}
    >
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>옵션 추가</h4>

      <input
        type="text"
        placeholder={isShoes ? "사이즈 (260)" : "옵션"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />

      {/* ⭐ 바코드 입력 추가 */}
      <input
        type="text"
        placeholder="바코드(선택)"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />

      <div style={{ marginTop: 8 }}>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && (
          <img
            src={image}
            alt=""
            style={{
              marginTop: 8,
              width: "100%",
              maxWidth: 180,
              borderRadius: 8,
            }}
          />
        )}
      </div>

      <button
        onClick={submit}
        style={{
          marginTop: 10,
          padding: "6px 14px",
          borderRadius: 999,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        추가
      </button>
    </div>
  );
}

/* ======================= 옵션 수정 모달 ======================= */
function EditOptionModal({ isShoes, editModal, setEditModal, onSave }) {
  const { id, value, image, barcode } = editModal; // ⭐ barcode 추가

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setEditModal({ id, value, image: compressed, barcode }); // ⭐ barcode 유지
    } catch (err) {
      console.error("이미지 압축 실패", err);
      alert("이미지 처리 중 오류가 발생했어요 😢");
    }
  };

  return (
    <ModalContainer>
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "white",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>옵션 수정</h3>

        <input
          type="text"
          value={value}
          onChange={(e) => setEditModal({ id, value: e.target.value, image, barcode })}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          placeholder={isShoes ? "사이즈" : "옵션"}
        />

        {/* ⭐ 바코드 수정 입력 */}
        <input
          type="text"
          value={barcode ?? ""}
          onChange={(e) => setEditModal({ id, value, image, barcode: e.target.value })}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          placeholder="바코드(선택)"
        />

        <input type="file" accept="image/*" onChange={handleImage} style={{ marginTop: 8 }} />

        {image && (
          <img
            src={image}
            alt=""
            style={{
              marginTop: 10,
              width: "100%",
              height: 140,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={() => setEditModal(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            취소
          </button>

          <button
            onClick={onSave}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            저장
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}

/* ======================= 삭제 확인 모달 ======================= */
function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <ModalContainer>
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          backgroundColor: "white",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{message}</div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            취소
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}

function ModalContainer({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      {children}
    </div>
  );
}
