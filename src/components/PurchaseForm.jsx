import { useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!price) return;

    onAddRecord({
      date,
      price,
      count,
    });

    // 금액 / 개수 초기화
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
        backgroundColor: "#ffffff",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "140px minmax(0, 1.2fr) 100px auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* 날짜 */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        />

        {/* 매입 금액 */}
        <input
          type="number"
          min="0"
          placeholder="매입 금액 (총액)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        />

        {/* 개수 */}
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
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        />

        {/* 기록 추가 버튼 */}
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          기록 추가
        </button>
      </form>
    </div>
  );
}

export default PurchaseForm;