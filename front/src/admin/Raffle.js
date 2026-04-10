import { useState, useCallback, useRef, useEffect } from "react";
import QRCode from "qrcode";
import "./Raffle.css";

const PROVENANCE_HASH = "0x7ba1cf782d87d7e37b0d780eb30d0d5d0530e79";
const MAX_PARTICIPANTS = 30;

// --- 컴포넌트: 아이콘 및 보조 컴포넌트 ---
const Icon = ({ d, size = 14, stroke = "currentColor", strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const QRIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
  </svg>
);

const QRCanvas = ({ url }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" }, errorCorrectionLevel: "M",
    }).catch((err) => console.error("QR 생성 실패:", err));
  }, [url]);
  return <canvas ref={canvasRef} style={{ borderRadius: 8, display: "block", border: "1px solid #333", margin: "0 auto" }} />;
};

// --- 모달 컴포넌트들 ---
const ConfirmModal = ({ open, title, message, confirmLabel, confirmVariant = "orange", onConfirm, onCancel, warning, loading }) => {
  if (!open) return null;
  return (
    <div className="nf-modal-overlay" onClick={onCancel}>
      <div className="nf-modal nf-modal--confirm" onClick={(e) => e.stopPropagation()}>
        <div className="nf-modal__header">
          <span className="nf-modal__title">{title}</span>
          <button className="nf-modal__close" onClick={onCancel} disabled={loading}>×</button>
        </div>
        <p className="nf-confirm-message">{message}</p>
        {warning && <div className="nf-warning-box nf-warning-box--sm"><span style={{ flexShrink: 0 }}>⚠</span><span>{warning}</span></div>}
        <div className="nf-confirm-actions">
          <button className="nf-btn-apply nf-confirm-cancel" onClick={onCancel} disabled={loading}>취소</button>
          <button className={`nf-confirm-ok nf-confirm-ok--${confirmVariant}`} onClick={onConfirm} disabled={loading}>
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ParticipantsModal = ({ participants, onClose, loading }) => (
  <div className="nf-modal-overlay" onClick={onClose}>
    <div className="nf-modal nf-modal--md" onClick={(e) => e.stopPropagation()}>
      <div className="nf-modal__header">
        <span className="nf-modal__title">참여자 목록</span>
        <button className="nf-modal__close" onClick={onClose}>×</button>
      </div>
      <div className="nf-participants-count">총 <strong>{participants.length}</strong>명 참여 중</div>
      <div className="nf-participants-list">
        {loading ? (
          <div className="nf-participant-item">데이터 로딩 중...</div>
        ) : participants.length === 0 ? (
          <div className="nf-participant-item">
            <div className="nf-participant-info"><div className="nf-participant-name">아직 참여자가 없습니다.</div></div>
          </div>
        ) : (
          participants.map((p, index) => (
            <div key={p.id || index} className="nf-participant-item">
              <div className="nf-participant-avatar">{String(index + 1).padStart(3, "0")}</div>
              <div className="nf-participant-info">
                <div className="nf-participant-name">{p.name || "카카오 사용자"}</div>
                <div className="nf-participant-addr">{p.walletAddress || "연결된 지갑 없음"}</div>
              </div>
              <div className="nf-participant-time">{p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString("ko-KR") : "-"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// --- 메인 대시보드 ---
export default function NoFakeDashboard() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
  const toLocalInput = (date) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
  };

  // State
  const [startAt, setStartAt] = useState(toLocalInput(new Date()));
  const [endAt, setEndAt] = useState(toLocalInput(new Date(Date.now() + 3 * 86400000)));
  const [prizeInputs, setPrizeInputs] = useState({ first: 1, second: 3 });
  const [applied, setApplied] = useState(null);
  const [prizeCounts, setPrizeCounts] = useState({ first: 1, second: 3 });
  const [countdown, setCountdown] = useState("");
  const [status, setStatus] = useState("");
  const [participants, setParticipants] = useState([]);
  
  // 경고 해결: loading 상태를 실제 API 호출 시 사용하도록 수정
  const [participantsLoading, setParticipantsLoading] = useState(false);
  
  const [mintClosed, setMintClosed] = useState(false);
  const [mintClosedAt, setMintClosedAt] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [qrApplied, setQrApplied] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, fromApply: false });
  const [participantsModal, setParticipantsModal] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, loading: false });

  const qrUrl = `${process.env.REACT_APP_BASE_URL || "http://localhost:3000"}/user/pages/Home`;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  // 1. 참여자 로드 (setParticipantsLoading 사용)
  const loadParticipants = useCallback(async (isSilent = false) => {
    if (!isSilent) setParticipantsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/participants`);
      if (!response.ok) throw new Error("로드 실패");
      const data = await response.json();
      setParticipants(data.participants || []);
    } catch (error) {
      console.error("Load failed:", error);
    } finally {
      if (!isSilent) setParticipantsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadParticipants(); // 첫 로드 시에는 로딩 표시
    const id = setInterval(() => loadParticipants(true), 5000); // 이후 5초마다 자동 갱신은 백그라운드에서(isSilent)
    return () => clearInterval(id);
  }, [loadParticipants]);

  // 2. 카운트다운 로직 (이전과 동일)
  useEffect(() => {
    if (!applied) return;
    const tick = () => {
      if (mintClosedAt) {
        setStatus("종료");
        setCountdown("민팅이 수동 마감되었습니다");
        return;
      }
      const now = Date.now();
      const start = new Date(applied.startAt).getTime();
      const end = new Date(applied.endAt).getTime();

      if (now < start) {
        setStatus("예정");
        setCountdown("시작 대기 중");
      } else if (now < end) {
        setStatus("진행중");
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${h}시간 ${m}분 ${s}초 남음`);
      } else {
        setStatus("종료");
        setCountdown("래플이 종료되었습니다");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [applied, mintClosedAt]);

  // 3. 핸들러: 설정 적용
  const handleApply = async () => {
    if (new Date(startAt) >= new Date(endAt)) {
      showToast("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    try {
      const config = {
        startAt,
        endAt,
        firstPrize: parseInt(prizeInputs.first),
        secondPrize: parseInt(prizeInputs.second),
        provenanceHash: PROVENANCE_HASH
      };

      const response = await fetch(`${apiBaseUrl}/api/raffle/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setApplied({ ...config });
        setPrizeCounts({ first: config.firstPrize, second: config.secondPrize });
        setQrApplied(true);
        setQrModal({ open: true, fromApply: true });
        showToast("래플 설정이 서버에 저장되었습니다.");
      }
    } catch (e) {
      showToast("서버 연결에 실패했습니다.");
    }
  };

  // 4. 핸들러: 민팅 마감
  const handleMintConfirm = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${apiBaseUrl}/api/raffle/close`, { method: "POST" });
      if (response.ok) {
        setMintClosed(true);
        setMintClosedAt(new Date().toISOString());
        showToast("민팅이 조기 마감되었습니다.");
      }
    } catch (e) {
      showToast("마감 처리에 실패했습니다.");
    } finally {
      setConfirmModal({ open: false, type: null, loading: false });
    }
  };

  // 5. 핸들러: 결과 공개 (Reveal)
  const handleRevealConfirm = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${apiBaseUrl}/api/raffle/reveal`, { method: "POST" });
      if (response.ok) {
        setRevealed(true);
        showToast("당첨 결과가 모든 참가자에게 공개되었습니다.");
      }
    } catch (e) {
      showToast("결과 공개 실패");
    } finally {
      setConfirmModal({ open: false, type: null, loading: false });
    }
  };

  const handleReset = () => {
    if (!window.confirm("모든 설정과 참여자 데이터를 초기화하시겠습니까?")) return;
    setApplied(null);
    setMintClosed(false);
    setRevealed(false);
    setQrApplied(false);
    showToast("대시보드가 리셋되었습니다.");
  };

  const statusColor = status === "진행중" ? "#00ff88" : status === "종료" ? "#ff4e00" : "#888";

  return (
    <div className="nf-root">
      <div className="nf-app">
        {/* 헤더 */}
        <div className="nf-page-header">
          <div>
            <h1 className="nf-title">NOFAKE ADMIN</h1>
            <p className="nf-subtitle">Web3 래플 이벤트 제어 센터</p>
          </div>
          <div className="nf-header-actions">
            {qrApplied && (
              <button className="nf-btn-ghost nf-btn-ghost--blue" onClick={() => setQrModal({ open: true, fromApply: false })}>
                <QRIcon size={14} /> QR 코드
              </button>
            )}
            <button className="nf-btn-ghost" onClick={handleReset}>
              <Icon size={13} d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> 리셋
            </button>
          </div>
        </div>

        <div className="nf-grid">
          {/* 왼쪽 컬럼: 상태 및 통계 */}
          <div className="nf-col">
            <div className="nf-card">
              <div className="nf-card-title"><Icon size={13} d={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} /> 검증 해시</div>
              <div className="nf-hash-box">{PROVENANCE_HASH}</div>
              <div className="nf-hash-link">블록체인 스마트 컨트랙트 연동됨</div>
            </div>

            <div className="nf-card">
              <div className="nf-card-title"><Icon size={13} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} /> 실시간 현황</div>
              <div className="nf-stat-row">
                <div>
                  <div className="nf-stat-label">현재 참여자</div>
                  <div className="nf-stat-value">{participants.length} <span className="nf-stat-sub">/ {MAX_PARTICIPANTS}</span></div>
                </div>
                <button className="nf-stat-icon-btn" onClick={() => setParticipantsModal(true)}><Icon size={18} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} /></button>
              </div>
              <div className="nf-stat-row">
                <div>
                  <div className="nf-stat-label">당첨 설정</div>
                  <div className="nf-stat-value" style={{ color: "var(--color-orange)" }}>{prizeCounts.first + prizeCounts.second}명</div>
                  <div className="nf-stat-sub">1등 {prizeCounts.first}명 · 2등 {prizeCounts.second}명</div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼: 설정 */}
          <div className="nf-col">
            <div className="nf-card">
              <div className="nf-section-label">래플 설정</div>
              <div className="nf-winner-setting">
                <div className="nf-input-group">
                  <label>시작 시간</label>
                  <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="nf-date-input" />
                </div>
                <div className="nf-input-group">
                  <label>종료 시간</label>
                  <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="nf-date-input" />
                </div>
                <div className="nf-prize-inputs">
                  <div className="nf-prize-row">
                    <span>🥇 1등</span>
                    <input type="number" value={prizeInputs.first} onChange={(e) => setPrizeInputs({ ...prizeInputs, first: e.target.value })} />
                  </div>
                  <div className="nf-prize-row">
                    <span>🥈 2등</span>
                    <input type="number" value={prizeInputs.second} onChange={(e) => setPrizeInputs({ ...prizeInputs, second: e.target.value })} />
                  </div>
                </div>
                <button className="nf-btn-apply nf-btn-apply--full" onClick={handleApply}>설정 저장 및 활성화</button>
              </div>

              {applied && (
                <div className="nf-status-badge" style={{ borderColor: statusColor }}>
                  <div style={{ color: statusColor, fontWeight: "bold" }}>● {status}</div>
                  <div className="nf-countdown-text">{countdown}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단: 액션 구역 */}
        <div className="nf-finalize">
          <div className="nf-action-grid">
            <div className="nf-action-card">
              <h3>1. 민팅 제어</h3>
              <p>참여를 조기에 마감하거나 상태를 변경합니다.</p>
              <button 
                className={`nf-btn-mint ${mintClosed ? "nf-btn-mint--closed" : ""}`} 
                onClick={() => setConfirmModal({ open: true, type: "mint" })}
                disabled={mintClosed || !applied}
              >
                {mintClosed ? "민팅 마감됨" : "민팅 강제 마감"}
              </button>
            </div>
            <div className="nf-action-card">
              <h3>2. 결과 발표</h3>
              <p>당첨자를 확정하고 사용자에게 결과를 공개합니다.</p>
              <button 
                className={`nf-btn-reveal ${revealed ? "nf-btn-reveal--done" : (mintClosed || status === "종료") ? "nf-btn-reveal--active" : ""}`}
                disabled={(!mintClosed && status !== "종료") || revealed}
                onClick={() => setConfirmModal({ open: true, type: "reveal" })}
              >
                {revealed ? "결과 공개 완료" : "결과 공개 (Reveal)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달 및 토스트 */}
      <ConfirmModal 
        open={confirmModal.open} 
        title={confirmModal.type === "mint" ? "민팅 마감" : "결과 공개"}
        message={confirmModal.type === "mint" ? "지금 즉시 민팅을 마감할까요?" : "당첨 결과를 공개하시겠습니까? 이 작업은 취소할 수 없습니다."}
        confirmLabel={confirmModal.type === "mint" ? "마감하기" : "공개하기"}
        confirmVariant={confirmModal.type === "mint" ? "orange" : "green"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.type === "mint" ? handleMintConfirm : handleRevealConfirm}
        onCancel={() => setConfirmModal({ open: false, type: null })}
      />
      
      {qrModal.open && (
        <div className="nf-modal-overlay" onClick={() => setQrModal({ open: false })}>
          <div className="nf-modal nf-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal__header">
              <span>참여자 접속 QR</span>
              <button onClick={() => setQrModal({ open: false })}>×</button>
            </div>
            <div className="nf-qr-body">
              <QRCanvas url={qrUrl} />
              <p className="nf-qr-url">{qrUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* 수정된 부분: participantsLoading 상태를 Modal에 전달 */}
      {participantsModal && (
        <ParticipantsModal 
          participants={participants} 
          onClose={() => setParticipantsModal(false)} 
          loading={participantsLoading} 
        />
      )}
      
      <div className={`nf-toast ${toast ? "nf-toast--show" : ""}`}>{toast}</div>
    </div>
  );
}