export default function Toast({ message }) {
  if (!message) return null;

  return (
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
      {message}
    </div>
  );
}
