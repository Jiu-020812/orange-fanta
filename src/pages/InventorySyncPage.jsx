import { useEffect, useState } from "react";
import ItemPicker from "../components/ItemPicker";
import Toast from "../components/common/Toast";
import {
  getItemDetail,
  syncInventory,
  upsertChannelListing,
  upsertItemPolicy,
  getSyncLogs,
  getSyncStatus,
  triggerManualSync,
  uploadListingsCsv,
} from "../api/items";
import {
  listIntegrations,
  removeIntegration,
  upsertIntegration,
  naverConnect,
} from "../api/integrations";

export default function InventorySyncPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [toast, setToast] = useState("");

  const [policyMode, setPolicyMode] = useState("NORMAL");
  const [policyBuffer, setPolicyBuffer] = useState(1);
  const [policyMinVisible, setPolicyMinVisible] = useState(1);
  const [exclusiveProvider, setExclusiveProvider] = useState("NAVER");

  const [listingProvider, setListingProvider] = useState("NAVER");
  const [channelProductId, setChannelProductId] = useState("");
  const [channelOptionId, setChannelOptionId] = useState("");
  const [listingExternalSku, setListingExternalSku] = useState("");

  const [policyLoading, setPolicyLoading] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [connections, setConnections] = useState({});
  const [connectionForms, setConnectionForms] = useState({});
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionSaving, setConnectionSaving] = useState({});
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncStatus, setSyncStatus] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!selectedItem?.id) {
      setItemDetail(null);
      return;
    }

    (async () => {
      try {
        const detail = await getItemDetail(selectedItem.id);
        if (alive) setItemDetail(detail);
      } catch (err) {
        console.error("item detail load failed", err);
        if (alive) setItemDetail(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedItem]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setConnectionLoading(true);
        const data = await listIntegrations();
        if (!alive) return;
        const map = {};
        for (const conn of data?.connections || []) {
          map[conn.provider] = conn;
        }
        setConnections(map);
        setConnectionForms((prev) => {
          const next = { ...prev };
          for (const provider of Object.keys(PROVIDER_FIELDS)) {
            const existing = map[provider];
            next[provider] = existing?.credentials || {};
          }
          return next;
        });
      } catch (err) {
        console.error("integrations load failed", err);
      } finally {
        if (alive) setConnectionLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLogsLoading(true);
        const [logs, status] = await Promise.all([
          getSyncLogs({ limit: 20 }),
          getSyncStatus(),
        ]);
        if (!alive) return;
        setSyncLogs(logs || []);
        setSyncStatus(status || []);
      } catch (err) {
        console.error("sync logs/status load failed", err);
      } finally {
        if (alive) setLogsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleIntegrationChange = (provider, key, value) => {
    setConnectionForms((prev) => ({
      ...prev,
      [provider]: {
        ...(prev[provider] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveIntegration = async (provider) => {
    try {
      setConnectionSaving((prev) => ({ ...prev, [provider]: true }));
      const credentials = connectionForms[provider] || {};
      let result;
      if (provider === "NAVER") {
        // Naver는 유저가 직접 clientId/clientSecret 입력
        if (!credentials.clientId || !credentials.clientSecret) {
          window.alert("Client ID와 Client Secret을 입력해주세요.");
          return;
        }
        result = await naverConnect(credentials);
      } else {
        result = await upsertIntegration({ provider, credentials, isActive: true });
      }
      setConnections((prev) => ({
        ...prev,
        [provider]: result.connection || { provider, isActive: true },
      }));
      showToast(`${provider} 연결 완료`);
    } catch (err) {
      console.error("integration save failed", err);
      window.alert(err?.message || "연동 저장 실패");
    } finally {
      setConnectionSaving((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleRemoveIntegration = async (provider) => {
    if (!window.confirm(`${provider} 연결을 해제할까요?`)) return;
    try {
      setConnectionSaving((prev) => ({ ...prev, [provider]: true }));
      await removeIntegration(provider);
      setConnections((prev) => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
      showToast(`${provider} 연결 해제 완료`);
    } catch (err) {
      console.error("integration remove failed", err);
      window.alert(err?.message || "연동 해제 실패");
    } finally {
      setConnectionSaving((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSavePolicy = async () => {
    if (!selectedItem?.id) return;
    try {
      setPolicyLoading(true);
      await upsertItemPolicy(selectedItem.id, {
        mode: policyMode,
        buffer: policyMode === "NORMAL" ? Number(policyBuffer) : undefined,
        minVisible: policyMode === "NORMAL" ? Number(policyMinVisible) : undefined,
        exclusiveProvider: policyMode === "EXCLUSIVE" ? exclusiveProvider : null,
      });
      showToast("정책 저장 완료");
    } catch (err) {
      console.error("정책 저장 실패", err);
      window.alert(err?.message || "정책 저장 실패");
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleSaveListing = async () => {
    if (!selectedItem?.id) return;
    try {
      setListingLoading(true);
      await upsertChannelListing(selectedItem.id, {
        provider: listingProvider,
        channelProductId: channelProductId || null,
        channelOptionId: channelOptionId || null,
        externalSku: listingExternalSku || null,
        isActive: true,
      });
      showToast("채널 리스팅 저장 완료");
    } catch (err) {
      console.error("리스팅 저장 실패", err);
      window.alert(err?.message || "리스팅 저장 실패");
    } finally {
      setListingLoading(false);
    }
  };

  const handleSyncInventory = async () => {
    if (!selectedItem?.id) return;
    try {
      setSyncLoading(true);
      const result = await syncInventory(selectedItem.id);
      setSyncResult(result);
      showToast("재고 동기화 큐 등록 완료");
    } catch (err) {
      console.error("동기화 실패", err);
      window.alert(err?.message || "동기화 실패");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleManualSync = async (provider) => {
    try {
      await triggerManualSync({ provider });
      showToast(`${provider} 즉시 동기화 실행됨`);

      // 동기화 로그 새로고침
      const logs = await getSyncLogs({ limit: 20 });
      setSyncLogs(logs || []);
    } catch (err) {
      console.error("수동 동기화 실패", err);
      window.alert(err?.message || "수동 동기화 실패");
    }
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setCsvUploading(true);
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      // 첫 줄은 헤더이므로 스킵
      const mappings = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 2) continue;

        const [sku, itemName, coupangProductId, coupangOptionId, naverProductId, naverOptionId] = cols;

        if (coupangProductId) {
          mappings.push({
            sku,
            itemName,
            provider: "COUPANG",
            channelProductId: coupangProductId,
            channelOptionId: coupangOptionId || null,
          });
        }

        if (naverProductId) {
          mappings.push({
            sku,
            itemName,
            provider: "NAVER",
            channelProductId: naverProductId,
            channelOptionId: naverOptionId || null,
          });
        }
      }

      if (mappings.length === 0) {
        alert("유효한 데이터가 없습니다.");
        return;
      }

      await uploadListingsCsv(mappings);
      showToast(`${mappings.length}건의 매핑이 등록되었습니다!`);

      // 파일 input 초기화
      event.target.value = "";
    } catch (err) {
      console.error("CSV 업로드 실패", err);
      window.alert(err?.message || "CSV 업로드 실패");
    } finally {
      setCsvUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const sample = `SKU,상품명,쿠팡상품ID,쿠팡옵션ID,네이버상품ID,네이버옵션ID
SHRIMP-001,새우깡,12345678,987654,87654321,456789
POTATO-001,감자깡,23456789,876543,98765432,567890
ONION-001,양파링,34567890,765432,19876543,678901`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "채널매핑_샘플.csv";
    link.click();
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #b8c5f2 0%, #c5b3d9 50%, #e8d4f0 100%)",
        padding: "40px 20px",
      }}
    >
      <Toast message={toast} />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 2px 8px rgba(123, 97, 255, 0.08)",
          border: "1px solid rgba(184, 197, 242, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#7c8db5",
            }}
          >
            🔗 채널 재고 연동
          </h2>
          <div
            title="자세한 설명 보기"
            style={{
              cursor: "pointer",
              fontSize: 20,
              color: "#7c8db5",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "2px solid #7c8db5",
              fontWeight: 700,
            }}
            onClick={() => {
              const helpText = `
📌 채널 재고 연동이란?

여러 판매 채널(네이버, 쿠팡, 11번가 등)에 동일한 상품을 올려놓았을 때,
한 채널에서 판매가 발생하면 자동으로 다른 채널의 재고도 함께 차감되는 기능입니다.

✅ 사용 방법:
1. [채널 계정 연결] - 각 판매 채널의 API 키를 입력하고 연결하세요
2. [CSV 일괄 등록] - 엑셀로 여러 상품의 매핑을 한 번에 등록하세요
3. [품목 선택] - 개별 상품의 정책과 리스팅을 설정하세요
4. [재고 동기화] - 수동으로 재고를 동기화할 수 있습니다

💡 예시:
- 새우깡을 쿠팡, 네이버, 11번가에 각각 10개씩 올려놓음
- 쿠팡에서 1개 판매 발생
- 자동으로 네이버와 11번가의 재고도 9개로 변경됨

⚠️ 주의사항:
- 각 채널의 API 키는 해당 채널의 판매자 센터에서 발급받아야 합니다
- CSV 업로드 시 샘플 파일 형식을 참고하세요
- 정책 설정에서 버퍼(안전 재고)를 설정할 수 있습니다
              `;
              alert(helpText.trim());
            }}
          >
            ?
          </div>
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>
          중앙 재고 기준으로 판매 채널의 노출 수량을 자동 계산해 SET 방식으로 푸시합니다.
        </div>

        <div
          style={{
            marginBottom: 32,
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>📱 채널 계정 연결</div>
          {connectionLoading ? (
            <div style={{ fontSize: 12, color: "#64748b" }}>불러오는 중...</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.keys(PROVIDER_FIELDS).map((provider) => {
                const fields = PROVIDER_FIELDS[provider];
                const saved = connections[provider];
                const saving = Boolean(connectionSaving[provider]);
                const values = connectionForms[provider] || {};

                const providerIcons = {
                  NAVER: "🟢",
                  COUPANG: "🔵",
                  ELEVENST: "🔴",
                  ETC: "⚪",
                };

                return (
                  <div
                    key={provider}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: saved ? "2px solid #9dadd6" : "1px solid #e2e8f0",
                      backgroundColor: saved ? "#f8f9fe" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{providerIcons[provider]}</span>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{provider}</div>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: saved ? "#10b981" : "#9ca3af",
                        }}
                      >
                        {saved ? "✓ 연결됨" : "미연결"}
                      </span>
                    </div>

                    {provider === "NAVER" ? (
                      <div style={{ marginTop: 4 }}>
                        {saved ? (
                          <>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => handleManualSync(provider)}
                                style={{ ...smallButtonStyle, backgroundColor: "#10b981", flex: 1 }}
                              >
                                즉시 동기화
                              </button>
                              <button
                                onClick={() => handleRemoveIntegration(provider)}
                                disabled={saving}
                                style={{ ...smallButtonStyle, backgroundColor: "transparent", border: "1px solid #ef4444", color: "#ef4444" }}
                              >
                                해제
                              </button>
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                              자동 동기화 중 · 5분간격
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                              {fields.map((field) => (
                                <label key={field.key} style={{ fontSize: 11 }}>
                                  {field.label}
                                  <input
                                    value={values[field.key] || ""}
                                    onChange={(e) =>
                                      handleIntegrationChange(provider, field.key, e.target.value)
                                    }
                                    placeholder={field.placeholder}
                                    style={smallInputStyle}
                                  />
                                </label>
                              ))}
                            </div>
                            <button
                              onClick={() => handleSaveIntegration(provider)}
                              disabled={saving}
                              style={{ ...smallButtonStyle, backgroundColor: "#03C75A", width: "100%" }}
                            >
                              {saving ? "연결 중..." : "Naver 연결하기"}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {fields.map((field) => (
                            <label key={field.key} style={{ fontSize: 11 }}>
                              {field.label}
                              <input
                                value={values[field.key] || ""}
                                onChange={(e) =>
                                  handleIntegrationChange(provider, field.key, e.target.value)
                                }
                                placeholder={field.placeholder}
                                style={smallInputStyle}
                              />
                            </label>
                          ))}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            onClick={() => handleSaveIntegration(provider)}
                            disabled={saving}
                            style={{
                              ...smallButtonStyle,
                              backgroundColor: "#9dadd6",
                              flex: 1,
                            }}
                          >
                            {saving ? "저장 중..." : saved ? "재저장" : "연결하기"}
                          </button>
                          {saved ? (
                            <>
                              <button
                                onClick={() => handleManualSync(provider)}
                                style={{
                                  ...smallButtonStyle,
                                  backgroundColor: "#10b981",
                                }}
                              >
                                동기화
                              </button>
                              <button
                                onClick={() => handleRemoveIntegration(provider)}
                                disabled={saving}
                                style={{
                                  ...smallButtonStyle,
                                  backgroundColor: "transparent",
                                  border: "1px solid #ef4444",
                                  color: "#ef4444",
                                }}
                              >
                                해제
                              </button>
                            </>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CSV 일괄 업로드 */}
        <div
          style={{
            marginBottom: 32,
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            backgroundColor: "#f0fdf4",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>📊 CSV 일괄 등록</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            엑셀(CSV) 파일로 한 번에 여러 상품의 채널 매핑을 등록할 수 있습니다.
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: "2px dashed #9dadd6",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: csvUploading ? "#9ca3af" : "#7c8db5",
              }}
            >
              {csvUploading ? "업로드 중..." : "📁 CSV 파일 선택"}
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={csvUploading}
                style={{ display: "none" }}
              />
            </label>

            <button
              onClick={downloadSampleCsv}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #9dadd6",
                backgroundColor: "#ffffff",
                color: "#7c8db5",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📥 샘플 다운로드
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#ffffff",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>CSV 파일 형식:</div>
            <div>SKU, 상품명, 쿠팡상품ID, 쿠팡옵션ID, 네이버상품ID, 네이버옵션ID</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
              * 옵션ID는 선택사항입니다. 비워두셔도 됩니다.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            marginBottom: 24,
          }}
        >
          <label style={{ fontSize: 14, fontWeight: 700, display: "block", marginBottom: 12 }}>
            📦 품목 선택 (개별 등록)
          </label>
          <ItemPicker value={selectedItem} onSelect={setSelectedItem} />
        </div>

        {selectedItem?.id ? (
          <>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
                fontSize: 12,
              }}
            >
              <div>
                <b>SKU</b>: {itemDetail?.item?.sku || selectedItem.sku || "자동 생성 예정"}
              </div>
              <div style={{ marginTop: 4 }}>
                <b>현재 재고</b>: {itemDetail?.stock ?? "-"}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>⚙️ 정책 설정</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 12 }}>
                  모드
                  <select
                    value={policyMode}
                    onChange={(e) => setPolicyMode(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="EXCLUSIVE">EXCLUSIVE</option>
                  </select>
                </label>

                <label style={{ fontSize: 12 }}>
                  단일 채널
                  <select
                    value={exclusiveProvider}
                    onChange={(e) => setExclusiveProvider(e.target.value)}
                    disabled={policyMode !== "EXCLUSIVE"}
                    style={{
                      ...inputStyle,
                      backgroundColor: policyMode === "EXCLUSIVE" ? "white" : "#f1f5f9",
                    }}
                  >
                    <option value="NAVER">NAVER</option>
                    <option value="COUPANG">COUPANG</option>
                    <option value="ELEVENST">ELEVENST</option>
                    <option value="ETC">ETC</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <label style={{ fontSize: 12 }}>
                  버퍼
                  <input
                    type="number"
                    value={policyBuffer}
                    onChange={(e) => setPolicyBuffer(e.target.value)}
                    disabled={policyMode !== "NORMAL"}
                    style={{
                      ...inputStyle,
                      backgroundColor: policyMode === "NORMAL" ? "white" : "#f1f5f9",
                    }}
                  />
                </label>
                <label style={{ fontSize: 12 }}>
                  최소 노출
                  <input
                    type="number"
                    value={policyMinVisible}
                    onChange={(e) => setPolicyMinVisible(e.target.value)}
                    disabled={policyMode !== "NORMAL"}
                    style={{
                      ...inputStyle,
                      backgroundColor: policyMode === "NORMAL" ? "white" : "#f1f5f9",
                    }}
                  />
                </label>
              </div>

              <button
                onClick={handleSavePolicy}
                disabled={policyLoading}
                style={{ ...buttonStyle, backgroundColor: "#9dadd6" }}
              >
                {policyLoading ? "저장 중..." : "정책 저장"}
              </button>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📋 채널 리스팅</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 12 }}>
                  Provider
                  <select
                    value={listingProvider}
                    onChange={(e) => setListingProvider(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="NAVER">NAVER</option>
                    <option value="COUPANG">COUPANG</option>
                    <option value="ELEVENST">ELEVENST</option>
                    <option value="ETC">ETC</option>
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>
                  외부 SKU
                  <input
                    value={listingExternalSku}
                    onChange={(e) => setListingExternalSku(e.target.value)}
                    style={inputStyle}
                    placeholder="옵션 SKU"
                  />
                </label>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <label style={{ fontSize: 12 }}>
                  상품 ID
                  <input
                    value={channelProductId}
                    onChange={(e) => setChannelProductId(e.target.value)}
                    style={inputStyle}
                    placeholder="채널 상품 ID"
                  />
                </label>
                <label style={{ fontSize: 12 }}>
                  옵션 ID
                  <input
                    value={channelOptionId}
                    onChange={(e) => setChannelOptionId(e.target.value)}
                    style={inputStyle}
                    placeholder="채널 옵션 ID"
                  />
                </label>
              </div>
              <button
                onClick={handleSaveListing}
                disabled={listingLoading}
                style={{ ...buttonStyle, backgroundColor: "#9dadd6" }}
              >
                {listingLoading ? "저장 중..." : "리스팅 저장"}
              </button>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>🔄 재고 동기화</div>
              <button
                onClick={handleSyncInventory}
                disabled={syncLoading}
                style={{ ...buttonStyle, backgroundColor: "#9dadd6" }}
              >
                {syncLoading ? "동기화 중..." : "지금 동기화"}
              </button>
              {syncResult?.targets?.length ? (
                <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                  {syncResult.targets.map((t) => (
                    <div key={`${t.provider}-${t.listingId}`}>
                      {t.provider} → {t.targetQty}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {/* 동기화 로그 */}
        <div
          style={{
            marginTop: 32,
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>📊 최근 동기화 내역</div>
            <button
              onClick={async () => {
                try {
                  setLogsLoading(true);
                  const logs = await getSyncLogs({ limit: 20 });
                  setSyncLogs(logs || []);
                  showToast("동기화 내역 새로고침 완료");
                } catch (err) {
                  console.error("로그 새로고침 실패", err);
                } finally {
                  setLogsLoading(false);
                }
              }}
              disabled={logsLoading}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                fontSize: 12,
                cursor: logsLoading ? "not-allowed" : "pointer",
              }}
            >
              {logsLoading ? "새로고침 중..." : "🔄 새로고침"}
            </button>
          </div>

          {syncLogs.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: 14 }}>
              아직 동기화 내역이 없습니다.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {syncLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #f3f4f6",
                    backgroundColor: "#fafafa",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>
                        {log.provider || "UNKNOWN"}
                      </span>
                      {log.itemName && (
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          · {log.itemName}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {log.message || log.description || "동기화 완료"}
                      {log.orderId && ` (주문번호: ${log.orderId})`}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        backgroundColor: log.status === "SUCCESS" ? "#d1fae5" : "#fee2e2",
                        color: log.status === "SUCCESS" ? "#065f46" : "#991b1b",
                      }}
                    >
                      {log.status || "SUCCESS"}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString("ko-KR")
                        : new Date().toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 채널별 동기화 상태 */}
        {syncStatus.length > 0 && (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              backgroundColor: "#f8fafc",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📈 채널별 동기화 상태</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {syncStatus.map((ch) => (
                <div
                  key={ch.provider}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {ch.provider}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    마지막 동기화:{" "}
                    {ch.lastSyncAt
                      ? new Date(ch.lastSyncAt).toLocaleString("ko-KR")
                      : "없음"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    처리 건수: {ch.totalProcessed || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  height: 32,
  marginTop: 6,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxSizing: "border-box",
};

const buttonStyle = {
  marginTop: 10,
  padding: "6px 12px",
  borderRadius: 8,
  backgroundColor: "#111827",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: 12,
};

const smallInputStyle = {
  width: "100%",
  maxWidth: "100%",
  height: 28,
  marginTop: 6,
  padding: "0 8px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 11,
  boxSizing: "border-box",
};

const smallButtonStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  backgroundColor: "#111827",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: 11,
};

const PROVIDER_FIELDS = {
  NAVER: [
    { key: "clientId", label: "App ID", placeholder: "애플리케이션 ID" },
    { key: "clientSecret", label: "App Secret", placeholder: "애플리케이션 시크릿 키" },
  ],
  COUPANG: [
    { key: "accessKey", label: "Access Key", placeholder: "쿠팡 Access Key" },
    { key: "secretKey", label: "Secret Key", placeholder: "쿠팡 Secret" },
    { key: "vendorId", label: "Vendor ID", placeholder: "판매자 ID" },
  ],
  ELEVENST: [
    { key: "openApiKey", label: "Open API Key", placeholder: "11번가 API Key" },
    { key: "sellerId", label: "Seller ID", placeholder: "판매자 ID" },
  ],
  ETC: [
    { key: "apiKey", label: "API Key", placeholder: "채널 API Key" },
    { key: "apiSecret", label: "API Secret", placeholder: "채널 Secret" },
  ],
};
