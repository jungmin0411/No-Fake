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

const RAFFLE_STORAGE_KEY = "nofake_admin_raffles";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
const initialParticipantSeries = Array(7).fill(0);
const toLocalInput = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const defaultImage =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

const defaultRaffles = [];
const seededRaffleIds = new Set([1, 2, 3]);
const seededRaffleNames = new Set(["백석신발", "나이키 x 트래비스", "에어맥스 90 골프"]);

const defaultLogs = [
  { id: 1, title: "래플 생성", detail: "트래비스 래플이 생성되었습니다.", time: "방금 전" },
  { id: 2, title: "당첨 설정 변경", detail: "에어맥스 90 골프 당첨 수가 업데이트되었습니다.", time: "12분 전" },
  { id: 3, title: "참여자 급증", detail: "동일 시간대 유입량이 평소보다 38% 증가했습니다.", time: "27분 전" },
];

const roleItems = [
  { name: "슈퍼 어드민", description: "설정, 마감, 결과 공개, 내보내기 전부 가능", active: true },
  { name: "운영자", description: "래플 생성과 운영 가능, 민감 설정은 제한", active: true },
  { name: "뷰어", description: "대시보드 조회만 가능", active: false },
];

const createInitialForm = () => ({
  name: "",
  category: "스니커즈",
  imageUrl: "",
  startAt: toLocalInput(new Date()),
  endAt: toLocalInput(new Date(Date.now() + 3 * 86400000)),
  firstPrize: 1,
  secondPrize: 3,
  description: "",
});

const ParticipantTrendChart = ({ data }) => {
  const width = 100;
  const height = 44;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="participant-chart-wrap">
      <div className="participant-chart-meta">
        <span>최근 유입 추이</span>
        <strong>실시간</strong>
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
        <span>6분 전</span>
        <span>지금</span>
      </div>
    </div>
  );
};

const loadStoredRaffles = () => {
  try {
    const raw = window.localStorage.getItem(RAFFLE_STORAGE_KEY);
    if (!raw) return defaultRaffles;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultRaffles;
    }

    return parsed
      .filter((raffle) => !seededRaffleIds.has(raffle.id) && !seededRaffleNames.has(raffle.name))
      .map((raffle) => ({
      category: "기타",
      conversionRate: 0,
      dropoutRate: 0,
      avgEntryMinutes: 0,
      createdAt: new Date().toISOString(),
      imageUrl: "",
      description: "",
      startAt: toLocalInput(new Date()),
      endAt: toLocalInput(new Date(Date.now() + 86400000)),
      firstPrize: 1,
      secondPrize: 3,
        ...raffle,
      }));
  } catch (error) {
    console.error("Failed to load raffles:", error);
    return defaultRaffles;
  }
};

