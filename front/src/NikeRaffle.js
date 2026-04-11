import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./NikeRaffle.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";

const NikeRaffle = ({ walletAddress }) => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleRaffleButtonClick = async (raffleId) => {
    if (!walletAddress) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          raffleId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.alert("래플 응모가 완료되었습니다. 지갑으로 NFT가 전송됩니다.");
        navigate("/dashboard");
        return;
      }

      window.alert(`응모 실패: ${data.error || "알 수 없는 오류"}`);
    } catch (error) {
      console.error("Mint request failed:", error);
      window.alert("백엔드 서버 연결에 실패했습니다.");
    }
  };

  const navItems = ["남성", "여성", "신발", "래플", "컬렉션", "SALE"];

  return (
    <div className="nike-page">
      <nav className={`nike-nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="nav-logo">NIKE</div>
          <div className="nav-menu">
            {navItems.map((item) => (
              <span key={item} className={item === "래플" ? "active" : ""}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </nav>

      <section className="raffle-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <ShieldCheck size={13} />
            <span>ON-CHAIN VERIFIED · 공정 추첨 보장</span>
          </div>
          <h1 className="hero-title">
            한정판 스니커즈를
            <br />
            <em>만나는 가장 투명한 방식</em>
            <br />
            나이키 래플
          </h1>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => handleRaffleButtonClick(1)}>
              지금 참여하기
            </button>
          </div>
        </div>
      </section>

      <main className="raffle-main">
        <div className="raffle-column">
          <div className="main-raffle-card">
            <div className="card-text">
              <span className="drop-tag">LIMITED DROP</span>
              <h2>
                나이키 x 트래비스 스캇
                <br />
                에어 조던 1 로우
              </h2>
              <button className="btn-raffle" onClick={() => handleRaffleButtonClick(1)}>
                {walletAddress ? "민팅하기 (On-Chain)" : "참여하기 (로그인 필요)"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NikeRaffle;
