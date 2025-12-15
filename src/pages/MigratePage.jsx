import { useState } from "react";
import api from "../api/items";

export default function MigratePage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleMigrate() {
    if (!file) return alert("파일 선택해줘");

    setLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await api.post("/migrate/indexeddb", json);
      setResult(res.data);
    } catch (err) {
      alert(err?.response?.data?.message || "마이그레이션 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto" }}>
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

      {result && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}