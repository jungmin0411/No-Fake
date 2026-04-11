import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  Filter,
  ImagePlus,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import "./AdminDashboard.css";

const API_BASE_URL = "http://localhost:3002";
const initialParticipantSeries = Array(7).fill(0);

const STATUS_LABELS = {
  READY: "예정",
  MINTING: "진행중",
  CLOSED: "종료",
  REVEALED: "결과공개",
};

const CATEGORY_OPTIONS = ["스니커즈", "의류", "액세서리", "기타"];

const defaultImage =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

const defaultLogs = [
  {
    id: 1,
    title: "래플 운영 준비",
    detail: "관리자 대시보드가 정상적으로 연결되었습니다.",
    time: "방금 전",
  },
  {
    id: 2,
    title: "상태 점검 완료",
    detail: "백엔드 API와 DB 연결 상태를 확인했습니다.",
    time: "1분 전",
  },
];

const roleItems = [
  {
    name: "슈퍼 관리자",
    description: "래플 생성, 운영, 종료, 결과 공개까지 전체 기능을 사용할 수 있습니다.",
    active: true,
  },
  {
    name: "운영자",
    description: "래플 생성과 운영 기능을 사용할 수 있으며 민감한 설정은 제한됩니다.",
    active: true,
  },
  {
    name: "뷰어",
    description: "대시보드 조회만 가능합니다.",
    active: false,
  },
];

const toLocalInput = (date) => {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
};

const createInitialForm = () => ({
  name: "",
  category: "스니커즈",
  imageUrl: "",
  startAt: toLocalInput(new Date()),
  endAt: toLocalInput(new Date(Date.now() + 3 * 86400000)),
  firstPrize: 1,
  secondPrize: 0,
  description: "",
});

const normalizeSearchValue = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const getStatusLabel = (status) => STATUS_LABELS[status] || "예정";

const getStatusTone = (status) => {
  if (status === "MINTING") return "live";
  if (status === "CLOSED" || status === "REVEALED") return "done";
  return "draft";
};

const mapApiRaffleToUi = (raffle) => ({
  id: raffle.id,
  name: raffle.title || "",
  status: raffle.status || "READY",
  statusLabel: getStatusLabel(raffle.status || "READY"),
  participants: Number(raffle.participants || 0),
  category: raffle.category || "기타",
  views: Number(raffle.views || 0),
  completions: Number(raffle.completions || 0),
  dropouts: Number(raffle.dropouts || 0),
  conversionRate: Number(raffle.conversionRate || 0),
  dropoutRate: Number(raffle.dropoutRate || 0),
  avgEntryMinutes: Number(raffle.avgEntryMinutes || 0),
  createdAt: raffle.createdAt || new Date().toISOString(),
  imageUrl: raffle.imageUrl || "",
  description: raffle.description || "",
  startAt: raffle.startAt ? toLocalInput(new Date(raffle.startAt)) : toLocalInput(new Date()),
  endAt: raffle.endAt
    ? toLocalInput(new Date(raffle.endAt))
    : toLocalInput(new Date(Date.now() + 86400000)),
  firstPrize: Number(raffle.firstPrizeCount || 0),
  secondPrize: Number(raffle.secondPrizeCount || 0),
  contractAddress: raffle.contractAddress || "",
  provenanceHash: raffle.provenanceHash || "",
});

