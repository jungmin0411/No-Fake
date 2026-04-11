// import { useMemo, useState } from "react";

// const eventMap = {
//   jordan: {
//     title: "조던 신발 선구매 이벤트",
//     subtitle: "한정판 조던 신발 선구매 기회를 위한 래플 이벤트입니다.",
//     status: {
//       participants: 12,
//       maxParticipants: 30,
//       winners: 3,
//       statusText: "참여 가능",
//       progress: 55,
//     },
//     transparency: {
//       contractAddress: "0x1234...5678",
//       provenanceHash: "0xabcd...ef01",
//       description1: "모든 참여 기록과 추첨 결과는 블록체인에 기록됩니다.",
//       description2: "누구나 검증 가능한 투명한 이벤트 흐름을 제공합니다.",
//     },
//     rewardInfo: {
//       title: "보상 정보",
//       first: "1등: 조던 선구매권",
//       second: "2등: 퍼즐 조각 지급",
//     },
//   },
//   baekseok: {
//     title: "백석대 콜라보 이벤트",
//     subtitle: "백석대 콜라보 굿즈와 특별 혜택을 위한 이벤트입니다.",
//     status: {
//       participants: 18,
//       maxParticipants: 50,
//       winners: 5,
//       statusText: "진행 중",
//       progress: 36,
//     },
//     transparency: {
//       contractAddress: "0x9876...4321",
//       provenanceHash: "0xbcde...fa22",
//       description1: "이벤트 참여 이력과 당첨 결과는 온체인에 반영됩니다.",
//       description2: "콜라보 이벤트의 모든 절차는 투명성 센터에서 확인 가능합니다.",
//     },
//     rewardInfo: {
//       title: "보상 정보",
//       first: "1등: 콜라보 한정 선구매권",
//       second: "2등: 퍼즐 조각 지급",
//     },
//   },
// };

// export default function EventOverview() {
//   const [selectedEvent, setSelectedEvent] = useState("jordan");

//   const currentEvent = useMemo(() => eventMap[selectedEvent], [selectedEvent]);

//   const { title, subtitle, status, transparency, rewardInfo } = currentEvent;

//   return (
//     <section className="event-overview-page">
//       <div className="page-heading">
//         <h2>이벤트 개요</h2>
//         <p>진행 중인 이벤트를 선택해 참여 현황과 상태를 확인하세요</p>
//       </div>

//       <div className="event-selector">
//         <button
//           type="button"
//           className={selectedEvent === "jordan" ? "event-tab active" : "event-tab"}
//           onClick={() => setSelectedEvent("jordan")}
//         >
//           조던 신발 선구매
//         </button>

//         <button
//           type="button"
//           className={selectedEvent === "baekseok" ? "event-tab active" : "event-tab"}
//           onClick={() => setSelectedEvent("baekseok")}
//         >
//           백석대 콜라보
//         </button>
//       </div>

//       <div className="event-overview-hero">
//         <span className="event-badge">진행 중</span>
//         <h3>{title}</h3>
//         <p>{subtitle}</p>
//       </div>

//       <div className="event-overview-grid">
//         <div className="overview-column">
//           <div className="home-card">
//             <h3 className="card-title">이벤트 상태</h3>

//             <div className="info-row">
//               <span>참여자 수</span>
//               <span>
//                 {status.participants} / {status.maxParticipants}
//               </span>
//             </div>

//             <div className="info-row">
//               <span>당첨자 수</span>
//               <span>{status.winners}</span>
//             </div>

//             <div className="divider" />

//             <div className="info-row">
//               <span>현재 상태</span>
//               <span className="status-active">{status.statusText}</span>
//             </div>

//             <div className="progress-track">
//               <div
//                 className="progress-fill orange"
//                 style={{ width: `${status.progress}%` }}
//               />
//             </div>
//           </div>

//           <div className="home-card">
//             <h3 className="card-title">{rewardInfo.title}</h3>

//             <div className="info-box">
//               <span className="info-label">1등 보상</span>
//               <strong>{rewardInfo.first}</strong>
//             </div>

//             <div className="info-box">
//               <span className="info-label">2등 보상</span>
//               <strong>{rewardInfo.second}</strong>
//             </div>
//           </div>
//         </div>

//         <div className="overview-column">
//           <div className="home-card">
//             <h3 className="card-title">투명성 센터</h3>

//             <div className="info-box">
//               <span className="info-label">컨트랙트 주소</span>
//               <strong>{transparency.contractAddress}</strong>
//             </div>

//             <div className="info-box">
//               <span className="info-label">원본 증명 해시</span>
//               <strong>{transparency.provenanceHash}</strong>
//             </div>

//             <div className="notice-box">
//               <p>{transparency.description1}</p>
//               <p>{transparency.description2}</p>
//             </div>

//             <button className="full-btn">블록체인에서 확인</button>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }


//
import { Link, useNavigate, useParams } from "react-router-dom";

export default function EventOverview({ events = [] }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  // 1) slug 없으면 카드 목록 화면
  if (!slug) {
    return (
      <section className="event-overview-page">
        <div className="page-heading">
          <h2>이벤트 개요</h2>
          <p>선택한 이벤트의 참여 현황과 상태를 확인하세요</p>
        </div>

        <div className="overview-card-list">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/event-overview/${event.slug}`}
              className="overview-main-card"
            >
              <span className="event-badge">진행 중</span>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // 2) slug 있으면 상세 화면
  const currentEvent = events.find((event) => event.slug === slug);

  if (!currentEvent) {
    return (
      <section className="event-overview-page">
        <div className="page-heading">
          <h2>이벤트 개요</h2>
          <p>존재하지 않는 이벤트입니다.</p>
        </div>
      </section>
    );
  }

  const { title, overviewSubtitle, status, transparency, rewardInfo } = currentEvent;

  return (
    <section className="event-overview-page">
      <div className="event-overview-topbar">
        <button
          type="button"
          className="overview-back-btn"
          onClick={() => navigate("/event-overview")}
        >
          ← 뒤로가기
        </button>
      </div>

      <div className="page-heading">
        <h2>이벤트 개요</h2>
        <p>선택한 이벤트의 참여 현황과 상태를 확인하세요</p>
      </div>

      <div className="event-overview-hero">
        <span className="event-badge">진행 중</span>
        <h3>{title}</h3>
        <p>{overviewSubtitle}</p>
      </div>

      <div className="event-overview-grid">
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

        <div className="overview-column">
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
        </div>
      </div>
    </section>
  );
}