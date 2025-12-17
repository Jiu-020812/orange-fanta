import { useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState("IN"); // ✅ IN=매입, OUT=출고
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!price) return;

    onAddRecord({
      type, // ✅ 추가
      date,
      price,
      count,
    });

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
          gridTemplateColumns: "110px 140px minmax(0, 1.2fr) 100px auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* ✅ 매입/출고 선택 */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#111827",
            cursor: "pointer",
          }}
        >
          <option value="IN">매입</option>
          <option value="OUT">출고</option>
        </select>

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

        {/* 금액 */}
        <input
          type="number"
          min="0"
          placeholder={type === "OUT" ? "판매 금액 (총액)" : "매입 금액 (총액)"}
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
            backgroundColor: type === "OUT" ? "#ef4444" : "#3b82f6",
            color: "#ffffff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {type === "OUT" ? "출고 추가" : "매입 추가"}
        </button>
      </form>
    </div>
  );
}

export default PurchaseForm;
