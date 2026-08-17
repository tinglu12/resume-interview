export function PlaceholderText({ text }: { text: string }) {
  const parts = text.split(/(\[X\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part === "[X]" ? (
          <span
            key={i}
            className="font-mono text-[10px] bg-proof-accent/25 text-proof-fg rounded px-1 py-[1px]"
          >
            [X]
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
