import { Navigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
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

  const events = useMemo(() => {
    return mockEvents.map((event) => ({
      ...event,
      status: {
        ...event.status,
        isRevealed: revealState[event.slug] ?? false,
      },
    }));
  }, [revealState]);

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
