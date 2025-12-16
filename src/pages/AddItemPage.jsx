import { useEffect, useMemo, useState } from "react";
import { getItems, createItem } from "../api/items";
import "./AddItemPage.css";

const norm = (s) => String(s ?? "").trim();
const lower = (s) => norm(s).toLowerCase();

function AddItemPage() {
  const [activeType, setActiveType] = useState("shoes"); // shoes | foods

  // 입력값
  const [name, setName] = useState("");
  const [second, setSecond] = useState(""); // shoes=size, foods=option(=size에 저장)
  const [imageDataUrl, setImageDataUrl] = useState("");

  // 자동완성 관련
  const [nameFocused, setNameFocused] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);

  // 토스트
  const [toast, setToast] = useState("");

  // 서버 Item 목록
  const [serverItems, setServerItems] = useState([]);

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

  const isShoes = activeType === "shoes";
  const targetCategory = isShoes ? "SHOE" : "FOOD";

  /* ----------------------- 자동완성 후보 (서버 기준) ----------------------- */
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

  /* ----------------------- 자동완성 키보드 조작 ----------------------- */
  const handleNameKeyDown = (e) => {
    if (isComposing) return;

    if (e.key === "Enter") {
      if (hasNameSuggestions) {
        e.preventDefault();
        const idx = activeSuggestIndex >= 0 ? activeSuggestIndex : 0;
        const val = nameSuggestions[idx];
        if (val) handleSelectNameSuggestion(val);
        return;
      }
      return;
    }

    if (!hasNameSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIndex((prev) =>
        prev + 1 >= nameSuggestions.length ? 0 : prev + 1
      );
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIndex((prev) =>
        prev - 1 < 0 ? nameSuggestions.length - 1 : prev - 1
      );
    }
  };

  /* ----------------------- 이미지 업로드 ----------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl("");
      return;
    }

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

  /* ----------------------- 대표 이미지 상속 (서버 기준) ----------------------- */
  function getInheritedImageUrl(trimmedName) {
    const sameName = serverItems.filter(
      (it) =>
        (it?.category ?? "SHOE") === targetCategory &&
        lower(it?.name) === lower(trimmedName)
    );
    const rep = sameName.find((it) => it?.imageUrl) || sameName[0];
    return rep?.imageUrl || "";
  }

  /* ----------------------- 중복 체크 (서버 기준) ----------------------- */
  function isDuplicated(trimmedName, trimmedSecond) {
    const tn = lower(trimmedName);
    const ts = norm(trimmedSecond);

    return serverItems.some((it) => {
      const cat = it?.category ?? "SHOE";
      if (cat !== targetCategory) return false;

      return lower(it?.name) === tn && norm(it?.size) === ts;
    });
  }

  /* ----------------------- 신규 등록 (서버만) ----------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = norm(name);
    const trimmedSecond = norm(second);

    if (!trimmedName) return;

    // shoes는 size 필수, foods는 옵션 없어도 "-" 저장(기존 유지)
    const finalSecond =
      isShoes ? trimmedSecond : trimmedSecond || "-";

    if (isShoes && !finalSecond) return;

    // 서버 중복 체크
    if (isDuplicated(trimmedName, finalSecond)) {
      window.alert(
        isShoes
          ? "이미 등록된 신발입니다. (동일한 이름 + 사이즈)"
          : "이미 등록된 식품입니다. (동일한 이름 + 옵션)"
      );
      return;
    }

    // 대표 이미지 상속(서버 기준)
    let finalImage = imageDataUrl || "";
    if (!finalImage) finalImage = getInheritedImageUrl(trimmedName);

    try {
      const created = await createItem({
        name: trimmedName,
        size: finalSecond,
        imageUrl: finalImage || null,
        category: targetCategory, // ✅ 서버에 카테고리 저장
      });

      // 서버 목록 갱신(빠른 UX)
      setServerItems((prev) => [...prev, created]);

      showToast(
        isShoes
          ? `"${trimmedName} (${finalSecond})" 신발 등록 완료`
          : `"${trimmedName} (${finalSecond})" 식품 등록 완료`
      );
    } catch (err) {
      console.error("AddItemPage 서버 등록 실패:", err);
      window.alert(err?.response?.data?.message || "서버 등록 실패 😢");
    } finally {
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

        {/* shoes / foods 탭 */}
        <div className="add-item-tabs">
          <button
            type="button"
            className={
              "add-item-tab-button" + (activeType === "shoes" ? " active" : "")
            }
            onClick={() => {
              setActiveType("shoes");
              setName("");
              setSecond("");
              setActiveSuggestIndex(-1);
            }}
          >
            신발 등록
          </button>

          <button
            type="button"
            className={
              "add-item-tab-button" + (activeType === "foods" ? " active" : "")
            }
            onClick={() => {
              setActiveType("foods");
              setName("");
              setSecond("");
              setActiveSuggestIndex(-1);
            }}
          >
            식품 등록
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="add-item-form">
          {/* 이름 + 자동완성 */}
          <div className="add-item-name-wrapper">
            <input
              type="text"
              placeholder={
                activeType === "shoes"
                  ? "품명 (ex: FD4116-100)"
                  : "품명 (ex: 초코파이)"
              }
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setActiveSuggestIndex(-1);
              }}
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
                    className={
                      "add-item-suggestion-item" +
                      (idx === activeSuggestIndex ? " active" : "")
                    }
                    onMouseDown={() => handleSelectNameSuggestion(sg)}
                  >
                    {sg}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 사이즈 / 옵션 */}
          <input
            type="text"
            placeholder={
              activeType === "shoes"
                ? "사이즈 (ex: 260)"
                : "옵션 (ex: 초코맛 / 500ml) — 비우면 '-'로 저장"
            }
            value={second}
            onChange={(e) => setSecond(e.target.value)}
            className="add-item-input"
          />

          {/* 이미지 업로드 */}
          <div>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imageDataUrl && (
              <div className="add-item-image-preview">
                <img src={imageDataUrl} alt="" className="add-item-image" />
              </div>
            )}
          </div>

          <button type="submit" className="add-item-submit-button">
            {activeType === "shoes" ? "신발 등록" : "식품 등록"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItemPage;