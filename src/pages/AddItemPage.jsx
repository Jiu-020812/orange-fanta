import { useEffect, useMemo, useState } from "react";
import { getItems, createItem } from "../api/items";
import { useLocation } from "react-router-dom";
import "./AddItemPage.css";

const norm = (s) => String(s ?? "").trim();
const lower = (s) => norm(s).toLowerCase();

function AddItemPage() {
  const location = useLocation();

  const [activeType, setActiveType] = useState("shoes"); // shoes | foods

  // 입력값
  const [barcode, setBarcode] = useState(""); // 🔫 바코드
  const [name, setName] = useState("");
  const [second, setSecond] = useState(""); // shoes=size, foods=option
  const [imageDataUrl, setImageDataUrl] = useState("");

  // 자동완성
  const [nameFocused, setNameFocused] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);

  // 토스트
  const [toast, setToast] = useState("");

  // 서버 Item 목록
  const [serverItems, setServerItems] = useState([]);

  const isShoes = activeType === "shoes";
  const targetCategory = isShoes ? "SHOE" : "FOOD";

  /* ----------------------- 쿼리에서 barcode 자동 세팅 ----------------------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bc = params.get("barcode");
    if (bc) setBarcode(bc);
  }, [location.search]);

  /* ----------------------- 초기 로드: 서버 items ----------------------- */
  useEffect(() => {
    async function load() {
      try {
        const backendItems = await getItems();
        const list = Array.isArray(backendItems)
          ? backendItems
          : Array.isArray(backendItems?.items)
          ? backendItems.items
          : [];
        setServerItems(list);
      } catch (e) {
        console.error("AddItemPage 서버 items 로드 오류:", e);
        setServerItems([]);
      }
    }
    load();
  }, []);

  /* ----------------------- 자동완성 후보 ----------------------- */
  const nameSuggestions = useMemo(() => {
    const keyword = lower(name);
    if (!keyword) return [];

    const set = new Set();

    for (const it of serverItems) {
      const cat = it?.category ?? "SHOE";
      if (cat !== targetCategory) continue;

      const n = norm(it?.name);
      if (!n) continue;

      if (lower(n).includes(keyword)) set.add(n);
    }

    return Array.from(set).slice(0, 20);
  }, [serverItems, name, targetCategory]);

  const hasNameSuggestions = nameFocused && nameSuggestions.length > 0;

  const handleSelectNameSuggestion = (value) => {
    setTimeout(() => setName(value), 0);
    setActiveSuggestIndex(-1);
    setNameFocused(false);
  };

  const handleNameKeyDown = (e) => {
    if (isComposing) return;

    if (e.key === "Enter" && hasNameSuggestions) {
      e.preventDefault();
      const idx = activeSuggestIndex >= 0 ? activeSuggestIndex : 0;
      const val = nameSuggestions[idx];
      if (val) handleSelectNameSuggestion(val);
    }

    if (!hasNameSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIndex((p) => (p + 1) % nameSuggestions.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIndex((p) =>
        p - 1 < 0 ? nameSuggestions.length - 1 : p - 1
      );
    }
  };

  /* ----------------------- 이미지 ----------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return setImageDataUrl("");

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /* ----------------------- 토스트 ----------------------- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ----------------------- 중복 체크 ----------------------- */
  function isDuplicated(trimmedName, trimmedSecond) {
    return serverItems.some((it) => {
      const cat = it?.category ?? "SHOE";
      if (cat !== targetCategory) return false;
      return (
        lower(it?.name) === lower(trimmedName) &&
        norm(it?.size) === norm(trimmedSecond)
      );
    });
  }

  /* ----------------------- 등록 ----------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = norm(name);
    const trimmedSecond = norm(second);
    if (!trimmedName) return;

    const finalSecond = isShoes ? trimmedSecond : trimmedSecond || "-";
    if (isShoes && !finalSecond) return;

    if (isDuplicated(trimmedName, finalSecond)) {
      alert("이미 등록된 상품입니다.");
      return;
    }

    try {
      const created = await createItem({
        name: trimmedName,
        size: finalSecond,
        barcode: barcode || null, // 🔥 핵심
        imageUrl: imageDataUrl || null,
        category: targetCategory,
      });

      setServerItems((prev) => [...prev, created]);
      showToast(`"${trimmedName} (${finalSecond})" 등록 완료`);

    } catch (err) {
      console.error("등록 실패:", err);
      alert("서버 등록 실패");
    } finally {
      setBarcode("");
      setName("");
      setSecond("");
      setImageDataUrl("");
      setActiveSuggestIndex(-1);
    }
  };

  return (
    <div className="add-item-page">
      {toast && <div className="add-item-toast">{toast}</div>}

      <div className="add-item-card">
        <h1 className="add-item-title">새 물품 등록</h1>

        {/* 탭 */}
        <div className="add-item-tabs">
          <button
            type="button"
            className={`add-item-tab-button ${activeType === "shoes" ? "active" : ""}`}
            onClick={() => setActiveType("shoes")}
          >
            신발
          </button>
          <button
            type="button"
            className={`add-item-tab-button ${activeType === "foods" ? "active" : ""}`}
            onClick={() => setActiveType("foods")}
          >
            식품
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* 🔫 바코드 */}
          <input
            type="text"
            placeholder="바코드 스캔 (선택)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="add-item-input"
          />

          {/* 이름 */}
          <div className="add-item-name-wrapper">
            <input
              type="text"
              placeholder="품명"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setTimeout(() => setNameFocused(false), 150)}
              onKeyDown={handleNameKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                setName(e.target.value);
              }}
              className="add-item-input"
            />

            {hasNameSuggestions && (
              <div className="add-item-suggestions">
                {nameSuggestions.map((sg, idx) => (
                  <div
                    key={sg}
                    className={`add-item-suggestion-item ${
                      idx === activeSuggestIndex ? "active" : ""
                    }`}
                    onMouseDown={() => handleSelectNameSuggestion(sg)}
                  >
                    {sg}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 옵션/사이즈 */}
          <input
            type="text"
            placeholder={isShoes ? "사이즈" : "옵션 (ex: 초코맛)"}
            value={second}
            onChange={(e) => setSecond(e.target.value)}
            className="add-item-input"
          />

          {/* 이미지 */}
          <input type="file" accept="image/*" onChange={handleImageChange} />

          <button type="submit" className="add-item-submit-button">
            등록
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItemPage;
