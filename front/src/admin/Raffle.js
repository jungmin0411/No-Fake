import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import "./Raffle.css";

const MAX_PARTICIPANTS = 30;

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
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch((err) => console.error("QR 생성 실패:", err));
  }, [url]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8, display: "block", border: "1px solid #333", margin: "0 auto" }} />;
};

const ConfirmModal = ({ open, title, message, confirmLabel, confirmVariant = "orange", onConfirm, onCancel, loading }) => {
  if (!open) return null;

  return (
    <div className="nf-modal-overlay" onClick={onCancel}>
      <div className="nf-modal nf-modal--confirm" onClick={(e) => e.stopPropagation()}>
        <div className="nf-modal__header">
          <span className="nf-modal__title">{title}</span>
          <button className="nf-modal__close" onClick={onCancel} disabled={loading}>X</button>
        </div>
        <p className="nf-confirm-message">{message}</p>
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
        <button className="nf-modal__close" onClick={onClose}>X</button>
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
                <div className="nf-participant-name">{p.name || "참여자"}</div>
                <div className="nf-participant-addr">{p.walletAddress || "지갑 정보 없음"}</div>
              </div>
              <div className="nf-participant-time">{p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString("ko-KR") : "-"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const toLocalInput = (date) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

const mapStatusLabel = (status) => {
  if (status === "MINTING") return "진행중";
  if (status === "CLOSED") return "종료";
  if (status === "REVEALED") return "결과공개";
  return "설정 전";
};

export default function NoFakeDashboard() {
  const { id: raffleId } = useParams();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
  const [raffle, setRaffle] = useState(null);
  const [startAt, setStartAt] = useState(toLocalInput(new Date()));
  const [endAt, setEndAt] = useState(toLocalInput(new Date(Date.now() + 3 * 86400000)));
  const [prizeInputs, setPrizeInputs] = useState({ first: 1, second: 3 });
  const [prizeCounts, setPrizeCounts] = useState({ first: 1, second: 3 });
  const [countdown, setCountdown] = useState("");
  const [status, setStatus] = useState("설정 전");
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [mintClosed, setMintClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [qrApplied, setQrApplied] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, fromApply: false });
  const [participantsModal, setParticipantsModal] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, loading: false });

  const qrUrl = `${process.env.REACT_APP_BASE_URL || "http://localhost:3000"}/home`;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  const loadRaffle = useCallback(async () => {
    if (!raffleId) return;

    const response = await fetch(`${apiBaseUrl}/api/admin/raffles/${raffleId}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "래플 정보를 불러오지 못했습니다.");
    }

    const nextRaffle = result.data;
    const nextStartAt = nextRaffle.startAt ? toLocalInput(new Date(nextRaffle.startAt)) : toLocalInput(new Date());
    const nextEndAt = nextRaffle.endAt ? toLocalInput(new Date(nextRaffle.endAt)) : toLocalInput(new Date(Date.now() + 3 * 86400000));
    const first = nextRaffle.firstPrizeCount || 1;
    const second = nextRaffle.secondPrizeCount || 3;

    setRaffle(nextRaffle);
    setStartAt(nextStartAt);
    setEndAt(nextEndAt);
    setPrizeInputs({ first, second });
    setPrizeCounts({ first, second });
    setStatus(mapStatusLabel(nextRaffle.status));
    setMintClosed(nextRaffle.status === "CLOSED" || nextRaffle.status === "REVEALED");
    setRevealed(nextRaffle.status === "REVEALED");
    setQrApplied(nextRaffle.status === "MINTING" || nextRaffle.status === "CLOSED" || nextRaffle.status === "REVEALED");
  }, [apiBaseUrl, raffleId]);

  useEffect(() => {
    loadRaffle().catch((error) => {
      console.error("Failed to load raffle:", error);
      showToast(error.message || "래플 정보를 불러오지 못했습니다.");
    });
  }, [loadRaffle, showToast]);

  const loadParticipants = useCallback(async () => {
    setParticipantsLoading(true);
    try {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    if (!raffle?.startAt || !raffle?.endAt) return;

    const tick = () => {
      const now = Date.now();
      const start = new Date(raffle.startAt).getTime();
      const end = new Date(raffle.endAt).getTime();

      if (raffle.status === "REVEALED") {
        setCountdown("결과 공개가 완료되었습니다.");
        setStatus("결과공개");
        return;
      }

      if (raffle.status === "CLOSED") {
        setCountdown("래플이 종료되었습니다.");
        setStatus("종료");
        return;
      }

      if (now < start) {
        setCountdown("오픈 대기 중");
        setStatus("설정 전");
        return;
      }

      if (now < end) {
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${h}시간 ${m}분 ${s}초 남음`);
        setStatus("진행중");
        return;
      }

      setCountdown("래플이 종료되었습니다.");
      setStatus("종료");
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [raffle]);

  const handleApply = async () => {
    if (!raffleId) return;
    if (new Date(startAt) >= new Date(endAt)) {
      showToast("종료 시간은 시작 시간보다 뒤여야 합니다.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/raffles/${raffleId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          firstPrizeCount: parseInt(prizeInputs.first, 10) || 0,
          secondPrizeCount: parseInt(prizeInputs.second, 10) || 0,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "래플 설정 저장 실패");
      }

      setPrizeCounts({
        first: parseInt(prizeInputs.first, 10) || 0,
        second: parseInt(prizeInputs.second, 10) || 0,
      });
      setQrApplied(true);
      setMintClosed(false);
      setRevealed(false);
      await loadRaffle();
      setQrModal({ open: true, fromApply: true });
      showToast("설정이 저장되었고 사용자 홈 노출 상태로 변경되었습니다.");
    } catch (error) {
      showToast(error.message || "설정 저장에 실패했습니다.");
    }
  };

  const handleMintConfirm = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/raffles/${raffleId}/close`, { method: "POST" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "래플 종료 실패");
      }

      await loadRaffle();
      showToast("래플이 종료되었습니다.");
    } catch (error) {
      showToast(error.message || "종료 처리에 실패했습니다.");
    } finally {
      setConfirmModal({ open: false, type: null, loading: false });
    }
  };

  const handleRevealConfirm = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/raffles/${raffleId}/reveal`, { method: "POST" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "래플 결과 공개 실패");
      }

      await loadRaffle();
      showToast("래플 결과가 공개되었습니다.");
    } catch (error) {
      showToast(error.message || "결과 공개에 실패했습니다.");
    } finally {
      setConfirmModal({ open: false, type: null, loading: false });
    }
  };

  const handleReset = () => {
    loadRaffle()
      .then(() => showToast("래플 정보를 다시 불러왔습니다."))
      .catch((error) => showToast(error.message || "새로고침에 실패했습니다."));
  };

  const statusColor = status === "진행중" ? "#00ff88" : status === "종료" ? "#ff4e00" : "#888";

  return (
    <div className="nf-root">
      <div className="nf-app">
        <div className="nf-page-header">
          <div>
            <h1 className="nf-title">NOFAKE ADMIN</h1>
            <p className="nf-subtitle">Web3 래플 이벤트 제어 센터</p>
            <p className="nf-subtitle">{raffle?.title || "래플 관리"}</p>
          </div>
          <div className="nf-header-actions">
            {qrApplied && (
              <button className="nf-btn-ghost nf-btn-ghost--blue" onClick={() => setQrModal({ open: true, fromApply: false })}>
                <QRIcon size={14} /> QR 코드
              </button>
            )}
            <button className="nf-btn-ghost" onClick={handleReset}>
              <Icon size={13} d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> 새로고침
            </button>
          </div>
        </div>

        <div className="nf-grid">
          <div className="nf-col">
            <div className="nf-card">
              <div className="nf-card-title"><Icon size={13} d={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} /> 검증 해시</div>
              <div className="nf-hash-box">{raffle?.provenanceHash || "-"}</div>
              <div className="nf-hash-link">컨트랙트 주소: {raffle?.contractAddress || "-"}</div>
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
                  <div className="nf-stat-label">당첨 수 설정</div>
                  <div className="nf-stat-value" style={{ color: "var(--color-orange)" }}>{prizeCounts.first + prizeCounts.second}명</div>
                  <div className="nf-stat-sub">1등 {prizeCounts.first}명 / 2등 {prizeCounts.second}명</div>
                </div>
              </div>
            </div>
          </div>

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
                    <span>1등</span>
                    <input type="number" value={prizeInputs.first} onChange={(e) => setPrizeInputs({ ...prizeInputs, first: e.target.value })} />
                  </div>
                  <div className="nf-prize-row">
                    <span>2등</span>
                    <input type="number" value={prizeInputs.second} onChange={(e) => setPrizeInputs({ ...prizeInputs, second: e.target.value })} />
                  </div>
                </div>
                <button className="nf-btn-apply nf-btn-apply--full" onClick={handleApply}>설정 저장 및 진행 시작</button>
              </div>

              <div className="nf-status-badge" style={{ borderColor: statusColor }}>
                <div style={{ color: statusColor, fontWeight: "bold" }}>● {status}</div>
                <div className="nf-countdown-text">{countdown || "래플 설정을 저장해 진행을 시작하세요."}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="nf-finalize">
          <div className="nf-action-grid">
            <div className="nf-action-card">
              <h3>1. 진행 종료</h3>
              <p>래플 모집을 종료하고 상태를 종료로 변경합니다.</p>
              <button
                className={`nf-btn-mint ${mintClosed ? "nf-btn-mint--closed" : ""}`}
                onClick={() => setConfirmModal({ open: true, type: "mint" })}
                disabled={mintClosed || !raffle || raffle.status !== "MINTING"}
              >
                {mintClosed ? "종료 완료" : "래플 종료"}
              </button>
            </div>
            <div className="nf-action-card">
              <h3>2. 결과 공개</h3>
              <p>래플 종료 후 결과를 공개합니다.</p>
              <button
                className={`nf-btn-reveal ${revealed ? "nf-btn-reveal--done" : mintClosed ? "nf-btn-reveal--active" : ""}`}
                disabled={!mintClosed || revealed}
                onClick={() => setConfirmModal({ open: true, type: "reveal" })}
              >
                {revealed ? "결과 공개 완료" : "결과 공개"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.type === "mint" ? "래플 종료" : "결과 공개"}
        message={confirmModal.type === "mint" ? "이 래플을 종료하시겠습니까?" : "래플 결과를 공개하시겠습니까?"}
        confirmLabel={confirmModal.type === "mint" ? "종료하기" : "공개하기"}
        confirmVariant={confirmModal.type === "mint" ? "orange" : "green"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.type === "mint" ? handleMintConfirm : handleRevealConfirm}
        onCancel={() => setConfirmModal({ open: false, type: null, loading: false })}
      />

      {qrModal.open && (
        <div className="nf-modal-overlay" onClick={() => setQrModal({ open: false, fromApply: false })}>
          <div className="nf-modal nf-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal__header">
              <span>사용자 홈 QR</span>
              <button onClick={() => setQrModal({ open: false, fromApply: false })}>X</button>
            </div>
            <div className="nf-qr-body">
              <QRCanvas url={qrUrl} />
              <p className="nf-qr-url">{qrUrl}</p>
            </div>
          </div>
        </div>
      )}

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
