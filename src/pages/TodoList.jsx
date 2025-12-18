import { useEffect, useState } from "react";

const MAX_VISIBLE = 6; // 메모지 안에 보여줄 최대 개수

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [showAll, setShowAll] = useState(false); // 더보기 모달

  // 로컬스토리지 로드
  useEffect(() => {
    const saved = localStorage.getItem("today_todos_memo");
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem("today_todos_memo", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!text.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: text.trim(), done: false },
    ]);
    setText("");
  };

  const toggleDone = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const visibleTodos =
    todos.length > MAX_VISIBLE ? todos.slice(0, MAX_VISIBLE) : todos;
  const hiddenCount =
    todos.length > MAX_VISIBLE ? todos.length - MAX_VISIBLE : 0;

  return (
    <>
      {/* 메모지 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 340,
          backgroundColor: "transparent", // 파란 배경 제거
          borderRadius: 20,
          padding: 0,
          boxShadow: "none",
          boxSizing: "border-box",
        }}
      >
        {/* 테이프 두 개 (원하면 지워도 됨) */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 62,
            width: 70,
            height: 18,
            backgroundColor: "rgba(255,255,255,0.75)",
            transform: "rotate(-4deg)",
            boxShadow: "0 2px 4px rgba(15,23,42,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 56,
            width: 70,
            height: 18,
            backgroundColor: "rgba(255,255,255,0.8)",
            transform: "rotate(5deg)",
            boxShadow: "0 2px 4px rgba(15,23,42,0.12)",
          }}
        />

        {/* 노란 메모지 본체 */}
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            backgroundColor: "#fff7dd",
            border: "1px solid #f4d48d",
            padding: "18px 16px 16px",
            boxShadow: "0 6px 14px rgba(15,23,42,0.18)",
            height: 360, // 고정 높이
            boxSizing: "border-box",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 26px)",
          }}
        >
          {/* 제목 */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 10,
              color: "#3f3a2c",
            }}
          >
            ✔ 오늘 할 일
          </div>

          {/* 입력 */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <input
              type="text"
              placeholder="할 일 입력"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // ✅한글 조합 중일 때 Enter 무시 (마지막 글자 두 번 생기는 문제 방지)
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTodo();
                }
              }}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: 10,
                border: "1px solid #e5cf8c",
                fontSize: 13,
                outline: "none",
                backgroundColor: "rgba(255,255,255,0.7)",
              }}
            />
            <button
              onClick={addTodo}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "none",
                backgroundColor: "#f97316",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              추가
            </button>
          </div>

          {/* 리스트 (고정 높이 내, 스크롤 없음 / 일부만 표시) */}
          <div
            style={{
              height: 360 - 18 - 10 - 10 - 32, // 대략 제목/입력 영역 뺀 공간
              display: "flex",
              flexDirection: "column",
              justifyContent:
                todos.length === 0 ? "center" : "flex-start",
              gap: 6,
            }}
          >
            {todos.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(63,58,44,0.6)",
                }}
              >
                오늘 해야 할 일을 적어보세요 :)
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {visibleTodos.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: t.done
                          ? "rgba(63,58,44,0.5)"
                          : "#3f3a2c",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={() => toggleDone(t.id)}
                          style={{
                            width: 16,
                            height: 16,
                            cursor: "pointer",
                          }}
                        />
                        <span
                          style={{
                            textDecoration: t.done
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {t.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTodo(t.id)}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#b91c1c",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>

                {/* 숨겨진 항목이 있을 경우 더보기 */}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    style={{
                      marginTop: 4,
                      border: "none",
                      background: "none",
                      padding: 0,
                      fontSize: 12,
                      color: "#2563eb",
                      cursor: "pointer",
                      alignSelf: "flex-start",
                    }}
                  >
                    외 {hiddenCount}개 더보기…
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 전체 보기 모달 */}
      {showAll && todos.length > MAX_VISIBLE && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
          onClick={() => setShowAll(false)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: 420,
              maxHeight: "70vh",
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 18,
              boxShadow: "0 10px 30px rgba(15,23,42,0.3)",
              boxSizing: "border-box",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않게
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                오늘 할 일 전체 보기
              </div>
              <button
                onClick={() => setShowAll(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                닫기 ✕
              </button>
            </div>

            {todos.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                아직 등록된 할 일이 없습니다.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {todos.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 13,
                      color: t.done ? "#9ca3af" : "#111827",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleDone(t.id)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                        }}
                      />
                      <span
                        style={{
                          textDecoration: t.done
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {t.text}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTodo(t.id)}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#dc2626",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}