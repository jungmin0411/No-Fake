import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { mintMysteryBox } from "../services/mint";
import SimpleToast from "../components/SimpleToast";
import { ExternalLink, ShieldCheck } from "lucide-react"; // 아이콘 추가

const MINTED_STORAGE_KEY = "mintedEventsById";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";

export default function Participate({ walletAddress, events = [] }) {
  const { slug } = useParams();
  const [isMinting, setIsMinting] = useState(false);
  const sessionRef = useRef(null);
  
  // [추가] 민팅 성공 후 트랜잭션 해시를 저장할 상태
  const [lastTxHash, setLastTxHash] = useState(null);

  const [mintedEventsById, setMintedEventsById] = useState(() => {
    const saved = localStorage.getItem(MINTED_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const event = useMemo(() => events.find((item) => item.slug === slug), [events, slug]);
  const isWalletConnected = Boolean(walletAddress);
  const mintedKey = event ? String(event.id) : "";
  const isMinted = event ? Boolean(mintedEventsById[mintedKey]) : false;
  const isMintClosed = event?.status?.mintClosed ?? false;

  useEffect(() => {
    if (!event?.id) return;

    const sessionId =
      window.crypto?.randomUUID?.() || `raffle-session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const startedAt = new Date().toISOString();

    sessionRef.current = {
      raffleId: event.id,
      sessionId,
      startedAt,
      completed: false,
    };

    fetch(`${API_BASE_URL}/api/analytics/raffles/${event.id}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, startedAt }),
    }).catch((error) => console.error("Failed to start raffle analytics session:", error));

    return () => { sessionRef.current = null; };
  }, [event?.id]);

  const showToast = (message, type) => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, open: false })), 2200);
  };

  // [추가] 이더스캔 이동 함수
  const goToEtherscan = () => {
    if (lastTxHash) {
      const url = `https://sepolia.etherscan.io/tx/${lastTxHash}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleMint = async () => {
    if (!isWalletConnected) {
      showToast("지갑 연결 후 다시 시도해 주세요.", "error");
      return;
    }
    if (!event) return;
    if (isMintClosed) {
      showToast("이 래플은 이미 마감되었습니다.", "error");
      return;
    }
    if (isMinted) {
      showToast("이미 민팅이 완료되었습니다.", "error");
      return;
    }

    try {
      setIsMinting(true);
      setLastTxHash(null); // 새로운 민팅 시작 시 이전 해시 초기화

      const mintResult = await mintMysteryBox({
        raffleId: event.id,
        walletAddress,
      });

      // [핵심] 백엔드에서 받은 hash 저장
      if (mintResult?.success && mintResult?.hash) {
        setLastTxHash(mintResult.hash);
      }

      // 분석 세션 완료 처리 로직 (기존 유지)
      const activeSession = sessionRef.current;
      if (activeSession && activeSession.raffleId === event.id && !activeSession.completed) {
        const completedAt = new Date().toISOString();
        const durationSeconds = Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(activeSession.startedAt).getTime()) / 1000));
        activeSession.completed = true;
        fetch(`${API_BASE_URL}/api/analytics/raffles/${event.id}/session/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.sessionId,
            startedAt: activeSession.startedAt,
            completedAt,
            durationSeconds,
          }),
        }).catch((err) => console.error(err));
      }

      // 민팅 상태 업데이트 및 로컬스토리지 저장 (기존 유지)
      setMintedEventsById((prev) => {
        const next = { ...prev, [mintedKey]: true };
        localStorage.setItem(MINTED_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event("minted-events-updated"));
        return next;
      });

      const savedMintedTickets = localStorage.getItem("mintedTickets");
      const mintedTickets = savedMintedTickets ? JSON.parse(savedMintedTickets) : [];
      if (!mintedTickets.some(t => t.eventId === event.id && t.source === "minted")) {
        const newTicket = {
          id: Date.now(),
          eventId: event.id,
          eventSlug: event.slug,
          title: `${event.shortTitle} 미스터리 박스`,
          eventName: event.shortTitle,
          image: "",
          contractAddress: event.transparency.contractAddress,
          mintedDate: new Date().toLocaleDateString("ko-KR"),
          expiryDate: "2026-12-31",
          status: "결과 대기",
          reward: "결과 공개 전",
          usageGuide: "관리자 결과 공개 후 당첨 여부를 확인할 수 있습니다.",
          isPrePurchaseReward: false,
          mintOrder: Number(mintResult?.participants || 0),
          source: "minted",
          txHash: mintResult?.hash // 티켓 정보에도 해시 저장
        };
        localStorage.setItem("mintedTickets", JSON.stringify([...mintedTickets, newTicket]));
      }

      showToast("민팅이 완료되었습니다. 아래 검증 버튼으로 확인하세요!", "success");
    } catch (error) {
      console.error(error);
      showToast("민팅에 실패했습니다. 다시 시도해 주세요.", "error");
    } finally {
      setIsMinting(false);
    }
  };

  if (!event) {
    return (
      <section className="participate-page">
        <div className="page-heading">
          <h2>이벤트를 찾을 수 없습니다</h2>
          <p>존재하지 않거나 종료된 이벤트입니다.</p>
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
                disabled={!isWalletConnected || isMinting || isMinted || isMintClosed}
              >
                {isMinted ? "민팅 완료" : isMintClosed ? "민팅 마감" : isMinting ? "민팅 처리 중..." : "민팅하기"}
              </button>

              {/* [추가] 민팅 성공 시 나타나는 검증 섹션 */}
              {lastTxHash && (
                <div className="tx-verification-box" style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#28a745', fontWeight: 'bold', marginBottom: '10px' }}>
                    <ShieldCheck size={18} /> 온체인 데이터 기록 완료
                  </div>
                  <button 
                    onClick={goToEtherscan}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#343a40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    이더스캔에서 실시간 검증 <ExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="participate-overview-grid">
          <div className="overview-column">
            <div className="home-card">
              <h3 className="card-title">이벤트 상태</h3>
              <div className="info-row">
                <span>참여자 수</span>
                <span>{status.participants} / {status.maxParticipants}</span>
              </div>
              <div className="info-row"><span>당첨 수</span><span>{status.winners}</span></div>
              <div className="divider" />
              <div className="info-row">
                <span>현재 상태</span>
                <span className="status-active">{status.statusText}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill orange" style={{ width: `${status.progress}%` }} />
              </div>
            </div>

            <div className="home-card">
              <h3 className="card-title">{rewardInfo.title}</h3>
              <div className="info-box"><span className="info-label">1등 보상</span><strong>{rewardInfo.first}</strong></div>
              <div className="info-box"><span className="info-label">2등 보상</span><strong>{rewardInfo.second}</strong></div>
            </div>
          </div>

          <div className="overview-column">
            <div className="home-card">
              <h3 className="card-title">투명성 센터</h3>
              <div className="info-box"><span className="info-label">컨트랙트 주소</span><strong>{transparency.contractAddress}</strong></div>
              <div className="info-box"><span className="info-label">원본 증명 해시</span><strong>{transparency.provenanceHash}</strong></div>
              <div className="notice-box"><p>{transparency.description1}</p><p>{transparency.description2}</p></div>
              <button type="button" className="full-btn" onClick={() => window.open(`https://sepolia.etherscan.io/address/${transparency.contractAddress}`, "_blank")}>
                블록체인에서 확인
              </button>
            </div>
          </div>
        </div>

        <div className="participate-guide-card">
          <h3>참여 안내</h3>
          <ul>
            <li>이벤트 상태와 당첨 정보를 확인한 뒤 참여할 수 있습니다.</li>
            <li>미스터리 박스를 민팅하면 이벤트 참여가 완료됩니다.</li>
            <li>당첨 결과는 드로우 현황 또는 내 지갑에서 확인할 수 있습니다.</li>
            <li>모든 추첨 과정은 투명성 센터에서 검증 가능합니다.</li>
          </ul>
        </div>
      </section>

      <SimpleToast open={toast.open} message={toast.message} type={toast.type} />
    </>
  );
}