const normalizeSearchValue = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const STATUS_LABELS = {
  READY: "예정",
  MINTING: "진행중",
  CLOSED: "종료",
  REVEALED: "결과공개",
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status || "예정";

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
  participants: raffle.participants || 0,
  category: raffle.category || "기타",
  conversionRate: raffle.conversionRate || 0,
  dropoutRate: raffle.dropoutRate || 0,
  avgEntryMinutes: raffle.avgEntryMinutes || 0,
  createdAt: raffle.createdAt || new Date().toISOString(),
  imageUrl: raffle.imageUrl || "",
  description: raffle.description || "",
  startAt: raffle.startAt ? toLocalInput(new Date(raffle.startAt)) : toLocalInput(new Date()),
  endAt: raffle.endAt ? toLocalInput(new Date(raffle.endAt)) : toLocalInput(new Date(Date.now() + 86400000)),
  firstPrize: raffle.firstPrizeCount || 0,
  secondPrize: raffle.secondPrizeCount || 0,
  contractAddress: raffle.contractAddress || "",
  provenanceHash: raffle.provenanceHash || "",
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [participantSeries, setParticipantSeries] = useState(initialParticipantSeries);
  const [participantFetchError, setParticipantFetchError] = useState("");
  const [raffles, setRaffles] = useState(loadStoredRaffles);
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

        const nextValue = Number(data.totalParticipants || 0);

        if (!isMounted) {
          return;
        }

        setParticipantFetchError("");
        setParticipantSeries((prev) => {
          const hasLoadedValue = prev.some((value) => value !== 0);

          if (!hasLoadedValue) {
            return Array(prev.length).fill(nextValue);
          }

          return [...prev.slice(1), nextValue];
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to fetch contract participant stats:", error);
        setParticipantFetchError(error.message || "Failed to load contract stats");
      }
    };

    fetchParticipantStats();
    const id = setInterval(fetchParticipantStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(id);
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

        if (!isMounted) {
          return;
        }

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

  useEffect(() => {
    window.localStorage.setItem(RAFFLE_STORAGE_KEY, JSON.stringify(raffles));
  }, [raffles]);

  const categories = useMemo(() => {
    const values = new Set(raffles.map((raffle) => raffle.category || "기타"));
    return ["전체", ...Array.from(values)];
  }, [raffles]);

  const filteredRaffles = useMemo(() => {
    const nowDate = Date.now();
    const rangeDays =
      rangeFilter === "7일" ? 7 : rangeFilter === "30일" ? 30 : rangeFilter === "90일" ? 90 : null;
    const normalizedSearch = normalizeSearchValue(searchTerm);

    return raffles.filter((raffle) => {
      const target = normalizeSearchValue(
        `${raffle.name} ${raffle.category || ""} ${raffle.description || ""}`
      );
      const matchesSearch =
        !normalizedSearch || target.includes(normalizedSearch);
      const matchesStatus = statusFilter === "전체" || raffle.status === statusFilter;
      const matchesCategory = categoryFilter === "전체" || raffle.category === categoryFilter;
      const matchesRange =
        !rangeDays || nowDate - new Date(raffle.createdAt).getTime() <= rangeDays * 86400000;

      return matchesSearch && matchesStatus && matchesCategory && matchesRange;
    });
  }, [raffles, searchTerm, statusFilter, categoryFilter, rangeFilter]);

  const totalParticipants = participantSeries[participantSeries.length - 1].toLocaleString();
  const activeRaffles = raffles.filter((raffle) => raffle.status === "진행 중");
  const avgConversion = raffles.length
    ? (raffles.reduce((sum, raffle) => sum + (raffle.conversionRate || 0), 0) / raffles.length).toFixed(1)
    : "0.0";
  const avgDropout = raffles.length
    ? (raffles.reduce((sum, raffle) => sum + (raffle.dropoutRate || 0), 0) / raffles.length).toFixed(1)
    : "0.0";
  const avgParticipationTime = raffles.length
    ? (raffles.reduce((sum, raffle) => sum + (raffle.avgEntryMinutes || 0), 0) / raffles.length).toFixed(1)
    : "0.0";

  const alerts = useMemo(() => {
    const items = [];

    raffles.forEach((raffle) => {
      if (raffle.participants >= 8000) {
        items.push({
          id: `traffic-${raffle.id}`,
          level: "critical",
          title: `${raffle.name} 유입 급증`,
          detail: "짧은 시간에 참여자가 몰리고 있어 어뷰징 로그를 함께 확인하는 것이 좋습니다.",
        });
      }

      if (raffle.status === "설정 전") {
        items.push({
          id: `draft-${raffle.id}`,
          level: "warning",
          title: `${raffle.name} 설정 대기`,
          detail: "생성은 되었지만 기간 또는 당첨 수가 아직 확정되지 않았습니다.",
        });
      }
    });

    if (!items.length) {
      items.push({
        id: "healthy",
        level: "good",
        title: "이상 징후 없음",
        detail: "현재 대시보드에서 확인된 주요 경고는 없습니다.",
      });
    }

    return items.slice(0, 4);
  }, [raffles]);

  const previewImage = raffleForm.imageUrl.trim() || defaultImage;

  const handleFormChange = (field, value) => {
    setRaffleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteRaffle = async (raffleId, raffleName) => {
    if (!window.confirm(`${raffleName} 래플을 삭제할까요?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/raffles/${raffleId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete raffle");
      }

      setRaffles((prev) => prev.filter((raffle) => raffle.id !== raffleId));
      setLogs((prev) => [
        {
          id: Date.now() + 1,
          title: "래플 삭제",
          detail: `${raffleName} 래플이 삭제되었습니다.`,
          time: "방금 전",
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Failed to delete raffle:", error);
      window.alert(error.message || "래플 삭제에 실패했습니다.");
    }
  };

  const handleAddRaffleToApi = async () => {
    const trimmedName = raffleForm.name.trim();
    if (!trimmedName) return;
    if (new Date(raffleForm.startAt) >= new Date(raffleForm.endAt)) return;

    const payload = {
      title: trimmedName,
      category: raffleForm.category,
      imageUrl: raffleForm.imageUrl.trim(),
      startAt: new Date(raffleForm.startAt).toISOString(),
      endAt: new Date(raffleForm.endAt).toISOString(),
      firstPrizeCount: Number(raffleForm.firstPrize) || 0,
      secondPrizeCount: Number(raffleForm.secondPrize) || 0,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/raffles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create raffle");
      }

      const savedRaffle = mapApiRaffleToUi(result.data);
      setRaffles((prev) => [savedRaffle, ...prev]);
      setLogs((prev) => [
        {
          id: Date.now() + 1,
          title: "래플 생성",
          detail: `${trimmedName} 래플이 ${raffleForm.category} 카테고리로 DB에 저장되었습니다.`,
          time: "방금 전",
        },
        ...prev,
      ]);
      setRaffleForm(createInitialForm());
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to create raffle:", error);
      window.alert(error.message || "래플 생성에 실패했습니다.");
    }
  };

  const handleAddRaffle = () => {
    const trimmedName = raffleForm.name.trim();
    if (!trimmedName) return;
    if (new Date(raffleForm.startAt) >= new Date(raffleForm.endAt)) return;

    const nextRaffle = {
      id: Date.now(),
      name: trimmedName,
      status: "설정 전",
      participants: 0,
      category: raffleForm.category,
      conversionRate: 0,
      dropoutRate: 0,
      avgEntryMinutes: 0,
      createdAt: new Date().toISOString(),
      imageUrl: raffleForm.imageUrl.trim(),
      description: raffleForm.description.trim(),
      startAt: raffleForm.startAt,
      endAt: raffleForm.endAt,
      firstPrize: Number(raffleForm.firstPrize) || 0,
      secondPrize: Number(raffleForm.secondPrize) || 0,
    };

    setRaffles((prev) => [nextRaffle, ...prev]);
    setLogs((prev) => [
      {
        id: Date.now() + 1,
        title: "래플 생성",
        detail: `${trimmedName} 래플이 ${raffleForm.category} 카테고리로 추가되었습니다.`,
        time: "방금 전",
      },
      ...prev,
    ]);
    setRaffleForm(createInitialForm());
    setIsAddOpen(false);
  };

  const handleExportCsv = () => {
    const header = ["id", "name", "status", "category", "participants", "firstPrize", "startAt", "endAt"];
    const rows = filteredRaffles.map((raffle) =>
      [
        raffle.id,
        raffle.name,
        raffle.status,
        raffle.category,
        raffle.participants,
        raffle.firstPrize,
        raffle.startAt,
        raffle.endAt,
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nofake-raffles-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-container">
      <div className="admin-shell">
        <header className="admin-header admin-header--left">
          <div>
            <h1>NOFAKE 관리자 대시보드</h1>
            
          </div>
          <div className="header-role-badge">
            <Shield size={16} />
            슈퍼 어드민
          </div>
        </header>

        <section className="toolbar-card">
          <div className="toolbar-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="래플명 또는 카테고리 검색"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="toolbar-filters">
            <div className="toolbar-select">
              <Filter size={15} />
              <select value={rangeFilter} onChange={(event) => setRangeFilter(event.target.value)}>
                <option>7일</option>
                <option>30일</option>
                <option>90일</option>
                <option>전체</option>
              </select>
            </div>

            <div className="toolbar-select">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>전체</option>
                <option>진행 중</option>
                <option>설정 전</option>
                <option>종료</option>
              </select>
            </div>

            <div className="toolbar-select">
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <button className="toolbar-export-btn" onClick={handleExportCsv}>
              <Download size={15} />
              CSV 내보내기
            </button>
          </div>
        </section>

        <section className="kpi-grid">
          <article className="kpi-card kpi-card--primary">
            <div className="kpi-top">
              <div className="stat-icon" style={{ backgroundColor: "#4F46E5" }}>
                <Users />
              </div>
              <div className="stat-info">
                <span>총 참여자</span>
                <h3>{totalParticipants}명</h3>
              </div>
            </div>
            <ParticipantTrendChart data={participantSeries} />
            {participantFetchError && (
              <p className="kpi-footnote">NoFake.sol totalSupply 조회 실패: {participantFetchError}</p>
            )}
          </article>

          <article className="kpi-card">
            <span className="kpi-label">진행 중 래플</span>
            <strong>{activeRaffles.length}개</strong>
            <p>현재 운영 중인 래플 수</p>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">평균 전환율</span>
            <strong>{avgConversion}%</strong>
            <p>페이지 진입 대비 참여 완료 기준</p>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">평균 이탈율</span>
            <strong>{avgDropout}%</strong>
            <p>참여 직전 이탈 사용자 비중</p>
          </article>

          <article className="kpi-card">
            <span className="kpi-label">평균 참여 시간</span>
            <strong>{avgParticipationTime}분</strong>
            <p>유입 후 참여 완료까지 걸린 시간</p>
          </article>
        </section>

        <section className="ops-grid">
          <article className="panel-card">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">알림 & 이상 감지</span>
                <h2>운영 경고 센터</h2>
              </div>
              <AlertTriangle size={18} />
            </div>
            <div className="alert-list">
              {alerts.map((alert) => (
                <div key={alert.id} className={`alert-item alert-item--${alert.level}`}>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.detail}</p>
                  </div>
                  <span className="alert-pill">
                    {alert.level === "critical" ? "즉시 확인" : alert.level === "warning" ? "추가 필요" : "정상"}
                  </span>
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
              <button className="add-raffle-btn" onClick={() => setIsAddOpen((prev) => !prev)}>
                <Plus size={16} />
                래플 추가
              </button>
            </div>

            {isAddOpen && (
              <div className="add-raffle-panel">
                <div className="add-raffle-head">
                  <div>
                    <span className="add-raffle-kicker">래플 생성</span>
                    <h3>기간, 이미지, 당첨 수를 한 번에 설정</h3>
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
                          placeholder="예: 덩크 로우 레트로"
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
                          <option>스니커즈</option>
                          <option>의류</option>
                          <option>패션</option>
                          <option>액세서리</option>
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
                        <label className="add-raffle-label">시작 시각</label>
                        <input
                          className="add-raffle-input"
                          type="datetime-local"
                          value={raffleForm.startAt}
                          onChange={(event) => handleFormChange("startAt", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">종료 시각</label>
                        <input
                          className="add-raffle-input"
                          type="datetime-local"
                          value={raffleForm.endAt}
                          onChange={(event) => handleFormChange("endAt", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">1등 수</label>
                        <input
                          className="add-raffle-input"
                          type="number"
                          min="0"
                          value={raffleForm.firstPrize}
                          onChange={(event) => handleFormChange("firstPrize", event.target.value)}
                        />
                      </div>

                      <div className="field-block">
                        <label className="add-raffle-label">2등 수</label>
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
                          placeholder="사용자에게 보여줄 간단한 설명"
                          value={raffleForm.description}
                          onChange={(event) => handleFormChange("description", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="add-raffle-actions">
                      <p className="add-raffle-help">
                        생성과 동시에 기간, 이미지, 당첨 수가 저장됩니다. 이후 관리 화면에서 세부 조정만 하면 됩니다.
                      </p>
                      <button className="add-raffle-submit" onClick={handleAddRaffleToApi}>
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
                      {raffle.imageUrl ? <img src={raffle.imageUrl} alt={raffle.name} /> : <div className="raffle-thumb-placeholder" />}
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
                      {raffle.statusLabel || getStatusLabel(raffle.status)}
                    </span>
                  </div>

                  <div className="raffle-table-cell raffle-table-cell--strong">
                    {raffle.startAt.slice(5, 10).replace("-", ".")}-{raffle.endAt.slice(5, 10).replace("-", ".")}
                  </div>

                  <div className="raffle-table-cell raffle-table-cell--strong">
                    {raffle.participants.toLocaleString()}?
                  </div>

                  <div className="raffle-table-cell raffle-table-cell--strong">
                    1? {raffle.firstPrize}?
                  </div>

                  <div className="raffle-actions">
                    <button className="mini-manage-btn" type="button" onClick={() => navigate(`/admin/raffle/${raffle.id}`)}>
                      <Settings size={14} />
                      ??
                    </button>
                    <button className="mini-delete-btn" type="button" onClick={() => handleDeleteRaffle(raffle.id, raffle.name)}>
                      ??
                    </button>
                  </div>
                </div>
              ))}

              {filteredRaffles.length === 0 && (
                <div className="raffle-empty-state">
                  검색 조건에 맞는 래플이 없습니다.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
