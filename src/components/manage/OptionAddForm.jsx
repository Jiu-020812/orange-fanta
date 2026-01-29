import { useState } from "react";
import { compressImage } from "./imageUtils";

export default function OptionAddForm({ isShoes, onAdd }) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState("");
  const [barcode, setBarcode] = useState("");
  const [sku, setSku] = useState("");

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setImage(compressed);
    } catch (err) {
      console.error("이미지 압축 실패", err);
      alert("이미지 처리 중 오류가 발생했어요 😢");
    }
  };

  const submit = () => {
    if (typeof onAdd !== "function") return;
    onAdd({ value, image, barcode, sku });
    setValue("");
    setImage("");
    setBarcode("");
    setSku("");
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        backgroundColor: "#fafafa",
      }}
    >
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>옵션 추가</h4>

      <input
        type="text"
        placeholder={isShoes ? "사이즈 (260)" : "옵션"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />

      <input
        type="text"
        placeholder="바코드(선택)"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />

      <input
        type="text"
        placeholder="SKU(선택, 비워두면 자동 생성)"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />

      <div style={{ marginTop: 8 }}>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && (
          <img
            src={image}
            alt=""
            style={{
              marginTop: 8,
              width: "100%",
              maxWidth: 180,
              borderRadius: 8,
            }}
          />
        )}
      </div>

      <button
        onClick={submit}
        style={{
          marginTop: 10,
          padding: "6px 14px",
          borderRadius: 999,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        추가
      </button>
    </div>
  );
}
