import { Link } from "react-router-dom";
import { useState } from "react";

function EventCardImage({ thumbnail, title }) {
  const [hasError, setHasError] = useState(false);

  if (!thumbnail || hasError) {
    return null;
  }

  return (
    <div className="event-poster-image">
      <img
        src={thumbnail}
        alt={title}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function Home({ events = [] }) {
  return (
    <section className="home-page">
      <div className="page-heading">
        <h2>메인 홈</h2>
        <p>진행 중인 이벤트를 확인하고 원하는 래플에 참여하세요</p>
      </div>

      <section className="ongoing-events-section">
        <h3 className="section-title">진행중인 이벤트</h3>

        <div className="ongoing-events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-poster-card">
              <EventCardImage
                thumbnail={event.thumbnail}
                title={event.title}
              />

              <span className="event-badge">진행 중</span>

              <div className="event-poster-content">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>

              <div className="button-row">
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
    </section>
  );
}