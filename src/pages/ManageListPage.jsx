import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useMobile from "../hooks/useMobile";
import {
  getItems as fetchItems,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/items";
import useBarcodeInputNavigate from "../hooks/useBarcodeInputNavigate";
import ImageModal from "../components/ImageModal";
import QRCodeGenerator from "../components/QRCodeGenerator";

const norm = (s) => String(s ?? "").trim();

// 재고 계산 헬퍼
const calcStock = (records) => {
  if (!Array.isArray(records)) return 0;
  let stock = 0;
  records.forEach((r) => {
    if (r.type === "IN") stock += Math.abs(r.count || 0);
    else if (r.type === "OUT") stock -= Math.abs(r.count || 0);
  });
  return stock;
};

export default function ManageListPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 고급 필터 상태
  const [stockFilter, setStockFilter] = useState("all"); // all | low | out | available
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);

  // 정렬 상태
  const [sortKey, setSortKey] = useState("name"); // name | latest | count
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // 카테고리 메뉴(⋯) 상태
  const [catMenu, setCatMenu] = useState(null); // { id, x, y } | null
  const catMenuRef = useRef(null);

  // 정렬 메뉴 ref (바깥 클릭 닫기)
  const sortMenuRef = useRef(null);

  // 모달 상태
  const [renameModal, setRenameModal] = useState(null); // { id, name }
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [imageModal, setImageModal] = useState(null); // 이미지 확대 모달
  const [qrModal, setQrModal] = useState(null); // QR코드 생성 모달

  //  items fetch 레이스 방지용
  const itemsReqSeq = useRef(0);

  /* ----------------------- 공통: 카테고리 재로딩 ----------------------- */
  const reloadCategories = useCallback(async (preferId = null) => {
    try {
      const cats = await getCategories();
      const safe = Array.isArray(cats) ? cats : [];
      setCategories(safe);

      setActiveCategoryId((prev) => {
        if (safe.length === 0) return null;

        // 1) preferId 우선
        if (preferId && safe.some((c) => c.id === preferId)) return preferId;

        // 2) 기존 선택 유지
        const still = prev && safe.some((c) => c.id === prev);
        if (still) return prev;

        // 3) 미분류 우선 (있으면)
        const unc = safe.find((c) => c.name === "미분류");
        if (unc) return unc.id;

        // 4) 아니면 첫번째
        return safe[0].id;
      });
    } catch (err) {
      console.error("카테고리 불러오기 실패:", err);
      setCategories([]);
      setActiveCategoryId(null);
    }
  }, []);

  /* ----------------------- 초기 카테고리 로드 ----------------------- */
  useEffect(() => {
    reloadCategories();
  }, [reloadCategories]);

  /* ----------------------- 아이템 로드 (선택된 카테고리) ----------------------- */
  useEffect(() => {
    const reqId = ++itemsReqSeq.current;
    let alive = true;

    async function loadItems() {
      try {
        if (!activeCategoryId) {
          if (alive && reqId === itemsReqSeq.current) setItems([]);
          return;
        }

        const data = await fetchItems(activeCategoryId);

        //  늦게 도착한 응답이면 무시
        if (!alive || reqId !== itemsReqSeq.current) return;

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive || reqId !== itemsReqSeq.current) return;
        console.error("아이템 불러오기 실패:", err);
        setItems([]);
      }
    }

    loadItems();
    return () => {
      alive = false;
    };
  }, [activeCategoryId]);

  /* ----------------------- 바코드 스캔(검색창 포커스일 때만) ----------------------- */
  const { onKeyDown: onBarcodeKeyDown } = useBarcodeInputNavigate({
    items,
    navigate,
    buildUrl: (id) => `/manage/${id}`,
    minLength: 6,
    idleMs: 120,
  });

  /* ----------------------- 카테고리 추가 ----------------------- */
  const handleAddCategory = async () => {
    const name = window.prompt("새 카테고리 이름을 입력해주세요.");
    const trimmed = norm(name);
    if (!trimmed) return;

    try {
      const created = await createCategory({ name: trimmed });

      // 즉시 반영 + 선택
      setCategories((prev) => [...prev, created]);
      setActiveCategoryId(created.id);
    } catch (err) {
      console.error("카테고리 생성 실패:", err);
      const msg = String(err?.response?.data?.message || err?.message || "");
      if (msg.includes("duplicate")) alert("이미 같은 이름의 카테고리가 있어!");
      else alert("카테고리 추가 실패 😢");
    }
  };

  /* ----------------------- 카테고리 메뉴 열기 ----------------------- */
  const openCategoryMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    // 화면 밖으로 나가지 않게 clamp
    const left = Math.min(rect.left, window.innerWidth - 170);
    const top = Math.min(rect.bottom + 6, window.innerHeight - 120);

    setCatMenu({
      id,
      x: Math.max(8, left),
      y: Math.max(8, top),
    });
  };

  /* ----------------------- 메뉴 바깥 클릭 닫기 ----------------------- */
  useEffect(() => {
    const onDoc = (e) => {
      // 카테고리 메뉴 닫기
      if (catMenu) {
        const el = catMenuRef.current;
        if (el && !el.contains(e.target)) setCatMenu(null);
      }
      // 정렬 메뉴 닫기
      if (isSortMenuOpen) {
        const el = sortMenuRef.current;
        if (el && !el.contains(e.target)) setIsSortMenuOpen(false);
      }
      // 필터 메뉴 닫기
      if (isFilterMenuOpen) {
        const el = filterMenuRef.current;
        if (el && !el.contains(e.target)) setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [catMenu, isSortMenuOpen, isFilterMenuOpen]);

  const activeCategoryName = useMemo(() => {
    const c = categories.find((x) => x.id === activeCategoryId);
    return c?.name ?? "";
  }, [categories, activeCategoryId]);

  /* ----------------------- name 기준 그룹핑 (+ 재고 계산) ----------------------- */
  const grouped = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const key = norm(item.name);
      if (!key) return;
      if (!map[key]) map[key] = [];

      // 재고 계산 추가
      const stock = calcStock(item.records || []);
      map[key].push({ ...item, currentStock: stock });
    });
    return map;
  }, [items]);

  /* ----------------------- 검색(이름 + 옵션 + 바코드) + 재고 필터 ----------------------- */
  const filteredGroups = useMemo(() => {
    let result = grouped;

    // 1. 검색어 필터
    const keyword = searchQuery.trim().toLowerCase();
    if (keyword) {
      const searchResult = {};
      Object.entries(result).forEach(([name, list]) => {
        const nameMatch = name.toLowerCase().includes(keyword);

        const optionMatch = list.some((item) => {
          const sizeMatch = norm(item.size).toLowerCase().includes(keyword);
          const barcodeMatch = String(item.barcode ?? "").toLowerCase().includes(keyword);
          return sizeMatch || barcodeMatch;
        });

        if (nameMatch || optionMatch) searchResult[name] = list;
      });
      result = searchResult;
    }

    // 2. 재고 필터
    if (stockFilter !== "all") {
      const stockResult = {};
      Object.entries(result).forEach(([name, list]) => {
        // 그룹 내 모든 옵션의 총 재고 계산
        const totalStock = list.reduce((sum, item) => sum + (item.currentStock || 0), 0);

        let include = false;
        if (stockFilter === "out" && totalStock === 0) include = true;
        else if (stockFilter === "low" && totalStock > 0 && totalStock <= 10) include = true;
        else if (stockFilter === "available" && totalStock > 10) include = true;

        if (include) stockResult[name] = list;
      });
      result = stockResult;
    }

    return result;
  }, [grouped, searchQuery, stockFilter]);

  /* ----------------------- 그룹 최신 날짜(createdAt) ----------------------- */
  const getLatestTime = (list) => {
    let latest = 0;
    list.forEach((item) => {
      const t = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
      if (!Number.isNaN(t) && t > latest) latest = t;
    });
    return latest;
  };

  /* ----------------------- 정렬된 그룹 ----------------------- */
  const sortedGroupEntries = useMemo(() => {
    const entries = Object.entries(filteredGroups);

    return entries.sort(([nameA, listA], [nameB, listB]) => {
      let base = 0;

      if (sortKey === "name") base = nameA.localeCompare(nameB, "ko");
      else if (sortKey === "count") base = listA.length - listB.length;
      else if (sortKey === "latest") base = getLatestTime(listA) - getLatestTime(listB);

      return sortOrder === "asc" ? base : -base;
    });
  }, [filteredGroups, sortKey, sortOrder]);

  const sortLabel =
    sortKey === "name" ? "이름순" : sortKey === "latest" ? "최신순" : "옵션 많은 순";
  const sortIcon = sortOrder === "asc" ? "▲" : "▼";

  const handleSelectSortKey = (key) => {
    setSortKey(key);
    if (key === "name") setSortOrder("asc");
    else setSortOrder("desc");
    setIsSortMenuOpen(false);
  };

  /* name 그룹 → 대표 itemId로 상세 이동 */
  const goDetailByGroupName = (groupName, list) => {
    const representative = list.find((i) => i.imageUrl) || list[0];
    const id = representative?.id;

    if (!id) {
      alert("이 품목의 itemId를 찾을 수 없어요.");
      return;
    }
    navigate(`/manage/${id}`);
  };

  /* ----------------------- 카테고리 이름 변경 ----------------------- */
  const openRename = (id) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setRenameModal({ id: cat.id, name: cat.name });
    setCatMenu(null);
  };

  const submitRename = async () => {
    if (!renameModal) return;
    const id = renameModal.id;
    const nextName = norm(renameModal.name);
    if (!nextName) return alert("이름을 입력해줘!");

    try {
      const updated = await updateCategory(id, { name: nextName });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setRenameModal(null);
    } catch (err) {
      console.error("카테고리 이름 변경 실패:", err);
      const msg = String(err?.response?.data?.message || err?.message || "");
      if (msg.includes("duplicate")) alert("이미 같은 이름의 카테고리가 있어!");
      else alert("이름 변경 실패 😢");
    }
  };

  /* ----------------------- 카테고리 삭제 ----------------------- */
  const openDelete = (id) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setDeleteModal({ id: cat.id, name: cat.name });
    setCatMenu(null);
  };

  const submitDelete = async () => {
    if (!deleteModal) return;
    const id = deleteModal.id;

    if (deleteModal.name === "미분류") {
      alert("미분류는 삭제할 수 없어!");
      return;
    }

    try {
      await deleteCategory(id);

      const wasActive = activeCategoryId === id;
      setDeleteModal(null);

      //  reload 후 activeCategoryId 변경은 useEffect가 items를 알아서 안정적으로 로드함
      await reloadCategories(wasActive ? null : activeCategoryId);

      //  여기서 activeCategoryId로 다시 fetchItems 호출하지 말기 (옛값 레이스 위험)
    } catch (err) {
      console.error("카테고리 삭제 실패:", err);
      const msg = String(err?.response?.data?.message || err?.message || "");
      alert(msg || "카테고리 삭제 실패 😢");
    }
  };

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
            marginBottom: isMobile ? 16 : 24,
            color: "#7c8db5",
          }}
        >
          물품 관리 {activeCategoryName ? `· ${activeCategoryName}` : ""}
        </h2>

        {/* 카테고리 탭 + +버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            backgroundColor: "#f3f4f6",
            padding: 4,
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {categories.length === 0 ? (
            <div style={{ padding: "6px 12px", fontSize: 13, color: "#6b7280" }}>
              카테고리가 없습니다. (오른쪽 + 로 추가해주세요.)
            </div>
          ) : (
            categories.map((c) => {
              const isActive = c.id === activeCategoryId;
              const isUncategorized = c.name === "미분류";

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    backgroundColor: isActive ? "#2563eb" : "transparent",
                    color: isActive ? "#ffffff" : "#374151",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {c.name}

                  {/* 미분류는 ⋯ 메뉴 자체를 숨김 */}
                  {!isUncategorized && (
                    <span
                      onClick={(e) => openCategoryMenu(e, c.id)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        cursor: "pointer",
                        opacity: isActive ? 0.95 : 0.6,
                        background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                        color: isActive ? "#fff" : "#374151",
                      }}
                      title="카테고리 설정"
                    >
                      ⋯
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={handleAddCategory}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            border: "1px solid #2563eb",
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            fontSize: 18,
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="카테고리 추가"
        >
          +
        </button>
      </div>

      {/* 카테고리 메뉴(⋯) */}
      {catMenu && (
        <div
          ref={catMenuRef}
          style={{
            position: "fixed",
            left: catMenu.x,
            top: catMenu.y,
            padding: 8,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            fontSize: 12,
            zIndex: 999,
            minWidth: 150,
          }}
        >
          <button type="button" onClick={() => openRename(catMenu.id)} style={menuBtnStyle()}>
            ✏️ 이름 변경
          </button>
          <button type="button" onClick={() => openDelete(catMenu.id)} style={menuBtnStyle({ danger: true })}>
            🗑️ 삭제
          </button>
        </div>
      )}

      {/* 검색 + 필터 + 정렬 */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="품명 / 옵션(size) / 바코드 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onBarcodeKeyDown}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            flex: 1,
            minWidth: isMobile ? 0 : 200,
            fontSize: 14,
          }}
        />

        {/* 재고 필터 */}
        <div style={{ position: "relative" }} ref={filterMenuRef}>
          <button
            type="button"
            onClick={() => setIsFilterMenuOpen((prev) => !prev)}
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              border: stockFilter !== "all" ? "1px solid #10b981" : "1px solid #6b7280",
              backgroundColor: stockFilter !== "all" ? "#d1fae5" : "#f3f4f6",
              color: stockFilter !== "all" ? "#047857" : "#374151",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            필터: {stockFilter === "all" ? "전체" : stockFilter === "out" ? "품절" : stockFilter === "low" ? "재고부족" : "충분"} ▾
          </button>

          {isFilterMenuOpen && (
            <div
              style={{
                position: "absolute",
                left: 0,
                marginTop: 4,
                padding: 8,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                fontSize: 12,
                zIndex: 10,
                minWidth: 140,
              }}
            >
              <div style={{ marginBottom: 6, fontSize: 11, color: "#6b7280" }}>재고 상태</div>

              <button
                type="button"
                onClick={() => { setStockFilter("all"); setIsFilterMenuOpen(false); }}
                style={filterBtnStyle(stockFilter === "all")}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => { setStockFilter("out"); setIsFilterMenuOpen(false); }}
                style={filterBtnStyle(stockFilter === "out")}
              >
                품절 (0개)
              </button>
              <button
                type="button"
                onClick={() => { setStockFilter("low"); setIsFilterMenuOpen(false); }}
                style={filterBtnStyle(stockFilter === "low")}
              >
                재고 부족 (≤10개)
              </button>
              <button
                type="button"
                onClick={() => { setStockFilter("available"); setIsFilterMenuOpen(false); }}
                style={filterBtnStyle(stockFilter === "available")}
              >
                재고 충분 (&gt;10개)
              </button>
            </div>
          )}
        </div>

        <div style={{ position: "relative" }} ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setIsSortMenuOpen((prev) => !prev)}
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              border: "1px solid #2563eb",
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            정렬: {sortLabel} ▾
          </button>

          {isSortMenuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                marginTop: 4,
                padding: 8,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                fontSize: 12,
                zIndex: 10,
                minWidth: 130,
              }}
            >
              <div style={{ marginBottom: 6, fontSize: 11, color: "#6b7280" }}>정렬 기준 선택</div>

              <button type="button" onClick={() => handleSelectSortKey("name")} style={sortBtnStyle(sortKey === "name")}>
                이름 순
              </button>
              <button type="button" onClick={() => handleSelectSortKey("latest")} style={sortBtnStyle(sortKey === "latest")}>
                최신 순
              </button>
              <button type="button" onClick={() => handleSelectSortKey("count")} style={sortBtnStyle(sortKey === "count")}>
                옵션 많은 순
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: "1px solid #2563eb",
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
          title="오름/내림차순"
        >
          {sortIcon}
        </button>
      </div>

      {/* 그룹 목록 */}
      {Object.keys(filteredGroups).length === 0 ? (
        <div style={{ fontSize: 14, color: "#9ca3af" }}>등록된 물품이 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? 10 : 16 }}>
          {sortedGroupEntries.map(([name, list]) => {
            const representative = list.find((i) => i.imageUrl) || list[0];

            return (
              <div
                key={name}
                style={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  padding: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                {representative?.imageUrl ? (
                  <img
                    src={representative.imageUrl}
                    alt=""
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageModal(representative.imageUrl);
                    }}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 10,
                      marginBottom: 8,
                      cursor: "zoom-in",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 140,
                      borderRadius: 10,
                      backgroundColor: "#e5e7eb",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    이미지 없음
                  </div>
                )}

                <div style={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>옵션 {list.length}개</div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                    onClick={() => goDetailByGroupName(name, list)}
                  >
                    관리하기
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrModal(representative);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                    title="QR코드 생성"
                  >
                    QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {imageModal && <ImageModal imageUrl={imageModal} onClose={() => setImageModal(null)} />}

      {/* QR코드 생성 모달 */}
      {qrModal && <QRCodeGenerator item={qrModal} onClose={() => setQrModal(null)} />}

      {/* 이름변경 모달 */}
      {renameModal && (
        <ModalContainer>
          <div style={modalCardStyle()}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>카테고리 이름 변경</div>

            <input
              value={renameModal.name}
              onChange={(e) => setRenameModal((p) => ({ ...p, name: e.target.value }))}
              placeholder="새 이름"
              style={modalInputStyle()}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setRenameModal(null)} style={modalBtnStyle()}>
                취소
              </button>
              <button onClick={submitRename} style={modalBtnStyle({ primary: true })}>
                저장
              </button>
            </div>
          </div>
        </ModalContainer>
      )}

      {/* 삭제 모달 */}
      {deleteModal && (
        <ModalContainer>
          <div style={modalCardStyle()}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>카테고리 삭제</div>

            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              <div>
                <b>{deleteModal.name}</b> 카테고리를 삭제할까요?
              </div>
              <div style={{ marginTop: 6, color: "#6b7280" }}>
                삭제해도 아이템은 사라지지 않고 <b>"미분류"</b>로 자동 이동합니다.
              </div>
              <div style={{ marginTop: 6, color: "#dc2626", fontWeight: 700 }}>
                (미분류 카테고리는 삭제할 수 없어요)
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setDeleteModal(null)} style={modalBtnStyle()}>
                취소
              </button>
              <button onClick={submitDelete} style={modalBtnStyle({ danger: true })}>
                삭제
              </button>
            </div>
          </div>
        </ModalContainer>
      )}
      </div>
    </div>
  );
}

