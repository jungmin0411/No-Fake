const notices = [
  {
    id: 1,
    title: "백석대 콜라보 래플 공지",
    summary: "응모 전 확인해야 할 일정과 참여 조건을 정리했습니다.",
    date: "2026.04.10",
  },
  {
    id: 2,
    title: "당첨자 발표 일정 안내",
    summary: "래플 종료 후 결과 공개와 지갑 확인 절차를 안내합니다.",
    date: "2026.04.09",
  },
  {
    id: 3,
    title: "퍼즐 교환소 이용 가이드",
    summary: "퍼즐 조각 획득과 교환 규칙을 쉽게 볼 수 있게 정리했습니다.",
    date: "2026.04.08",
  },
];

export default function Board() {
  return (
    <section className="board-page">
      <div className="page-heading">
        <h2>게시판</h2>
        <p>공지와 운영 안내를 빠르게 확인할 수 있는 공간입니다.</p>
      </div>

      <div className="board-list">
        {notices.map((notice) => (
          <article key={notice.id} className="board-card">
            <div className="board-card-top">
              <span className="board-badge">공지</span>
              <span className="board-date">{notice.date}</span>
            </div>
            <h3>{notice.title}</h3>
            <p>{notice.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
