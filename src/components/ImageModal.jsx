import { useEffect } from "react";

/**
 * 이미지 확대 모달
 * - 클릭하면 큰 화면으로 이미지 보기
 * - ESC 키 또는 배경 클릭으로 닫기
 */
export default function ImageModal({ imageUrl, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // 모달 열릴 때 스크롤 방지
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        cursor: "zoom-out",
      }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          color: "#111827",
          fontSize: "24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        ×
      </button>

      {/* 이미지 */}
      <img
        src={imageUrl}
        alt="확대 이미지"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          objectFit: "contain",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          cursor: "default",
        }}
      />

      {/* 안내 텍스트 */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#ffffff",
          fontSize: "14px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          padding: "8px 16px",
          borderRadius: "20px",
          pointerEvents: "none",
        }}
      >
        ESC 키 또는 배경을 클릭하여 닫기
      </div>
    </div>
  );
}
