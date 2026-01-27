export default function OptionCard({
  option,
  isSelected,
  displayImageUrl,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <div
      onClick={() => onSelect(option.id)}
      style={{
        border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
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

      <div style={{ fontSize: 14, fontWeight: 700 }}>{option.size || "(옵션)"}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(option);
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
            onDelete(option.id);
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
}