/* ----------------------- UI Helpers ----------------------- */
function menuBtnStyle({ danger } = {}) {
  return {
    display: "block",
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    backgroundColor: danger ? "#fee2e2" : "#f3f4f6",
    color: danger ? "#991b1b" : "#111827",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 700,
    marginBottom: 6,
  };
}

function sortBtnStyle(active) {
  return {
    display: "block",
    width: "100%",
    padding: "6px 8px",
    textAlign: "left",
    borderRadius: 8,
    border: "none",
    backgroundColor: active ? "#eff6ff" : "transparent",
    color: active ? "#1d4ed8" : "#374151",
    cursor: "pointer",
    marginBottom: 2,
  };
}

function filterBtnStyle(active) {
  return {
    display: "block",
    width: "100%",
    padding: "6px 8px",
    textAlign: "left",
    borderRadius: 8,
    border: "none",
    backgroundColor: active ? "#d1fae5" : "transparent",
    color: active ? "#047857" : "#374151",
    cursor: "pointer",
    marginBottom: 2,
    fontWeight: active ? 600 : 400,
  };
}

function ModalContainer({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}

function modalCardStyle() {
  return {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
  };
}

function modalInputStyle() {
  return {
    width: "100%",
    height: 38,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
  };
}

function modalBtnStyle({ primary, danger } = {}) {
  return {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    backgroundColor: primary ? "#2563eb" : danger ? "#dc2626" : "#f3f4f6",
    color: primary || danger ? "#fff" : "#111827",
  };
}
