import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./UserDashboard.css";

import Header from "./components/Header";
import Navbar from "./components/Navbar";

import Login from "./pages/KakaoLogin";
import Home from "./pages/Home";
import Participate from "./pages/Participate";
import DrawStatus from "./pages/DrawStatus";
import MyWallet from "./pages/MyWallet";
import PuzzleExchange from "./pages/PuzzleExchange";
import Marketplace from "./pages/Marketplace";
import TransparencyCenter from "./pages/TransparencyCenter";

import mockEvents from "./data/mockEvents";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const formatDateLabel = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getStatusMeta = (status, startAt, endAt) => {
  const now = Date.now();
  const start = startAt ? new Date(startAt).getTime() : null;
  const end = endAt ? new Date(endAt).getTime() : null;

  if (status === "REVEALED") {
    return { statusText: "결과 공개", mintClosed: true, remainingTime: "공개 완료" };
  }

  if (status === "CLOSED") {
    return { statusText: "종료", mintClosed: true, remainingTime: "종료됨" };
  }

  if (status === "MINTING") {
    return { statusText: "민팅 중", mintClosed: false, remainingTime: endAt ? `${formatDateLabel(endAt)} 마감` : "진행 중" };
  }

  if (start && now < start) {
    return { statusText: "오픈 예정", mintClosed: true, remainingTime: `${formatDateLabel(startAt)} 시작` };
  }

  if (end && now > end) {
    return { statusText: "종료", mintClosed: true, remainingTime: "종료됨" };
  }

  return { statusText: "진행 중", mintClosed: false, remainingTime: endAt ? `${formatDateLabel(endAt)} 마감` : "진행 중" };
};

const mapRaffleToEvent = (raffle, revealState = {}) => {
  const slug = toSlug(raffle.title || raffle.id);
  const statusMeta = getStatusMeta(raffle.status, raffle.startAt, raffle.endAt);

  return {
    id: raffle.id,
    slug,
    title: raffle.title,
    shortTitle: raffle.title,
    thumbnail: raffle.imageUrl || "",
    description: raffle.category
      ? `${raffle.category} 카테고리 래플입니다. 응모 기간과 당첨 정보를 확인해보세요.`
      : "응모 기간과 당첨 정보를 확인해보세요.",
    overviewSubtitle: raffle.category
      ? `${raffle.category} 카테고리 래플 이벤트입니다.`
      : "래플 이벤트 상세 정보를 확인해보세요.",
    result: "pending",
    status: {
      participants: 0,
      maxParticipants: Math.max((raffle.firstPrizeCount || 0) + (raffle.secondPrizeCount || 0), 1),
      winners: (raffle.firstPrizeCount || 0) + (raffle.secondPrizeCount || 0),
      statusText: statusMeta.statusText,
      progress: 0,
      mintClosed: statusMeta.mintClosed,
      isRevealed: revealState[slug] ?? raffle.status === "REVEALED",
      remainingTime: statusMeta.remainingTime,
    },
    transparency: {
      contractAddress: raffle.contractAddress || "-",
      provenanceHash: raffle.provenanceHash || "-",
      description1: "모든 래플 데이터는 서버 DB와 온체인 정보 기준으로 관리됩니다.",
      description2: "컨트랙트 주소와 provenance hash를 통해 무결성을 확인할 수 있습니다.",
    },
    rewardInfo: {
      title: "당첨 정보",
      first: `1등 ${raffle.firstPrizeCount || 0}명`,
      second: `2등 ${raffle.secondPrizeCount || 0}명`,
    },
    mintTitle: `${raffle.title} 래플에 참여해보세요`,
    mintDescription: raffle.category
      ? `${raffle.category} 래플 응모를 위해 민팅을 진행합니다.`
      : "래플 응모를 위해 민팅을 진행합니다.",
    mintPrice: "0.01 ETH",
    gasEstimate: "~0.002 ETH",
    totalCost: "~0.012 ETH",
  };
};

function ProtectedLayout({ children, walletAddress, onLogout }) {
  if (!walletAddress) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <Header walletAddress={walletAddress} onLogout={onLogout} />
      <Navbar />

      <main className="app-main">
        <div className="page-shell">{children}</div>
      </main>
    </div>
  );
}

function UserDashboard() {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState(
    () => localStorage.getItem("testWalletAddress") || ""
  );

  const [revealState, setRevealState] = useState(
    () => JSON.parse(localStorage.getItem("revealState") || "{}")
  );
  const [apiEvents, setApiEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchRaffles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/raffles`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          throw new Error("Failed to load raffles");
        }

        if (!isMounted) {
          return;
        }

        const liveRaffles = data.filter((raffle) => raffle.status === "MINTING");
        setApiEvents(liveRaffles.map((raffle) => mapRaffleToEvent(raffle, revealState)));
      } catch (error) {
        console.error("Failed to fetch user raffles:", error);
        if (isMounted) {
          setApiEvents([]);
        }
      }
    };

    fetchRaffles();

    return () => {
      isMounted = false;
    };
  }, [revealState]);

  const events = useMemo(() => {
    if (apiEvents.length > 0) {
      return apiEvents;
    }

    return mockEvents.map((event) => ({
      ...event,
      status: {
        ...event.status,
        isRevealed: revealState[event.slug] ?? false,
      },
    }));
  }, [apiEvents, revealState]);

  const handleDisconnectWallet = () => {
    localStorage.removeItem("testWalletAddress");
    localStorage.removeItem("mintedEvents");
    localStorage.removeItem("mintedTickets");
    localStorage.removeItem("revealState");
    setWalletAddress("");
    setRevealState({});
  };

  const handleLoginSuccess = (newWalletAddress) => {
    localStorage.setItem("testWalletAddress", newWalletAddress);
    setWalletAddress(newWalletAddress);
  };

  const pathname = location.pathname;

  if (pathname === "/" || pathname === "/login") {
    return walletAddress ? (
      <Navigate to="/home" replace />
    ) : (
      <Login onLoginSuccess={handleLoginSuccess} />
    );
  }

  if (pathname === "/home") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <Home events={events} />
      </ProtectedLayout>
    );
  }

  if (pathname.startsWith("/participate/")) {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <Participate walletAddress={walletAddress} events={events} />
      </ProtectedLayout>
    );
  }

  if (pathname === "/draw-status") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <DrawStatus events={events} revealState={revealState} />
      </ProtectedLayout>
    );
  }

  if (pathname === "/my-wallet") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <MyWallet revealState={revealState} />
      </ProtectedLayout>
    );
  }

  if (pathname === "/puzzle-exchange") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <PuzzleExchange />
      </ProtectedLayout>
    );
  }

  if (pathname === "/marketplace") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <Marketplace />
      </ProtectedLayout>
    );
  }

  if (pathname === "/transparency-center") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <TransparencyCenter />
      </ProtectedLayout>
    );
  }

  return <Navigate to="/home" replace />;
}

export default UserDashboard;
