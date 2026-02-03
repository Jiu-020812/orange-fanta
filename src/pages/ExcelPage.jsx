import { useState } from "react";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ExcelPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleDownload = async (type) => {
    try {
      const token =
        window.localStorage.getItem("authToken") ||
        window.sessionStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/excel/${type}`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("다운로드 실패");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1] || `${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 데이터 변환
      const items = jsonData.map((row) => ({
        category: row["카테고리"] || "기타",
        name: row["품목명"],
        size: row["사이즈"] || "",
        barcode: row["바코드"] || "",
        sku: row["SKU"] || "",
        memo: row["메모"] || "",
        lowStockThreshold: row["재고 부족 기준"] || 10,
      }));

      // 서버로 전송
      const token =
        window.localStorage.getItem("authToken") ||
        window.sessionStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/excel/upload-items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "업로드 실패");
      }

      setUploadResult(result.results);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        카테고리: "전자제품",
        품목명: "노트북",
        사이즈: "15인치",
        바코드: "1234567890",
        SKU: "LAPTOP-001",
        "재고 부족 기준": 5,
        메모: "예시 데이터",
      },
      {
        카테고리: "의류",
        품목명: "티셔츠",
        사이즈: "L",
        바코드: "",
        SKU: "TSHIRT-L-001",
        "재고 부족 기준": 10,
        메모: "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "품목 템플릿");
    XLSX.writeFile(workbook, "품목_업로드_템플릿.xlsx");
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
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#7c8db5" }}>
            📊 엑셀 관리
          </h1>
          <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#6b7280" }}>
            데이터를 엑셀로 다운로드하거나 일괄 업로드하세요
          </p>
        </div>

        {/* 다운로드 섹션 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "32px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 700 }}>
            📥 데이터 다운로드
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <DownloadCard
              icon="📦"
              title="품목 목록"
              description="전체 품목 정보"
              onClick={() => handleDownload("items")}
            />
            <DownloadCard
              icon="📋"
              title="재고 현황"
              description="현재 재고 상태"
              onClick={() => handleDownload("stock")}
            />
            <DownloadCard
              icon="📊"
              title="입출고 내역"
              description="전체 입출고 기록"
              onClick={() => handleDownload("records")}
            />
          </div>
        </div>

        {/* 업로드 섹션 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 700 }}>
            📤 품목 일괄 업로드
          </h2>

          <div style={{ marginBottom: 24 }}>
            <button
              onClick={downloadTemplate}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #7c8db5",
                background: "#ffffff",
                color: "#7c8db5",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              📄 템플릿 다운로드
            </button>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              먼저 템플릿을 다운로드하여 양식을 확인하세요
            </p>
          </div>

          <div
            style={{
              border: "2px dashed #d1d5db",
              borderRadius: 12,
              padding: "40px 20px",
              textAlign: "center",
              background: "#f9fafb",
            }}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: 8,
                background: "#7c8db5",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "업로드 중..." : "📁 파일 선택"}
            </label>
            <p style={{ margin: "12px 0 0 0", fontSize: 13, color: "#6b7280" }}>
              .xlsx 또는 .xls 파일을 선택하세요
            </p>
          </div>

          {/* 업로드 결과 */}
          {uploadResult && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                background: uploadResult.failed > 0 ? "#fef3c7" : "#d1fae5",
                border: `1px solid ${uploadResult.failed > 0 ? "#fbbf24" : "#10b981"}`,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>업로드 완료</div>
              <div style={{ fontSize: 14 }}>
                성공: {uploadResult.success}개 | 실패: {uploadResult.failed}개
              </div>
              {uploadResult.errors.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>오류 내역:</div>
                  {uploadResult.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx} style={{ color: "#92400e" }}>
                      {err.row}행 ({err.item}): {err.error}
                    </div>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <div style={{ color: "#92400e" }}>
                      외 {uploadResult.errors.length - 5}건...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadCard({ icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "24px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{description}</div>
    </div>
  );
}
