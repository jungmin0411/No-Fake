import { Link } from "react-router-dom";
import mockHome from "../data/mockHome";
import mockEvents from "../data/mockEvents";

export default function Home() {
  const { rewards, puzzleExchange } = mockHome;

  return (
    <section className="home-page">
      <div className="page-heading">
        <h2>메인 홈</h2>
        <p>진행 중인 이벤트를 확인하고 원하는 래플에 참여하세요</p>
      </div>

      <section className="ongoing-events-section">
        <h3 className="section-title">진행중인 이벤트</h3>

        <div className="ongoing-events-grid">
          {mockEvents.map((event) => (
            <div key={event.id} className="event-poster-card">
              <span className="event-badge">진행 중</span>

              <div className="event-poster-content">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>

              <div className="button-row">
                <Link
                  to={`/event-overview/${event.slug}`}
                  className="half-btn link-btn"
                >
                  이벤트 개요 보기
                </Link>

                <Link
                  to={`/participate/${event.slug}`}
                  className="half-btn link-btn"
                >
                  참여하기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-bottom-grid">
        <div className="home-card">
          <h3 className="card-title">내 보상</h3>

          <div className="reward-box">
            <div className="info-row">
              <span>퍼즐 조각</span>
              <span>
                {rewards.puzzleCount} / {rewards.puzzleGoal}
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill purple"
                style={{
                  width: `${(rewards.puzzleCount / rewards.puzzleGoal) * 100}%`,
                }}
              />
            </div>
          </div>

          {rewards.hasPrePurchase && (
            <div className="prepurchase-box">
              <strong>선구매권</strong>
              <p>{rewards.prePurchaseText}</p>
            </div>
          )}

          <div className="button-row">
            <button className="half-btn">사용하기</button>
            <button className="half-btn">교환소 이동</button>
          </div>
        </div>

        <div className="home-card">
          <h3 className="card-title">퍼즐 교환소</h3>

          <div className="puzzle-big-number">
            <span>현재 보유 퍼즐 조각</span>
            <strong>
              {puzzleExchange.currentPieces} / {puzzleExchange.targetPieces}
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill gradient"
              style={{
                width: `${
                  (puzzleExchange.currentPieces / puzzleExchange.targetPieces) * 100
                }%`,
              }}
            />
          </div>

          <div className="reward-preview">
            <span className="info-label">교환 가능 보상</span>
            <strong>{puzzleExchange.rewardName}</strong>
          </div>

          <div className="disabled-box">{puzzleExchange.neededText}</div>
          <p className="helper-text">{puzzleExchange.guideText}</p>
        </div>
      </section>
    </section>
  );
}