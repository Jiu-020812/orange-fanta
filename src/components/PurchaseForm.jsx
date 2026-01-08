import { useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState("PURCHASE"); // PURCHASE | OUT
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const t = String(type || "").toUpperCase();

    if (t === "PURCHASE") {
      const p = Number(price);
      if (!Number.isFinite(p) || p <= 0) return; // 매입은 가격 필수
    } else {
      // OUT은 가격 선택
      if (price !== "" && price != null) {
        const p = Number(price);
        if (!Number.isFinite(p) || p < 0) return;
      }
    }

    onAddRecord({
      type: t,
      date,
      price: price === "" || price == null ? null : Number(price),
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
          onChange={(e) => setType(String(e.target.value || "").toUpperCase())}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}
        >
          <option value="PURCHASE">매입</option>
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
          placeholder={type === "OUT" ? "판매 금액(총액, 선택)" : "매입 금액(총액)"}
          value={price}
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
            backgroundColor: type === "OUT" ? "#ef4444" : "#3b82f6",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {type === "OUT" ? "판매 추가" : "매입 추가"}
        </button>
      </form>
    </div>
  );
}

export default PurchaseForm;
