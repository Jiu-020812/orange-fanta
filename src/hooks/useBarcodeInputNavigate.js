import { useRef } from "react";

/**
 * 검색창 포커스 상태에서만 바코드 스캔 감지
 * - 엔터 없이 입력 끝나면 자동 이동
 */
export default function useBarcodeInputNavigate({
  items,
  navigate,
  buildUrl = (id) => `/manage/${id}`,
  minLength = 8,
  idleMs = 120,
}) {
  const bufferRef = useRef("");
  const timerRef = useRef(null);

  const reset = () => {
    bufferRef.current = "";
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const finalize = () => {
    const code = bufferRef.current.trim();
    if (code.length < minLength) {
      reset();
      return;
    }

    // barcode 우선, 없으면 name/size에 포함된 숫자도 허용
    const found = items.find((it) => {
      if (it.barcode && String(it.barcode) === code) return true;

      const hay = `${it.name ?? ""} ${it.size ?? ""}`;
      return hay.includes(code);
    });

    if (found?.id) {
      navigate(buildUrl(found.id));
    }

    reset();
  };

  const onKeyDown = (e) => {
    const k = e.key;

    if (k === "Enter") {
      finalize();
      return;
    }

    if (k === "Backspace" || k === "Escape") {
      reset();
      return;
    }

    if (typeof k !== "string" || k.length !== 1) return;
    if (!/^[0-9A-Za-z\-]$/.test(k)) return;

    bufferRef.current += k;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(finalize, idleMs);
  };

  return { onKeyDown, reset };
}
