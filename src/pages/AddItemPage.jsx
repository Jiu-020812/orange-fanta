import { useEffect, useMemo, useState } from "react";
import { getItems, createItem, getCategories } from "../api/items";
import { useLocation, useNavigate } from "react-router-dom";
import { optimizeImage, isValidImageFile } from "../utils/imageOptimizer";
import "./AddItemPage.css";

const norm = (s) => String(s ?? "").trim();
const lower = (s) => norm(s).toLowerCase();

function AddItemPage() {
  const location = useLocation();
  const navigate = useNavigate();

  //  서버 카테고리
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // 입력값
  const [barcode, setBarcode] = useState(""); // 바코드
  const [sku, setSku] = useState(""); // 내부 SKU
  const [name, setName] = useState("");
  const [second, setSecond] = useState(""); // size/option 통합
  const [imageDataUrl, setImageDataUrl] = useState("");

  // 자동완성
  const [nameFocused, setNameFocused] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);

  // 토스트
  const [toast, setToast] = useState("");

  // 서버 Item 목록(현재 선택 카테고리 기준으로 쓰면 자동완성 품질이 좋아짐)
  const [serverItems, setServerItems] = useState([]);

  const activeCategoryName = useMemo(() => {
    const c = categories.find((x) => x.id === activeCategoryId);
    return c?.name ?? "";
  }, [categories, activeCategoryId]);

  /* ----------------------- 쿼리에서 barcode 자동 세팅 ----------------------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bc = params.get("barcode");
    if (bc) setBarcode(String(bc));
  }, [location.search]);

  /* ----------------------- 초기 로드: categories ----------------------- */
  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const cats = await getCategories();
        const list = Array.isArray(cats) ? cats : [];
        if (!mounted) return;

        setCategories(list);

        // 첫 카테고리 자동 선택
        if (list.length > 0) {
          setActiveCategoryId((prev) => prev ?? list[0].id);
        } else {
          setActiveCategoryId(null);
        }
      } catch (e) {
        console.error("AddItemPage categories 로드 오류:", e);
        if (!mounted) return;
        setCategories([]);
        setActiveCategoryId(null);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------- 현재 선택 카테고리 items 로드 ----------------------- */
  useEffect(() => {
    let mounted = true;

    async function loadItems() {
      try {
        if (!activeCategoryId) {
          if (mounted) setServerItems([]);
          return;
        }
        const backendItems = await getItems(activeCategoryId); //  categoryId로 서버 필터
        const list = Array.isArray(backendItems)
          ? backendItems
          : Array.isArray(backendItems?.items)
          ? backendItems.items
          : [];
        if (!mounted) return;
        setServerItems(list);
      } catch (e) {
        console.error("AddItemPage 서버 items 로드 오류:", e);
        if (!mounted) return;
        setServerItems([]);
      }
    }

    loadItems();
    return () => {
      mounted = false;
    };
  }, [activeCategoryId]);

  /* ----------------------- 자동완성 후보 ----------------------- */
  const nameSuggestions = useMemo(() => {
    const keyword = lower(name);
    if (!keyword) return [];

    const set = new Set();

    for (const it of serverItems) {
      //  같은 카테고리 items만 이미 로드돼있어서 별도 필터 거의 필요 없음
      const n = norm(it?.name);
      if (!n) continue;
      if (lower(n).includes(keyword)) set.add(n);
    }

    return Array.from(set).slice(0, 20);
  }, [serverItems, name]);

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
      return;
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
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl("");
      return;
    }

    await processImageFile(file);
  };

  const processImageFile = async (file) => {
    // 파일 검증
    const validation = isValidImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setImageLoading(true);
      // 이미지 최적화 (리사이징 + 압축)
      const optimizedDataUrl = await optimizeImage(file);
      setImageDataUrl(optimizedDataUrl);
      showToast("이미지 업로드 완료");
    } catch (err) {
      console.error("이미지 처리 실패:", err);
      alert("이미지 처리에 실패했습니다.");
    } finally {
      setImageLoading(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
  };

  /* ----------------------- 토스트 ----------------------- */
  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2000);
  };

  /* ----------------------- 중복 체크 ----------------------- */
  function isDuplicatedByNameSize(trimmedName, finalSecond) {
    //  현재 카테고리 items만 serverItems에 들어있으므로 그대로 비교하면 됨
    return serverItems.some((it) => {
      return (
        lower(it?.name) === lower(trimmedName) &&
        norm(it?.size) === norm(finalSecond)
      );
    });
  }

  // barcode 유니크 제약 대응 (userId+barcode)
  function isDuplicatedByBarcode(trimmedBarcode) {
    if (!trimmedBarcode) return false;
    //  현재 카테고리 내에만 체크하면 "다른 카테고리에 같은 바코드"를 놓칠 수 있음
    // 하지만 DB 제약이 userId+barcode라서 서버에서 어차피 막힘.
    // UX 위해: 가능하면 전체 items를 로드해서 체크하는게 더 좋지만, 일단은 서버 에러 처리로 커버.
    return serverItems.some((it) => norm(it?.barcode) === trimmedBarcode);
  }

  /* ----------------------- 등록 ----------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedBarcode = norm(barcode);
    const trimmedSku = norm(sku);
    const trimmedName = norm(name);
    const trimmedSecond = norm(second);

    if (!activeCategoryId) {
      alert("카테고리를 먼저 만들어주세요.");
      return;
    }

    if (!trimmedName) {
      alert("품명을 입력해주세요.");
      return;
    }

    const finalSecond = trimmedSecond || "-"; // 옵션/사이즈 통합: 비면 "-"
    if (!finalSecond) {
      alert("옵션(또는 사이즈)을 입력해주세요.");
      return;
    }

    // (1) barcode 중복 방지 (서버에서도 막음)
    if (trimmedBarcode && isDuplicatedByBarcode(trimmedBarcode)) {
      alert("이미 등록된 바코드입니다.");
      return;
    }

    // (2) 기존 name+size(옵션) 중복 방지
    if (isDuplicatedByNameSize(trimmedName, finalSecond)) {
      alert("이미 등록된 상품입니다.");
      return;
    }

    try {
      const created = await createItem({
        name: trimmedName,
        size: finalSecond,
        barcode: trimmedBarcode || null,
        sku: trimmedSku || null,
        imageUrl: imageDataUrl || null,
        categoryId: activeCategoryId, // 
      });

      const createdItem = created?.item ?? created;

      setServerItems((prev) => [...prev, createdItem]);
      showToast(`"${trimmedName} (${finalSecond})" 등록 완료`);

      // 필요하면 등록 후 이동:
      // navigate(`/manage/${createdItem.id}`);

    } catch (err) {
      console.error("등록 실패:", err);

      const msg = String(err?.response?.data?.message || err?.message || "");
      if (msg.toLowerCase().includes("barcode") || msg.toLowerCase().includes("unique")) {
        alert("이미 등록된 바코드입니다.");
      } else if (msg.toLowerCase().includes("category")) {
        alert("카테고리 설정이 올바르지 않습니다.");
      } else {
        alert("서버 등록 실패");
      }
    } finally {
      setBarcode("");
      setSku("");
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
        <h1 className="add-item-title">
          새 물품 등록 {activeCategoryName ? `· ${activeCategoryName}` : ""}
        </h1>

        {/* 카테고리 탭 (DB 기반) */}
        <div className="add-item-tabs">
          {categories.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              카테고리가 없습니다. 먼저 카테고리를 추가해주세요.
            </div>
          ) : (
            categories.map((c) => {
              const active = c.id === activeCategoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`add-item-tab-button ${active ? "active" : ""}`}
                  onClick={() => setActiveCategoryId(c.id)}
                >
                  {c.name}
                </button>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* 바코드 */}
          <input
            type="text"
            placeholder="바코드 스캔 (선택)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="add-item-input"
            autoComplete="off"
            inputMode="numeric"
          />

          {/* SKU */}
          <input
            type="text"
            placeholder="SKU (비워두면 자동 생성됩니다)"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="add-item-input"
            autoComplete="off"
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
              autoComplete="off"
            />

            {hasNameSuggestions && (
              <div className="add-item-suggestions">
                {nameSuggestions.map((sg, idx) => (
                  <div
                    key={`${sg}-${idx}`}
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
            placeholder="옵션 / 사이즈 (ex: 260, 갤럭시맛)"
            value={second}
            onChange={(e) => setSecond(e.target.value)}
            className="add-item-input"
            autoComplete="off"
          />

          {/* 이미지 드래그 앤 드롭 영역 */}
          <div
            className={`image-upload-area ${isDragging ? "dragging" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("image-file-input").click()}
            style={{
              border: isDragging ? "2px dashed #3b82f6" : "2px dashed #d1d5db",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: isDragging ? "#eff6ff" : imageDataUrl ? "#f9fafb" : "#ffffff",
              transition: "all 0.2s",
              marginBottom: "12px",
            }}
          >
            <input
              id="image-file-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />

            {imageLoading ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                이미지 처리 중...
              </div>
            ) : imageDataUrl ? (
              <div>
                <img
                  src={imageDataUrl}
                  alt="미리보기"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                />
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                  클릭하여 이미지 변경
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
                  이미지를 드래그하거나 클릭하여 업로드
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  JPG, PNG, WEBP (최대 10MB)
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="add-item-submit-button">
            등록
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItemPage;
