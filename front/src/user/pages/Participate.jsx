import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { mintMysteryBox } from "../services/mint";
import SimpleToast from "../components/SimpleToast";

export default function Participate({ walletAddress, events = [] }) {
  const { slug } = useParams();
  const [isMinting, setIsMinting] = useState(false);
  const [mintedEvents, setMintedEvents] = useState(() => {
    const saved = localStorage.getItem("mintedEvents");
    return saved ? JSON.parse(saved) : {};
  });
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const event = useMemo(() => {
    return events.find((item) => item.slug === slug);
  }, [events, slug]);

  const isWalletConnected = Boolean(walletAddress);
  const isMinted = event ? Boolean(mintedEvents[event.slug]) : false;

  const showToast = (message, type) => {
    setToast({
      open: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2200);
  };

  const handleMint = async () => {
    if (!isWalletConnected) {
      showToast("지갑 연결 후 다시 시도해 주세요.", "error");
      return;
    }

    if (!event) return;

    if (isMinted) {
      showToast("이미 민팅이 완료되었습니다.", "error");
      return;
    }

    try {
      setIsMinting(true);

      await mintMysteryBox({
        eventSlug: event.slug,
        walletAddress,
      });

      setMintedEvents((prev) => {
        const next = {
          ...prev,
          [event.slug]: true,
        };

        localStorage.setItem("mintedEvents", JSON.stringify(next));
        return next;
      });

      const savedMintedTickets = localStorage.getItem("mintedTickets");
      const mintedTickets = savedMintedTickets ? JSON.parse(savedMintedTickets) : [];

      const alreadyExists = mintedTickets.some(
        (ticket) =>
          ticket.eventSlug === event.slug &&
          ticket.source === "minted"
      );

      if (!alreadyExists) {
  const statusText =
    event.result === "first"
      ? "1등"
      : event.result === "second"
      ? "2등"
      : "미당첨";

  const rewardText =
    event.result === "first"
      ? event.rewardInfo?.first || "1등 보상"
      : event.result === "second"
      ? event.rewardInfo?.second || "2등 보상"
      : "당첨 내역 없음";

  const usageGuideText =
    event.result === "first"
      ? "당첨 보상을 확인하고 사용 안내를 확인하세요."
      : event.result === "second"
      ? "퍼즐 조각 보상을 확인하세요."
      : "아쉽지만 이번 이벤트는 미당첨입니다.";

  const newTicket = {
    id: Date.now(),
    eventSlug: event.slug,
    title: `${event.shortTitle} 미스터리 박스`,
    eventName: event.shortTitle,
    image: "",
    contractAddress: event.transparency.contractAddress,
    mintedDate: new Date().toLocaleDateString("ko-KR"),
    expiryDate: "2026-12-31",
    status: statusText,
    reward: rewardText,
    usageGuide: usageGuideText,
    isPrePurchaseReward: event.result === "first",
    source: "minted",
  };

  const nextTickets = [...mintedTickets, newTicket];
  localStorage.setItem("mintedTickets", JSON.stringify(nextTickets));
}

      showToast("민팅되었습니다.", "success");
    } catch (error) {
      console.error(error);
      showToast("민팅이 실패하였습니다. 다시 시도해 주세요.", "error");
    } finally {
      setIsMinting(false);
    }
  };

  if (!event) {
    return (
      <section className="participate-page">
        <div className="page-heading">
          <h2>이벤트를 찾을 수 없습니다</h2>
          <p>존재하지 않거나 삭제된 이벤트입니다.</p>
        </div>
      </section>
    );
  }

  const { title, overviewSubtitle, status, transparency, rewardInfo } = event;

  return (
    <>
      <section className="participate-page">
        <div className="page-heading">
          <h2>{title}</h2>
          <p>{overviewSubtitle}</p>
        </div>

        <div className="participate-mint-top">
          <div className="home-card mint-top-card">
            <h3 className="card-title">미스터리 박스 민팅</h3>

            <div className="mint-card-body">
              <div className="mint-placeholder">BOX</div>

              <p className="mint-card-title">{event.mintTitle}</p>
              <p className="mint-card-desc">{event.mintDescription}</p>

            

              <button
                type="button"
                className={`mint-btn ${isMinted ? "completed" : ""}`}
                onClick={handleMint}
                disabled={!isWalletConnected || isMinting || isMinted}
              >
                {isMinted
                  ? "민팅 완료"
                  : isMinting
                  ? "민팅 처리 중..."
                  : "민팅하기"}
              </button>
            </div>
          </div>
        </div>

        <div className="participate-overview-grid">
          <div className="overview-column">
            <div className="home-card">
              <h3 className="card-title">이벤트 상태</h3>

              <div className="info-row">
                <span>참여자 수</span>
                <span>
                  {status.participants} / {status.maxParticipants}
                </span>
              </div>

              <div className="info-row">
                <span>당첨자 수</span>
                <span>{status.winners}</span>
              </div>

              <div className="divider" />

              <div className="info-row">
                <span>현재 상태</span>
                <span className="status-active">{status.statusText}</span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill orange"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>

            <div className="home-card">
              <h3 className="card-title">{rewardInfo.title}</h3>

              <div className="info-box">
                <span className="info-label">1등 보상</span>
                <strong>{rewardInfo.first}</strong>
              </div>

              <div className="info-box">
                <span className="info-label">2등 보상</span>
                <strong>{rewardInfo.second}</strong>
              </div>
            </div>
          </div>

          {/* <div className="overview-column">
            <div className="home-card">
              <h3 className="card-title">투명성 센터</h3>

              <div className="info-box">
                <span className="info-label">컨트랙트 주소</span>
                <strong>{transparency.contractAddress}</strong>
              </div>

              <div className="info-box">
                <span className="info-label">원본 증명 해시</span>
                <strong>{transparency.provenanceHash}</strong>
              </div>

              <div className="notice-box">
                <p>{transparency.description1}</p>
                <p>{transparency.description2}</p>
              </div>

              <button type="button" className="full-btn">
                블록체인에서 확인
              </button>
            </div>
          </div> */}
        </div>

        <div className="participate-guide-card">
          <h3>참여 안내</h3>
          <ul>
            <li>이벤트 상태와 보상 정보를 확인한 뒤 참여할 수 있습니다.</li>
            <li>미스터리 박스를 민팅하면 이벤트 참여가 완료됩니다.</li>
            <li>당첨 결과는 내 지갑 또는 드로우 현황에서 확인할 수 있습니다.</li>
            <li>모든 추첨 과정은 투명성 센터에서 검증 가능합니다.</li>
          </ul>
        </div>
      </section>

      <SimpleToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}