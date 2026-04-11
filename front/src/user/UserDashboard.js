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
import {
  clearWalletScopedStorage,
  getWalletAddressStorageKey,
  getWalletMintedEventsById,
  getWalletMintedTickets,
  getWalletRevealState,
  saveWalletMintedTickets,
  saveWalletRevealState,
} from "./utils/walletStorage";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";

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
    return { statusText: "결과공개", mintClosed: true, remainingTime: "결과 공개 완료" };
  }

  if (status === "CLOSED") {
    return { statusText: "종료", mintClosed: true, remainingTime: "민팅 마감" };
  }

  if (status === "MINTING") {
    if (end && now > end) {
      return { statusText: "종료", mintClosed: true, remainingTime: "기간 종료" };
    }

    return {
      statusText: "진행중",
      mintClosed: false,
      remainingTime: endAt ? `${formatDateLabel(endAt)} 마감` : "진행중",
    };
  }

  if (start && now < start) {
    return { statusText: "예정", mintClosed: true, remainingTime: `${formatDateLabel(startAt)} 시작` };
  }

  if (end && now > end) {
    return { statusText: "종료", mintClosed: true, remainingTime: "기간 종료" };
  }

  return {
    statusText: "진행중",
    mintClosed: false,
    remainingTime: endAt ? `${formatDateLabel(endAt)} 마감` : "진행중",
  };
};

const getResultStatusLabel = (result, hasCheckedResult) => {
  if (!hasCheckedResult) return "결과공개";
  if (result === "first") return "1등";
  if (result === "second") return "2등";
  return "꽝";
};

