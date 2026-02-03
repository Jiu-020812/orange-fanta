import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../api/suppliers";

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data.suppliers || []);
    } catch (e) {
      console.error("공급업체 목록 조회 오류:", e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setShowForm(false);
      setEditingSupplier(null);
      setFormData({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      loadSuppliers();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (supplierId) => {
    if (!confirm("이 공급업체를 삭제하시겠습니까?")) return;
    try {
      await deleteSupplier(supplierId);
      loadSuppliers();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (supplier) => {
    try {
      await updateSupplier(supplier.id, { isActive: !supplier.isActive });
      loadSuppliers();
    } catch (e) {
      alert(e.message);
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#7c8db5" }}>
              🏢 공급업체 관리
            </h1>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => navigate("/purchase-orders")}
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
                발주 관리
              </button>
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setFormData({
                    name: "",
                    contactName: "",
                    email: "",
                    phone: "",
                    address: "",
                    notes: "",
                  });
                  setShowForm(true);
                }}
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
                + 공급업체 등록
              </button>
            </div>
          </div>
        </div>

        {/* 등록/수정 폼 */}
        {showForm && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 32,
              marginBottom: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 700 }}>
              {editingSupplier ? "공급업체 수정" : "공급업체 등록"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                    공급업체명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    담당자명
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
                    이메일
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
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
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#7c8db5",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {editingSupplier ? "수정" : "등록"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSupplier(null);
                  }}
                  style={{
                    padding: "10px 24px",
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
              </div>
            </form>
          </div>
        )}

        {/* 공급업체 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, background: "#ffffff", borderRadius: 16 }}>
              불러오는 중...
            </div>
          ) : suppliers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                background: "#ffffff",
                borderRadius: 16,
                color: "#6b7280",
              }}
            >
              등록된 공급업체가 없습니다. 새 공급업체를 등록해보세요!
            </div>
          ) : (
            suppliers.map((supplier) => (
              <div
                key={supplier.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: supplier.isActive ? "1px solid #e5e7eb" : "1px solid #fca5a5",
                  opacity: supplier.isActive ? 1 : 0.7,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        {supplier.name}
                      </h3>
                      {!supplier.isActive && (
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 12,
                            background: "#fee2e2",
                            color: "#dc2626",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          비활성
                        </span>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14, color: "#6b7280" }}>
                      {supplier.contactName && (
                        <div>담당자: {supplier.contactName}</div>
                      )}
                      {supplier.phone && (
                        <div>전화: {supplier.phone}</div>
                      )}
                      {supplier.email && (
                        <div>이메일: {supplier.email}</div>
                      )}
                      {supplier.address && (
                        <div style={{ gridColumn: "1 / -1" }}>주소: {supplier.address}</div>
                      )}
                      {supplier.notes && (
                        <div style={{ gridColumn: "1 / -1", color: "#9ca3af" }}>메모: {supplier.notes}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleToggleActive(supplier)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        color: supplier.isActive ? "#dc2626" : "#10b981",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {supplier.isActive ? "비활성화" : "활성화"}
                    </button>
                    <button
                      onClick={() => handleEdit(supplier)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
