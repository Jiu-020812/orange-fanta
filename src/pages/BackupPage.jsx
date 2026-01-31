import { useState, useRef } from "react";
import { exportData, importData } from "../api/backup";
import * as XLSX from "xlsx";
import { getCategories, createCategory } from "../api/categories";
import { createItem } from "../api/items";

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMode, setImportMode] = useState("merge");

  // Excel import states
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({});
  const [importingExcel, setImportingExcel] = useState(false);
  const [showExcelTooltip, setShowExcelTooltip] = useState(false);
  const excelInputRef = useRef(null);

  async function handleExport() {
    try {
      setExporting(true);
      const backup = await exportData();

      // JSON 파일로 다운로드
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("백업 파일이 다운로드되었습니다.");
    } catch (err) {
      console.error("백업 실패:", err);
      alert(err.message || "백업에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        importMode === "replace"
          ? "기존 데이터를 모두 삭제하고 백업 데이터로 교체합니다. 계속하시겠습니까?"
          : "백업 데이터를 기존 데이터와 병합합니다. 계속하시겠습니까?"
      )
    ) {
      event.target.value = "";
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const backup = JSON.parse(text);

      await importData(backup, importMode);
      alert("데이터 복원이 완료되었습니다. 페이지를 새로고침합니다.");
      window.location.reload();
    } catch (err) {
      console.error("복원 실패:", err);
      alert(err.message || "데이터 복원에 실패했습니다.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  // Excel 파일 업로드 처리
  async function handleExcelUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        alert("엑셀 파일에 데이터가 없습니다.");
        return;
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell));

      setExcelHeaders(headers);
      setExcelData(rows);
      setExcelFile(file);
      setShowMapping(true);

      // 자동 매핑 시도 (열 이름이 일치하는 경우)
      const autoMapping = {};
      const fieldNames = {
        품목명: "name",
        이름: "name",
        name: "name",
        사이즈: "size",
        규격: "size",
        size: "size",
        카테고리: "category",
        분류: "category",
        category: "category",
        수량: "quantity",
        재고: "quantity",
        quantity: "quantity",
        바코드: "barcode",
        bar코드: "barcode",
        barcode: "barcode",
        SKU: "sku",
        sku: "sku",
        메모: "memo",
        비고: "memo",
        memo: "memo",
      };

      headers.forEach((header, index) => {
        const normalized = header?.toString().trim();
        if (fieldNames[normalized]) {
          autoMapping[index] = fieldNames[normalized];
        }
      });

      setColumnMapping(autoMapping);
    } catch (err) {
      console.error("엑셀 파일 읽기 실패:", err);
      alert("엑셀 파일을 읽을 수 없습니다. 올바른 파일인지 확인해주세요.");
    } finally {
      event.target.value = "";
    }
  }

  // 컬럼 매핑 변경
  function handleMappingChange(columnIndex, field) {
    setColumnMapping((prev) => ({
      ...prev,
      [columnIndex]: field,
    }));
  }

  // Excel 데이터 가져오기
  async function handleImportExcel() {
    if (!excelData.length) {
      alert("가져올 데이터가 없습니다.");
      return;
    }

    // 필수 필드 확인
    const hasName = Object.values(columnMapping).includes("name");
    if (!hasName) {
      alert("품목명은 필수 항목입니다. 컬럼 매핑에서 품목명을 지정해주세요.");
      return;
    }

    if (
      !confirm(
        `${excelData.length}개의 품목을 가져옵니다. 계속하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      setImportingExcel(true);

      // 기존 카테고리 가져오기
      const existingCategories = await getCategories();
      const categoryMap = {};
      existingCategories.forEach((cat) => {
        categoryMap[cat.name] = cat.id;
      });

      let successCount = 0;
      let errorCount = 0;

      for (const row of excelData) {
        try {
          const itemData = {};

          // 컬럼 매핑에 따라 데이터 변환
          Object.entries(columnMapping).forEach(([colIndex, field]) => {
            const value = row[parseInt(colIndex)];
            if (value !== undefined && value !== null && value !== "") {
              itemData[field] = value.toString().trim();
            }
          });

          // 필수 필드 확인
          if (!itemData.name) {
            errorCount++;
            continue;
          }

          // 카테고리 처리
          let categoryId = null;
          if (itemData.category) {
            if (!categoryMap[itemData.category]) {
              // 새 카테고리 생성
              const newCategory = await createCategory({
                name: itemData.category,
              });
              categoryMap[itemData.category] = newCategory.id;
            }
            categoryId = categoryMap[itemData.category];
          }

          // 품목 생성
          await createItem({
            name: itemData.name,
            size: itemData.size || "",
            categoryId: categoryId,
            barcode: itemData.barcode || "",
            sku: itemData.sku || "",
            memo: itemData.memo || "",
            imageUrl: "",
          });

          successCount++;
        } catch (err) {
          console.error("품목 생성 실패:", err);
          errorCount++;
        }
      }

      alert(
        `가져오기 완료!\n성공: ${successCount}개\n실패: ${errorCount}개\n\n페이지를 새로고침합니다.`
      );
      window.location.reload();
    } catch (err) {
      console.error("Excel 가져오기 실패:", err);
      alert(err.message || "데이터 가져오기에 실패했습니다.");
    } finally {
      setImportingExcel(false);
    }
  }

  // 매핑 취소
  function handleCancelMapping() {
    setShowMapping(false);
    setExcelFile(null);
    setExcelData([]);
    setExcelHeaders([]);
    setColumnMapping({});
    if (excelInputRef.current) {
      excelInputRef.current.value = "";
    }
  }

  return (
    <div style={{ padding: "16px", maxWidth: 800, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          데이터 백업/복원
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          모든 데이터를 백업하거나 이전 백업을 복원할 수 있습니다.
        </p>
      </div>

      {/* 백업 섹션 */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          데이터 백업
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
          카테고리, 품목, 입출고 기록, 창고, 재고 이동, 재고 실사 등 모든 데이터를
          JSON 파일로 내보냅니다.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: "12px 24px",
            backgroundColor: exporting ? "#9ca3af" : "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: exporting ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {exporting ? "백업 중..." : "📥 백업 파일 다운로드"}
        </button>
      </div>

      {/* 복원 섹션 */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          데이터 복원
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
          이전에 백업한 JSON 파일을 업로드하여 데이터를 복원합니다.
        </p>

        {/* 복원 모드 선택 */}
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            backgroundColor: "#f9fafb",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            복원 모드 선택
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === "merge"}
                onChange={(e) => setImportMode(e.target.value)}
                style={{ cursor: "pointer" }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  병합 (Merge)
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  기존 데이터를 유지하고 백업 데이터를 추가합니다
                </div>
              </div>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === "replace"}
                onChange={(e) => setImportMode(e.target.value)}
                style={{ cursor: "pointer" }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#dc2626" }}>
                  교체 (Replace)
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  기존 데이터를 모두 삭제하고 백업 데이터로 교체합니다 (주의!)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 파일 업로드 */}
        <div>
          <label
            htmlFor="import-file"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: importing ? "#9ca3af" : "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: importing ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {importing ? "복원 중..." : "📤 백업 파일 선택"}
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            style={{ display: "none" }}
          />
        </div>

        {/* 경고 메시지 */}
        {importMode === "replace" && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              ⚠️ 경고
            </div>
            <div style={{ fontSize: 13, color: "#991b1b", marginTop: 4 }}>
              교체 모드는 기존의 모든 데이터를 삭제합니다. 신중하게 선택하세요.
            </div>
          </div>
        )}
      </div>

      {/* Excel 가져오기 섹션 */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          marginTop: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Excel 파일로 품목 가져오기
          </h2>
          {/* 사용법 툴팁 */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onMouseEnter={() => setShowExcelTooltip(true)}
              onMouseLeave={() => setShowExcelTooltip(false)}
              onClick={() => setShowExcelTooltip(!showExcelTooltip)}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ?
            </button>
            {showExcelTooltip && (
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  left: 0,
                  backgroundColor: "#1f2937",
                  color: "#fff",
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                  width: 400,
                  maxWidth: "90vw",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
                  📋 Excel 가져오기 사용 방법
                </strong>

                <div style={{ marginBottom: 12 }}>
                  <strong>1단계: 기존 시스템에서 데이터 내보내기</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • 현재 사용 중인 재고관리 프로그램에서 품목 데이터를 Excel(.xlsx, .xls) 파일로 내보냅니다
                    <br />
                    • 대부분의 프로그램은 "내보내기", "Export", "다운로드" 등의 메뉴를 제공합니다
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <strong>2단계: Excel 파일 구조 확인</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • 첫 번째 행에 열 이름(헤더)이 있어야 합니다
                    <br />
                    • 품목명은 필수이고, 나머지는 선택사항입니다
                    <br />
                    • 예시: 품목명, 사이즈, 카테고리, 수량, 바코드, SKU, 메모
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <strong>3단계: 파일 업로드</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • 아래 "Excel 파일 선택" 버튼을 클릭하여 준비한 파일을 업로드합니다
                    <br />
                    • 시스템이 자동으로 파일을 분석합니다
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <strong>4단계: 컬럼 매핑</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • Excel의 각 열이 우리 시스템의 어떤 필드에 해당하는지 지정합니다
                    <br />
                    • 일반적인 열 이름(품목명, 사이즈 등)은 자동으로 매핑됩니다
                    <br />
                    • 매핑이 잘못된 경우 드롭다운에서 수정할 수 있습니다
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <strong>5단계: 데이터 가져오기</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • 매핑이 완료되면 "가져오기" 버튼을 클릭합니다
                    <br />
                    • 존재하지 않는 카테고리는 자동으로 생성됩니다
                    <br />
                    • 가져오기가 완료되면 결과를 확인할 수 있습니다
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #4b5563",
                  }}
                >
                  <strong style={{ color: "#fbbf24" }}>⚠️ 주의사항</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • 가져오기 전에 반드시 백업을 받으세요
                    <br />
                    • 중복된 품목이 있으면 추가로 생성됩니다
                    <br />
                    • 품목명이 없는 행은 자동으로 건너뜁니다
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #4b5563",
                  }}
                >
                  <strong style={{ color: "#34d399" }}>💡 팁</strong>
                  <div style={{ marginLeft: 12, marginTop: 4, color: "#d1d5db" }}>
                    • 소량의 데이터로 먼저 테스트해보세요
                    <br />
                    • Excel에서 불필요한 열은 삭제하고 업로드하면 매핑이 쉽습니다
                    <br />
                    • 한글, 영문 열 이름 모두 지원합니다
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
          다른 재고관리 시스템에서 추출한 Excel 파일을 업로드하여 품목을 한 번에 가져올 수 있습니다.
        </p>

        {!showMapping ? (
          <div>
            <label
              htmlFor="excel-file"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📊 Excel 파일 선택
            </label>
            <input
              id="excel-file"
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              style={{ display: "none" }}
            />
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 12 }}>
              지원 형식: .xlsx, .xls
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                padding: 16,
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                📁 파일: {excelFile?.name}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                총 {excelData.length}개의 품목이 발견되었습니다. 각 Excel 열이 어떤
                필드에 해당하는지 확인하고 수정해주세요.
              </div>

              {/* 컬럼 매핑 테이블 */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#e5e7eb" }}>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        Excel 열 이름
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        매핑할 필드
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        미리보기
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelHeaders.map((header, index) => (
                      <tr key={index}>
                        <td
                          style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #e5e7eb",
                            fontWeight: 500,
                          }}
                        >
                          {header || `열 ${index + 1}`}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <select
                            value={columnMapping[index] || ""}
                            onChange={(e) =>
                              handleMappingChange(index, e.target.value)
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              fontSize: 13,
                              width: "100%",
                              maxWidth: 200,
                            }}
                          >
                            <option value="">매핑 안함</option>
                            <option value="name">품목명 (필수)</option>
                            <option value="size">사이즈/규격</option>
                            <option value="category">카테고리</option>
                            <option value="barcode">바코드</option>
                            <option value="sku">SKU</option>
                            <option value="memo">메모</option>
                          </select>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #e5e7eb",
                            color: "#6b7280",
                            fontSize: 12,
                          }}
                        >
                          {excelData[0]?.[index] || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 필수 필드 안내 */}
              {!Object.values(columnMapping).includes("name") && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                    ⚠️ 품목명 필드를 매핑해주세요
                  </div>
                  <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>
                    품목명은 필수 항목입니다. 최소 하나의 열을 "품목명"으로 매핑해야
                    합니다.
                  </div>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleCancelMapping}
                disabled={importingExcel}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 8,
                  cursor: importingExcel ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                취소
              </button>
              <button
                onClick={handleImportExcel}
                disabled={
                  importingExcel ||
                  !Object.values(columnMapping).includes("name")
                }
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor:
                    importingExcel ||
                    !Object.values(columnMapping).includes("name")
                      ? "#9ca3af"
                      : "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor:
                    importingExcel ||
                    !Object.values(columnMapping).includes("name")
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {importingExcel ? "가져오는 중..." : "가져오기"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 안내 사항 */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          💡 백업 팁
        </h3>
        <ul
          style={{
            fontSize: 13,
            color: "#1e40af",
            margin: 0,
            paddingLeft: 20,
            lineHeight: 1.8,
          }}
        >
          <li>정기적으로 백업 파일을 생성하여 안전한 곳에 보관하세요</li>
          <li>중요한 작업 전에는 항상 백업을 먼저 받으세요</li>
          <li>백업 파일은 JSON 형식으로 저장되어 다른 도구에서도 활용 가능합니다</li>
          <li>
            복원 시 병합 모드를 사용하면 기존 데이터가 보존됩니다
          </li>
          <li>Excel 가져오기는 소량의 데이터로 먼저 테스트해보세요</li>
        </ul>
      </div>
    </div>
  );
}
