import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import StatsSection from "../components/StatsSection";
import PurchaseForm from "../components/PurchaseForm";
import PurchaseList from "../components/PurchaseList";
import {
  getAllShoes,
  getAllFoods,
  saveShoes,
  saveFoods,
  getAllRecords,
  getAllFoodRecords,
  saveRecords,
  saveFoodRecords,
} from "../db";
import {
  getItems as fetchItems,
  createItem,
  createRecord,
} from "../api/items";

export default function ManageDetailPage() {
  const navigate = useNavigate();
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  const [activeType, setActiveType] = useState("shoes");
  const [shoes, setShoes] = useState([]);
  const [foods, setFoods] = useState([]);
  const [records, setRecords] = useState([]);
  const [foodRecords, setFoodRecords] = useState([]);

  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [toast, setToast] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [memoText, setMemoText] = useState("");

  const [serverItems, setServerItems] = useState([]);

  /* ---------------- 초기 데이터 로드 ---------------- */
  useEffect(() => {
    async function load() {
      const [
        loadedShoes,
        loadedFoods,
        loadedRecords,
        loadedFoodRecords,
      ] = await Promise.all([
        getAllShoes(),
        getAllFoods(),
        getAllRecords(),
        getAllFoodRecords(),
      ]);

      setShoes(loadedShoes || []);
      setFoods(loadedFoods || []);
      setRecords(loadedRecords || []);
      setFoodRecords(loadedFoodRecords || []);

      try {
        const backendItems = await fetchItems();
        setServerItems(backendItems || []);
      } catch (err) {
        console.error("백엔드 아이템 불러오기 실패", err);
      }
    }
    load();
  }, []);

  /* ---------------- type 결정 ---------------- */
  useEffect(() => {
    if (shoes.some((i) => i.name === decodedName)) {
      setActiveType("shoes");
    } else if (foods.some((i) => i.name === decodedName)) {
      setActiveType("foods");
    }
  }, [shoes, foods, decodedName]);

  const isShoes = activeType === "shoes";
  const items = isShoes ? shoes : foods;
  const itemRecords = isShoes ? records : foodRecords;
  const setItemRecords = isShoes ? setRecords : setFoodRecords;

  /* ---------------- 옵션 리스트 ---------------- */
  const options = useMemo(() => {
    return items.filter((i) => i.name === decodedName);
  }, [items, decodedName]);

  /* ---------------- 옵션 중복 확인 ---------------- */
  const isOptionExists = (value) => {
    return options.some((opt) =>
      (isShoes ? opt.size : opt.option) === value.trim()
    );
  };

  /* ---------------- 선택된 옵션 ---------------- */
  const selectedOption = options.find((o) => o.id === selectedOptionId);

  useEffect(() => {
    if (selectedOption) {
      setMemoText(selectedOption.memo || "");
    } else {
      setMemoText("");
    }
  }, [selectedOption]);

  /* ---------------- 메모 저장 ---------------- */
  const handleSaveMemo = async () => {
    if (!selectedOption) return;

    const updatedItems = items.map((opt) =>
      opt.id === selectedOption.id ? { ...opt, memo: memoText } : opt
    );

    if (isShoes) {
      setShoes(updatedItems);
      await saveShoes(updatedItems);
    } else {
      setFoods(updatedItems);
      await saveFoods(updatedItems);
    }

    showToast("메모 저장 완료!");
  };

  /* ---------------- 매입기록 옵션별 필터 ---------------- */
  const filteredRecords = useMemo(() => {
    if (!selectedOptionId) return [];
    return itemRecords.filter((r) => r.shoeId === selectedOptionId);
  }, [itemRecords, selectedOptionId]);

  /* ---------------- 토스트 ---------------- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ---------------- 옵션 추가 ---------------- */
  const handleAddOption = async ({ value, image }) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (isOptionExists(trimmed)) {
      window.alert("이미 등록된 옵션입니다.");
      return;
    }

    let finalImage = image || "";

    if (!finalImage) {
      const sameNameItems = items.filter(
        (item) =>
          item.name.trim().toLowerCase() ===
          decodedName.trim().toLowerCase()
      );

      const representative =
        sameNameItems.find((i) => i.image) || sameNameItems[0];

      if (representative?.image) {
        finalImage = representative.image;
      }
    }

    const newOption = {
      id: uuid(),
      name: decodedName,
      ...(isShoes ? { size: trimmed } : { option: trimmed }),
      image: finalImage || undefined,
      memo: "",
    };

    const newList = [...items, newOption];

    if (isShoes) {
      setShoes(newList);
      await saveShoes(newList);
    } else {
      setFoods(newList);
      await saveFoods(newList);
    }

    showToast("옵션 추가 완료");
  };

  /* ---------------- 옵션 수정 ---------------- */
  const handleSaveEditOption = async () => {
    if (!editModal) return;

    const { id, value, image } = editModal;
    const trimmed = value.trim();
    if (!trimmed) return;

    if (
      options.some(
        (opt) =>
          opt.id !== id &&
          (isShoes ? opt.size : opt.option) === trimmed
      )
    ) {
      window.alert("이미 존재하는 옵션입니다.");
      return;
    }

    const newList = items.map((i) =>
      i.id === id
        ? {
            ...i,
            ...(isShoes ? { size: trimmed } : { option: trimmed }),
            image: image || i.image,
          }
        : i
    );

    if (isShoes) {
      setShoes(newList);
      await saveShoes(newList);
    } else {
      setFoods(newList);
      await saveFoods(newList);
    }

    setEditModal(null);
    showToast("옵션 수정 완료");
  };

  /* ---------------- 옵션 삭제 ---------------- */
  const handleDeleteOption = async () => {
    const id = deleteModal;
    if (!id) return;

    const newList = items.filter((i) => i.id !== id);
    const newRecords = itemRecords.filter((r) => r.shoeId !== id);

    if (isShoes) {
      setShoes(newList);
      setRecords(newRecords);
      await saveShoes(newList);
      await saveRecords(newRecords);
    } else {
      setFoods(newList);
      setFoodRecords(newRecords);
      await saveFoods(newList);
      await saveFoodRecords(newRecords);
    }

    if (selectedOptionId === id) setSelectedOptionId("");

    setDeleteModal(null);
    showToast("옵션 삭제 완료");
  };

  /* ---------------- 품목 전체 삭제 ---------------- */
  const handleDeleteItem = async () => {
    if (!window.confirm("정말 이 품목을 전체 삭제할까요?")) return;

    const optionIds = options.map((o) => o.id);

    const newList = items.filter((i) => i.name !== decodedName);
    const newRecords = itemRecords.filter(
      (r) => !optionIds.includes(r.shoeId)
    );

    if (isShoes) {
      setShoes(newList);
      setRecords(newRecords);
      await saveShoes(newList);
      await saveRecords(newRecords);
    } else {
      setFoods(newList);
      setFoodRecords(newRecords);
      await saveFoods(newList);
      await saveFoodRecords(newRecords);
    }

    showToast("품목 전체 삭제 완료");
    navigate("/manage");
  };

  /* ---------------- 렌더링 ---------------- */
  return (
    <div style={{ padding: 24, width: "100%" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(59,130,246,0.95)",
            color: "white",
            fontSize: 13,
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate("/manage")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px #cbd5e1",
            background: "#e2e8f0",
            color: "#1e293b",
            cursor: "pointer",
          }}
        >
          ← 뒤로
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          {decodedName}
        </h2>

        <button
          onClick={handleDeleteItem}
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            backgroundColor: "#dc2626",
            borderRadius: 8,
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          품목 전체 삭제
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
          gap: 24,
        }}
      >
        {/* ---------------------------------- 좌측 ---------------------------------- */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            옵션 목록
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {options.map((opt) => {
              const value = isShoes ? opt.size : opt.option;
              return (
                <div
                  key={opt.id}
                  style={{
                    border:
                      selectedOptionId === opt.id
                        ? "2px solid #2563eb"
                        : "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    cursor: "pointer",
                    backgroundColor: "white",
                  }}
                >
                  <div
                    onClick={() => setSelectedOptionId(opt.id)}
                    style={{ marginBottom: 6 }}
                  >
                    {opt.image ? (
                      <img
                        src={opt.image}
                        alt=""
                        style={{
                          width: "100%",
                          height: 110,
                          objectFit: "cover",
                          borderRadius: 10,
                          marginBottom: 6,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 110,
                          borderRadius: 10,
                          backgroundColor: "#f3f4f6",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6b7280",
                          fontSize: 12,
                        }}
                      >
                        이미지 없음
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {value}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() =>
                        setEditModal({
                          id: opt.id,
                          value,
                          image: opt.image || "",
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "4px 0",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #93c5fd",
                        background: "#dbeafe",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      수정
                    </button>

                    <button
                      onClick={() => setDeleteModal(opt.id)}
                      style={{
                        flex: 1,
                        padding: "4px 0",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solidr #FF6C6C",
                        background: "#fee2e2",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <OptionAddBox isShoes={isShoes} onAdd={handleAddOption} />
        </div>

        {/* ---------------------------------- 우측 ---------------------------------- */}
        <div>
          {!selectedOptionId ? (
            <div
              style={{ color: "#9ca3af", fontSize: 14, marginTop: 20 }}
            >
              왼쪽에서 옵션을 선택하면 매입 그래프와 기록이 표시됩니다.
            </div>
          ) : (
            <>
              <StatsSection
                records={filteredRecords}
                itemName={
                  isShoes
                    ? `${decodedName} (${selectedOption?.size})`
                    : `${decodedName} (${selectedOption?.option})`
                }
              />

              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                }}
              >
                <PurchaseForm
                  onAddRecord={async (info) => {
                    const newRecord = {
                      id: uuid(),
                      shoeId: selectedOptionId,
                      date:
                        info.date ||
                        new Date().toISOString().slice(0, 10),
                      price: Number(info.price),
                      count:
                        info.count === "" ? 1 : Number(info.count),
                    };

                    const updated = [...itemRecords, newRecord];

                    // 1) IndexedDB 저장
                    if (isShoes) {
                      setRecords(updated);
                      saveRecords(updated);
                    } else {
                      setFoodRecords(updated);
                      saveFoodRecords(updated);
                    }

                    // 2) shoes일 경우 서버에도 저장
                    if (isShoes) {
                      try {
                        const size = selectedOption?.size;

                        let serverItem =
                          serverItems.find(
                            (it) =>
                              it.name === decodedName &&
                              it.size === size
                          ) || null;

                        if (!serverItem) {
                          const created = await createItem({
                            name: decodedName,
                            size,
                            imageUrl: selectedOption?.image || null,
                          });
                          serverItem = created;
                          setServerItems((prev) => [...prev, created]);
                        }

                        await createRecord({
                          itemId: serverItem.id,
                          price: Number(info.price),
                          count:
                            info.count === "" ? 1 : Number(info.count),
                          date:
                            info.date ||
                            new Date().toISOString().slice(0, 10),
                        });
                      } catch (err) {
                        console.error("백엔드 기록 저장 실패", err);
                      }
                    }

                    showToast("매입 기록 추가 완료");
                  }}
                />
              </div>

              <PurchaseList
                records={filteredRecords}
                onDeleteRecord={(id) => {
                  const newList = itemRecords.filter(
                    (r) => r.id !== id
                  );
                  setItemRecords(newList);

                  if (isShoes) saveRecords(newList);
                  else saveFoodRecords(newList);

                  showToast("기록 삭제 완료");
                }}
                onUpdateRecord={(id, info) => {
                  const newList = itemRecords.map((r) =>
                    r.id === id
                      ? {
                          ...r,
                          date: info.date || r.date,
                          price:
                            info.price === "" || info.price == null
                              ? r.price
                              : Number(info.price),
                          count:
                            info.count === "" || info.count == null
                              ? r.count
                              : Number(info.count),
                        }
                      : r
                  );

                  setItemRecords(newList);

                  if (isShoes) saveRecords(newList);
                  else saveFoodRecords(newList);

                  showToast("기록 수정 완료");
                }}
              />

              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  backgroundColor: "#ffffff",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  옵션 메모
                </div>

                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="이 옵션에 대한 메모를 적어주세요."
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />

                <button
                  onClick={handleSaveMemo}
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    fontSize: 13,
                    float: "right",
                  }}
                >
                  메모 저장
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {editModal && (
        <EditOptionModal
          isShoes={isShoes}
          editModal={editModal}
          setEditModal={setEditModal}
          onSave={handleSaveEditOption}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          message="정말 이 옵션을 삭제할까요?"
          onCancel={() => setDeleteModal(null)}
          onConfirm={handleDeleteOption}
        />
      )}
    </div>
  );
}

/* ======================= 옵션 추가 박스 ======================= */

function OptionAddBox({ isShoes, onAdd }) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState("");

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    onAdd({ value, image });
    setValue("");
    setImage("");
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        backgroundColor: "#fafafa",
      }}
    >
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
        옵션 추가
      </h4>

      <input
        type="text"
        placeholder={isShoes ? "사이즈 (260)" : "옵션"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />

      <div style={{ marginTop: 8 }}>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && (
          <img
            src={image}
            alt=""
            style={{
              marginTop: 8,
              width: "100%",
              maxWidth: 180,
              borderRadius: 8,
            }}
          />
        )}
      </div>

      <button
        onClick={submit}
        style={{
          marginTop: 10,
          padding: "6px 14px",
          borderRadius: 999,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        추가
      </button>
    </div>
  );
}

/* ======================= 옵션 수정 모달 ======================= */

function EditOptionModal({ isShoes, editModal, setEditModal, onSave }) {
  const { id, value, image } = editModal;

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string")
        setEditModal({ id, value, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <ModalContainer>
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "white",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          옵션 수정
        </h3>

        <input
          type="text"
          value={value}
          onChange={(e) =>
            setEditModal({ id, value: e.target.value, image })
          }
          style={{
            width: "100%",
            marginTop: 14,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          style={{ marginTop: 8 }}
        />

        {image && (
          <img
            src={image}
            alt=""
            style={{
              marginTop: 10,
              width: "100%",
              height: 140,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <button
            onClick={() => setEditModal(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
            }}
          >
            취소
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#2563eb",
              color: "white",
            }}
          >
            저장
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}

/* ======================= 공통 모달 컨테이너 ======================= */

function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <ModalContainer>
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          backgroundColor: "white",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{message}</div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#dc2626",
              color: "white",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}

function ModalContainer({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      {children}
    </div>
  );
}