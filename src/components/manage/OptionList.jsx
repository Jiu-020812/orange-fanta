import OptionCard from "./OptionCard";

export default function OptionList({
  options,
  selectedOptionId,
  representativeImageUrl,
  onSelect,
  onEdit,
  onDelete,
}) {
  const list = Array.isArray(options) ? options : [];

  return (
    <>
      {list.length === 0 && (
        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>옵션이 없습니다.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {list.map((opt) => {
          const displayImageUrl = opt.imageUrl || representativeImageUrl;

          return (
            <OptionCard
              key={opt.id}
              option={opt}
              isSelected={selectedOptionId === opt.id}
              displayImageUrl={displayImageUrl}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </>
  );
}
