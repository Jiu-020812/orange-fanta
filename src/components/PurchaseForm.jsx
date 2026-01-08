import { useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState("PURCHASE");
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // count 정규화(최소 1)
    const cRaw = count === "" || count == null ? 1 : Number(count);
    const c = Math.max(1, Number.isFinite(cRaw) ? cRaw : 1);

    // price 정규화
    const pRaw = price === "" || price == null ? null : Number(price);

    // PURCHASE는 price > 0 필수
    if (type === "PURCHASE") {
      const p = Number(pRaw);
      if (!Number.isFinite(p) || p <= 0) return;
    }

    // OUT은 price 선택 (있으면 >=0 정도만 최소 검증)
    if (type === "OUT" && pRaw != null) {
      if (!Number.isFinite(pRaw) || pRaw < 0) return;
    }

    onAddRecord({
      type,
      date,
      price: type === "IN" ? null : pRaw,
      count: c,
    });

    // 초기화
    setPrice("");
    setCount("");
  };

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "120px 140px minmax(0, 1.2fr) 100px auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <select
          value={type}
          onChange={(e) => {
            const next = e.target.value;
            setType(next);
            if (next === "IN") setPrice("");
          }}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
          }}
        >
          <option value="PURCHASE">매입</option>
          <option value="IN">입고</option>
          <option value="OUT">판매</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
          }}
        />

        <input
          type="number"
          min="0"
          placeholder={
            type === "PURCHASE"
              ? "매입 금액(총액)"
              : type === "OUT"
              ? "판매 금액(총액, 선택)"
              : "입고는 금액 없음"
          }
          value={type === "IN" ? "" : price}
          disabled={type === "IN"}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
          }}
        />

        <input
          type="number"
          min="1"
          placeholder="개수"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor:
              type === "OUT" ? "#ef4444" : type === "IN" ? "#10b981" : "#3b82f6",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {type === "OUT" ? "판매 추가" : type === "IN" ? "입고 추가" : "매입 추가"}
        </button>
      </form>
    </div>
  );
}

export default PurchaseForm;
