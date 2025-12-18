import { useEffect, useRef, useState } from "react";
import { searchItems } from "../api/items";

/**
 * props
 * - value: 선택된 item (or null)
 * - onSelect: (item|null) => void   // item: { id, name, size?, barcode? }
 */
export default function ItemPicker({ value, onSelect }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  //  바코드 스캐너 입력 대응 (Enter로 확정)
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" && items.length === 1) {
      onSelect(items[0]);
      setOpen(false);
      setQuery("");
    }
  }

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onDocDown(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // 검색
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const list = await searchItems(q);
        setItems(Array.isArray(list) ? list : []);
        setOpen(true);
      } catch (e) {
        console.error("searchItems 실패:", e);
        setItems([]);
        setOpen(false);
      }
    }, 200);

    return () => clearTimeout(t);
  }, [query]);

  //  선택된 값 표시 (겹침 방지 위해 width/boxSizing/minWidth 통일)
  if (value) {
    return (
      <div
        ref={rootRef}
        style={{
          width: "100%",
          minWidth: 0,               //  flex에서 줄어들 수 있게
          boxSizing: "border-box",   //  폭 계산 통일
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={value.name}
        >
          ✔ {formatItemLabel(value)}
        </div>

        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
            setItems([]);
            setOpen(false);
            setTimeout(() => inputRef.current?.focus?.(), 0);
          }}
          style={changeBtn}
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: "100%",
        minWidth: 0,             //  flex shrink 허용
        boxSizing: "border-box",
      }}
    >
      <input
        ref={inputRef}
        placeholder="바코드 스캔 또는 상품명 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        style={{
          width: "100%",
          minWidth: 0,           //  입력도 줄어들 수 있게
          boxSizing: "border-box",
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
            zIndex: 99999,        //  TopNav 위로
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onMouseDown={(e) => e.preventDefault()} //  blur로 닫히기 전에 클릭 처리
              onClick={() => {
                onSelect(item);
                setOpen(false);
                setQuery("");
              }}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 14,
              }}
              title={formatItemLabel(item)}
            >
              {formatItemLabel(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatItemLabel(item) {
  const name = String(item?.name ?? "");
  const size = String(item?.size ?? "").trim();
  // 옵션/사이즈가 있으면 같이 보여주기 (그래프/재고 혼동 줄임)
  return size && size !== "-" ? `${name} (${size})` : name;
}

const changeBtn = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: 13,
  flex: "0 0 auto",
};
