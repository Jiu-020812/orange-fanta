import { useMemo, useState } from "react";

function PurchaseForm({ onAddRecord }) {
  const today = new Date().toISOString().slice(0, 10);

  // ✅ B안 기준
  // PURCHASE = 매입(가격 필수)
  // IN       = 입고(가격 없음)
  // OUT      = 판매/출고(가격 선택)
  const [type, setType] = useState("PURCHASE");
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("1");
  const [memo, setMemo] = useState("");

  const isPriceRequired = type === "PURCHASE";
  const isPriceDisabled = type === "IN";

  const priceLabel = useMemo(() => {
    if (type === "PURCHASE") return "매입 금액 (총액)";
    if (type === "OUT") return "판매 금액 (선택)";
    return "가격 없음";
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const countNum = count === "" || count == null ? 1 : Number(count);
    if (!Number.isFinite(countNum) || countNum <= 0) {
      window.alert("수량은 1 이상이어야 해요.");
      return;
    }

    // ✅ 가격 규칙
    let priceValue = price === "" || price == null ? null : Number(price);

    if (isPriceDisabled) priceValue = null;

    if (isPriceRequired) {
      if (priceValue == null || !Number.isFinite(priceValue) || priceValue <= 0) {
        window.alert("매입은 가격을 반드시 입력해야 해요.");
        return;
      }
    }

    if (type === "OUT") {
      // 판매는 가격 선택(없으면 null), 있으면 0 이상
      if (priceValue != null && (!Number.isFinite(priceValue) || priceValue < 0)) {
        window.alert("판매 가격이 올바르지 않습니다.");
        return;
      }
    }

    onAddRecord({
      type,
      date,
      price: priceValue,
      count: countNum,
      memo: memo?.trim() || "",
    });

    // reset
    setPrice("");
    setCount("1");
    setMemo("");
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
          gridTemplateColumns: "120px 140px minmax(0, 1.2fr) 100px minmax(0, 1fr) auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* ✅ 타입 선택 */}
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
          <option value="PURCHASE">매입</option>
          <option value="IN">입고</option>
          <option value="OUT">판매(출고)</option>
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

        {/* 가격 */}
        <input
          type="number"
          min="0"
          placeholder={priceLabel}
          value={isPriceDisabled ? "" : price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isPriceDisabled}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: isPriceDisabled ? "#f3f4f6" : "#ffffff",
            color: "#111827",
          }}
        />

        {/* 수량 */}
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

        {/* 메모 */}
        <input
          type="text"
          placeholder="메모(선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        />

        {/* 버튼 */}
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: type === "OUT" ? "#ef4444" : type === "IN" ? "#10b981" : "#3b82f6",
            color: "#ffffff",
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
