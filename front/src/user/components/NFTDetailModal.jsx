import { useNavigate } from "react-router-dom";

export default function NFTDetailModal({ isOpen, ticket, onClose }) {
  const navigate = useNavigate();

  if (!isOpen || !ticket) return null;

  const handleUseTicket = () => {
    if (!ticket.eventSlug) return;
    navigate(`/participate/${ticket.eventSlug}`);
    onClose();
  };

  return (
    <div className="nft-modal-overlay" onClick={onClose}>
      <div className="nft-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="nft-modal-close" onClick={onClose}>
          닫기
        </button>

        <div className="nft-modal-image-wrap">
          {ticket.image ? (
            <img src={ticket.image} alt={ticket.title} className="nft-modal-image" />
          ) : (
            <div className="nft-modal-image-placeholder">NFT</div>
          )}
        </div>

        <div className="nft-modal-body">
          <h3>{ticket.title}</h3>
          <p>{ticket.eventName}</p>

          <div className="nft-modal-info">
            <div className="info-row">
              <span>상태</span>
              <strong>{ticket.status}</strong>
            </div>

            <div className="info-row">
              <span>보상</span>
              <strong>{ticket.reward}</strong>
            </div>

            <div className="info-row">
              <span>민팅일</span>
              <strong>{ticket.mintedDate || "-"}</strong>
            </div>

            <div className="info-row">
              <span>만료일</span>
              <strong>{ticket.expiryDate || "-"}</strong>
            </div>

            <div className="info-row">
              <span>컨트랙트 주소</span>
              <strong>{ticket.contractAddress || "-"}</strong>
            </div>
          </div>

          <div className="notice-box">
            <p>{ticket.usageGuide || "사용 안내 정보가 없습니다."}</p>
          </div>

          {ticket.isPrePurchaseReward && ticket.status === "당첨" && (
            <button type="button" className="full-btn" onClick={handleUseTicket}>
              사용하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
