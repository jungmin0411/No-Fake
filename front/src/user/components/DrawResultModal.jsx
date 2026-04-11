export default function DrawResultModal({ isOpen, onClose, result }) {
  if (!isOpen) return null;

  const resultMap = {
    first: {
      badge: "1등",
      title: "1등 당첨!",
      desc: "축하드립니다. 한정 NFT 선구매권에 당첨되셨습니다.",
      className: "first",
    },
    second: {
      badge: "2등",
      title: "2등 당첨!",
      desc: "축하드립니다. 퍼즐 조각 보상에 당첨되셨습니다.",
      className: "second",
    },
    lose: {
      badge: "미당첨",
      title: "다음 기회에",
      desc: "아쉽지만 이번 이벤트는 미당첨입니다. 다음 이벤트에 다시 도전해보세요.",
      className: "lose",
    },
  };

  const current = resultMap[result] || resultMap.lose;

  return (
    <div className="draw-result-overlay" onClick={onClose}>
      <div className={`draw-result-modal ${current.className}`} onClick={(e) => e.stopPropagation()}>
        <div className="draw-result-top">
          <span className={`draw-result-chip ${current.className}`}>{current.badge}</span>

          <button type="button" className="draw-result-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="draw-result-content">
          <div className={`draw-result-icon ${current.className}`}>
            {current.className === "first" ? "🏆" : current.className === "second" ? "🧩" : "•"}
          </div>

          <h2>{current.title}</h2>
          <p>{current.desc}</p>
        </div>

        <div className="draw-result-footer">
          <button type="button" className="draw-result-confirm" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
