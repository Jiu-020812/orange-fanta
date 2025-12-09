const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-one.vercel.app";

/**
 * 특정 품목의 기록 목록 조회 (GET /api/records?itemId=...)
 */
export async function getRecords(itemId) {
  const res = await fetch(
    `${API_BASE_URL}/api/records?itemId=${encodeURIComponent(itemId)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch records: ${res.status}`);
  }

  return res.json();
}

/**
 * 기록 추가 (POST /api/records)
 */
export async function createRecord({ itemId, price, count, date }) {
  const res = await fetch(`${API_BASE_URL}/api/records`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      itemId,
      price,
      count,
      date, // 문자열(YYYY-MM-DD)로 보내면 백엔드에서 new Date(date) 처리
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.message || `Failed to create record: ${res.status}`
    );
  }

  return res.json();
}
