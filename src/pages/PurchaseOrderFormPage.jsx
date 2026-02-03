import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSuppliers } from "../api/suppliers";
import { getItems } from "../api/items";
import { createPurchaseOrder, getPurchaseOrder } from "../api/purchase-orders";

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const isEdit = !!orderId;

  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    supplierId: "",
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDate: "",
    notes: "",
    items: [],
  });

  const [selectedItem, setSelectedItem] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersData, itemsData] = await Promise.all([
        getSuppliers(true),
        getItems(),
      ]);
      setSuppliers(suppliersData.suppliers || []);
      setItems(itemsData);

      if (isEdit) {
        const orderData = await getPurchaseOrder(orderId);
        setFormData({
          supplierId: orderData.order.supplierId,
          orderDate: orderData.order.orderDate.slice(0, 10),
          expectedDate: orderData.order.expectedDate?.slice(0, 10) || "",
          notes: orderData.order.notes || "",
          items: orderData.order.items.map((item) => ({
            itemId: item.itemId,
            orderedQuantity: item.orderedQuantity,
            unitPrice: item.unitPrice || 0,
          })),
        });
      }
    } catch (e) {
      console.error("데이터 로딩 오류:", e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem || !itemQuantity) {
      alert("품목과 수량을 입력해주세요.");
      return;
    }

    const itemId = parseInt(selectedItem);
    const quantity = parseInt(itemQuantity);
    const price = parseFloat(itemPrice) || 0;

    if (formData.items.some((item) => item.itemId === itemId)) {
      alert("이미 추가된 품목입니다.");
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { itemId, orderedQuantity: quantity, unitPrice: price }],
    });

    setSelectedItem("");
    setItemQuantity("");
    setItemPrice("");
  };

  const handleRemoveItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.itemId !== itemId),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplierId) {
      alert("공급업체를 선택해주세요.");
      return;
    }

    if (formData.items.length === 0) {
      alert("최소 1개 이상의 품목을 추가해주세요.");
      return;
    }

    try {
      await createPurchaseOrder({
        supplierId: parseInt(formData.supplierId),
        orderDate: formData.orderDate,
        expectedDate: formData.expectedDate || null,
        notes: formData.notes || null,
        items: formData.items,
      });
      alert("발주서가 생성되었습니다.");
      navigate("/purchase-orders");
    } catch (e) {
      alert(e.message);
    }
  };

  const getItemById = (itemId) => items.find((item) => item.id === itemId);

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + item.orderedQuantity * item.unitPrice;
    }, 0);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        불러오는 중...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #b8c5f2 0%, #c5b3d9 50%, #e8d4f0 100%)",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
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
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#7c8db5" }}>
            📝 {isEdit ? "발주서 수정" : "발주서 생성"}
          </h1>
        </div>

        {/* 발주서 폼 */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 32,
              marginBottom: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 700 }}>기본 정보</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  공급업체 *
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">선택하세요</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  발주일 *
                </label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  입고 예정일
                </label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* 품목 추가 */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 32,
              marginBottom: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 700 }}>품목 추가</h2>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  품목
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">선택하세요</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.size && `(${item.size})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  수량
                </label>
                <input
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  단가
                </label>
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#10b981",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                추가
              </button>
            </div>

            {/* 추가된 품목 목록 */}
            {formData.items.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                  발주 품목 ({formData.items.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {formData.items.map((item) => {
                    const itemDetail = getItemById(item.itemId);
                    return (
                      <div
                        key={item.itemId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: 8,
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {itemDetail?.name || "알 수 없음"}
                            {itemDetail?.size && ` (${itemDetail.size})`}
                          </div>
                          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                            수량: {item.orderedQuantity}개 | 단가: {item.unitPrice.toLocaleString()}원 |
                            소계: {(item.orderedQuantity * item.unitPrice).toLocaleString()}원
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.itemId)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
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
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, fontSize: 18, fontWeight: 700, textAlign: "right" }}>
                  총 금액: {calculateTotal().toLocaleString()}원
                </div>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate("/purchase-orders")}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: "#7c8db5",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isEdit ? "수정" : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
