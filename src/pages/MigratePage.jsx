import { useState } from "react";
import api from "../api/items";

// ✅ Vercel 413 피하려고 넉넉하게 낮게 잡기 (0.8MB)
const MAX_BYTES = 800_000;

// 바이트 기준 청크
function chunkByBytes(list, wrapKey, maxBytes = MAX_BYTES) {
  const enc = new TextEncoder();
  const chunks = [];
  let cur = [];

  for (const obj of list) {
    const testPayload = { [wrapKey]: [...cur, obj] };
    const bytes = enc.encode(JSON.stringify(testPayload)).length;

    if (bytes > maxBytes) {
      if (cur.length === 0) {
        throw new Error(
          `Single ${wrapKey} item too large (>${maxBytes} bytes). ` +
            `imageUrl/base64 같은 큰 필드가 있는지 확인하고 제거해야 해.`
        );
      }
      chunks.push(cur);
      cur = [obj];
    } else {
      cur.push(obj);
    }
  }

  if (cur.length) chunks.push(cur);
  return chunks;
}

function sanitizeItem(it, userId) {
  const imageUrl = it.imageUrl ?? it.image ?? null;

  const safeImageUrl =
    typeof imageUrl === "string" && imageUrl.startsWith("data:image/")
      ? null
      : imageUrl;

  return {
    userId,
    name: it.name ?? "",
    size: it.size ?? "",
    category: it.category ?? it.type ?? "FOOD",
    legacyId: String(it.legacyId ?? it.id ?? ""),
    imageUrl: safeImageUrl,
    createdAt: it.createdAt ?? it.created_at ?? null,
  };
}

function sanitizeRecord(r, userId) {
  return {
    userId,
    shoeId: r.shoeId ?? r.itemId ?? r.itemLegacyId ?? r.legacyItemId,
    itemLegacyId: r.itemLegacyId ?? r.shoeId ?? r.itemId ?? r.legacyItemId,
    price: r.price,
    count: r.count,
    date: r.date ?? r.createdAt ?? r.created_at,
    category: r.category ?? null,
  };
}

export default function MigratePage() {
  const [file, setFile] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  function pushLog(msg) {
    setLog((prev) => [...prev, msg]);
  }

  async function handleMigrate() {
    if (!file) return alert("파일 선택해줘");

    setLoading(true);
    setLog([]);

    try {
      // ✅ 여기만 고치면 됨: 실제 존재하는 엔드포인트 사용
      const meRes = await api.get("/auth/me");
      const userId = meRes?.data?.user?.id;

      if (!userId) {
        throw new Error(
          `현재 로그인 유저의 id를 못 가져왔어. /auth/me 응답: ${JSON.stringify(meRes?.data)}`
        );
      }

      pushLog(`👤 로그인 유저 id=${userId}`);

      const text = await file.text();
      const json = JSON.parse(text);

      const stores = json.stores || {};

      // 1️⃣ items 먼저
      const rawItems = [...(stores.shoes || []), ...(stores.foods || [])];
      const items = rawItems
        .map((it) => sanitizeItem(it, userId))
        .filter((x) => x.name && x.size && x.legacyId);

      pushLog(`📦 items ${items.length}개 업로드 시작 (MAX_BYTES=${MAX_BYTES})`);

      const itemChunks = chunkByBytes(items, "items", MAX_BYTES);
      for (let i = 0; i < itemChunks.length; i++) {
        await api.post("/migrate/items-batch", { items: itemChunks[i] });
        pushLog(`✅ items ${i + 1}/${itemChunks.length} 완료 (sent=${itemChunks[i].length})`);
      }

      // 2️⃣ records 나중
      const rawRecords = [...(stores.records || []), ...(stores.foodRecords || [])];
      const records = rawRecords.map((r) => sanitizeRecord(r, userId));

      pushLog(`📦 records ${records.length}개 업로드 시작 (MAX_BYTES=${MAX_BYTES})`);

      const recordChunks = chunkByBytes(records, "records", MAX_BYTES);
      for (let i = 0; i < recordChunks.length; i++) {
        await api.post("/migrate/records-batch", { records: recordChunks[i] });
        pushLog(`✅ records ${i + 1}/${recordChunks.length} 완료 (sent=${recordChunks[i].length})`);
      }

      pushLog("🎉 마이그레이션 완료");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "마이그레이션 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>📦 IndexedDB → 서버 마이그레이션</h2>

      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={handleMigrate}
        disabled={loading}
        style={{ marginTop: 16 }}
      >
        {loading ? "이동 중..." : "마이그레이션 시작"}
      </button>

      <pre style={{ marginTop: 20, fontSize: 12 }}>
        {log.join("\n")}
      </pre>
    </div>
  );
}