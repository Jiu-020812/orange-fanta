export default function StockDisplay({ stock, pendingIn }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700 }}>
        현재 재고: <span style={{ color: stock <= 0 ? "#dc2626" : "#111827" }}>{stock}</span>
        <span
          style={{
            marginLeft: 10,
            fontSize: 13,
            fontWeight: 600,
            color: pendingIn > 0 ? "#d97706" : "#6b7280",
          }}
        >
          미입고: {pendingIn}
        </span>
      </div>
    </div>
  );
}
