import { useEffect, useState } from "react";
import { getStockAudits, createStockAudit } from "../api/stock-audits";
import { getWarehouses } from "../api/warehouses";
import { getItems } from "../api/items";

export default function StockAuditsPage() {
  const [audits, setAudits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState({
    itemId: "",
    warehouseId: "",
    expectedQuantity: "",
    actualQuantity: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [auditsData, warehousesData, itemsData] = await Promise.all([
        getStockAudits(),
        getWarehouses(),
        getItems(),
      ]);
      setAudits(auditsData);
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
      warehouseId: "",
      expectedQuantity: "",
      actualQuantity: "",
      notes: "",
    });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setFormData({
      itemId: "",
      warehouseId: "",
      expectedQuantity: "",
      actualQuantity: "",
      notes: "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !formData.itemId ||
      !formData.warehouseId ||
      formData.expectedQuantity === "" ||
      formData.actualQuantity === ""
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (parseInt(formData.expectedQuantity) < 0 || parseInt(formData.actualQuantity) < 0) {
      alert("수량은 0 이상이어야 합니다.");
      return;
    }

    try {
      await createStockAudit({
        ...formData,
        itemId: parseInt(formData.itemId),
        warehouseId: parseInt(formData.warehouseId),
        expectedQuantity: parseInt(formData.expectedQuantity),
        actualQuantity: parseInt(formData.actualQuantity),
      });
      alert("재고 실사가 등록되었습니다.");
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error("재고 실사 등록 실패:", err);
      alert(err.message || "재고 실사 등록에 실패했습니다.");
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
    <div style={{ padding: "16px", maxWidth: 1200, margin: "0 auto" }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>재고 실사</h1>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "1px solid #9ca3af",
                backgroundColor: "transparent",
                color: "#9ca3af",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              ?
            </button>
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 8,
                  padding: 12,
                  backgroundColor: "#1f2937",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.5,
                  width: 280,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >
                <strong>재고 실사란?</strong>
                <br />
                창고에서 실제로 물건을 세어보고, 시스템 재고와 비교하는 작업입니다.
                <br />
                <br />
                • 예상 수량: 시스템상 있어야 하는 수량
                <br />
                • 실제 수량: 실제로 세어본 수량
                <br />• 차이: 실제 - 예상 (±로 표시)
              </div>
            )}
          </div>
        </div>
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
          + 재고 실사 등록
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
            재고 실사를 등록하려면 먼저 창고를 추가해주세요.
          </p>
        </div>
      )}

      {/* 재고 실사 목록 */}
      {audits.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: 12,
          }}
        >
          <p style={{ color: "#6b7280" }}>등록된 재고 실사 기록이 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "auto",
              display: window.innerWidth > 768 ? "block" : "none",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                    날짜
                  </th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                    품목
                  </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  창고
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                  예상 수량
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                  실제 수량
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                  차이
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                  비고
                </th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr
                  key={audit.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {new Date(audit.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {audit.item.name} ({audit.item.size})
                  </td>
                  <td style={{ padding: 12, fontSize: 14 }}>
                    {audit.warehouse.name}
                  </td>
                  <td style={{ padding: 12, fontSize: 14, textAlign: "right" }}>
                    {audit.expectedQuantity}
                  </td>
                  <td style={{ padding: 12, fontSize: 14, textAlign: "right" }}>
                    {audit.actualQuantity}
                  </td>
                  <td
                    style={{
                      padding: 12,
                      fontSize: 14,
                      textAlign: "right",
                      fontWeight: 600,
                      color:
                        audit.difference > 0
                          ? "#059669"
                          : audit.difference < 0
                          ? "#dc2626"
                          : "#6b7280",
                    }}
                  >
                    {audit.difference > 0 ? "+" : ""}
                    {audit.difference}
                  </td>
                  <td style={{ padding: 12, fontSize: 14, color: "#6b7280" }}>
                    {audit.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 뷰 */}
        <div
          style={{
            display: window.innerWidth > 768 ? "none" : "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {audits.map((audit) => (
            <div
              key={audit.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {audit.item.name} ({audit.item.size})
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    {audit.warehouse.name}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  {new Date(audit.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  padding: "12px 0",
                  borderTop: "1px solid #f3f4f6",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                    예상 수량
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {audit.expectedQuantity}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                    실제 수량
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {audit.actualQuantity}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                    차이
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color:
                        audit.difference > 0
                          ? "#059669"
                          : audit.difference < 0
                          ? "#dc2626"
                          : "#6b7280",
                    }}
                  >
                    {audit.difference > 0 ? "+" : ""}
                    {audit.difference}
                  </div>
                </div>
              </div>

              {audit.notes && (
                <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                  {audit.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
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
              재고 실사 등록
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
                  창고 *
                </label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouseId: e.target.value })
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
                  예상 수량 *
                </label>
                <input
                  type="number"
                  value={formData.expectedQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedQuantity: e.target.value })
                  }
                  placeholder="0"
                  min="0"
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

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  실제 수량 *
                </label>
                <input
                  type="number"
                  value={formData.actualQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, actualQuantity: e.target.value })
                  }
                  placeholder="0"
                  min="0"
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

              {formData.expectedQuantity && formData.actualQuantity && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                    차이
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color:
                        parseInt(formData.actualQuantity) -
                          parseInt(formData.expectedQuantity) >
                        0
                          ? "#059669"
                          : parseInt(formData.actualQuantity) -
                              parseInt(formData.expectedQuantity) <
                            0
                          ? "#dc2626"
                          : "#6b7280",
                    }}
                  >
                    {parseInt(formData.actualQuantity) -
                      parseInt(formData.expectedQuantity) >
                    0
                      ? "+"
                      : ""}
                    {parseInt(formData.actualQuantity) -
                      parseInt(formData.expectedQuantity)}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  비고
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="비고사항을 입력하세요"
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
