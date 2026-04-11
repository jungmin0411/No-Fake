import mockTransparency from "../data/mockTransparency";

export default function Transparency() {
  const { hero, contract, blockchain, history } = mockTransparency;

  return (
    <section className="transparency-page">
      <div className="page-heading">
        <h2>투명성 센터</h2>
        <p>블록체인 기반 공정 추첨 시스템을 확인하세요</p>
      </div>

      <div className="transparency-hero">
        <h3>{hero.title}</h3>
        <p>{hero.description}</p>

        <div className="hero-tags">
          {hero.tags.map((tag, index) => (
            <span key={index} className="hero-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="transparency-grid">
        <div className="home-card">
          <h3 className="card-title">스마트 컨트랙트 정보</h3>

          <div className="info-box">
            <span className="info-label">컨트랙트 주소</span>
            <strong>{contract.address}</strong>
          </div>

          <div className="info-box">
            <span className="info-label">원본 증명 해시</span>
            <strong>{contract.provenanceHash}</strong>
          </div>

          <div className="contract-meta">
            <div className="info-row">
              <span>네트워크</span>
              <span>{contract.network}</span>
            </div>
            <div className="info-row">
              <span>컨트랙트 타입</span>
              <span>{contract.type}</span>
            </div>
            <div className="info-row">
              <span>검증 상태</span>
              <span className="status-badge green">{contract.status}</span>
            </div>
          </div>

          <button className="full-btn">{contract.buttonText}</button>
        </div>

        <div className="home-card">
          <h3 className="card-title">블록체인 투명성</h3>

          <div className="transparency-highlight-box">
            <strong>{blockchain.title}</strong>
            <p>{blockchain.description}</p>
          </div>

          <div className="transparency-stats">
            <div className="info-row">
              <span>총 이벤트 수</span>
              <span>{blockchain.totalEvents}</span>
            </div>
            <div className="info-row">
              <span>총 참여자</span>
              <span className="highlight-orange">
                {blockchain.totalParticipants}명
              </span>
            </div>
            <div className="info-row">
              <span>총 당첨자</span>
              <span className="highlight-green">
                {blockchain.totalWinners}명
              </span>
            </div>
          </div>

          <div className="transparency-list">
            <span className="info-label">검증 가능한 데이터</span>
            <ul>
              {blockchain.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="home-card history-card">
        <h3 className="card-title">추첨 기록</h3>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>이벤트 ID</th>
                <th>트랜잭션 Hash</th>
                <th>실행 시간</th>
                <th>참여자 수</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, index) => (
                <tr key={index}>
                  <td>{row.eventId}</td>
                  <td>{row.txHash}</td>
                  <td>{row.executedAt}</td>
                  <td>{row.participants}</td>
                  <td>
                    <span className="status-badge green">{row.status}</span>
                  </td>
                  <td>↗</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="helper-text center-text">
          모든 추첨 기록은 블록체인에 영구적으로 기록됩니다
        </p>
      </div>
    </section>
  );
}