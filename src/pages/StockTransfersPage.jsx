import { useEffect, useState } from "react";
import {
  getStockTransfers,
  createStockTransfer,
} from "../api/stock-transfers";
import { getWarehouses } from "../api/warehouses";
import { getItems } from "../api/items";

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    itemId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [transfersData, warehousesData, itemsData] = await Promise.all([
        getStockTransfers(),
        getWarehouses(),
        getItems(),
      ]);
      setTransfers(transfersData);
      setWarehouses(warehousesData);
      setItems(itemsData);
    } catch (err) {
      console.error("데이터 조회 실패:", err);
      alert("데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal() {
    setFormData({
      itemId: "",
      fromWarehouseId: "",
      toWarehouseId: "",
      quantity: "",
      reason: "",
    });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setFormData({
      itemId: "",
      fromWarehouseId: "",
      toWarehouseId: "",
      quantity: "",
      reason: "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.itemId || !formData.fromWarehouseId || !formData.toWarehouseId || !formData.quantity) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      alert("출발 창고와 도착 창고는 달라야 합니다.");
      return;
    }

    if (parseInt(formData.quantity) <= 0) {
      alert("수량은 0보다 커야 합니다.");
      return;
    }

    try {
      await createStockTransfer({
        ...formData,
        itemId: parseInt(formData.itemId),
        fromWarehouseId: parseInt(formData.fromWarehouseId),
        toWarehouseId: parseInt(formData.toWarehouseId),
        quantity: parseInt(formData.quantity),
      });
      alert("재고 이동이 등록되었습니다.");
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error("재고 이동 등록 실패:", err);
      alert(err.message || "재고 이동 등록에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>재고 이동</h1>
        <button
          onClick={handleOpenModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + 재고 이동 등록
        </button>
      </div>

      {/* 안내 메시지 */}
      {warehouses.length === 0 && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <p style={{ color: "#92400e", fontSize: 14, margin: 0 }}>
            재고 이동을 등록하려면 먼저 창고를 추가해주세요.
          </p>
        </div>
      )}

      {/* 재고 이동 목록 */}
      {transfers.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: 12,
          }}
        >
          <p style={{ color: "#6b7280" }}>등록된 재고 이동 기록이 없습니다.</p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  날짜
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  품목
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  출발 창고
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  도착 창고
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                  수량
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  사유
                </th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {new Date(transfer.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {transfer.item.name} ({transfer.item.size})
                  </td>
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {transfer.fromWarehouse.name}
                  </td>
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {transfer.toWarehouse.name}
                  </td>
                  <td style={{ padding: 12, fontSize: 14, textAlign: "right" }}>
                    {transfer.quantity}
                  </td>
                  <td style={{ padding: 12, fontSize: 14, color: "#6b7280" }}>
                    {transfer.reason || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 32,
              borderRadius: 16,
              width: "90%",
              maxWidth: 500,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              재고 이동 등록
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  품목 *
                </label>
                <select
                  value={formData.itemId}
                  onChange={(e) =>
                    setFormData({ ...formData, itemId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                  required
                >
                  <option value="">선택하세요</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.size})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  출발 창고 *
                </label>
                <select
                  value={formData.fromWarehouseId}
                  onChange={(e) =>
                    setFormData({ ...formData, fromWarehouseId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                  required
                >
                  <option value="">선택하세요</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  도착 창고 *
                </label>
                <select
                  value={formData.toWarehouseId}
                  onChange={(e) =>
                    setFormData({ ...formData, toWarehouseId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                  required
                >
                  <option value="">선택하세요</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  수량 *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="0"
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  사유
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="이동 사유를 입력하세요"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#1d4ed8",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
