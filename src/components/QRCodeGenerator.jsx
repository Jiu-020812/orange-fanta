import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

/**
 * QR코드 및 바코드 생성 컴포넌트
 * - 품목 정보를 QR코드 및 바코드로 변환
 * - 라벨 출력 지원
 * - 다운로드 기능
 */
export default function QRCodeGenerator({ item, onClose }) {
  const qrCanvasRef = useRef(null);
  const barcodeCanvasRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  const [mode, setMode] = useState("both"); // "qr", "barcode", "both"

  useEffect(() => {
    if (!item) return;

    // QR코드 생성
    if (qrCanvasRef.current && (mode === "qr" || mode === "both")) {
      const qrData = item.barcode || `ITEM-${item.id}`;
      QRCode.toCanvas(
        qrCanvasRef.current,
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
    }

    // 바코드 생성
    const barcodeData = item.barcode || `ITEM-${item.id}`;
    if (barcodeCanvasRef.current && (mode === "barcode" || mode === "both")) {
      try {
        JsBarcode(barcodeCanvasRef.current, barcodeData, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
        setBarcodeGenerated(true);
      } catch (error) {
        console.error("바코드 생성 실패:", error);
        setBarcodeGenerated(false);
      }
    }
  }, [item, mode]);

  const handleDownload = () => {
    // 모드에 따라 다운로드할 캔버스 선택
    let canvas;
    let filename;

    if (mode === "qr" && qrCanvasRef.current) {
      canvas = qrCanvasRef.current;
      filename = `QR_${item.name}_${item.size}.png`;
    } else if (mode === "barcode" && barcodeCanvasRef.current) {
      canvas = barcodeCanvasRef.current;
      filename = `Barcode_${item.name}_${item.size}.png`;
    } else if (mode === "both") {
      // 두 개의 캔버스를 합쳐서 다운로드
      const combinedCanvas = document.createElement("canvas");
      const ctx = combinedCanvas.getContext("2d");

      const qrCanvas = qrCanvasRef.current;
      const barcodeCanvas = barcodeCanvasRef.current;

      if (!qrCanvas && !barcodeCanvas) return;

      const width = Math.max(
        qrCanvas?.width || 0,
        barcodeCanvas?.width || 0,
        300
      );
      const height = (qrCanvas?.height || 0) + (barcodeCanvas?.height || 0) + 20;

      combinedCanvas.width = width;
      combinedCanvas.height = height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      let offsetY = 0;
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, (width - qrCanvas.width) / 2, offsetY);
        offsetY += qrCanvas.height + 10;
      }
      if (barcodeCanvas) {
        ctx.drawImage(barcodeCanvas, (width - barcodeCanvas.width) / 2, offsetY);
      }

      canvas = combinedCanvas;
      filename = `QR_Barcode_${item.name}_${item.size}.png`;
    }

    if (!canvas) return;

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
      return;
    }

    let content = "";

    if (mode === "qr" && qrCanvasRef.current) {
      const qrDataUrl = qrCanvasRef.current.toDataURL();
      content = `
        <div class="label">
          <img src="${qrDataUrl}" alt="QR Code" class="qr-code" />
          <div class="item-name">${item.name}</div>
          <div class="item-size">${item.size}</div>
        </div>
      `;
    } else if (mode === "barcode" && barcodeCanvasRef.current) {
      const barcodeDataUrl = barcodeCanvasRef.current.toDataURL();
      content = `
        <div class="label">
          <img src="${barcodeDataUrl}" alt="Barcode" class="barcode" />
          <div class="item-name">${item.name}</div>
          <div class="item-size">${item.size}</div>
        </div>
      `;
    } else if (mode === "both" && qrCanvasRef.current && barcodeCanvasRef.current) {
      const qrDataUrl = qrCanvasRef.current.toDataURL();
      const barcodeDataUrl = barcodeCanvasRef.current.toDataURL();
      content = `
        <div class="label">
          <img src="${qrDataUrl}" alt="QR Code" class="qr-code" />
          <img src="${barcodeDataUrl}" alt="Barcode" class="barcode" />
          <div class="item-name">${item.name}</div>
          <div class="item-size">${item.size}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>라벨 - ${item.name}</title>
        <style>
          @media print {
            @page {
              size: ${mode === "both" ? "60mm 50mm" : "50mm 30mm"};
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
          .label {
            text-align: center;
          }
          .qr-code {
            width: 25mm;
            height: 25mm;
            margin: 0 auto 2mm;
          }
          .barcode {
            max-width: 45mm;
            height: auto;
            margin: 2mm auto;
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
        ${content}
      </body>
      </html>
    `);

    printWindow.document.close();

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
            코드 라벨 생성
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

        {/* 모드 선택 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => setMode("qr")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: mode === "qr" ? "2px solid #3b82f6" : "1px solid #d1d5db",
                background: mode === "qr" ? "#eff6ff" : "#ffffff",
                color: "#374151",
                fontSize: 13,
                fontWeight: mode === "qr" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              QR코드만
            </button>
            <button
              onClick={() => setMode("barcode")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: mode === "barcode" ? "2px solid #3b82f6" : "1px solid #d1d5db",
                background: mode === "barcode" ? "#eff6ff" : "#ffffff",
                color: "#374151",
                fontSize: 13,
                fontWeight: mode === "barcode" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              바코드만
            </button>
            <button
              onClick={() => setMode("both")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: mode === "both" ? "2px solid #3b82f6" : "1px solid #d1d5db",
                background: mode === "both" ? "#eff6ff" : "#ffffff",
                color: "#374151",
                fontSize: 13,
                fontWeight: mode === "both" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              둘 다
            </button>
          </div>
        </div>

        {/* 코드 표시 */}
        <div style={{ textAlign: "center", marginBottom: 24, minHeight: 120 }}>
          {(mode === "qr" || mode === "both") && (
            <div style={{ marginBottom: 16 }}>
              <canvas
                ref={qrCanvasRef}
                style={{ display: qrGenerated ? "block" : "none", margin: "0 auto" }}
              />
              {!qrGenerated && (
                <div style={{ color: "#6b7280", padding: "60px 0" }}>QR코드 생성 중...</div>
              )}
            </div>
          )}
          {(mode === "barcode" || mode === "both") && (
            <div style={{ marginBottom: 16 }}>
              <canvas
                ref={barcodeCanvasRef}
                style={{ display: barcodeGenerated ? "block" : "none", margin: "0 auto" }}
              />
              {!barcodeGenerated && mode === "barcode" && (
                <div style={{ color: "#6b7280", padding: "60px 0" }}>바코드 생성 중...</div>
              )}
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
          <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
            바코드: {item.barcode || `ITEM-${item.id}`}
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleDownload}
            disabled={
              (mode === "qr" && !qrGenerated) ||
              (mode === "barcode" && !barcodeGenerated) ||
              (mode === "both" && (!qrGenerated || !barcodeGenerated))
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                (mode === "qr" && qrGenerated) ||
                (mode === "barcode" && barcodeGenerated) ||
                (mode === "both" && qrGenerated && barcodeGenerated)
                  ? "pointer"
                  : "not-allowed",
              opacity:
                (mode === "qr" && qrGenerated) ||
                (mode === "barcode" && barcodeGenerated) ||
                (mode === "both" && qrGenerated && barcodeGenerated)
                  ? 1
                  : 0.5,
            }}
          >
            다운로드
          </button>
          <button
            onClick={handlePrint}
            disabled={
              (mode === "qr" && !qrGenerated) ||
              (mode === "barcode" && !barcodeGenerated) ||
              (mode === "both" && (!qrGenerated || !barcodeGenerated))
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                (mode === "qr" && qrGenerated) ||
                (mode === "barcode" && barcodeGenerated) ||
                (mode === "both" && qrGenerated && barcodeGenerated)
                  ? "pointer"
                  : "not-allowed",
              opacity:
                (mode === "qr" && qrGenerated) ||
                (mode === "barcode" && barcodeGenerated) ||
                (mode === "both" && qrGenerated && barcodeGenerated)
                  ? 1
                  : 0.5,
            }}
          >
            라벨 인쇄
          </button>
        </div>

        {/* 안내 */}
        <div style={{ marginTop: 16, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          {mode === "both"
            ? "QR코드와 바코드를 함께 출력하거나 이미지로 저장할 수 있습니다"
            : mode === "barcode"
            ? "바코드를 라벨 프린터로 출력하거나 이미지로 저장할 수 있습니다"
            : "QR코드를 라벨 프린터로 출력하거나 이미지로 저장할 수 있습니다"}
        </div>
      </div>
    </div>
  );
}
