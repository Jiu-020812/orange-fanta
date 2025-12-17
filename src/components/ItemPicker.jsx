import { useEffect, useRef, useState } from "react";
import { searchItems } from "../api/items";

/**
 * props
 * - value: 선택된 item (or null)
 * - onSelect: (item) => void   // { id, name, barcode? }
 */
export default function ItemPicker({ value, onSelect }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  // 🔫 바코드 스캐너 입력 대응 (Enter로 확정)
  function handleKeyDown(e) {
    if (e.key === "Enter" && items.length === 1) {
      onSelect(items[0]);
      setOpen(false);
    }
  }

  // 검색
  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      return;
    }

    const t = setTimeout(async () => {
      const list = await searchItems(query.trim());
      setItems(list);
      setOpen(true);
    }, 200);

    return () => clearTimeout(t);
  }, [query]);

  if (value) {
    return (
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 600 }}>✔ {value.name}</div>
        <button
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          style={changeBtn}
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        placeholder="바코드 스캔 또는 상품명 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          fontSize: 14,
        }}
      />

      {open && items.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
            zIndex: 1000,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const changeBtn = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: 13,
};
