import { useEffect, useState } from "react";
import ItemPicker from "../components/ItemPicker";
import Toast from "../components/common/Toast";
import {
  getItemDetail,
  syncInventory,
  upsertChannelListing,
  upsertItemPolicy,
} from "../api/items";

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
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

  return (
    <div style={{ padding: 24 }}>
      <Toast message={toast} />

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: 16,
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          채널 재고 연동
        </h2>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
          중앙 재고 기준으로 판매 채널의 노출 수량을 자동 계산해 SET 방식으로 푸시합니다.
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>품목 선택</label>
          <div style={{ marginTop: 6 }}>
            <ItemPicker value={selectedItem} onSelect={setSelectedItem} />
          </div>
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

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>정책 설정</div>
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
                    <option value="KREAM">KREAM</option>
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
                style={buttonStyle}
              >
                {policyLoading ? "저장 중..." : "정책 저장"}
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>채널 리스팅</div>
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
                    <option value="KREAM">KREAM</option>
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
                style={{ ...buttonStyle, backgroundColor: "#0f766e" }}
              >
                {listingLoading ? "저장 중..." : "리스팅 저장"}
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>재고 동기화</div>
              <button
                onClick={handleSyncInventory}
                disabled={syncLoading}
                style={{ ...buttonStyle, backgroundColor: "#2563eb" }}
              >
                {syncLoading ? "동기화 중..." : "재고 동기화"}
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
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: 32,
  marginTop: 6,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 12,
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
