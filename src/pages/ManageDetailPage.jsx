import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useMobile from "../hooks/useMobile";
import StatsSection from "../components/StatsSection";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import OptionAddForm from "../components/manage/OptionAddForm";
import OptionEditModal from "../components/manage/OptionEditModal";
import OptionList from "../components/manage/OptionList";
import RecordFilters from "../components/manage/RecordFilters";
import RecordList from "../components/manage/RecordList";
import StockDisplay from "../components/manage/StockDisplay";
import PurchaseForm from "../components/forms/PurchaseForm";
import ReorderSettingsModal from "../components/manage/ReorderSettingsModal";
import {
  getItems as fetchItems,
  getItemDetail,
  createItem,
  updateItem as updateServerItem,
  createRecord,
  updateRecord as updateServerRecord,
  deleteRecord as deleteServerRecord,
  deleteItem as deleteServerItem,
  updateLowStockAlert,
} from "../api/items";

const norm = (s) => String(s ?? "").trim();

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
    //  서버가 type 누락해도 IN으로 떨어지지 않게 (안전)
    type: String(rec.type || "PURCHASE").toUpperCase(),
    price: rec.price,
    count: rec.count,
    date: String(rec.date || "").slice(0, 10),
    memo: rec.memo ?? "",
  }));
}

