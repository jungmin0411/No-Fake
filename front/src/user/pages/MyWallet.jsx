import { useEffect, useMemo, useState } from "react";
import mockWallet from "../data/mockWallet";
import NFTDetailModal from "../components/NFTDetailModal";
import { derivePuzzlePieces } from "../utils/derivePuzzlePieces";
import { getWalletMintedTickets } from "../utils/walletStorage";

const RESULT_LABELS = {
  first: "당첨",
  second: "당첨",
  lose: "미당첨",
  pending: "결과 대기",
};

const REWARD_LABELS = {
  first: "당첨권",
  second: "퍼즐조각",
  lose: "보상 없음",
  pending: "결과 공개 전",
};

const WINNING_RESULT_LABELS = {
  first: "1등 당첨",
  second: "2등 당첨",
};

export default function MyWallet({ revealState = {}, walletAddress = "" }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mintedTickets, setMintedTickets] = useState([]);

  useEffect(() => {
    const loadMintedTickets = () => {
      setMintedTickets(getWalletMintedTickets(walletAddress));
    };

    loadMintedTickets();
    window.addEventListener("minted-events-updated", loadMintedTickets);

    return () => {
      window.removeEventListener("minted-events-updated", loadMintedTickets);
    };
  }, [walletAddress]);

  const allTickets = useMemo(() => [...mockWallet.tickets, ...mintedTickets], [mintedTickets]);

  const ticketsWithDisplayStatus = useMemo(() => {
    return allTickets
      .map((ticket) => {
        const revealKey = ticket.eventSlug || ticket.slug || ticket.event?.slug || "";
        const revealMeta = revealState[revealKey] || {};
        const isEventRevealed = Boolean(revealMeta.isRevealed);
        const resolvedResult = revealMeta.result || ticket.result || "pending";

        return {
          ...ticket,
          resolvedResult,
          isEventRevealed,
          displayStatus: isEventRevealed
            ? RESULT_LABELS[resolvedResult] || RESULT_LABELS.lose
            : RESULT_LABELS.pending,
          displayReward: isEventRevealed
            ? REWARD_LABELS[resolvedResult] || REWARD_LABELS.lose
            : REWARD_LABELS.pending,
          displayUsageGuide: isEventRevealed
            ? resolvedResult === "first"
              ? ticket.usageGuide || "1등 보상을 사용할 수 있습니다."
              : resolvedResult === "second"
              ? "퍼즐조각이 지갑에 추가되었습니다."
              : "이번 래플은 미당첨입니다."
            : "결과 공개 후 확인할 수 있습니다.",
        };
      })
      .filter((ticket) => !(ticket.isEventRevealed && ticket.resolvedResult === "lose"));
  }, [allTickets, revealState]);

  const nftTickets = useMemo(
    () => ticketsWithDisplayStatus.filter((ticket) => !ticket.isEventRevealed || ticket.resolvedResult === "pending"),
    [ticketsWithDisplayStatus]
  );

  const winningTickets = useMemo(
    () => ticketsWithDisplayStatus.filter((ticket) => ticket.resolvedResult === "first"),
    [ticketsWithDisplayStatus]
  );

  const puzzlePieces = useMemo(() => derivePuzzlePieces(mintedTickets, revealState), [mintedTickets, revealState]);

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  return (
    <>
      <section className="wallet-page">
        <div className="page-heading">
          <h2>내 지갑</h2>
          <p>처음에는 NFT 티켓으로 보관되고, 공개 후 결과에 따라 당첨권 또는 퍼즐조각으로 이동합니다.</p>
        </div>

        <div className="wallet-summary-grid wallet-summary-grid--three">
          <div className="home-card wallet-summary-card">
            <span className="summary-label">NFT 티켓</span>
            <strong className="summary-value">{nftTickets.length}</strong>
          </div>

          <div className="home-card wallet-summary-card">
            <span className="summary-label">당첨권</span>
            <strong className="summary-value">{winningTickets.length}</strong>
          </div>

          <div className="home-card wallet-summary-card">
            <span className="summary-label">퍼즐조각</span>
            <strong className="summary-value">{puzzlePieces.length}</strong>
          </div>
        </div>

        <div className="home-card">
          <h3 className="card-title">NFT 티켓</h3>

          {nftTickets.length === 0 ? (
            <p className="helper-text">공개 전 상태의 NFT 티켓이 없습니다.</p>
          ) : (
            <div className="wallet-ticket-grid">
              {nftTickets.map((ticket) => (
                <div key={ticket.id} className="wallet-ticket-card">
                  <div className="wallet-ticket-image">
                    {ticket.image ? (
                      <img src={ticket.image} alt={ticket.title} />
                    ) : (
                      <div className="wallet-ticket-image-placeholder">NFT</div>
                    )}
                  </div>

                  <div className="wallet-ticket-body">
                    <strong className="wallet-ticket-title">{ticket.title}</strong>
                    <p className="wallet-ticket-event">{ticket.eventName}</p>
                    <span className="ticket-status-badge">{ticket.displayStatus}</span>

                    <button
                      type="button"
                      className="outline-btn wallet-detail-btn"
                      onClick={() => handleOpenDetail(ticket)}
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-card">
          <h3 className="card-title">당첨권</h3>

          {winningTickets.length === 0 ? (
            <p className="helper-text">1등 당첨권이 아직 없습니다.</p>
          ) : (
            <div className="wallet-ticket-grid">
              {winningTickets.map((ticket) => (
                <div key={`winning-${ticket.id}`} className="wallet-ticket-card">
                  <div className="wallet-ticket-image">
                    {ticket.image ? (
                      <img src={ticket.image} alt={ticket.title} />
                    ) : (
                      <div className="wallet-ticket-image-placeholder">당첨권</div>
                    )}
                  </div>

                  <div className="wallet-ticket-body">
                    <strong className="wallet-ticket-title">{ticket.title}</strong>
                    <p className="wallet-ticket-event">{ticket.eventName}</p>
                    <span className="ticket-status-badge">{WINNING_RESULT_LABELS[ticket.resolvedResult]}</span>

                    <button
                      type="button"
                      className="outline-btn wallet-detail-btn"
                      onClick={() => handleOpenDetail(ticket)}
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-card">
          <h3 className="card-title">퍼즐조각</h3>

          {puzzlePieces.length === 0 ? (
            <p className="helper-text">2등 당첨 시 퍼즐 이미지와 함께 이곳으로 이동합니다.</p>
          ) : (
            <div className="wallet-ticket-grid">
              {puzzlePieces.map((puzzle) => (
                <div key={puzzle.id} className="wallet-ticket-card">
                  <div className="wallet-ticket-image">
                    {puzzle.image ? (
                      <img src={puzzle.image} alt={puzzle.title} />
                    ) : (
                      <div className="wallet-ticket-image-placeholder">퍼즐</div>
                    )}
                  </div>

                  <div className="wallet-ticket-body">
                    <strong className="wallet-ticket-title">{puzzle.title}</strong>
                    <p className="wallet-ticket-event">{puzzle.eventSlug || "퍼즐 보상"}</p>
                    <span className="ticket-status-badge">2등 당첨</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <NFTDetailModal
        isOpen={isModalOpen}
        ticket={
          selectedTicket
            ? {
                ...selectedTicket,
                status: selectedTicket.displayStatus,
                reward: selectedTicket.displayReward,
                usageGuide: selectedTicket.displayUsageGuide,
              }
            : null
        }
        onClose={handleCloseDetail}
      />
    </>
  );
}
