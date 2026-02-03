import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * QR코드 생성 컴포넌트
 * - 품목 정보를 QR코드로 변환
 * - 라벨 출력 지원
 * - 다운로드 기능
 */
export default function QRCodeGenerator({ item, onClose }) {
  const canvasRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (!item || !canvasRef.current) return;

    // QR코드 데이터 (품목 ID 또는 바코드)
    const qrData = item.barcode || `ITEM-${item.id}`;

    // QR코드 생성
    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      },
      (error) => {
        if (error) {
          console.error("QR코드 생성 실패:", error);
        } else {
          setQrGenerated(true);
        }
      }
    );
  }, [item]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Canvas를 이미지로 변환하여 다운로드
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_${item.name}_${item.size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handlePrint = () => {
    // 프린트용 윈도우 열기
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
      return;
    }

    const qrDataUrl = canvasRef.current.toDataURL();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR 라벨 - ${item.name}</title>
        <style>
          @media print {
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4mm;
          }
          .qr-label {
            text-align: center;
          }
          .qr-code {
            width: 25mm;
            height: 25mm;
            margin: 0 auto 2mm;
          }
          .item-name {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          .item-size {
            font-size: 8pt;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="qr-label">
          <img src="${qrDataUrl}" alt="QR Code" class="qr-code" />
          <div class="item-name">${item.name}</div>
          <div class="item-size">${item.size}</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // 이미지 로드 후 인쇄
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
            QR코드 라벨
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* QR코드 */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <canvas ref={canvasRef} style={{ display: qrGenerated ? "block" : "none", margin: "0 auto" }} />
          {!qrGenerated && (
            <div style={{ color: "#6b7280", padding: "60px 0" }}>
              QR코드 생성 중...
            </div>
          )}
        </div>

        {/* 품목 정보 */}
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: "#f9fafb", borderRadius: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            {item.size}
          </div>
          {item.barcode && (
            <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
              바코드: {item.barcode}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleDownload}
            disabled={!qrGenerated}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              cursor: qrGenerated ? "pointer" : "not-allowed",
              opacity: qrGenerated ? 1 : 0.5,
            }}
          >
            다운로드
          </button>
          <button
            onClick={handlePrint}
            disabled={!qrGenerated}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: qrGenerated ? "pointer" : "not-allowed",
              opacity: qrGenerated ? 1 : 0.5,
            }}
          >
            라벨 인쇄
          </button>
        </div>

        {/* 안내 */}
        <div style={{ marginTop: 16, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          라벨 프린터로 출력하거나 이미지로 저장할 수 있습니다
        </div>
      </div>
    </div>
  );
}
