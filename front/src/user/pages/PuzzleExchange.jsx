import { useEffect, useMemo, useState } from "react";
import { derivePuzzlePieces } from "../utils/derivePuzzlePieces";
import { getWalletMintedTickets } from "../utils/walletStorage";

const TARGET_COUNT = 10;
const REWARDS = [
  {
    title: "20% 할인 쿠폰",
    description: "퍼즐 10개를 모아 가장 높은 할인 쿠폰으로 교환합니다.",
    need: 10,
  },
  {
    title: "15% 할인 쿠폰",
    description: "퍼즐 8개를 모아 할인 쿠폰으로 교환합니다.",
    need: 8,
  },
  {
    title: "10% 할인 쿠폰",
    description: "퍼즐 6개를 모아 할인 쿠폰으로 교환합니다.",
    need: 6,
  },
];

const PROCESS = [
  "래플에서 2등 당첨 시 퍼즐조각 1개가 적립됩니다.",
  "보유한 퍼즐조각을 선택하고 교환 가능한 보상을 확인합니다.",
  "필요 수량을 모으면 쿠폰 보상으로 교환할 수 있습니다.",
];

export default function PuzzleExchange({ revealState = {}, walletAddress = "" }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const loadPieces = () => {
      const mintedTickets = getWalletMintedTickets(walletAddress);
      setPieces(derivePuzzlePieces(mintedTickets, revealState));
    };

    loadPieces();
    window.addEventListener("minted-events-updated", loadPieces);

    return () => {
      window.removeEventListener("minted-events-updated", loadPieces);
    };
  }, [revealState, walletAddress]);

  const ownedCount = pieces.length;
  const selectedPieces = useMemo(() => pieces.filter((piece) => piece.selected), [pieces]);
  const selectedCount = selectedPieces.length;
  const progressPercent = TARGET_COUNT > 0 ? Math.min((ownedCount / TARGET_COUNT) * 100, 100) : 0;

  const helperText =
    ownedCount >= TARGET_COUNT
      ? "교환 가능한 조건을 충족했습니다."
      : `${TARGET_COUNT - ownedCount}개가 더 필요합니다.`;

  const handleTogglePiece = (pieceId) => {
    setPieces((prev) =>
      prev.map((piece) => (piece.id === pieceId ? { ...piece, selected: !piece.selected } : piece))
    );
  };

  const handleExchange = (requiredCount) => {
    if (selectedCount < requiredCount) {
      window.alert(`퍼즐 ${requiredCount}개가 필요합니다.`);
      return;
    }

    const selectedIdsToRemove = selectedPieces.slice(0, requiredCount).map((piece) => piece.id);
    setPieces((prev) => prev.filter((piece) => !selectedIdsToRemove.includes(piece.id)));
    window.alert(`퍼즐 ${requiredCount}개를 교환했습니다.`);
  };

  return (
    <section className="puzzle-page">
      <div className="page-heading">
        <h2>퍼즐 교환소</h2>
        <p>2등 당첨으로 모은 퍼즐조각을 쿠폰 보상으로 교환할 수 있습니다.</p>
      </div>

      <div className="puzzle-top-card">
        <span className="puzzle-top-label">현재 보유 퍼즐조각</span>
        <strong>
          {ownedCount} / {TARGET_COUNT}
        </strong>

        <div className="progress-track">
          <div className="progress-fill gradient" style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="helper-text">{helperText}</p>
      </div>

      <div className="puzzle-content-grid">
        <div className="home-card">
          <div className="card-header-row">
            <h3 className="card-title">보유 퍼즐조각</h3>
            <span className="status-badge purple">{ownedCount}개</span>
          </div>

          {pieces.length === 0 ? (
            <p className="helper-text center-text">아직 적립된 퍼즐조각이 없습니다.</p>
          ) : (
            <>
              <div className="puzzle-piece-grid">
                {pieces.map((piece) => (
                  <button
                    key={piece.id}
                    type="button"
                    className={`puzzle-piece-item ${piece.selected ? "selected" : ""}`}
                    onClick={() => handleTogglePiece(piece.id)}
                  >
                    {piece.image ? (
                      <div className="puzzle-piece-image-wrap">
                        <img src={piece.image} alt={piece.title} className="puzzle-piece-image" />
                      </div>
                    ) : (
                      <div className="puzzle-piece-icon">퍼즐</div>
                    )}
                    <strong>{piece.title}</strong>
                  </button>
                ))}
              </div>

              <p className="helper-text center-text">선택한 퍼즐: {selectedCount}개</p>
            </>
          )}
        </div>

        <div className="puzzle-right-column">
          <div className="home-card">
            <h3 className="card-title">교환 가능한 보상</h3>

            <div className="exchange-reward-list">
              {REWARDS.map((reward, index) => {
                const canExchange = selectedCount >= reward.need;
                const remainCount = Math.max(reward.need - selectedCount, 0);
                const actionText = canExchange ? "교환하기" : `${remainCount}개 더 필요`;

                return (
                  <div
                    key={index}
                    className={canExchange ? "exchange-reward-item active" : "exchange-reward-item"}
                  >
                    <strong>{reward.title}</strong>
                    <p>{reward.description}</p>

                    <div className="info-row">
                      <span>필요 수량</span>
                      <span>{reward.need}개</span>
                    </div>

                    {canExchange ? (
                      <button type="button" className="exchange-btn" onClick={() => handleExchange(reward.need)}>
                        {actionText}
                      </button>
                    ) : (
                      <div className="disabled-box">{actionText}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="home-card">
            <h3 className="card-title">교환 프로세스</h3>

            <ol className="process-list">
              {PROCESS.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
