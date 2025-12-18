import { useState } from "react";
import api from "../api/items";

// Vercel 413 피하려고 넉넉하게 낮게 잡기 (0.8MB)
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

  const category = it.category ?? it.type ?? "FOOD";

  //  FOOD는 size가 없는 경우가 많아서 기본값 넣어줌
  const rawSize = it.size ?? it.option ?? it.unit ?? it.variant ?? "";
  const size =
    String(rawSize || "").trim() ||
    (String(category).toUpperCase().includes("FOOD") ? "-" : "");

  return {
    userId,
    name: it.name ?? it.title ?? "",
    size, 
    category,
    legacyId: String(it.legacyId ?? it.id ?? ""),
    imageUrl: safeImageUrl,
    createdAt: it.createdAt ?? it.created_at ?? null,
  };
}

function sanitizeRecord(r, userId) {
  return {
    userId,
    // recordsBatchHandler가 shoeId 또는 itemLegacyId를 legacy로 쓰고 있음
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

  async function getUserId() {
    const meRes = await api.get("/auth/me");
    const userId = meRes?.data?.user?.id;
    if (!userId) {
      throw new Error(
        `현재 로그인 유저의 id를 못 가져왔어. /auth/me 응답: ${JSON.stringify(meRes?.data)}`
      );
    }
    return userId;
  }

  async function readStores() {
    if (!file) throw new Error("파일 선택해줘");
    const text = await file.text();
    const json = JSON.parse(text);
    return json.stores || {};
  }

  async function uploadItems(items, userId, label) {
    const sanitized = items
      .map((it) => sanitizeItem(it, userId))
      // name / legacyId만 필수, size는 FOOD에선 "-"로 채워짐
      .filter((x) => x.name && x.legacyId && x.size);

    pushLog(`📦 ${label} items raw=${items.length} → sanitized=${sanitized.length}`);

    const chunks = chunkByBytes(sanitized, "items", MAX_BYTES);
    for (let i = 0; i < chunks.length; i++) {
      await api.post("/migrate/items-batch", { items: chunks[i] });
      pushLog(` ${label} items ${i + 1}/${chunks.length} 완료 (sent=${chunks[i].length})`);
    }
  }

  async function uploadRecords(records, userId, label) {
    const sanitized = records.map((r) => sanitizeRecord(r, userId));
    pushLog(`📦 ${label} records raw=${records.length} → sanitized=${sanitized.length}`);

    const chunks = chunkByBytes(sanitized, "records", MAX_BYTES);
    for (let i = 0; i < chunks.length; i++) {
      await api.post("/migrate/records-batch", { records: chunks[i] });
      pushLog(` ${label} records ${i + 1}/${chunks.length} 완료 (sent=${chunks[i].length})`);
    }
  }

  async function run(type) {
    if (!file) return alert("파일 선택해줘");

    setLoading(true);
    setLog([]);

    try {
      const userId = await getUserId();
      pushLog(`👤 로그인 유저 id=${userId}`);

      const stores = await readStores();

      // 🔎 진단 로그 (원인 파악용)
      pushLog(
        `🧩 stores: shoes=${(stores.shoes || []).length}, foods=${(stores.foods || []).length}, records=${(stores.records || []).length}, foodRecords=${(stores.foodRecords || []).length}`
      );

      if (type === "FOOD_ITEMS") {
        await uploadItems(stores.foods || [], userId, "FOOD");
        pushLog("🎉 FOOD items 완료");
        return;
      }

      if (type === "SHOE_ITEMS") {
        await uploadItems(stores.shoes || [], userId, "SHOE");
        pushLog("🎉 SHOE items 완료");
        return;
      }

      if (type === "ALL_RECORDS") {
        // records 전체(신발+식품 기록) — 필요하면 foodRecords만 따로 버튼도 만들 수 있음
        const all = [...(stores.records || []), ...(stores.foodRecords || [])];
        await uploadRecords(all, userId, "ALL");
        pushLog("🎉 records 완료");
        return;
      }

      // 기본: 전체(아이템+레코드) — 지금은 실수 방지로 권장 X
      const allItems = [...(stores.shoes || []), ...(stores.foods || [])];
      await uploadItems(allItems, userId, "ALL");
      const allRecords = [...(stores.records || []), ...(stores.foodRecords || [])];
      await uploadRecords(allRecords, userId, "ALL");
      pushLog("🎉 전체 마이그레이션 완료");
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

      <input type="file" accept=".json" onChange={(e) => setFile(e.target.files[0])} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <button onClick={() => run("FOOD_ITEMS")} disabled={loading}>
          {loading ? "이동 중..." : "1) FOOD 아이템만 업로드"}
        </button>

        <button onClick={() => run("SHOE_ITEMS")} disabled={loading}>
          {loading ? "이동 중..." : "2) SHOE 아이템만 업로드"}
        </button>

        <button onClick={() => run("ALL_RECORDS")} disabled={loading}>
          {loading ? "이동 중..." : "3) 기록(records) 업로드"}
        </button>
      </div>

      <pre style={{ marginTop: 20, fontSize: 12 }}>{log.join("\n")}</pre>
    </div>
  );
}