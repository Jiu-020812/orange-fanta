import api from "./client";
import { request } from "./request";

// 데이터 백업 (Export)
export async function exportData() {
  const res = await request(() => api.get("/api/backup/export"));
  return res.data.backup;
}

// 데이터 복원 (Import)
export async function importData(backup, mode = "merge") {
  const res = await request(() =>
    api.post("/api/backup/import", { backup, mode })
  );
  return res.data;
}
