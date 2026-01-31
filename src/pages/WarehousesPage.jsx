import { useEffect, useState } from "react";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../api/warehouses";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  async function fetchWarehouses() {
    try {
      setLoading(true);
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error("창고 목록 조회 실패:", err);
      alert("창고 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(warehouse = null) {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        location: warehouse.location || "",
        description: warehouse.description || "",
      });
    } else {
      setEditingWarehouse(null);
      setFormData({ name: "", location: "", description: "" });
    }
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingWarehouse(null);
    setFormData({ name: "", location: "", description: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("창고 이름을 입력해주세요.");
      return;
    }

    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, formData);
        alert("창고가 수정되었습니다.");
      } else {
        await createWarehouse(formData);
        alert("창고가 생성되었습니다.");
      }
      handleCloseModal();
      fetchWarehouses();
    } catch (err) {
      console.error("창고 저장 실패:", err);
      alert(err.message || "창고 저장에 실패했습니다.");
    }
  }

  async function handleDelete(warehouse) {
    if (!confirm(`"${warehouse.name}" 창고를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteWarehouse(warehouse.id);
      alert("창고가 삭제되었습니다.");
      fetchWarehouses();
    } catch (err) {
      console.error("창고 삭제 실패:", err);
      alert(err.message || "창고 삭제에 실패했습니다.");
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
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>창고 관리</h1>
        <button
          onClick={() => handleOpenModal()}
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
          + 새 창고 추가
        </button>
      </div>

      {/* 창고 목록 */}
      {warehouses.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: 12,
          }}
        >
          <p style={{ color: "#6b7280" }}>등록된 창고가 없습니다.</p>
          <button
            onClick={() => handleOpenModal()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              backgroundColor: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            첫 창고 추가하기
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              style={{
                padding: 20,
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {warehouse.name}
              </h3>
              {warehouse.location && (
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                  📍 {warehouse.location}
                </p>
              )}
              {warehouse.description && (
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>
                  {warehouse.description}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => handleOpenModal(warehouse)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(warehouse)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
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
              {editingWarehouse ? "창고 수정" : "새 창고 추가"}
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
                  창고 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 본사 창고"
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
                  위치
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="예: 서울시 강남구"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
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
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="창고에 대한 설명을 입력하세요"
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
                  {editingWarehouse ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
