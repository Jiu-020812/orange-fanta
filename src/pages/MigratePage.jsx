import { useState } from "react";
import api from "../api/items";

const CHUNK_SIZE = 200;

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
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
      const text = await file.text();
      const json = JSON.parse(text);

      const stores = json.stores || {};

      // 1️⃣ items 먼저
      const items = [
        ...(stores.shoes || []),
        ...(stores.foods || []),
      ];

      pushLog(`📦 items ${items.length}개 업로드 시작`);

      const itemChunks = chunkArray(items, CHUNK_SIZE);
      for (let i = 0; i < itemChunks.length; i++) {
        await api.post("/migrate/items-batch", {
          items: itemChunks[i],
        });
        pushLog(`✅ items ${i + 1}/${itemChunks.length} 완료`);
      }

      // 2️⃣ records 나중
      const records = [
        ...(stores.records || []),
        ...(stores.foodRecords || []),
      ];

      pushLog(`📦 records ${records.length}개 업로드 시작`);

      const recordChunks = chunkArray(records, CHUNK_SIZE);
      for (let i = 0; i < recordChunks.length; i++) {
        await api.post("/migrate/records-batch", {
          records: recordChunks[i],
        });
        pushLog(`✅ records ${i + 1}/${recordChunks.length} 완료`);
      }

      pushLog("🎉 마이그레이션 완료");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "마이그레이션 실패");
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