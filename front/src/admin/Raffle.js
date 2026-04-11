import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import "./Raffle.css";

const toLocalInput = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
};


const mapStatusLabel = (status) => {
  if (status === "MINTING") return "진행중";
  if (status === "CLOSED") return "종료";
  if (status === "REVEALED") return "결과공개";
  return "예정";
};

const Icon = ({ d, size = 14, stroke = "currentColor", strokeWidth = 2.2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
  >
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const QRIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="14" width="3" height="3" />
    <rect x="14" y="18" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" />
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
    }).catch((error) => console.error("QR code generation failed:", error));
  }, [url]);

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: 8, display: "block", border: "1px solid #333", margin: "0 auto" }}
    />
  );
};

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = "orange",
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!open) return null;

  return (
    <div className="nf-modal-overlay" onClick={onCancel}>
      <div className="nf-modal nf-modal--confirm" onClick={(event) => event.stopPropagation()}>
        <div className="nf-modal__header">
          <span className="nf-modal__title">{title}</span>
          <button className="nf-modal__close" onClick={onCancel} disabled={loading}>
            X
          </button>
        </div>
        <p className="nf-confirm-message">{message}</p>
        <div className="nf-confirm-actions">
          <button className="nf-btn-apply nf-confirm-cancel" onClick={onCancel} disabled={loading}>
            취소
          </button>
          <button
            className={`nf-confirm-ok nf-confirm-ok--${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ParticipantsModal = ({ participants, onClose }) => (
  <div className="nf-modal-overlay" onClick={onClose}>
    <div className="nf-modal nf-modal--md" onClick={(event) => event.stopPropagation()}>
      <div className="nf-modal__header">
        <span className="nf-modal__title">참여자 목록</span>
        <button className="nf-modal__close" onClick={onClose}>
          X
        </button>
      </div>
      <div className="nf-participants-count">
        총 <strong>{participants.length}</strong>명 참여 중
      </div>
      <div className="nf-participants-list">
        {participants.length === 0 ? (
          <div className="nf-participant-item">
            <div className="nf-participant-info">
              <div className="nf-participant-name">아직 참여자가 없습니다.</div>
            </div>
          </div>
        ) : (
          participants.map((participant, index) => (
            <div key={participant.id || index} className="nf-participant-item">
              <div className="nf-participant-avatar">{String(index + 1).padStart(3, "0")}</div>
              <div className="nf-participant-info">
                <div className="nf-participant-name">{participant.name || `참여자 ${index + 1}`}</div>
                <div className="nf-participant-addr">{participant.walletAddress || "지갑 정보 없음"}</div>
              </div>
              <div className="nf-participant-time">
                {participant.joinedAt ? new Date(participant.joinedAt).toLocaleTimeString("ko-KR") : "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default function Raffle() {
  const { id: raffleId } = useParams();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";
  const [raffle, setRaffle] = useState(null);
  const [startAt, setStartAt] = useState(toLocalInput(new Date()));
  const [endAt, setEndAt] = useState(toLocalInput(new Date(Date.now() + 3 * 86400000)));
  const [prizeInputs, setPrizeInputs] = useState({ first: 1, second: 0 });
  const [toast, setToast] = useState("");
  const [participants, setParticipants] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, loading: false });

  const qrUrl = `${process.env.REACT_APP_BASE_URL || "http://localhost:3000"}/home`;

  const showToast = useCallback((message) => {
    setToast(message);
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
    setRaffle(nextRaffle);
    setStartAt(nextRaffle.startAt ? toLocalInput(new Date(nextRaffle.startAt)) : toLocalInput(new Date()));
    setEndAt(
      nextRaffle.endAt
        ? toLocalInput(new Date(nextRaffle.endAt))
        : toLocalInput(new Date(Date.now() + 3 * 86400000))
    );
    setPrizeInputs({
      first: Number(nextRaffle.firstPrizeCount || 0),
      second: Number(nextRaffle.secondPrizeCount || 0),
    });
    setParticipants(
      Array.from({ length: Number(nextRaffle.participants || 0) }, (_, index) => ({
        id: `${nextRaffle.id}-${index + 1}`,
        name: `참여자 ${index + 1}`,
        walletAddress: "지갑 주소 비공개",
      }))
    );
  }, [apiBaseUrl, raffleId]);

  useEffect(() => {
    loadRaffle().catch((error) => {
      console.error("Failed to load raffle:", error);
      showToast(error.message || "래플 정보를 불러오지 못했습니다.");
    });
  }, [loadRaffle, showToast]);

  const statusLabel = mapStatusLabel(raffle?.status);
  const statusColor =
    raffle?.status === "MINTING" ? "#00ff88" : raffle?.status === "CLOSED" ? "#ff8a00" : raffle?.status === "REVEALED" ? "#60a5fa" : "#888";

  const countdown = useMemo(() => {
    if (!raffle) return "래플 정보를 불러오는 중입니다.";
    if (raffle.status === "REVEALED") return "결과 공개가 완료되었습니다.";
    if (raffle.status === "CLOSED") return "래플이 종료되었습니다.";
    return endAt ? `${formatDateTime(endAt)} 마감` : "진행중";
  }, [endAt, raffle]);

  const canCloseMint = Boolean(raffle) && raffle.status === "MINTING";
  const canReveal = Boolean(raffle) && raffle.status === "CLOSED";
  const qrEnabled = Boolean(raffle) && ["MINTING", "CLOSED", "REVEALED"].includes(raffle.status);

  const handleApply = async () => {
    if (!raffleId) return;
    if (new Date(startAt) >= new Date(endAt)) {
      showToast("종료 시간이 시작 시간보다 늦어야 합니다.");
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
        throw new Error(result.error || "설정 저장에 실패했습니다.");
      }

      await loadRaffle();
      showToast("설정이 저장되었습니다.");
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
        throw new Error(result.error || "래플 종료에 실패했습니다.");
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
        throw new Error(result.error || "?? ??? ??????.");
      }

      await loadRaffle();
      window.dispatchEvent(new Event("minted-events-updated"));
      showToast("?? ??? ???????.");
    } catch (error) {
      showToast(error.message || "?? ??? ??????.");
    } finally {
      setConfirmModal({ open: false, type: null, loading: false });
    }
  };

  return (
    <div className="nf-root">
      <div className="nf-app">
        <div className="nf-page-header">
          <div>
            <h1 className="nf-title">NOFAKE ADMIN</h1>
            <p className="nf-subtitle">래플 운영 상세 관리</p>
            <p className="nf-subtitle">{raffle?.title || "래플 정보를 불러오는 중입니다."}</p>
          </div>
          <div className="nf-header-actions">
            {qrEnabled && (
              <button className="nf-btn-ghost nf-btn-ghost--blue" onClick={() => setQrModalOpen(true)}>
                <QRIcon size={14} /> QR 코드
              </button>
            )}
            <button className="nf-btn-ghost" onClick={() => loadRaffle().then(() => showToast("래플 정보를 새로고침했습니다."))}>
              <Icon size={13} d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> 새로고침
            </button>
          </div>
        </div>

        <div className="nf-grid">
          <div className="nf-col">
            <div className="nf-card">
              <div className="nf-card-title">
                <Icon
                  size={13}
                  d={
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </>
                  }
                />{" "}
                검증 정보
              </div>
              <div className="nf-hash-box">{raffle?.provenanceHash || "-"}</div>
              <div className="nf-hash-link">컨트랙트 주소: {raffle?.contractAddress || "-"}</div>
            </div>

            <div className="nf-card">
              <div className="nf-card-title">
                <Icon size={13} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} /> 실시간 현황
              </div>
              <div className="nf-stat-row">
                <div>
                  <div className="nf-stat-label">현재 참여자</div>
                  <div className="nf-stat-value">
                    {participants.length} <span className="nf-stat-sub">명</span>
                  </div>
                </div>
                <button className="nf-stat-icon-btn" onClick={() => setParticipantsModalOpen(true)}>
                  <Icon
                    size={18}
                    d={
                      <>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </>
                    }
                  />
                </button>
              </div>
              <div className="nf-stat-row">
                <div>
                  <div className="nf-stat-label">당첨 수량</div>
                  <div className="nf-stat-value" style={{ color: "var(--color-orange)" }}>
                    {(Number(raffle?.firstPrizeCount || 0) + Number(raffle?.secondPrizeCount || 0)).toLocaleString()}명
                  </div>
                  <div className="nf-stat-sub">
                    1등 {Number(raffle?.firstPrizeCount || 0)}명 / 2등 {Number(raffle?.secondPrizeCount || 0)}명
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="nf-col">
            <div className="nf-card">
              <div className="nf-section-label">래플 설정 수정</div>
              <div className="nf-winner-setting">
                <div className="nf-input-group">
                  <label>시작 시간</label>
                  <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="nf-date-input" />
                </div>
                <div className="nf-input-group">
                  <label>종료 시간</label>
                  <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="nf-date-input" />
                </div>
                <div className="nf-prize-inputs">
                  <div className="nf-prize-row">
                    <span>1등</span>
                    <input
                      type="number"
                      value={prizeInputs.first}
                      onChange={(event) => setPrizeInputs((prev) => ({ ...prev, first: event.target.value }))}
                    />
                  </div>
                  <div className="nf-prize-row">
                    <span>2등</span>
                    <input
                      type="number"
                      value={prizeInputs.second}
                      onChange={(event) => setPrizeInputs((prev) => ({ ...prev, second: event.target.value }))}
                    />
                  </div>
                </div>
                <button className="nf-btn-apply nf-btn-apply--full" onClick={handleApply}>
                  설정 저장
                </button>
              </div>

              <div className="nf-status-badge" style={{ borderColor: statusColor }}>
                <div style={{ color: statusColor, fontWeight: "bold" }}>현재 상태: {statusLabel}</div>
                <div className="nf-countdown-text">{countdown}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="nf-finalize">
          <div className="nf-action-grid">
            <div className="nf-action-card">
              <h3>1. 민팅 마감</h3>
              <p>진행중인 래플의 응모를 종료하고 상태를 종료로 변경합니다.</p>
              <button
                className={`nf-btn-mint ${!canCloseMint ? "nf-btn-mint--closed" : ""}`}
                onClick={() => setConfirmModal({ open: true, type: "mint", loading: false })}
                disabled={!canCloseMint}
              >
                {canCloseMint ? "민팅 마감" : "마감 불가"}
              </button>
            </div>

            <div className="nf-action-card">
              <h3>2. 결과 공개</h3>
              <p>래플 종료 후 당첨 결과를 공개합니다.</p>
              <button
                className={`nf-btn-reveal ${raffle?.status === "REVEALED" ? "nf-btn-reveal--done" : canReveal ? "nf-btn-reveal--active" : ""}`}
                disabled={!canReveal}
                onClick={() => setConfirmModal({ open: true, type: "reveal", loading: false })}
              >
                {raffle?.status === "REVEALED" ? "결과 공개 완료" : "결과 공개"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.type === "mint" ? "민팅 마감" : "결과 공개"}
        message={
          confirmModal.type === "mint"
            ? "이 래플의 민팅을 마감하시겠습니까?"
            : "이 래플의 결과를 공개하시겠습니까?"
        }
        confirmLabel={confirmModal.type === "mint" ? "마감하기" : "공개하기"}
        confirmVariant={confirmModal.type === "mint" ? "orange" : "green"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.type === "mint" ? handleMintConfirm : handleRevealConfirm}
        onCancel={() => setConfirmModal({ open: false, type: null, loading: false })}
      />

      {qrModalOpen && (
        <div className="nf-modal-overlay" onClick={() => setQrModalOpen(false)}>
          <div className="nf-modal nf-modal--sm" onClick={(event) => event.stopPropagation()}>
            <div className="nf-modal__header">
              <span>사용자용 QR</span>
              <button onClick={() => setQrModalOpen(false)}>X</button>
            </div>
            <div className="nf-qr-body">
              <QRCanvas url={qrUrl} />
              <p className="nf-qr-url">{qrUrl}</p>
            </div>
          </div>
        </div>
      )}

      {participantsModalOpen && (
        <ParticipantsModal participants={participants} onClose={() => setParticipantsModalOpen(false)} />
      )}

      <div className={`nf-toast ${toast ? "nf-toast--show" : ""}`}>{toast}</div>
    </div>
  );
}