export default function ManageDetailPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
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
  const [showReorderModal, setShowReorderModal] = useState(false);

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

  // records/items safe
  const safeRecords = Array.isArray(records) ? records : [];
  const safeItems = Array.isArray(items) ? items : [];

  // 레이스 방지 토큰
  const detailSeqRef = useRef(0);

  const loadDetail = useCallback(
    async (targetId, { loadCategoryItems = false, reason = "" } = {}) => {
      const seq = ++detailSeqRef.current;

      try {
        const detail = await getItemDetail(targetId);

        // 최신 요청 아니면 무시
        if (seq !== detailSeqRef.current) {
          console.warn(
            `[detail][stale ignored] seq=${seq} latest=${detailSeqRef.current} id=${targetId} reason=${reason}`
          );
          return;
        }

        const itemFromApi = detail?.item ?? null;
        const rawRecords = Array.isArray(detail?.records) ? detail.records : [];

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
            map.set(itemFromApi.id, {
              ...(map.get(itemFromApi.id) || {}),
              ...itemFromApi,
            });
            return Array.from(map.values());
          })();

          setItems(merged);
        } else {
          if (itemFromApi?.id) {
            setItems((prev) => {
              const arr = Array.isArray(prev) ? prev : [];
              return arr.map((it) => (it.id === itemFromApi.id ? { ...it, ...itemFromApi } : it));
            });
          }
        }
      } catch (err) {
        console.error(`[detail][error] seq=${seq} id=${targetId} reason=${reason}`, err);

        if (seq !== detailSeqRef.current) return;
        if (loadCategoryItems) setItems([]);

        console.warn(
          `[detail][apply-empty-by-error] seq=${seq} id=${targetId} reason=${reason} err=${String(
            err?.message || err
          )}`
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
      try {
        await loadDetail(numericItemId, { loadCategoryItems: true, reason: "boot" });
      } finally {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
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
  const handleAddOption = async ({ value, image, barcode, sku }) => {
    const trimmed = String(value ?? "").trim();
    const trimmedBarcode = String(barcode ?? "").trim();
    const trimmedSku = String(sku ?? "").trim();
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
        sku: trimmedSku || null,
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

    const { id, value, image, barcode, sku } = editModal;
    const trimmed = String(value ?? "").trim();
    const trimmedBarcode = String(barcode ?? "").trim();
    const trimmedSku = String(sku ?? "").trim();

    if (!trimmed) return;

    if (options.some((opt) => opt.id !== id && norm(opt.size) === trimmed)) {
      window.alert("이미 존재하는 옵션입니다.");
      return;
    }

    if (trimmedBarcode) {
      const dup = options.some(
        (opt) => opt.id !== id && String(opt.barcode ?? "").trim() === trimmedBarcode
      );
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
        sku: trimmedSku || "",
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
        const hay = [r.date, String(r.price ?? ""), String(r.count ?? ""), r.type || "", r.memo || ""]
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

  return (
    <div style={{ padding: 24, width: "100%" }}>
      <Toast message={toast} />

      {/* 상단 헤더 */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
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

        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, flex: 1, minWidth: 0 }}>{decodedName || "(품목)"}</h2>

        <button
          onClick={() => setShowReorderModal(true)}
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            backgroundColor: "#7c8db5",
            borderRadius: 8,
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          📊 재주문 설정
        </button>

        <button
          onClick={handleDeleteItem}
          style={{
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

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.1fr) minmax(0,1fr)", gap: isMobile ? 16 : 24 }}>
        {/* 좌측: 옵션 목록 */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>옵션 목록</h3>

          <OptionList
            options={options}
            selectedOptionId={selectedOptionId}
            representativeImageUrl={representativeImageUrl}
            onSelect={handleSelectOption}
            onEdit={(opt) =>
              setEditModal({
                id: opt.id,
                value: opt.size ?? "",
                image: opt.imageUrl ?? "",
                barcode: opt.barcode ?? "",
                sku: opt.sku ?? "",
              })
            }
            onDelete={(id) => setDeleteModal(id)}
          />

          <OptionAddForm isShoes={isShoes} onAdd={handleAddOption} />
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
              <StockDisplay stock={stock} pendingIn={pendingIn} />

              {/* 재고 부족 알림 설정 */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#111827" }}>
                  ⚠️ 재고 부족 알림 설정
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={selectedOption?.lowStockAlert ?? false}
                      onChange={async (e) => {
                        const newValue = e.target.checked;
                        try {
                          await updateLowStockAlert(selectedOption.id, {
                            lowStockAlert: newValue,
                            lowStockThreshold: selectedOption?.lowStockThreshold ?? 10,
                          });
                          setItems((prev) =>
                            (Array.isArray(prev) ? prev : []).map((it) =>
                              it.id === selectedOption.id
                                ? { ...it, lowStockAlert: newValue }
                                : it
                            )
                          );
                          showToast("재고 부족 알림 설정이 저장되었습니다");
                        } catch (err) {
                          console.error("재고 부족 알림 설정 실패", err);
                          window.alert("설정 저장에 실패했습니다 😢");
                        }
                      }}
                      style={{ marginRight: 6 }}
                    />
                    재고 부족 알림 사용
                  </label>
                </div>

                {selectedOption?.lowStockAlert && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "#6b7280" }}>재고가</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedOption?.lowStockThreshold ?? 10}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        if (newValue >= 0) {
                          setItems((prev) =>
                            (Array.isArray(prev) ? prev : []).map((it) =>
                              it.id === selectedOption.id
                                ? { ...it, lowStockThreshold: newValue }
                                : it
                            )
                          );
                        }
                      }}
                      onBlur={async (e) => {
                        const newValue = Number(e.target.value);
                        if (newValue >= 0) {
                          try {
                            await updateLowStockAlert(selectedOption.id, {
                              lowStockAlert: selectedOption?.lowStockAlert ?? false,
                              lowStockThreshold: newValue,
                            });
                            showToast("재고 부족 기준이 저장되었습니다");
                          } catch (err) {
                            console.error("재고 부족 기준 설정 실패", err);
                            window.alert("설정 저장에 실패했습니다 😢");
                          }
                        }
                      }}
                      style={{
                        width: 70,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    />
                    <label style={{ fontSize: 13, color: "#6b7280" }}>개 이하일 때 알림</label>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#111827",
                }}
              >
                <b>SKU</b>: {selectedOption?.sku || "자동 생성 예정"}
              </div>

              {/* 기간/검색/정렬 컨트롤 */}
              <RecordFilters
                rangeMode={rangeMode}
                setRangeMode={setRangeMode}
                sortMode={sortMode}
                setSortMode={setSortMode}
                searchText={searchText}
                setSearchText={setSearchText}
                fromDate={fromDate}
                toDate={toDate}
                setFromDate={setFromDate}
                setToDate={setToDate}
              />

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
    const countValue =
      info.count === "" || info.count == null ? 1 : Number(info.count);

    const apiType =
      info.type === "OUT"
        ? "OUT"
        : "PURCHASE";

    const priceValue =
      info.price === "" || info.price == null ? null : Number(info.price);

    try {
      await createRecord({
        itemId: selectedOptionId,
        type: apiType,
        price: apiType === "OUT" ? priceValue : priceValue, // PURCHASE는 price 필수
        count: countValue,
        date: dateValue,
        memo: null,
      });

      await loadDetail(selectedOptionId, {
        loadCategoryItems: false,
        reason: "after-create",
      });

      showToast("기록 추가 완료");
    } catch (err) {
      console.error("백엔드 기록 저장 실패", err);
      alert("서버에 기록 저장 실패 😢");
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
                <RecordList
                  records={safeRecords} //  전체 넘겨야 showIn 토글/입고연결 계산이 됨
                  showIn={showIn}
                  onDeleteRecord={async (id) => {
                    if (!selectedOptionId) return;
                
                  try {
                    const resp = await deleteServerRecord({ itemId: selectedOptionId, id });
                
                    if (Array.isArray(resp?.records)) setRecords(resp.records);
                    if (resp?.stock != null) setStock(resp.stock);
                    if (resp?.pendingIn != null) setPendingIn(resp.pendingIn);
                
                    showToast("기록 삭제 완료");
                  } catch (err) {
                    console.error("백엔드 기록 삭제 실패", err);
                    window.alert("서버에서 기록 삭제 실패 😢");
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
                  const priceValue =
                    info.price === "" || info.price == null ? undefined : Number(info.price);
                  const countValue =
                    info.count === "" || info.count == null ? undefined : Number(info.count);

                  // 판매가만 넣는 경우 OUT 유지
                  if (priceValue != null && info.type == null) {
                    nextType = "OUT";
                  }

                  const finalPrice =
                    nextType === "IN" ? null : priceValue === undefined ? undefined : priceValue;

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
                              type: String(updated?.type ?? nextType ?? r.type ?? "PURCHASE").toUpperCase(),
                              memo: updated?.memo ?? info.memo ?? r.memo ?? "",
                            }
                          : r
                      )
                    );

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
                  if (!Number.isFinite(count) || count <= 0) return;

                  try {
                    await createRecord({
                      itemId: selectedOptionId,
                      type: "IN",
                      price: null,
                      count,
                      date: new Date().toISOString().slice(0, 10),
                      memo: `매입(${purchase.id}) 입고`,
                    });

                    await loadDetail(selectedOptionId, { loadCategoryItems: false, reason: "after-arrive" });
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
        <OptionEditModal
          isShoes={isShoes}
          editModal={editModal}
          setEditModal={setEditModal}
          onSave={handleSaveEditOption}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteModal)}
        message="정말 이 옵션을 삭제할까요?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={handleDeleteOption}
      />

      {showReorderModal && selectedOption && (
        <ReorderSettingsModal
          item={selectedOption}
          onClose={() => setShowReorderModal(false)}
          onSuccess={() => {
            showToast("재주문 설정 저장 완료!");
            loadDetail(selectedOption.id, { loadCategoryItems: false, reason: "reorder-update" });
          }}
        />
      )}
    </div>
  );
}
