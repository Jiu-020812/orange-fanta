export default function RecordFilters({
  rangeMode,
  setRangeMode,
  sortMode,
  setSortMode,
  searchText,
  setSearchText,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
}) {
  return (
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
  );
}
