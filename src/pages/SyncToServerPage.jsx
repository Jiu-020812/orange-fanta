import { useEffect, useState } from "react";
import { getAllShoes, getAllRecords } from "../db";
import { getItems, createItem, createRecord } from "../api/items";

export default function SyncToServerPage() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [log, setLog] = useState([]);

  const pushLog = (msg) => {
    setLog((prev) => [...prev, msg]);
    console.log(msg);
  };

  useEffect(() => {
    async function syncAll() {
      try {
        setStatus("running");
        pushLog("🚀 동기화 시작: 로컬(IndexedDB) → 서버(DB)");

        // 1) 로컬 데이터 가져오기 (신발 + 신발 기록)
        const [localShoes, localRecords] = await Promise.all([
          getAllShoes(),
          getAllRecords(),
        ]);

        pushLog(`📦 로컬 신발 개수: ${localShoes.length}`);
        pushLog(`🧾 로컬 신발 기록 개수: ${localRecords.length}`);

        // 2) 서버 데이터 가져오기
        const serverItems = await getItems();
        pushLog(`🗄️ 서버에 이미 있는 Item 개수: ${serverItems.length}`);

        // 로컬 shoe.id → 서버 item.id 매핑용
        const shoeIdToServerItemId = {};

        // 3) 로컬 신발 → 서버 Item으로 매핑/생성
        for (const shoe of localShoes) {
          const name = (shoe.name || "").trim();
          const size = (shoe.size || "").trim();

          if (!name || !size) {
            pushLog(
              `⚠️ 이름/사이즈가 비어있는 신발 건너뜀: ${JSON.stringify(
                shoe
              )}`
            );
            continue;
          }

          // 서버에 이미 있는지 확인 (name+size 기준)
          let serverItem =
            serverItems.find((it) => {
              const sName = (it.name || "").trim();
              const sSize = (it.size || "").trim();
              return (
                sName.toLowerCase() === name.toLowerCase() &&
                sSize === size
              );
            }) || null;

          // 없으면 새로 생성
          if (!serverItem) {
            const payload = {
              name,
              size,
              imageUrl: shoe.image || null,
            };

            pushLog(`📤 서버에 새 Item 생성: ${name} (${size})`);
            const created = await createItem(payload);

            serverItem = created;
            serverItems.push(serverItem); // 이후 비교를 위해 리스트에도 넣기

            pushLog(
              `✅ 생성 완료: id=${serverItem.id}, name=${serverItem.name}, size=${serverItem.size}`
            );
          } else {
            pushLog(`✔ 이미 서버에 있는 신발: ${name} (${size}) → 재사용`);
          }

          // 로컬 shoe.id → 서버 item.id 기록
          shoeIdToServerItemId[shoe.id] = serverItem.id;
        }

        // 4) 로컬 기록 → 서버 기록으로 복사
        let successCount = 0;
        for (const rec of localRecords) {
          const serverItemId = shoeIdToServerItemId[rec.shoeId];

          if (!serverItemId) {
            pushLog(
              `⚠️ 매칭되는 서버 Item이 없어 건너뜀: ${JSON.stringify(rec)}`
            );
            continue;
          }

          const payload = {
            itemId: serverItemId,
            price: rec.price,
            count: rec.count,
            date: rec.date,
          };

          pushLog(
            `🧾 서버에 기록 생성: itemId=${serverItemId}, price=${rec.price}, count=${rec.count}, date=${rec.date}`
          );

          await createRecord(payload);
          successCount++;
        }

        pushLog(`🎉 동기화 완료! 서버에 추가된 기록 수: ${successCount}개`);
        setStatus("done");
      } catch (err) {
        console.error("❌ 동기화 중 오류:", err);
        pushLog(`❌ 동기화 중 오류: ${err.message || err}`);
        setStatus("error");
      }
    }

    // 페이지 들어오면 자동 실행 (한 번만)
    syncAll();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        서버 동기화 (로컬 → 서버)
      </h1>

      <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 12 }}>
        이 페이지는 <b>한 번만</b> 실행하는 용도입니다. <br />
        브라우저(IndexedDB)에 저장되어 있던 신발/기록들을 서버 DB로 옮깁니다.
      </p>

      <div
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        {status === "idle" && "대기 중"}
        {status === "running" &&
          "⏳ 동기화 중입니다... 브라우저를 닫지 마세요."}
        {status === "done" && "✅ 동기화가 완료되었습니다!"}
        {status === "error" &&
          "❌ 동기화 중 오류가 발생했습니다. 콘솔을 확인하세요."}
      </div>

      <div
        style={{
          maxHeight: 320,
          overflowY: "auto",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          backgroundColor: "#111827",
          color: "#e5e7eb",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
          fontSize: 12,
        }}
      >
        {log.length === 0 ? (
          <div>로그가 아직 없습니다.</div>
        ) : (
          log.map((line, idx) => <div key={idx}>{line}</div>)
        )}
      </div>
    </div>
  );
}