const ParticipantTrendChart = ({ data }) => {
  const width = 100;
  const height = 44;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);

  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="participant-chart-wrap">
      <div className="participant-chart-meta">
        <span>최근 참여 추이</span>
        <strong>실시간 반영</strong>
      </div>
      <svg className="participant-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="participantLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c73ff" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="participantArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(79, 70, 229, 0.45)" />
            <stop offset="100%" stopColor="rgba(79, 70, 229, 0.02)" />
          </linearGradient>
        </defs>
        <polyline fill="url(#participantArea)" stroke="none" points={`0,${height} ${points} ${width},${height}`} />
        <polyline
          fill="none"
          stroke="url(#participantLine)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div className="participant-chart-labels">
        <span>6회 전</span>
        <span>지금</span>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [participantSeries, setParticipantSeries] = useState(initialParticipantSeries);
  const [participantFetchError, setParticipantFetchError] = useState("");
  const [raffles, setRaffles] = useState([]);
  const [logs, setLogs] = useState(defaultLogs);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [raffleForm, setRaffleForm] = useState(createInitialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [rangeFilter, setRangeFilter] = useState("30일");

  useEffect(() => {
    let isMounted = true;

    const fetchParticipantStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/contract-stats`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load contract stats");
        }

        if (!isMounted) return;

        const nextValue = Number(data.totalParticipants || 0);
        setParticipantFetchError("");
        setParticipantSeries((prev) => {
          const hasLoadedValue = prev.some((value) => value !== 0);
          if (!hasLoadedValue) {
            return Array(prev.length).fill(nextValue);
          }
          return [...prev.slice(1), nextValue];
        });
      } catch (error) {
        if (!isMounted) return;
        setParticipantFetchError("참여 통계 API가 연결되지 않아 기본값으로 표시 중입니다.");
      }
    };

    fetchParticipantStats();
    const intervalId = setInterval(fetchParticipantStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminRaffles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/raffles`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load raffles");
        }

        if (!isMounted) return;
        setRaffles(Array.isArray(data.data) ? data.data.map(mapApiRaffleToUi) : []);
      } catch (error) {
        console.error("Failed to fetch admin raffles:", error);
      }
    };

    fetchAdminRaffles();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const values = new Set(raffles.map((raffle) => raffle.category || "기타"));
    return ["전체", ...Array.from(values)];
  }, [raffles]);

  const filteredRaffles = useMemo(() => {
    const now = Date.now();
    const rangeDays =
      rangeFilter === "7일" ? 7 : rangeFilter === "30일" ? 30 : rangeFilter === "90일" ? 90 : null;
    const normalizedSearch = normalizeSearchValue(searchTerm);

    return raffles.filter((raffle) => {
      const target = normalizeSearchValue(
        `${raffle.id} ${raffle.name} ${raffle.category || ""} ${raffle.description || ""} ${
          raffle.statusLabel || ""
        } ${raffle.contractAddress || ""}`
      );
      const matchesSearch = !normalizedSearch || target.includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "전체" || raffle.status === statusFilter || raffle.statusLabel === statusFilter;
      const matchesCategory = categoryFilter === "전체" || raffle.category === categoryFilter;
      const matchesRange =
        !rangeDays || now - new Date(raffle.createdAt).getTime() <= rangeDays * 86400000;

      return matchesSearch && matchesStatus && matchesCategory && matchesRange;
    });
  }, [raffles, searchTerm, statusFilter, categoryFilter, rangeFilter]);

  const totalParticipants = participantSeries[participantSeries.length - 1].toLocaleString();
  const analyticsRaffles = filteredRaffles;
  const activeRaffles = analyticsRaffles.filter((raffle) => raffle.status === "MINTING");
  const avgConversion = analyticsRaffles.length
    ? (
        analyticsRaffles.reduce((sum, raffle) => sum + (raffle.conversionRate || 0), 0) /
        analyticsRaffles.length
      ).toFixed(1)
    : "0.0";
  const avgDropout = analyticsRaffles.length
    ? (
        analyticsRaffles.reduce((sum, raffle) => sum + (raffle.dropoutRate || 0), 0) /
        analyticsRaffles.length
      ).toFixed(1)
    : "0.0";
  const avgParticipationTime = analyticsRaffles.length
    ? (
        analyticsRaffles.reduce((sum, raffle) => sum + (raffle.avgEntryMinutes || 0), 0) /
        analyticsRaffles.length
      ).toFixed(1)
    : "0.0";
  const previewImage = raffleForm.imageUrl.trim() || defaultImage;

  const alerts = useMemo(() => {
    if (raffles.length === 0) {
      return [
        {
          level: "warning",
          title: "등록된 래플이 없습니다",
          detail: "관리자 페이지에서 새 래플을 추가하면 여기에서 운영 현황을 확인할 수 있습니다.",
          pill: "확인 필요",
        },
      ];
    }

    const items = [];

    if (activeRaffles.length === 0) {
      items.push({
        level: "warning",
        title: "진행중인 래플이 없습니다",
        detail: "래플을 생성하면 바로 사용자 홈에 노출되며, 필요하면 관리 화면에서 수정할 수 있습니다.",
        pill: "대기중",
      });
    } else {
      items.push({
        level: "good",
        title: `${activeRaffles.length}개의 래플이 진행중입니다`,
        detail: "사용자 메인 홈에는 진행중 상태의 래플만 노출됩니다.",
        pill: "정상",
      });
    }

    const revealCount = raffles.filter((raffle) => raffle.status === "REVEALED").length;
    if (revealCount > 0) {
      items.push({
        level: "critical",
        title: "결과 공개된 래플이 있습니다",
        detail: "공개된 래플은 종료 후 공지 및 후속 관리를 확인해 주세요.",
        pill: `${revealCount}건`,
      });
    }

    return items;
  }, [raffles, activeRaffles.length]);

  const handleFormChange = (field, value) => {
    setRaffleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteRaffle = async (raffleId, raffleName) => {
    const shouldDelete = window.confirm(`"${raffleName}" 래플을 삭제할까요?`);
    if (!shouldDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/raffles/${raffleId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete raffle");
      }

      setRaffles((prev) => prev.filter((raffle) => raffle.id !== raffleId));
      setLogs((prev) => [
        {
          id: Date.now(),
          title: "래플 삭제",
          detail: `${raffleName} 래플이 삭제되었습니다.`,
          time: "방금 전",
        },
        ...prev,
      ]);
    } catch (error) {
      window.alert(error.message || "래플 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAddRaffleToApi = async () => {
    const payload = {
      title: raffleForm.name.trim(),
      category: raffleForm.category,
      imageUrl: raffleForm.imageUrl.trim(),
      startAt: new Date(raffleForm.startAt).toISOString(),
      endAt: new Date(raffleForm.endAt).toISOString(),
      firstPrizeCount: Number(raffleForm.firstPrize) || 0,
      secondPrizeCount: Number(raffleForm.secondPrize) || 0,
      description: raffleForm.description.trim(),
    };

    if (!payload.title) {
      window.alert("래플명을 입력해 주세요.");
      return;
    }

    if (!payload.startAt || !payload.endAt || new Date(payload.startAt) >= new Date(payload.endAt)) {
      window.alert("기간을 올바르게 설정해 주세요.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/raffles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create raffle");
      }

      const nextRaffle = mapApiRaffleToUi(data.data);
      setRaffles((prev) => [nextRaffle, ...prev]);
      setLogs((prev) => [
        {
          id: Date.now(),
          title: "래플 생성",
          detail: `${nextRaffle.name} 래플이 추가되었습니다.`,
          time: "방금 전",
        },
        ...prev,
      ]);
      setRaffleForm(createInitialForm());
      setIsAddOpen(false);
      window.alert("래플이 생성되어 바로 사용자 홈에 노출됩니다.");
    } catch (error) {
      window.alert(error.message || "래플 생성 중 오류가 발생했습니다.");
    }
  };

  const handleExportCsv = () => {
    if (filteredRaffles.length === 0) {
      window.alert("내보낼 래플 데이터가 없습니다.");
      return;
    }

    const rows = [
      ["래플명", "상태", "카테고리", "참여자", "1등 수량", "2등 수량", "시작일", "종료일"],
      ...filteredRaffles.map((raffle) => [
        raffle.name,
        raffle.statusLabel,
        raffle.category,
        raffle.participants,
        raffle.firstPrize,
        raffle.secondPrize,
        raffle.startAt,
        raffle.endAt,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "raffles.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-container">
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-header--left">
            <div>
              <h1>래플 관리자 대시보드</h1>
              <p>DB에 저장된 래플을 추가하고 상태를 관리하는 운영 화면입니다.</p>
            </div>
            <div className="header-role-badge">
              <Shield size={18} />
              운영 권한 활성화
            </div>
          </div>
        </header>

        <section className="toolbar-card">
          <div className="toolbar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="래플명, 카테고리, 설명 검색"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="toolbar-filters">
            <div className="toolbar-select">
              <Filter size={16} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="전체">전체 상태</option>
                <option value="READY">예정</option>
                <option value="MINTING">진행중</option>
                <option value="CLOSED">종료</option>
                <option value="REVEALED">결과공개</option>
              </select>
            </div>

            <div className="toolbar-select">
              <Filter size={16} />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-select">
              <Filter size={16} />
              <select value={rangeFilter} onChange={(event) => setRangeFilter(event.target.value)}>
                <option value="7일">최근 7일</option>
                <option value="30일">최근 30일</option>
                <option value="90일">최근 90일</option>
                <option value="전체">전체 기간</option>
              </select>
            </div>

            <button className="toolbar-export-btn" type="button" onClick={handleExportCsv}>
              <Download size={16} />
              CSV 내보내기
            </button>
          </div>
        </section>

        <section className="kpi-grid">
          <article className="kpi-card kpi-card--primary">
            <div className="kpi-top">
              <div className="stat-icon" style={{ background: "linear-gradient(135deg, #6257ff, #4338ca)" }}>
                <Users size={28} />
              </div>
              <div className="stat-info">
                <span>현재 누적 참여자</span>
                <h3>{totalParticipants}</h3>
              </div>
            </div>
            <ParticipantTrendChart data={participantSeries} />
            {participantFetchError && <p className="kpi-footnote">{participantFetchError}</p>}
          </article>

          <article className="kpi-card">
            <span className="kpi-label">진행중 래플</span>
            <strong>{activeRaffles.length}</strong>
            <p>사용자 홈에 노출 중인 래플 수입니다.</p>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">평균 전환율</span>
            <strong>{avgConversion}%</strong>
            <p>계약 통계가 연결되면 더 정확하게 반영됩니다.</p>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">평균 이탈률</span>
            <strong>{avgDropout}%</strong>
            <p>참여 흐름 분석용 지표입니다.</p>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">평균 참여 시간</span>
            <strong>{avgParticipationTime}분</strong>
            <p>사용자 진입 후 완료까지의 평균 시간입니다.</p>
          </article>
        </section>

        <section className="ops-grid">
          <article className="panel-card">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">운영 알림</span>
                <h2>지금 확인할 항목</h2>
              </div>
              <AlertTriangle size={18} />
            </div>
            <div className="alert-list">
              {alerts.map((alert, index) => (
                <div key={`${alert.title}-${index}`} className={`alert-item alert-item--${alert.level}`}>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.detail}</p>
                  </div>
                  <span className="alert-pill">{alert.pill}</span>
                </div>
              ))}
            </div>
          </article>

          <div className="ops-side-stack">
            <article className="panel-card">
              <div className="panel-header">
                <div>
                  <span className="panel-eyebrow">권한 관리</span>
                  <h2>관리자 역할</h2>
                </div>
                <Shield size={18} />
              </div>
              <div className="role-list">
                {roleItems.map((role) => (
                  <div key={role.name} className="role-item">
                    <div>
                      <strong>{role.name}</strong>
                      <p>{role.description}</p>
                    </div>
                    <span className={`role-pill ${role.active ? "role-pill--active" : ""}`}>
                      {role.active ? "접근 가능" : "읽기 전용"}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-header">
                <div>
                  <span className="panel-eyebrow">활동 로그</span>
                  <h2>최근 운영 기록</h2>
                </div>
              </div>
              <div className="log-list">
                {logs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-dot" />
                    <div className="log-copy">
                      <strong>{log.title}</strong>
                      <p>{log.detail}</p>
                    </div>
                    <span>{log.time}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="content-grid">
          <article className="panel-card panel-card--wide">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">래플 운영</span>
                <h2>래플 목록</h2>
              </div>
              <button className="add-raffle-btn" type="button" onClick={() => setIsAddOpen((prev) => !prev)}>
                <Plus size={16} />
                래플 추가
              </button>
            </div>

            {isAddOpen && (
              <div className="add-raffle-panel">
                <div className="add-raffle-head">
                  <div>
                    <span className="add-raffle-kicker">래플 생성</span>
                    <h3>기본 정보를 입력해 새 래플을 등록하세요.</h3>
                  </div>
                </div>

                <div className="add-raffle-layout">
                  <div className="add-raffle-preview">
                    <div className="add-raffle-preview-image">
                      {raffleForm.imageUrl.trim() ? (
                        <img src={previewImage} alt="래플 미리보기" />
                      ) : (
                        <div className="add-raffle-placeholder">
                          <ImagePlus size={20} />
                          <span>이미지 미리보기</span>
                        </div>
                      )}
                    </div>
                    <div className="add-raffle-preview-copy">
                      <strong>{raffleForm.name.trim() || "새 래플 이름"}</strong>
                      <span>{raffleForm.category}</span>
                      <small>
                        {raffleForm.startAt.slice(0, 10)} ~ {raffleForm.endAt.slice(0, 10)}
                      </small>
                    </div>
                  </div>

                  <div className="add-raffle-fields">
                    <div className="add-raffle-grid">
                      <div className="field-block field-block--wide">
                        <label className="add-raffle-label">래플명</label>
                        <input
                          className="add-raffle-input"
                          type="text"
                          placeholder="예: 백석대 콜라보 한정 드로우"
                          value={raffleForm.name}
                          onChange={(event) => handleFormChange("name", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">카테고리</label>
                        <select
                          className="add-raffle-input add-raffle-select"
                          value={raffleForm.category}
                          onChange={(event) => handleFormChange("category", event.target.value)}
                        >
                          {CATEGORY_OPTIONS.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field-block field-block--wide">
                        <label className="add-raffle-label">이미지 URL</label>
                        <input
                          className="add-raffle-input"
                          type="text"
                          placeholder="https://example.com/image.jpg"
                          value={raffleForm.imageUrl}
                          onChange={(event) => handleFormChange("imageUrl", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">시작 시간</label>
                        <input
                          className="add-raffle-input"
                          type="datetime-local"
                          value={raffleForm.startAt}
                          onChange={(event) => handleFormChange("startAt", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">종료 시간</label>
                        <input
                          className="add-raffle-input"
                          type="datetime-local"
                          value={raffleForm.endAt}
                          onChange={(event) => handleFormChange("endAt", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">1등 수량</label>
                        <input
                          className="add-raffle-input"
                          type="number"
                          min="0"
                          value={raffleForm.firstPrize}
                          onChange={(event) => handleFormChange("firstPrize", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">2등 수량</label>
                        <input
                          className="add-raffle-input"
                          type="number"
                          min="0"
                          value={raffleForm.secondPrize}
                          onChange={(event) => handleFormChange("secondPrize", event.target.value)}
                        />
                      </div>

                      <div className="field-block field-block--full">
                        <label className="add-raffle-label">설명</label>
                        <textarea
                          className="add-raffle-input add-raffle-textarea"
                          placeholder="관리용 메모 또는 간단한 안내 문구"
                          value={raffleForm.description}
                          onChange={(event) => handleFormChange("description", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="add-raffle-actions">
                      <p className="add-raffle-help">
                        래플을 생성하면 바로 진행중 상태로 저장되어 사용자 홈에 노출됩니다. 이후 관리 화면에서는
                        기간과 당첨 수를 수정하거나 민팅 마감, 결과 공개를 진행할 수 있습니다.
                      </p>
                      <button className="add-raffle-submit" type="button" onClick={handleAddRaffleToApi}>
                        래플 생성
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="raffle-table raffle-table--list">
              <div className="raffle-table-head">
                <span>래플명</span>
                <span>상태</span>
                <span>기간</span>
                <span>참여자</span>
                <span>당첨</span>
                <span>관리</span>
              </div>

              {filteredRaffles.map((raffle) => (
                <div key={raffle.id} className="raffle-row">
                  <div className="raffle-main raffle-main--table">
                    <div className="raffle-thumb raffle-thumb--table">
                      {raffle.imageUrl ? (
                        <img src={raffle.imageUrl} alt={raffle.name} />
                      ) : (
                        <div className="raffle-thumb-placeholder" />
                      )}
                    </div>
                    <div className="raffle-copy raffle-copy--table">
                      <strong>{raffle.name}</strong>
                      <span className="raffle-category-tag">{raffle.category}</span>
                      <div className="raffle-progress-track">
                        <div
                          className="raffle-progress-bar"
                          style={{ width: `${Math.min(100, Math.max(12, raffle.participants / 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="raffle-table-cell">
                    <span className={`mini-raffle-status mini-raffle-status--${getStatusTone(raffle.status)}`}>
                      {raffle.statusLabel}
                    </span>
                  </div>

                  <div className="raffle-table-cell raffle-table-cell--strong">
                    {formatDisplayDate(raffle.startAt)}-{formatDisplayDate(raffle.endAt)}
                  </div>

                  <div className="raffle-table-cell raffle-table-cell--strong">
                    {raffle.participants.toLocaleString()}명
                  </div>

                  <div className="raffle-table-cell raffle-table-cell--strong">
                    <div>1등 {raffle.firstPrize}명</div>
                    <div className="table-muted">2등 {raffle.secondPrize}명</div>
                  </div>

                  <div className="raffle-actions">
                    <button
                      className="mini-manage-btn"
                      type="button"
                      onClick={() => navigate(`/admin/raffle/${raffle.id}`)}
                    >
                      <Settings size={14} />
                      관리
                    </button>
                    <button
                      className="mini-delete-btn"
                      type="button"
                      onClick={() => handleDeleteRaffle(raffle.id, raffle.name)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}

              {filteredRaffles.length === 0 && (
                <div className="raffle-empty-state">조건에 맞는 래플이 없습니다.</div>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
