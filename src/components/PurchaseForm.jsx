import { useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState("PURCHASE");
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // - PURCHASE: price 필수
    // - IN: price 입력 안 받음(무시)
    // - OUT: price 선택
    if (type === "PURCHASE" && !price) return;

    onAddRecord({
      type,
      date,
      price:
      type === "IN" || price === "" || price == null
        ? null
        : Number(price),
        count: count === "" ? 1 : Number(count),
    });

    // 초기화
    setPrice("");
    setCount("");
  };

  return (
    <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
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
          onChange={(e) => setType(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}
        >
          <option value="PURCHASE">매입</option>
          <option value="IN">입고</option>
          <option value="OUT">판매</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}
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
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}
        />

        <input
          type="number"
          min="1"
          placeholder="개수"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}
        />

        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: type === "OUT" ? "#ef4444" : type === "IN" ? "#10b981" : "#3b82f6",
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
