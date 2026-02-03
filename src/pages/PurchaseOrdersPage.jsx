import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPurchaseOrders, updatePurchaseOrderStatus, deletePurchaseOrder } from "../api/purchase-orders";

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseOrders(statusFilter);
      setOrders(data.orders || []);
    } catch (e) {
      console.error("발주서 목록 조회 오류:", e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updatePurchaseOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm("이 발주서를 삭제하시겠습니까?")) return;
    try {
      await deletePurchaseOrder(orderId);
      loadOrders();
    } catch (e) {
      alert(e.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT": return "#9ca3af";
      case "PENDING": return "#f59e0b";
      case "CONFIRMED": return "#3b82f6";
      case "PARTIAL": return "#8b5cf6";
      case "COMPLETED": return "#10b981";
      case "CANCELLED": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DRAFT": return "임시저장";
      case "PENDING": return "대기";
      case "CONFIRMED": return "승인";
      case "PARTIAL": return "부분입고";
      case "COMPLETED": return "완료";
      case "CANCELLED": return "취소";
      default: return status;
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #b8c5f2 0%, #c5b3d9 50%, #e8d4f0 100%)",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* 헤더 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "24px 32px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#7c8db5" }}>
              📋 발주 관리
            </h1>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => navigate("/suppliers")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                공급업체 관리
              </button>
              <button
                onClick={() => navigate("/purchase-orders/new")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#7c8db5",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + 발주서 생성
              </button>
            </div>
          </div>

          {/* 필터 */}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              onClick={() => setStatusFilter("")}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: statusFilter === "" ? "2px solid #7c8db5" : "1px solid #e5e7eb",
                background: statusFilter === "" ? "#f0f4ff" : "#ffffff",
                color: "#374151",
                fontSize: 13,
                fontWeight: statusFilter === "" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              전체
            </button>
            {["PENDING", "CONFIRMED", "PARTIAL", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: statusFilter === status ? "2px solid #7c8db5" : "1px solid #e5e7eb",
                  background: statusFilter === status ? "#f0f4ff" : "#ffffff",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: statusFilter === status ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* 발주서 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, background: "#ffffff", borderRadius: 16 }}>
              불러오는 중...
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                background: "#ffffff",
                borderRadius: 16,
                color: "#6b7280",
              }}
            >
              발주서가 없습니다. 새 발주서를 생성해보세요!
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        {order.orderNumber}
                      </h3>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: 12,
                          background: getStatusColor(order.status),
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: "#6b7280" }}>
                      공급업체: {order.supplier.name} | 발주일: {new Date(order.orderDate).toLocaleDateString("ko-KR")}
                      {order.expectedDate && ` | 입고 예정: ${new Date(order.expectedDate).toLocaleDateString("ko-KR")}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => navigate(`/purchase-orders/${order.id}`)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      상세보기
                    </button>
                    {(order.status === "DRAFT" || order.status === "CANCELLED") && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #ef4444",
                          background: "#ffffff",
                          color: "#ef4444",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                {/* 품목 요약 */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>품목 ({order.items.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {order.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "#f9fafb",
                          fontSize: 13,
                        }}
                      >
                        <span>
                          {item.item.name}
                          {item.item.size && ` (${item.item.size})`}
                        </span>
                        <span style={{ color: "#6b7280" }}>
                          {item.receivedQuantity}/{item.orderedQuantity}개
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                        외 {order.items.length - 3}개 품목
                      </div>
                    )}
                  </div>
                </div>

                {order.totalAmount && (
                  <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, textAlign: "right" }}>
                    총 금액: {order.totalAmount.toLocaleString()}원
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
