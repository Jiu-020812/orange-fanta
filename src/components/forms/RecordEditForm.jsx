export default function RecordEditForm({
  editType,
  editDate,
  editPrice,
  editCount,
  editMemo,
  onChangeType,
  onChangeDate,
  onChangePrice,
  onChangeCount,
  onChangeMemo,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 6,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          value={editType}
          onChange={(e) => onChangeType(e.target.value)}
          style={{
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 12,
            backgroundColor: "white",
          }}
        >
          <option value="PURCHASE">매입</option>
          <option value="OUT">판매</option>
          {/* IN은 여기서 수정 선택지로 안 둠 */}
        </select>

        <input
          type="date"
          value={editDate}
          onChange={(e) => onChangeDate(e.target.value)}
          style={{
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 12,
          }}
        />

        <input
          type="number"
          value={editPrice}
          onChange={(e) => onChangePrice(e.target.value)}
          placeholder={editType === "OUT" ? "판매 금액(총액)" : "매입 금액(총액)"}
          style={{
            width: 140,
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 12,
          }}
        />

        <input
          type="number"
          value={editCount}
          onChange={(e) => onChangeCount(e.target.value)}
          placeholder="수량"
          style={{
            width: 70,
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 12,
          }}
        />
      </div>

      <input
        value={editMemo}
        onChange={(e) => onChangeMemo(e.target.value)}
        placeholder="메모(선택)"
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 12,
          backgroundColor: "white",
        }}
      />
    </>
  );
}
