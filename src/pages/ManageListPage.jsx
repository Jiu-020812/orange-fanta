import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItems as fetchItems } from "../api/items";

const norm = (s) => String(s ?? "").trim();

export default function ManageListPage() {
  const navigate = useNavigate();

  const [activeType, setActiveType] = useState("shoes"); // shoes | foods
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 정렬 상태
  const [sortKey, setSortKey] = useState("name"); // name | latest | count
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  /* ----------------------- 서버 데이터 로드 ----------------------- */
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchItems();

        console.log("🟥 /manage items raw:", data);
        console.log("🟥 is array:", Array.isArray(data));
        console.log("🟥 length:", data?.length);

        // 서버가 배열을 주는 형태(지금 너 백엔드가 그럼)
        setItems(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        console.error("ManageListPage 아이템 불러오기 실패:", err);
        setItems([]);
      }
    }
    load();
  }, []);

  const isShoes = activeType === "shoes";

  // ✅ 카테고리로 분리 (서버 enum: SHOE | FOOD)
  const filteredByCategory = useMemo(() => {
    const cat = isShoes ? "SHOE" : "FOOD";
    return items.filter((it) => (it?.category ?? "SHOE") === cat);
  }, [items, isShoes]);

  /* ----------------------- name 기준 그룹핑 ----------------------- */
  const grouped = useMemo(() => {
    const map = {};

    filteredByCategory.forEach((item) => {
      const key = norm(item.name);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });

    return map;
  }, [filteredByCategory]);

  /* ----------------------- 검색 (이름 + 옵션(size)) ----------------------- */
  const filteredGroups = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return grouped;

    const result = {};
    Object.entries(grouped).forEach(([name, list]) => {
      const nameMatch = name.toLowerCase().includes(keyword);

      // ✅ 서버는 option/flavor가 아니라 size를 씀
      const optionMatch = list.some((item) => norm(item.size).toLowerCase().includes(keyword));

      if (nameMatch || optionMatch) result[name] = list;
    });

    return result;
  }, [grouped, searchQuery]);

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

      if (sortKey === "name") {
        base = nameA.localeCompare(nameB, "ko");
      } else if (sortKey === "count") {
        // ✅ 옵션 개수(list.length) 기준
        base = listA.length - listB.length;
      } else if (sortKey === "latest") {
        base = getLatestTime(listA) - getLatestTime(listB);
      }

      return sortOrder === "asc" ? base : -base;
    });
  }, [filteredGroups, sortKey, sortOrder]);

  const sortLabel =
    sortKey === "name" ? "이름순" : sortKey === "latest" ? "최신순" : "옵션 많은 순";
  const sortIcon = sortOrder === "asc" ? "▲" : "▼";

  const toggleSortOrder = () => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  const handleSelectSortKey = (key) => {
    setSortKey(key);
    if (key === "name") setSortOrder("asc");
    else setSortOrder("desc");
    setIsSortMenuOpen(false);
  };

  return (
    <div style={{ width: "100%", padding: 24, boxSizing: "border-box" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>물품 관리</h2>

      {/* 타입 선택 */}
      <div
        style={{
          display: "inline-flex",
          borderRadius: 999,
          backgroundColor: "#f3f4f6",
          padding: 4,
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setActiveType("shoes")}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "6px 16px",
            fontSize: 13,
            cursor: "pointer",
            backgroundColor: isShoes ? "#2563eb" : "transparent",
            color: isShoes ? "#ffffff" : "#374151",
          }}
        >
          신발
        </button>
        <button
          onClick={() => setActiveType("foods")}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "6px 16px",
            fontSize: 13,
            cursor: "pointer",
            backgroundColor: !isShoes ? "#2563eb" : "transparent",
            color: !isShoes ? "#ffffff" : "#374151",
          }}
        >
          식품
        </button>
      </div>

      {/* 검색 + 정렬 */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          placeholder="품명 / 옵션(size) 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            flex: 1,
            fontSize: 14,
          }}
        />

        <div style={{ position: "relative" }}>
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

              <button
                type="button"
                onClick={() => handleSelectSortKey("name")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 8px",
                  textAlign: "left",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: sortKey === "name" ? "#eff6ff" : "transparent",
                  color: sortKey === "name" ? "#1d4ed8" : "#374151",
                  cursor: "pointer",
                  marginBottom: 2,
                }}
              >
                이름 순
              </button>

              <button
                type="button"
                onClick={() => handleSelectSortKey("latest")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 8px",
                  textAlign: "left",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: sortKey === "latest" ? "#eff6ff" : "transparent",
                  color: sortKey === "latest" ? "#1d4ed8" : "#374151",
                  cursor: "pointer",
                  marginBottom: 2,
                }}
              >
                최신 순
              </button>

              <button
                type="button"
                onClick={() => handleSelectSortKey("count")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 8px",
                  textAlign: "left",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: sortKey === "count" ? "#eff6ff" : "transparent",
                  color: sortKey === "count" ? "#1d4ed8" : "#374151",
                  cursor: "pointer",
                }}
              >
                옵션 많은 순
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleSortOrder}
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
        >
          {sortIcon}
        </button>
      </div>

      {/* 그룹 목록 */}
      {Object.keys(filteredGroups).length === 0 ? (
        <div style={{ fontSize: 14, color: "#9ca3af" }}>등록된 물품이 없습니다.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {sortedGroupEntries.map(([name, list]) => {
            // ✅ 대표 이미지: 서버는 imageUrl
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
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 10,
                      marginBottom: 8,
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
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  옵션 {list.length}개
                </div>

                <button
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px 0",
                    borderRadius: 8,
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/manage/item/${encodeURIComponent(name)}`)}
                >
                  관리하기
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
