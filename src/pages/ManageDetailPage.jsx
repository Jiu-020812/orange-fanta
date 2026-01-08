import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

function mapRecords(rawRecords) {
  const arr = Array.isArray(rawRecords) ? rawRecords : [];
  return arr.map((rec) => ({
    id: rec.id,
    itemId: rec.itemId,
    type: String(rec.type || "IN").toUpperCase(),
    price: rec.price,
    count: rec.count,
    date: String(rec.date || "").slice(0, 10),
    memo: rec.memo ?? "",
  }));
}

export default function ManageDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const numericItemId = Number(itemId);

  if (!Number.isFinite(numericItemId) || numericItemId <= 0) {
    return <div style={{ padding: 24 }}>잘못된 접근입니다. (itemId가 없습니다)</div>;
  }

  const [items, setItems] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const [stock, setStock] = useState(0);
  const [pendingIn, setPendingIn] = useState(0);

  const [toast, setToast] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [memoText, setMemoText] = useState("");

  // 기간/검색/정렬
  const [rangeMode, setRangeMode] = useState("ALL"); // ALL | 7 | 30 | 90 | CUSTOM
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(() => toYmd(new Date()));
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState("ASC"); // ASC | DESC
  const [showIn, setShowIn] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  //  records는 절대 undefined가 아니게 보장
  const safeRecords = Array.isArray(records) ? records : [];
  const safeItems = Array.isArray(items) ? items : [];

  // 레이스 방지 토큰 (늦게 온 응답이 최신 상태 덮어쓰는 것 방지)
  const detailSeqRef = useRef(0);

  const loadDetail = useCallback(
    async (targetId, { loadCategoryItems = false, reason = "" } = {}) => {
      const seq = ++detailSeqRef.current;

      try {
        const detail = await getItemDetail(targetId);

        // 최신 요청 아니면 무시
        if (seq !== detailSeqRef.current) {
          console.warn(`[detail][stale ignored] seq=${seq} latest=${detailSeqRef.current} id=${targetId} reason=${reason}`);
          return;
        }

        const itemFromApi = detail?.item ?? null;
        const rawRecords = Array.isArray(detail?.records) ? detail.records : [];
         
        //콘솔추가
        console.log(
          "[RAW-CHECK]",
          "id=" + targetId,
          "reason=" + reason,
          rawRecords.map((r) => ({
            id: r.id,
            type: String(r.type || "").toUpperCase(),
            price: r.price,
            count: r.count,
            date: String(r.date || "").slice(0, 10),
          }))
        );

        setSelectedOptionId(targetId);
        setRecords(mapRecords(rawRecords));
        setStock(detail?.stock ?? 0);
        setPendingIn(detail?.pendingIn ?? 0);

        // 옵션 클릭(같은 카테고리 안)에서는 보통 items 재조회가 필요 없고,
        // 최초 진입/새로고침(boot)에서는 items(같은 category)까지 한 번 채우는게 필요.
        if (loadCategoryItems) {
          if (!itemFromApi?.id) return;

          const catId = itemFromApi.categoryId;
          const list = await fetchItems(catId);

          if (seq !== detailSeqRef.current) {
            console.warn(
              `[items][stale ignored] seq=${seq} latest=${detailSeqRef.current} id=${targetId} reason=${reason}`
            );
            return;
          }

          const safeList = Array.isArray(list) ? list : [];
          const merged = (() => {
            const map = new Map(safeList.map((x) => [x.id, x]));
            map.set(itemFromApi.id, { ...(map.get(itemFromApi.id) || {}), ...itemFromApi });
            return Array.from(map.values());
          })();

          setItems(merged);
        } else {
          // detail.item 정보가 오면 현재 items에도 반영(있을 때만)
          if (itemFromApi?.id) {
            setItems((prev) => {
              const arr = Array.isArray(prev) ? prev : [];
              return arr.map((it) => (it.id === itemFromApi.id ? { ...it, ...itemFromApi } : it));
            });
          }
        }
      } catch (err) {
        console.error(`[detail][error] seq=${seq} id=${targetId} reason=${reason}`, err);

        // 최신 요청일 때만 화면 초기화 (stale 에러가 최신 상태를 비우는 걸 막음)
        if (seq !== detailSeqRef.current) return;

        // boot에서만 items까지 싹 비우고, 옵션 클릭/후처리에서는 records/재고만 비우는게 덜 거슬림
        if (loadCategoryItems) setItems([]);

        //콘솔 추가
        console.warn(
          `[detail][apply-empty-by-error] seq=${seq} id=${targetId} reason=${reason} err=${String(err?.message || err)}`
        );

        setRecords([]);
        setStock(0);
        setPendingIn(0);
      }
    },
    []
  );

  /* ---------------- 서버에서 item/detail + 같은 category items 불러오기 ---------------- */
  useEffect(() => {
    let alive = true;

    (async () => {
      // loadDetail 내부는 seq로 stale 방지.
      // 여기서는 "언마운트 이후 setState 방지"만 보조로 체크.
      try {
        await loadDetail(numericItemId, { loadCategoryItems: true, reason: "boot" });
      } finally {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
      // (선택) 언마운트 시점에 seq를 올려서 이후 응답 무시 강화
      detailSeqRef.current += 1;
    };
  }, [numericItemId, loadDetail]);

  /* ---------------- 현재 선택 옵션 ---------------- */
  const selectedOption = useMemo(() => {
    if (!selectedOptionId) return null;
    return safeItems.find((it) => it.id === selectedOptionId) || null;
  }, [safeItems, selectedOptionId]);

  const decodedName = selectedOption?.name ?? "";

  const looksLikeShoeSize = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return true;
    const n = Number(s);
    return Number.isFinite(n) && n >= 180 && n <= 400;
  };
  const isShoes = looksLikeShoeSize(selectedOption?.size);

  /* ---------------- 옵션 리스트 (같은 name 묶음) ---------------- */
  const options = useMemo(() => {
    const groupName = norm(selectedOption?.name);
    if (!groupName) return [];
    return safeItems.filter((i) => norm(i.name) === groupName);
  }, [safeItems, selectedOption?.name]);

  const representativeImageUrl = useMemo(() => {
    return options.find((opt) => opt.imageUrl)?.imageUrl || null;
  }, [options]);

  const isOptionExists = (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return false;
    return options.some((opt) => norm(opt.size) === trimmed);
  };

  /* ---------------- 옵션 선택 시 detail 재조회 ---------------- */
  const handleSelectOption = async (nextId) => {
    setSelectedOptionId(nextId);
    navigate(`/manage/${nextId}`, { replace: true });

    // 여기서 직접 setRecords 하지 말고 loadDetail로 통일 (레이스 방지)
    await loadDetail(nextId, { loadCategoryItems: false, reason: "select-option" });
  };

  /* ---------------- 메모: 서버 Item.memo 기반 ---------------- */
  useEffect(() => {
    if (selectedOption && typeof selectedOption.memo === "string") setMemoText(selectedOption.memo);
    else setMemoText("");
  }, [selectedOption]);

  const handleSaveMemo = async () => {
    if (!selectedOption) return;
    try {
      const updated = await updateServerItem(selectedOption.id, { memo: memoText });
      setItems((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map((it) => (it.id === selectedOption.id ? { ...it, ...updated } : it));
      });
      showToast("메모 저장 완료!");
    } catch (err) {
      console.error("메모 서버 저장 실패", err);
      window.alert("메모 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 추가 ---------------- */
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

      setItems((prev) => [...(Array.isArray(prev) ? prev : []), created]);
      await handleSelectOption(created.id);
      showToast("옵션 추가 완료");
    } catch (err) {
      console.error("옵션 서버 저장 실패", err);
      window.alert("서버에 옵션 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 수정 ---------------- */
  const handleSaveEditOption = async () => {
    if (!editModal) return;

    const { id, value, image, barcode } = editModal;
    const trimmed = String(value ?? "").trim();
    const trimmedBarcode = String(barcode ?? "").trim();

    if (!trimmed) return;

    if (options.some((opt) => opt.id !== id && norm(opt.size) === trimmed)) {
      window.alert("이미 존재하는 옵션입니다.");
      return;
    }

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
        barcode: trimmedBarcode || null,
      });

      setItems((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map((it) => (it.id === id ? { ...it, ...updated } : it));
      });
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

    setItems((prev) => (Array.isArray(prev) ? prev : []).filter((it) => it.id !== id));
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

    setItems((prev) => (Array.isArray(prev) ? prev : []).filter((it) => norm(it.name) !== norm(decodedName)));
    setRecords([]);
    setSelectedOptionId(null);
    showToast("품목 전체 삭제 완료");
    navigate("/manage");
  };

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
    let arr = [...safeRecords];

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
      if (da !== db) return sortMode === "DESC" ? (db > da ? 1 : -1) : da > db ? 1 : -1;
      return sortMode === "DESC" ? (b.id ?? 0) - (a.id ?? 0) : (a.id ?? 0) - (b.id ?? 0);
    });

    return arr;
  }, [safeRecords, effectiveRange, searchText, sortMode]);

  const recordsForStats = filteredRecords;

  const visibleRecords = useMemo(() => {
    if (showIn) return safeRecords;
    return safeRecords.filter((r) => String(r?.type || "").toUpperCase() !== "IN");
  }, [safeRecords, showIn]);

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
                          barcode: opt.barcode ?? "",
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
                  <span style={{ color: stock <= 0 ? "#dc2626" : "#111827" }}>{stock}</span>
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 13,
                      fontWeight: 600,
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
                    const apiType = String(info.type || "IN").toUpperCase();

                    const priceValue = info.price === "" || info.price == null ? null : Number(info.price);
                    const finalPrice = apiType === "IN" ? null : priceValue;

                    try {
                      await createRecord({
                        itemId: selectedOptionId,
                        type: apiType,
                        price: finalPrice,
                        count: countValue,
                        date: dateValue,
                        memo: info.memo ?? null,
                      });

                      // ✅ 레이스 방지된 공용 로더 사용
                      await loadDetail(selectedOptionId, { loadCategoryItems: false, reason: "after-create" });

                      showToast("기록 추가 완료");
                    } catch (err) {
                      console.error("백엔드 기록 저장 실패", err);
                      window.alert("서버에 기록 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showIn}
                    onChange={(e) => setShowIn(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  입고(IN) 기록 보기
                </label>
              </div>

              {/* 기록 리스트 */}
              <PurchaseList
                records={visibleRecords}
                onDeleteRecord={async (id) => {
                  // ✅ 즉시 UI 반영
                  setRecords((prev) => (Array.isArray(prev) ? prev : []).filter((r) => r.id !== id));

                  try {
                    // ⚠️ 너 api/items.js가 어떤 시그니처인지 몰라서, 둘 다 가능하게 처리
                    // 1) deleteServerRecord({ itemId, id }) 형태였던 너 기존 코드 유지
                    await deleteServerRecord({ itemId: selectedOptionId, id });
                    showToast("기록 삭제 완료");
                  } catch (err) {
                    console.error("백엔드 기록 삭제 실패", err);
                    window.alert("서버에서 기록 삭제 실패 😢\n화면만 먼저 반영됐을 수 있어요.");
                  }
                }}
                onUpdateRecord={async (id, info) => {
                  if (!selectedOptionId) return;

                  const normType = (t) => {
                    const x = String(t || "").toUpperCase();
                    if (x === "OUT") return "OUT";
                    if (x === "PURCHASE") return "PURCHASE";
                    return "IN";
                  };

                  let nextType = info.type != null ? normType(info.type) : undefined;

                  const dateValue = info.date || undefined;
                  const priceValue = info.price === "" || info.price == null ? undefined : Number(info.price);
                  const countValue = info.count === "" || info.count == null ? undefined : Number(info.count);

                  // 판매가만 넣는 경우 OUT 유지
                  if (priceValue != null && info.type == null) {
                    nextType = "OUT";
                  }

                  const finalPrice = nextType === "IN" ? null : priceValue === undefined ? undefined : priceValue;

                  if (nextType === "PURCHASE") {
                    const p = finalPrice;
                    if (p == null || !Number.isFinite(Number(p)) || Number(p) <= 0) {
                      window.alert("매입(PURCHASE)은 가격을 반드시 입력해야 합니다.");
                      return;
                    }
                  }

                  try {
                    const updatedResp = await updateServerRecord({
                      itemId: selectedOptionId,
                      id,
                      price: finalPrice ?? null,
                      count: countValue ?? null,
                      date: dateValue ?? null,
                      type: nextType ?? null,
                      memo: info.memo ?? null,
                    });

                    const updated = updatedResp?.record ?? updatedResp;

                    setRecords((prev) =>
                      (Array.isArray(prev) ? prev : []).map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              price: updated?.price ?? (finalPrice !== undefined ? finalPrice : r.price),
                              count: updated?.count ?? (countValue !== undefined ? countValue : r.count),
                              date: String(updated?.date ?? dateValue ?? r.date ?? "").slice(0, 10),
                              type: String(updated?.type ?? nextType ?? r.type ?? "IN").toUpperCase(),
                              memo: updated?.memo ?? info.memo ?? r.memo ?? "",
                            }
                          : r
                      )
                    );

                    // stock/pendingIn도 응답에 있으면 갱신
                    if (updatedResp?.stock != null) setStock(updatedResp.stock);
                    if (updatedResp?.pendingIn != null) setPendingIn(updatedResp.pendingIn);

                    showToast("기록 수정 완료");
                  } catch (err) {
                    console.error("백엔드 기록 수정 실패", err);
                    window.alert("서버에 기록 수정 실패 😢\n잠시 후 다시 시도해 주세요.");
                  }
                }}
                onMarkArrived={async (purchase, arrivedCount) => {
                  if (!selectedOptionId) return;
                  if (String(purchase?.type || "").toUpperCase() !== "PURCHASE") return;
                
                  const count = Number(arrivedCount) || 1;
                
                  try {
                    await createRecord({
                      itemId: selectedOptionId,
                      type: "IN",
                      price: null,
                      count,
                      date: new Date().toISOString().slice(0, 10),
                      memo: `매입(${purchase.id}) 입고`,
                    });
                
                    const detail = await getItemDetail(selectedOptionId);
                    const raw = Array.isArray(detail?.records) ? detail.records : [];
                
                    setRecords(
                      raw.map((rec) => ({
                        id: rec.id,
                        itemId: rec.itemId,
                        type: String(rec.type || "IN").toUpperCase(),
                        price: rec.price,
                        count: rec.count,
                        date: String(rec.date || "").slice(0, 10),
                        memo: rec.memo ?? "",
                      }))
                    );
                
                    setStock(detail?.stock ?? 0);
                    setPendingIn(detail?.pendingIn ?? 0);
                
                    showToast("입고 처리 완료");
                  } catch (err) {
                    console.error("입고 처리 실패", err);
                    window.alert("입고 처리 실패 😢\n잠시 후 다시 시도해 주세요.");
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
        <ConfirmModal message="정말 이 옵션을 삭제할까요?" onCancel={() => setDeleteModal(null)} onConfirm={handleDeleteOption} />
      )}
    </div>
  );
}

/* ======================= 옵션 추가 박스 ======================= */
function OptionAddBox({ isShoes, onAdd }) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState("");
  const [barcode, setBarcode] = useState("");

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
    onAdd({ value, image, barcode });
    setValue("");
    setImage("");
    setBarcode("");
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
  const { id, value, image, barcode } = editModal;

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setEditModal({ id, value, image: compressed, barcode });
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
