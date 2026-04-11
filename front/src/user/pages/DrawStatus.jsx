import { useEffect, useMemo, useState } from "react";
import DrawResultModal from "../components/DrawResultModal";
import { getWalletRevealState, saveWalletRevealState } from "../utils/walletStorage";

const PUZZLE_IMAGE_URL =
  "https://nofake.s3.ap-northeast-2.amazonaws.com/images/post-reveal/2.png";

const getProductsFromEvent = (event) => [
  {
    rank: "1등",
    name: "선구매권",
    description: "관리자가 등록한 1등 대표 상품입니다.",
    quantity: event.rewardInfo?.first || "1등 0명",
    image: event.thumbnail || "",
  },
  {
    rank: "2등",
    name: "퍼즐 보상",
    description: "2등 당첨자에게 제공되는 퍼즐 조각입니다.",
    quantity: event.rewardInfo?.second || "2등 0명",
    image: PUZZLE_IMAGE_URL,
  },
];

const getResultLabel = (result) => {
  if (result === "first") return "1등";
  if (result === "second") return "2등";
  return "꽝";
};

export default function DrawStatus({ events = [], walletAddress = "" }) {
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [selectedEventSlug, setSelectedEventSlug] = useState("");
  const [checkedResults, setCheckedResults] = useState(() => {
    const revealState = getWalletRevealState(walletAddress);

    return Object.fromEntries(
      Object.entries(revealState).map(([slug, meta]) => [slug, Boolean(meta?.hasCheckedResult)])
    );
  });

  useEffect(() => {
    if (!events.length) {
      setSelectedEventSlug("");
      return;
    }

    setSelectedEventSlug((prev) =>
      prev && events.some((event) => event.slug === prev) ? prev : events[0].slug
    );
  }, [events]);

  useEffect(() => {
    const syncCheckedResults = () => {
      const revealState = getWalletRevealState(walletAddress);

      setCheckedResults(
        Object.fromEntries(
          Object.entries(revealState).map(([slug, meta]) => [slug, Boolean(meta?.hasCheckedResult)])
        )
      );
    };

    window.addEventListener("storage", syncCheckedResults);
    window.addEventListener("focus", syncCheckedResults);

    return () => {
      window.removeEventListener("storage", syncCheckedResults);
      window.removeEventListener("focus", syncCheckedResults);
    };
  }, [walletAddress]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.slug === selectedEventSlug) || events[0],
    [events, selectedEventSlug]
  );

  if (!selectedEvent) {
    return (
      <section className="draw-page">
        <div className="page-heading">
          <h2>드로우 현황</h2>
          <p>표시할 래플이 없습니다.</p>
        </div>
      </section>
    );
  }

  const { status, result } = selectedEvent;
  const isRevealed = status?.isRevealed ?? false;
  const participantCount = status?.participants ?? 0;
  const maxParticipants = status?.maxParticipants ?? 0;
  const hasCheckedResult = checkedResults[selectedEvent.slug] || Boolean(status?.hasCheckedResult);
  const currentStatusLabel = isRevealed
    ? hasCheckedResult
      ? getResultLabel(result)
      : "결과공개"
    : status?.statusText || "-";
  const currentStatusPill = isRevealed ? currentStatusLabel : status?.mintClosed ? "마감" : "진행중";
  const remainingTime = isRevealed
    ? hasCheckedResult
      ? "당첨 결과 확인 완료"
      : "결과 공개 완료"
    : status?.remainingTime ?? "-";
  const progressPercent =
    status?.progress ??
    (maxParticipants > 0 ? Math.min(Math.round((participantCount / maxParticipants) * 100), 100) : 0);
  const products = getProductsFromEvent(selectedEvent);

  const bannerTitle = isRevealed ? "드로우 결과를 확인해보세요" : "결과 공개 대기중";
  const bannerDescription = isRevealed
    ? "관리자가 결과를 공개했습니다. 당첨 결과를 확인해보세요."
    : "래플이 종료되면 관리자가 결과를 공개합니다.";
  const bannerButtonText = isRevealed ? "당첨 결과 확인" : "결과 공개 대기중";

  const handleOpenResult = () => {
    if (!isRevealed) return;

    const revealState = getWalletRevealState(walletAddress);
    const nextRevealState = {
      ...revealState,
      [selectedEvent.slug]: {
        ...(revealState[selectedEvent.slug] || {}),
        hasCheckedResult: true,
      },
    };

    saveWalletRevealState(walletAddress, nextRevealState);
    setCheckedResults((prev) => ({ ...prev, [selectedEvent.slug]: true }));
    setIsResultOpen(true);
  };

  return (
    <section className="draw-page">
      <div className="page-heading">
        <h2>드로우 현황</h2>
        <p>참여한 래플의 상태와 결과 공개 여부를 확인할 수 있습니다.</p>
      </div>

      <div className="draw-event-tabs">
        {events.map((event) => (
          <button
            key={event.slug}
            type="button"
            className={`draw-event-tab ${selectedEventSlug === event.slug ? "active" : ""}`}
            onClick={() => {
              setSelectedEventSlug(event.slug);
              setIsResultOpen(false);
            }}
          >
            {event.shortTitle}
          </button>
        ))}
      </div>

      <div className="selected-event-label">
        <strong>{selectedEvent.title}</strong>
      </div>

      <div className={`draw-banner ${isRevealed ? "revealed" : "waiting"}`}>
        <div className="draw-banner-icon">{isRevealed ? "당첨" : "대기"}</div>
        <h3>{bannerTitle}</h3>
        <p>{bannerDescription}</p>

        <button
          type="button"
          className={`banner-btn ${!isRevealed ? "disabled" : ""}`}
          onClick={handleOpenResult}
          disabled={!isRevealed}
        >
          {bannerButtonText}
        </button>
      </div>

      <div className="draw-content-grid">
        <div className="home-card">
          <h3 className="card-title">상품 정보</h3>

          <div className="draw-product-list">
            {products.map((product, index) => (
              <div key={index} className="draw-product-item">
                <div className="draw-product-left">
                  <div className="draw-product-thumb">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="draw-product-thumb-placeholder">{product.rank}</div>
                    )}
                  </div>
                  <div>
                    <span className="rank-badge">{product.rank}</span>
                    <strong>{product.name}</strong>
                    <p>{product.description}</p>
                  </div>
                </div>
                <span className="quantity-text">{product.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="home-card">
          <h3 className="card-title">실시간 참여 현황</h3>

          <div className="draw-live-status-card">
            <div className="draw-live-status-top">
              <div className="draw-live-status-item">
                <span className="summary-label">참여자 수</span>
                <strong>{participantCount}명</strong>
              </div>

              <div className="draw-live-status-item">
                <span className="summary-label">모집 인원</span>
                <strong>{maxParticipants}명</strong>
              </div>
            </div>

            <div className="draw-current-status-card">
              <div className="draw-current-status-copy">
                <span className="summary-label">현재 상태</span>
                <strong>{currentStatusLabel}</strong>
                <p>{remainingTime}</p>
              </div>
              <div
                className={`draw-current-status-pill draw-current-status-pill--${
                  isRevealed ? "revealed" : status?.mintClosed ? "closed" : "live"
                }`}
              >
                {currentStatusPill}
              </div>
            </div>

            <div className="draw-live-progress-header">
              <span>
                {participantCount} / {maxParticipants} 참여 중
              </span>
              <strong>{progressPercent}%</strong>
            </div>

            <div className="draw-live-progress-bar">
              <div className="draw-live-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <p className="helper-text center-text">상태값은 DB 기준으로 반영됩니다.</p>
          </div>
        </div>
      </div>

      <DrawResultModal isOpen={isResultOpen} onClose={() => setIsResultOpen(false)} result={result} />
    </section>
  );
}