const mapRaffleToEvent = (raffle, revealState = {}) => {
  const slug = toSlug(raffle.title || raffle.id);
  const statusMeta = getStatusMeta(raffle.status, raffle.startAt, raffle.endAt);
  const revealMeta = revealState[slug] || {};
  const resolvedResult = revealMeta.result || raffle.userResult || "lose";
  const isRevealed = revealMeta.isRevealed ?? raffle.status === "REVEALED";
  const hasCheckedResult = Boolean(revealMeta.hasCheckedResult);

  return {
    id: raffle.id,
    slug,
    title: raffle.title || "래플",
    shortTitle: raffle.title || "래플",
    thumbnail: raffle.imageUrl || "",
    description: raffle.category
      ? `${raffle.category} 카테고리 래플입니다. 응모 기간과 당첨 정보를 확인해보세요.`
      : "응모 기간과 당첨 정보를 확인해보세요.",
    overviewSubtitle: raffle.category
      ? `${raffle.category} 카테고리 래플 이벤트입니다.`
      : "래플 이벤트 상세 정보를 확인해보세요.",
    hasParticipated: Boolean(raffle.hasParticipated),
    result: resolvedResult,
    status: {
      participants: Number(raffle.participants || 0),
      maxParticipants: Math.max(Number(raffle.maxParticipants || 30), 1),
      winners: Number(raffle.firstPrizeCount || 0) + Number(raffle.secondPrizeCount || 0),
      statusText: isRevealed ? getResultStatusLabel(resolvedResult, hasCheckedResult) : statusMeta.statusText,
      progress: 0,
      mintClosed: statusMeta.mintClosed,
      isRevealed,
      hasCheckedResult,
      remainingTime: isRevealed
        ? hasCheckedResult
          ? "당첨 결과 확인 완료"
          : "결과 공개 완료"
        : statusMeta.remainingTime,
    },
    transparency: {
      contractAddress: raffle.contractAddress || "-",
      provenanceHash: raffle.provenanceHash || "-",
      description1: "모든 래플 데이터는 서버 DB와 블록체인 정보를 기준으로 관리됩니다.",
      description2: "컨트랙트 주소와 provenance hash를 통해 무결성을 확인할 수 있습니다.",
    },
    rewardInfo: {
      title: "당첨 정보",
      first: `1등 ${Number(raffle.firstPrizeCount || 0)}명`,
      second: `2등 ${Number(raffle.secondPrizeCount || 0)}명`,
    },
    mintTitle: `${raffle.title || "래플"}에 참여해보세요`,
    mintDescription: raffle.category
      ? `${raffle.category} 래플 응모를 위해 민팅을 진행합니다.`
      : "래플 응모를 위해 민팅을 진행합니다.",
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
  const [walletAddress, setWalletAddress] = useState(() => localStorage.getItem(getWalletAddressStorageKey()) || "");
  const [revealState, setRevealState] = useState(() => getWalletRevealState(localStorage.getItem(getWalletAddressStorageKey()) || ""));
  const [allEvents, setAllEvents] = useState([]);
  const [mintedEventIds, setMintedEventIds] = useState(() => {
    const parsed = getWalletMintedEventsById(localStorage.getItem(getWalletAddressStorageKey()) || "");
    return Object.keys(parsed).filter((key) => parsed[key]);
  });

  useEffect(() => {
    let cancelled = false;

    const syncLocalState = () => {
      const parsedRevealState = getWalletRevealState(walletAddress);
      const parsedMintedEvents = getWalletMintedEventsById(walletAddress);

      if (!cancelled) {
        setRevealState(parsedRevealState);
        setMintedEventIds(Object.keys(parsedMintedEvents).filter((key) => parsedMintedEvents[key]));
      }
    };

    const fetchRaffles = async () => {
      try {
        syncLocalState();

        const query = walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : "";
        const response = await fetch(`${API_BASE_URL}/api/raffles${query}`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          throw new Error("Failed to load raffles");
        }

        if (!cancelled) {
          const latestRevealState = getWalletRevealState(walletAddress);
          const nextRevealState = { ...latestRevealState };

          data.forEach((raffle) => {
            if (!raffle.hasParticipated) return;

            const slug = toSlug(raffle.title || raffle.id);
            nextRevealState[slug] = {
              ...(nextRevealState[slug] || {}),
              isRevealed: raffle.status === "REVEALED",
              result:
                raffle.status === "REVEALED"
                  ? raffle.userResult || nextRevealState[slug]?.result || "lose"
                  : nextRevealState[slug]?.result,
            };
          });

          const syncedMintedTickets = getWalletMintedTickets(walletAddress)
            .map((ticket) => {
              const matchingRaffle = data.find((raffle) => raffle.id === ticket.eventId);

                if (!matchingRaffle) {
                  return ticket;
                }

                const ticketWithImage = {
                  ...ticket,
                  image: ticket.image || matchingRaffle.imageUrl || "",
                };

                if (matchingRaffle.status !== "REVEALED") {
                  return ticketWithImage;
                }

              const ticketResult = matchingRaffle.userResult || "lose";
              if (ticketResult === "lose") {
                return null;
              }

              return {
                  ...ticketWithImage,
                result: ticketResult,
                status: "당첨",
                reward: ticketResult === "first" ? "당첨권" : "퍼즐조각",
                usageGuide:
                  ticketResult === "first"
                    ? "당첨권이 지갑에 저장되었습니다."
                    : "퍼즐조각이 지갑에 저장되었습니다.",
                isPrePurchaseReward: ticketResult === "first",
              };
            })
            .filter(Boolean);

          saveWalletMintedTickets(walletAddress, syncedMintedTickets);
          saveWalletRevealState(walletAddress, nextRevealState);
          setRevealState(nextRevealState);
          setAllEvents(data.map((raffle) => mapRaffleToEvent(raffle, nextRevealState)));
          window.dispatchEvent(new Event("minted-events-updated"));
        }
      } catch (error) {
        console.error("Failed to fetch user raffles:", error);
        if (!cancelled) {
          setAllEvents([]);
        }
      }
    };

    const handleSyncEvent = () => {
      fetchRaffles();
    };

    const handleStorage = (event) => {
      const revealStateKey = walletAddress ? `revealState:${walletAddress.toLowerCase()}` : "revealState";
      const mintedEventsKey = walletAddress ? `mintedEventsById:${walletAddress.toLowerCase()}` : "mintedEventsById";
      const mintedTicketsKey = walletAddress ? `mintedTickets:${walletAddress.toLowerCase()}` : "mintedTickets";

      if (event.key === revealStateKey || event.key === mintedEventsKey || event.key === mintedTicketsKey) {
        fetchRaffles();
      }
    };

    fetchRaffles();
    const intervalId = setInterval(fetchRaffles, 5000);

    window.addEventListener("minted-events-updated", handleSyncEvent);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleSyncEvent);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("minted-events-updated", handleSyncEvent);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleSyncEvent);
    };
  }, [walletAddress]);

  const homeEvents = useMemo(
    () => allEvents.filter((event) => event.status.statusText === "진행중" && !event.status.isRevealed),
    [allEvents]
  );

  const drawEvents = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          (event.hasParticipated || mintedEventIds.includes(String(event.id))) &&
          (event.status.isRevealed || ["진행중", "종료"].includes(event.status.statusText))
      ),
    [allEvents, mintedEventIds]
  );

  const handleDisconnectWallet = () => {
    clearWalletScopedStorage(walletAddress);
    localStorage.removeItem(getWalletAddressStorageKey());
    setWalletAddress("");
    setRevealState({});
    setMintedEventIds([]);
  };

  const handleLoginSuccess = (newWalletAddress) => {
    localStorage.setItem(getWalletAddressStorageKey(), newWalletAddress);
    setWalletAddress(newWalletAddress);
  };

  const pathname = location.pathname;

  if (pathname === "/" || pathname === "/login") {
    return walletAddress ? <Navigate to="/home" replace /> : <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (pathname === "/home") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <Home events={homeEvents} />
      </ProtectedLayout>
    );
  }

  if (pathname.startsWith("/participate/")) {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <Participate walletAddress={walletAddress} events={allEvents} />
      </ProtectedLayout>
    );
  }

  if (pathname === "/draw-status") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <DrawStatus events={drawEvents} walletAddress={walletAddress} />
      </ProtectedLayout>
    );
  }

  if (pathname === "/my-wallet") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <MyWallet revealState={revealState} walletAddress={walletAddress} />
      </ProtectedLayout>
    );
  }

  if (pathname === "/puzzle-exchange") {
    return (
      <ProtectedLayout walletAddress={walletAddress} onLogout={handleDisconnectWallet}>
        <PuzzleExchange revealState={revealState} walletAddress={walletAddress} />
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
