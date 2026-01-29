import Modal from "../common/Modal";
import { compressImage } from "./imageUtils";

export default function OptionEditModal({ isShoes, editModal, setEditModal, onSave }) {
  const { id, value, image, barcode, sku } = editModal;

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setEditModal({ id, value, image: compressed, barcode, sku });
    } catch (err) {
      console.error("이미지 압축 실패", err);
      alert("이미지 처리 중 오류가 발생했어요 😢");
    }
  };

  return (
    <Modal onClose={() => setEditModal(null)}>
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "white",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>옵션 수정</h3>

        <input
          type="text"
          value={value}
          onChange={(e) =>
            setEditModal({ id, value: e.target.value, image, barcode, sku })
          }
          style={{
            width: "100%",
            marginTop: 14,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          placeholder={isShoes ? "사이즈" : "옵션"}
        />

        <input
          type="text"
          value={barcode ?? ""}
          onChange={(e) => setEditModal({ id, value, image, barcode: e.target.value, sku })}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          placeholder="바코드(선택)"
        />

        <input
          type="text"
          value={sku ?? ""}
          onChange={(e) => setEditModal({ id, value, image, barcode, sku: e.target.value })}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          placeholder="SKU(선택, 비워두면 자동 생성)"
        />

        <input type="file" accept="image/*" onChange={handleImage} style={{ marginTop: 8 }} />

        {image && (
          <img
            src={image}
            alt=""
            style={{
              marginTop: 10,
              width: "100%",
              height: 140,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={() => setEditModal(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            취소
          </button>

          <button
            onClick={onSave}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
