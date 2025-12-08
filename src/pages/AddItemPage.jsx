import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { getAllShoes, saveShoes, getAllFoods, saveFoods } from "../db";
import { getItems } from "../api/items";   // 서버에서 Item 목록 가져오기
import { createItem } from "../api";       // 서버에 Item 하나 생성
import "./AddItemPage.css";

function AddItemPage() {
  const [activeType, setActiveType] = useState("shoes");

  // 로컬 IndexedDB 데이터
  const [shoes, setShoes] = useState([]);
  const [foods, setFoods] = useState([]);

  // 입력값
  const [name, setName] = useState("");
  const [second, setSecond] = useState(""); // shoes = size, foods = option
  const [imageDataUrl, setImageDataUrl] = useState("");

  // 자동완성 관련
  const [nameFocused, setNameFocused] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);

  // 토스트
  const [toast, setToast] = useState("");

  // 서버 Item 목록(중복 방지/디버깅용)
  const [serverItems, setServerItems] = useState([]);

  /* ---------------------------------------------
     초기 로드: 로컬(shoes/foods) + 서버(items)
  --------------------------------------------- */
  useEffect(() => {
    async function load() {
      try {
        const [loadedShoes, loadedFoods] = await Promise.all([
          getAllShoes(),
          getAllFoods(),
        ]);

        setShoes(loadedShoes || []);
        setFoods(loadedFoods || []);

        const backendItems = await getItems();
        setServerItems(backendItems || []);
      } catch (e) {
        console.error("AddItemPage 초기 로드 오류:", e);
      }
    }

    load();
  }, []);

  /* ---------------------------------------------
     자동완성 후보 계산
  --------------------------------------------- */
  const nameSuggestions = useMemo(() => {
    const list =
      activeType === "shoes"
        ? shoes.map((s) => s.name || "")
        : foods.map((f) => f.name || "");

    const keyword = (name || "").trim().toLowerCase();
    if (!keyword) return [];

    const set = new Set(
      list.filter(Boolean).filter((n) => n.toLowerCase().includes(keyword))
    );

    return Array.from(set);
  }, [activeType, shoes, foods, name]);

  const hasNameSuggestions = nameFocused && nameSuggestions.length > 0;

  const handleSelectNameSuggestion = (value) => {
    setTimeout(() => setName(value), 0);
    setActiveSuggestIndex(-1);
    setNameFocused(false);
  };

  /* ---------------------------------------------
     자동완성 키보드 조작 (↑↓ + Enter)
  --------------------------------------------- */
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

  /* ---------------------------------------------
     이미지 업로드
  --------------------------------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  /* ---------------------------------------------
     토스트
  --------------------------------------------- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ---------------------------------------------
     신규 등록 (신발 / 식품 공통)
  --------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedSecond = second.trim();

    if (!trimmedName) return;

    try {
      /* ========================
         1) 신발 등록
      ======================== */
      if (activeType === "shoes") {
        if (!trimmedSecond) return;

        // 로컬 중복 체크
        const duplicated = shoes.some((s) => {
          return (
            (s.name || "").trim().toLowerCase() ===
              trimmedName.toLowerCase() &&
            (s.size || "").trim() === trimmedSecond
          );
        });
        if (duplicated) {
          window.alert("이미 등록된 신발입니다. (동일한 이름 + 사이즈)");
          return;
        }

        // 대표 이미지 상속
        let finalImage = imageDataUrl || "";
        if (!finalImage) {
          const sameName = shoes.filter(
            (s) =>
              (s.name || "").trim().toLowerCase() ===
              trimmedName.toLowerCase()
          );
          const rep = sameName.find((s) => s.image) || sameName[0];
          if (rep?.image) finalImage = rep.image;
        }

        const shoe = {
          id: uuid(),
          name: trimmedName,
          size: trimmedSecond,
          image: finalImage || undefined,
        };

        // 로컬 저장
        const newShoes = [...shoes, shoe];
        setShoes(newShoes);
        await saveShoes(newShoes);

        showToast(`"${trimmedName} (${trimmedSecond})" 신발 등록 완료`);

        // ---- 서버 동기화 (Item 생성) ----
        try {
          console.log(
            "🔥 [AddItemPage] (신발) createItem 실행됨! 서버로 저장합니다.",
            { trimmedName, trimmedSecond }
          );

          const created = await createItem({
            name: trimmedName,
            size: trimmedSecond,
            imageUrl: finalImage || null,
          });

          console.log(
            "✅ [AddItemPage] (신발) 서버에서 돌아온 created:",
            created
          );

          setServerItems((prev) => [...prev, created]);
        } catch (err) {
          console.error("❌ [AddItemPage] (신발) 서버 Item 동기화 실패:", err);
        }

        return; // shoes 끝
      }

      /* ========================
         2) 식품 등록 (로컬 + 서버)
      ======================== */
      if (activeType === "foods") {
        const duplicated = foods.some((f) => {
          return (
            (f.name || "").trim().toLowerCase() ===
              trimmedName.toLowerCase() &&
            (f.option || "").trim() === trimmedSecond
          );
        });
        if (duplicated) {
          window.alert("이미 등록된 식품입니다. (동일한 이름 + 옵션)");
          return;
        }

        // 대표 이미지 상속
        let finalImage = imageDataUrl || "";
        if (!finalImage) {
          const sameName = foods.filter(
            (f) =>
              (f.name || "").trim().toLowerCase() ===
              trimmedName.toLowerCase()
          );
          const rep = sameName.find((f) => f.image) || sameName[0];
          if (rep?.image) finalImage = rep.image;
        }

        const food = {
          id: uuid(),
          name: trimmedName,
          option: trimmedSecond || undefined,
          image: finalImage || undefined,
        };

        // 로컬 저장
        const newFoods = [...foods, food];
        setFoods(newFoods);
        await saveFoods(newFoods);

        showToast(`"${trimmedName}" 식품 등록 완료`);

        // ---- 서버 동기화 (Item 생성) ----
        try {
          console.log(
            "🔥 [AddItemPage] (식품) createItem 실행됨! 서버로 저장합니다.",
            { trimmedName, trimmedSecond }
          );

          const created = await createItem({
            name: trimmedName,
            size: trimmedSecond || "-", // 식품은 옵션을 size에 저장
            imageUrl: finalImage || null,
          });

          console.log(
            "✅ [AddItemPage] (식품) 서버에서 돌아온 created:",
            created
          );

          setServerItems((prev) => [...prev, created]);
        } catch (err) {
          console.error("❌ [AddItemPage] (식품) 서버 Item 동기화 실패:", err);
        }

        return; // foods 끝
      }
    } catch (err) {
      console.error("물품 등록 오류:", err);
      showToast("등록 중 오류가 발생했습니다.");
    } finally {
      // 입력 초기화
      setName("");
      setSecond("");
      setImageDataUrl("");
      setActiveSuggestIndex(-1);
    }
  };

  /* ---------------------------------------------
     렌더링
  --------------------------------------------- */
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
                : "옵션 (ex: 초코맛 / 500ml)"
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