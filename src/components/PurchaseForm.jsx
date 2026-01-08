import { useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState("PURCHASE");
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const t = String(type || "").toUpperCase();

    // PURCHASE는 price 필수
    if (t === "PURCHASE" && (price === "" || price == null)) return;

    onAddRecord({
      type: t,
      date,
      price: t === "IN" ? null : (price === "" || price == null ? null : Number(price)),
      count: count === "" || count == null ? 1 : Number(count),
    });

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
          onChange={(e) => {
            const next = String(e.target.value || "").toUpperCase();
            setType(next);
            // IN으로 바꾸면 금액은 의미 없으니 확실히 비워버리기
            if (next === "IN") setPrice("");
          }}
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
            String(type).toUpperCase() === "PURCHASE"
              ? "매입 금액(총액)"
              : String(type).toUpperCase() === "OUT"
              ? "판매 금액(총액, 선택)"
              : "입고는 금액 없음"
          }
          value={String(type).toUpperCase() === "IN" ? "" : price}
          disabled={String(type).toUpperCase() === "IN"}
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
            backgroundColor: String(type).toUpperCase() === "OUT" ? "#ef4444" : String(type).toUpperCase() === "IN" ? "#10b981" : "#3b82f6",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {String(type).toUpperCase() === "OUT" ? "판매 추가" : String(type).toUpperCase() === "IN" ? "입고 추가" : "매입 추가"}
        </button>
      </form>
    </div>
  );
}

export default PurchaseForm;
