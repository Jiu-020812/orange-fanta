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

  const [items, setItems] = useState([]);
  const [records, setRecords] = useState([]);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [toast, setToast] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [memoText, setMemoText] = useState("");

  const isShoes = true;

  /* ---------------- 토스트 ---------------- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ---------------- items 로드 ---------------- */
  useEffect(() => {
    async function loadItems() {
      try {
        const data = await fetchItems();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("아이템 불러오기 실패", err);
      }
    }
    loadItems();
  }, []);

  /* ---------------- 현재 name 옵션 ---------------- */
  const options = useMemo(() => {
    return items.filter((i) => norm(i.name) === norm(decodedName));
  }, [items, decodedName]);

  /* ✅ 대표 이미지 (같은 name 중 첫 imageUrl) */
  const representativeImageUrl = useMemo(() => {
    return options.find((o) => o.imageUrl)?.imageUrl || null;
  }, [options]);

  const selectedOption =
    options.find((o) => o.id === selectedOptionId) || null;

  /* ---------------- records 로드 ---------------- */
  useEffect(() => {
    if (!selectedOptionId) {
      setRecords([]);
      return;
    }

    async function loadRecords() {
      try {
        const data = await fetchRecords(selectedOptionId);
        setRecords(
          Array.isArray(data)
            ? data.map((r) => ({
                ...r,
                date: (r.date || "").slice(0, 10),
              }))
            : []
        );
      } catch (err) {
        console.error("기록 불러오기 실패", err);
      }
    }

    loadRecords();
  }, [selectedOptionId]);

  /* ---------------- 메모 ---------------- */
  useEffect(() => {
    setMemoText(selectedOption?.memo ?? "");
  }, [selectedOption]);

  const handleSaveMemo = async () => {
    if (!selectedOption) return;
    try {
      const updated = await updateServerItem(selectedOption.id, {
        memo: memoText,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      showToast("메모 저장 완료");
    } catch {
      alert("메모 저장 실패");
    }
  };

  /* ---------------- 옵션 추가 ---------------- */
  const handleAddOption = async ({ value, image }) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      const created = await createItem({
        name: decodedName,
        size: trimmed,
        imageUrl: image || null,
      });
      setItems((prev) => [...prev, created]);
      setSelectedOptionId(created.id);
      showToast("옵션 추가 완료");
    } catch {
      alert("옵션 추가 실패");
    }
  };

  /* ---------------- 옵션 수정 ---------------- */
  const handleSaveEditOption = async () => {
    const { id, value, image } = editModal;
    try {
      const updated = await updateServerItem(id, {
        size: value.trim(),
        imageUrl: image || null,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      setEditModal(null);
      showToast("옵션 수정 완료");
    } catch {
      alert("옵션 수정 실패");
    }
  };

  /* ---------------- 옵션 삭제 ---------------- */
  const handleDeleteOption = async () => {
    const id = deleteModal;
    try {
      await deleteServerItem(id);
    } catch {}
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteModal(null);
    setSelectedOptionId(null);
    showToast("옵션 삭제 완료");
  };

  /* ---------------- 렌더 ---------------- */
  return (
    <div style={{ padding: 24 }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%" }}>
          {toast}
        </div>
      )}

      <button onClick={() => navigate("/manage")}>← 뒤로</button>
      <h2>{decodedName}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 좌측 옵션 */}
        <div>
          <h3>옵션 목록</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {options.map((opt) => {
              const displayImage =
                opt.imageUrl || representativeImageUrl;

              return (
                <div
                  key={opt.id}
                  style={{
                    border:
                      selectedOptionId === opt.id
                        ? "2px solid blue"
                        : "1px solid #ddd",
                    padding: 10,
                    borderRadius: 12,
                  }}
                >
                  <div onClick={() => setSelectedOptionId(opt.id)}>
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt=""
                        style={{
                          width: "100%",
                          height: 110,
                          objectFit: "cover",
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 110,
                          background: "#eee",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        이미지 없음
                      </div>
                    )}
                    <div>{opt.size}</div>
                  </div>

                  <button
                    onClick={() =>
                      setEditModal({
                        id: opt.id,
                        value: opt.size,
                        image: opt.imageUrl,
                      })
                    }
                  >
                    수정
                  </button>
                  <button onClick={() => setDeleteModal(opt.id)}>
                    삭제
                  </button>
                </div>
              );
            })}
          </div>

          <OptionAddBox isShoes={isShoes} onAdd={handleAddOption} />
        </div>

        {/* 우측 기록 */}
        <div>
          {!selectedOptionId ? (
            <div>옵션을 선택하세요</div>
          ) : (
            <>
              <StatsSection
                records={records}
                itemName={`${decodedName} (${selectedOption?.size})`}
              />

              <PurchaseForm
                onAddRecord={async (info) => {
                  const created = await createRecord({
                    itemId: selectedOptionId,
                    price: info.price,
                    count: info.count || 1,
                    date: info.date,
                  });
                  setRecords((p) => [...p, created]);
                }}
              />

              <PurchaseList
                records={records}
                onDeleteRecord={async (id) => {
                  await deleteServerRecord({
                    itemId: selectedOptionId,
                    id,
                  });
                  setRecords((p) => p.filter((r) => r.id !== id));
                }}
                onUpdateRecord={async (id, info) => {
                  const updated = await updateServerRecord({
                    itemId: selectedOptionId,
                    id,
                    ...info,
                  });
                  setRecords((p) =>
                    p.map((r) => (r.id === id ? updated : r))
                  );
                }}
              />

              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
              />
              <button onClick={handleSaveMemo}>메모 저장</button>
            </>
          )}
        </div>
      </div>

      {editModal && (
        <EditOptionModal
          editModal={editModal}
          setEditModal={setEditModal}
          onSave={handleSaveEditOption}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          message="정말 삭제?"
          onCancel={() => setDeleteModal(null)}
          onConfirm={handleDeleteOption}
        />
      )}
    </div>
  );
}

/* ======================= 이하 컴포넌트 ======================= */

function OptionAddBox({ isShoes, onAdd }) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState("");

  const submit = () => {
    onAdd({ value, image });
    setValue("");
    setImage("");
  };

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <input type="file" onChange={(e) => {
        const r = new FileReader();
        r.onload = () => setImage(r.result);
        r.readAsDataURL(e.target.files[0]);
      }} />
      <button onClick={submit}>추가</button>
    </div>
  );
}

function EditOptionModal({ editModal, setEditModal, onSave }) {
  return (
    <div>
      <input
        value={editModal.value}
        onChange={(e) =>
          setEditModal({ ...editModal, value: e.target.value })
        }
      />
      <button onClick={onSave}>저장</button>
      <button onClick={() => setEditModal(null)}>취소</button>
    </div>
  );
}

function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <div>
      <div>{message}</div>
      <button onClick={onCancel}>취소</button>
      <button onClick={onConfirm}>삭제</button>
    </div>
  );
}