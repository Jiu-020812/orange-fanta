import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatsSection from "../components/StatsSection";
import PurchaseForm from "../components/PurchaseForm";
import PurchaseList from "../components/PurchaseList";
import {
  getItems as fetchItems,
  createItem,
  updateItem as updateServerItem,
  createRecord,
  updateRecord as updateServerRecord,
  getRecords as fetchRecords,
  deleteRecord as deleteServerRecord,
  deleteItem as deleteServerItem,
} from "../api/items";

const norm = (s) => String(s ?? "").trim();

export default function ManageDetailPage() {
  const navigate = useNavigate();
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  // 서버에서 가져온 전체 items (이름/옵션/이미지 등)
  const [items, setItems] = useState([]);
  // 현재 선택된 옵션(Item)에 대한 기록만 보관
  const [records, setRecords] = useState([]);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [toast, setToast] = useState("");
  const [editModal, setEditModal] = useState(null); // { id, value, image }
  const [deleteModal, setDeleteModal] = useState(null); // 삭제할 option id
  const [memoText, setMemoText] = useState("");

  // 아직 category 컬럼이 있더라도, UI는 일단 "신발처럼(size 사용)" 취급 유지
  const isShoes = true;

  /* ---------------- 토스트 ---------------- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ---------------- 서버에서 아이템 목록 불러오기 ---------------- */
  useEffect(() => {
    async function loadItems() {
      try {
        const data = await fetchItems();

        console.log(
          "🟡 items response",
          data,
          Array.isArray(data),
          data?.length
        );

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("아이템 불러오기 오류:", err);
      }
    }

    loadItems();
  }, []);

  /* ---------------- 현재 품목 이름에 해당하는 옵션 리스트 ---------------- */
  const options = useMemo(() => {
    const target = norm(decodedName);

    // dfddfdf
    console.log("🟢 decodedName:", decodedName);
    console.log("🟢 items count:", items.length);
    console.log("🟢 first item name:", items[0]?.name);
    console.log("🟢 options count:", filtered.length);

    
    return items.filter((i) => norm(i.name) === target);
  }, [items, decodedName]);

  /* ---------------- 선택된 옵션 객체 ---------------- */
  const selectedOption = options.find((opt) => opt.id === selectedOptionId) || null;

  /* ---------------- 옵션 중복 확인 ---------------- */
  const isOptionExists = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return options.some((opt) => norm(opt.size) === trimmed);
  };

  /* ---------------- 선택된 옵션이 바뀔 때 기록 로드 ---------------- */
  useEffect(() => {
    if (!selectedOptionId) {
      setRecords([]);
      return;
    }

    async function loadRecords() {
      try {
        const data = await fetchRecords(selectedOptionId);
        const normalized = Array.isArray(data)
          ? data.map((rec) => ({
              id: rec.id,
              itemId: rec.itemId,
              price: rec.price,
              count: rec.count,
              date: (rec.date || "").slice(0, 10),
            }))
          : [];
        setRecords(normalized);
      } catch (err) {
        console.error("기록 불러오기 실패:", err);
      }
    }

    loadRecords();
  }, [selectedOptionId]);

  /* ---------------- 메모: 서버 Item.memo 기반 ---------------- */
  useEffect(() => {
    if (selectedOption && typeof selectedOption.memo === "string") {
      setMemoText(selectedOption.memo);
    } else {
      setMemoText("");
    }
  }, [selectedOption]);

  const handleSaveMemo = async () => {
    if (!selectedOption) return;

    try {
      // ✅ 서버에 memo 저장
      const updated = await updateServerItem(selectedOption.id, { memo: memoText });

      // 서버가 updated item을 돌려준다는 가정
      setItems((prev) => prev.map((it) => (it.id === selectedOption.id ? { ...it, ...updated } : it)));

      showToast("메모 저장 완료!");
    } catch (err) {
      console.error("메모 서버 저장 실패", err);
      window.alert("메모 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 추가 (서버에 Item 생성) ---------------- */
  const handleAddOption = async ({ value, image }) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (isOptionExists(trimmed)) {
      window.alert("이미 등록된 옵션입니다.");
      return;
    }

    try {
      const created = await createItem({
        name: decodedName,
        size: trimmed,
        imageUrl: image || null,
      });

      setItems((prev) => [...prev, created]);
      setSelectedOptionId(created.id);

      showToast("옵션 추가 완료");
    } catch (err) {
      console.error("옵션 서버 저장 실패", err);
      window.alert("서버에 옵션 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 수정 (서버 기반) ---------------- */
  const handleSaveEditOption = async () => {
    if (!editModal) return;

    const { id, value, image } = editModal;
    const trimmed = value.trim();
    if (!trimmed) return;

    // 중복 체크
    if (options.some((opt) => opt.id !== id && norm(opt.size) === trimmed)) {
      window.alert("이미 존재하는 옵션입니다.");
      return;
    }

    try {
      const updated = await updateServerItem(id, {
        size: trimmed,
        imageUrl: image || null,
      });

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));

      setEditModal(null);
      showToast("옵션 수정 완료");
    } catch (err) {
      console.error("옵션 서버 수정 실패", err);
      window.alert("서버에 옵션 수정 실패 😢\n잠시 후 다시 시도해 주세요.");
    }
  };

  /* ---------------- 옵션 삭제 ---------------- */
  const handleDeleteOption = async () => {
    const id = deleteModal;
    if (!id) return;

    try {
      // 서버에서 이 item 및 연결된 기록 삭제
      await deleteServerItem(id);
    } catch (err) {
      console.error("옵션 서버 삭제 실패", err);
      window.alert("서버에서 옵션 삭제에 실패했을 수 있어요.\n화면에서는 삭제합니다.");
    }

    setItems((prev) => prev.filter((it) => it.id !== id));
    setRecords([]);
    if (selectedOptionId === id) setSelectedOptionId(null);

    setDeleteModal(null);
    showToast("옵션 삭제 완료");
  };

  /* ---------------- 품목 전체 삭제 (이 이름의 모든 옵션 삭제) ---------------- */
  const handleDeleteItem = async () => {
    if (!window.confirm("정말 이 품목을 전체 삭제할까요?")) return;

    const ids = options.map((it) => it.id);

    try {
      await Promise.all(ids.map((id) => deleteServerItem(id)));
    } catch (err) {
      console.error("품목 전체 삭제 실패", err);
      window.alert("서버에서 일부 옵션 삭제에 실패했을 수 있어요.\n다시 확인해 주세요.");
    }

    setItems((prev) => prev.filter((it) => norm(it.name) !== norm(decodedName)));
    setRecords([]);
    setSelectedOptionId(null);

    showToast("품목 전체 삭제 완료");
    navigate("/manage");
  };

  /* ---------------- 렌더링 ---------------- */
  const filteredRecords = records;

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

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{decodedName}</h2>

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
        {/* ---------------------------------- 좌측: 옵션 목록 ---------------------------------- */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>옵션 목록</h3>

          {options.length === 0 && (
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>
              옵션이 없습니다. (데이터는 있는데 안 보이면 name 매칭/라우팅을 확인해줘!)
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {options.map((opt) => {
              const value = opt.size;

              return (
                <div
                  key={opt.id}
                  style={{
                    border: selectedOptionId === opt.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    cursor: "pointer",
                    backgroundColor: "white",
                  }}
                >
                  <div onClick={() => setSelectedOptionId(opt.id)} style={{ marginBottom: 6 }}>
                    {opt.imageUrl ? (
                      <img
                        src={opt.imageUrl}
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

                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{value}</div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() =>
                        setEditModal({
                          id: opt.id,
                          value: value || "",
                          image: opt.imageUrl || "",
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
                        border: "1px solid #FF6C6C",
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

        {/* ---------------------------------- 우측: 그래프 + 기록 + 메모 ---------------------------------- */}
        <div>
          {!selectedOptionId ? (
            <div style={{ color: "#9ca3af", fontSize: 14, marginTop: 20 }}>
              왼쪽에서 옵션을 선택하면 매입 그래프와 기록이 표시됩니다.
            </div>
          ) : (
            <>
              <StatsSection records={filteredRecords} itemName={`${decodedName} (${selectedOption?.size ?? ""})`} />

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
                    if (!selectedOptionId) return;

                    const dateValue = info.date || new Date().toISOString().slice(0, 10);
                    const countValue =
                      info.count === "" || info.count == null ? 1 : Number(info.count);

                    try {
                      const created = await createRecord({
                        itemId: selectedOptionId,
                        price: Number(info.price),
                        count: countValue,
                        date: dateValue,
                      });

                      const newRecord = {
                        id: created.id,
                        itemId: created.itemId,
                        price: created.price,
                        count: created.count,
                        date: (created.date || "").slice(0, 10),
                      };

                      setRecords((prev) => [...prev, newRecord]);
                      showToast("매입 기록 추가 완료");
                    } catch (err) {
                      console.error("백엔드 기록 저장 실패", err);
                      window.alert("서버에 기록 저장 실패 😢\n잠시 후 다시 시도해 주세요.");
                    }
                  }}
                />
              </div>

              <PurchaseList
                records={filteredRecords}
                onDeleteRecord={async (id) => {
                  // 화면에서 먼저 제거
                  setRecords((prev) => prev.filter((r) => r.id !== id));

                  try {
                    // ✅ deleteRecord는 { itemId, id } 형태
                    await deleteServerRecord({ itemId: selectedOptionId, id });
                  } catch (err) {
                    console.error("백엔드 기록 삭제 실패", err);
                    window.alert("서버에서 기록 삭제 실패 😢\n화면만 먼저 반영됐을 수 있어요.");
                  }

                  showToast("기록 삭제 완료");
                }}
                onUpdateRecord={async (id, info) => {
                  if (!selectedOptionId) return;

                  const dateValue = info.date || undefined;
                  const priceValue =
                    info.price === "" || info.price == null ? undefined : Number(info.price);
                  const countValue =
                    info.count === "" || info.count == null ? undefined : Number(info.count);

                  try {
                    const updated = await updateServerRecord({
                      itemId: selectedOptionId,
                      id,
                      price: priceValue ?? null,
                      count: countValue ?? null,
                      date: dateValue ?? null,
                    });

                    setRecords((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              price: updated?.price ?? (priceValue ?? r.price),
                              count: updated?.count ?? (countValue ?? r.count),
                              date: ((updated?.date ?? dateValue ?? r.date) || "").slice(0, 10),
                            }
                          : r
                      )
                    );

                    showToast("기록 수정 완료");
                  } catch (err) {
                    console.error("백엔드 기록 수정 실패", err);
                    window.alert("서버에 기록 수정 실패 😢\n잠시 후 다시 시도해 주세요.");
                  }
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
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>옵션 메모</div>

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
                    cursor: "pointer",
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
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>옵션 추가</h4>

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
      if (typeof reader.result === "string") setEditModal({ id, value, image: reader.result });
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
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>옵션 수정</h3>

        <input
          type="text"
          value={value}
          onChange={(e) => setEditModal({ id, value: e.target.value, image })}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />

        <input type="file" accept="image/*" onChange={handleImage} style={{ marginTop: 8 }} />

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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={() => setEditModal(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
              border: "none",
              cursor: "pointer",
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
              border: "none",
              cursor: "pointer",
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              color: "black",
              border: "none",
              cursor: "pointer",
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
              border: "none",
              cursor: "pointer",
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
