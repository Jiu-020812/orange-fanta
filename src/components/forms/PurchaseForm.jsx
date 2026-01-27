import { useEffect, useState } from "react";

export default function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  //  IN 제거: PURCHASE / OUT만
  const [type, setType] = useState("PURCHASE");
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  // 타입 바뀔 때 price 기본 UX 정리(선택)
  useEffect(() => {
    // 판매는 가격 선택 가능이니 비우진 않음
    if (type === "PURCHASE" && price === "") {
      // 그대로 둠
    }
  }, [type]); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onAddRecord !== "function") return;

    const t = String(type || "PURCHASE").toUpperCase() === "OUT" ? "OUT" : "PURCHASE";

    const c = count === "" || count == null ? 1 : Number(count);
    if (!Number.isFinite(c) || c <= 0) {
      alert("수량은 1 이상으로 입력해 주세요.");
      return;
    }

    // PURCHASE는 가격 필수
    if (t === "PURCHASE") {
      const p = price === "" || price == null ? null : Number(price);
      if (p == null || !Number.isFinite(p) || p <= 0) {
        alert("매입은 가격을 반드시 입력해야 합니다.");
        return;
      }

      onAddRecord({ type: "PURCHASE", date, price: p, count: c });
      setPrice("");
      setCount("");
      return;
    }

    // OUT는 가격 선택(없으면 null로)
    const p = price === "" || price == null ? null : Number(price);
    if (p != null && (!Number.isFinite(p) || p < 0)) {
      alert("판매 가격이 올바르지 않습니다.");
      return;
    }

    onAddRecord({ type: "OUT", date, price: p, count: c });
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
          onChange={(e) => setType(e.target.value)}
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
          placeholder={type === "PURCHASE" ? "매입 금액(총액)" : "판매 금액(총액, 선택)"}
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
