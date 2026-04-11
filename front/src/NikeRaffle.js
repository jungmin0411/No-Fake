import React, { useEffect, useState } from "react";
import {
  Award,
  Clock3,
  Heart,
  Search,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./NikeRaffle.css";

const navLinks = ["남성", "여성", "신발", "래플", "컬렉션", "SALE"];

const NikeRaffle = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 39 });
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleRaffleClick = () => navigate("/login");
  const handleNavClick = (link) => {
    if (link !== "래플") {
      navigate("/");
    }
  };

  const pad = (value) => String(value).padStart(2, "0");

  return (
    <div className="nike-page">
      <nav className={`nike-nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            NIKE
          </div>

          <div className="nav-menu">
            {navLinks.map((link) => (
              <span
                key={link}
                className={link === "래플" ? "active" : ""}
                onClick={() => handleNavClick(link)}
              >
                {link}
              </span>
            ))}
          </div>

          <div className="nav-utils">
            <div className="search-bar">
              <input type="search" placeholder="검색" />
              <Search className="search-icon" size={16} />
            </div>
            <Heart size={20} />
            <ShoppingBag size={20} />
          </div>
        </div>
      </nav>

      <section className="raffle-hero">
        <div className="hero-bg-text">RAFFLE</div>

        <div className="hero-content">
          <div className="hero-eyebrow">
            <ShieldCheck size={13} />
            <span>ON-CHAIN VERIFIED · 공정 추첨 보장</span>
          </div>

          <h1 className="hero-title">
            한정판 스니커즈를
            <br />
            <em>만나는 가장</em>
            <br />
            공정한 방법
          </h1>

          <p className="hero-desc">
            스마트 컨트랙트 기반 추첨으로
            <br />
            누구에게나 동등한 당첨 기회를 제공합니다.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={handleRaffleClick}>
              지금 참여하기
            </button>

            <div className="hero-timer">
              <Clock3 size={14} />
              <span>마감까지</span>
              <strong>
                {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
              </strong>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">12,482</span>
              <span className="stat-lbl">현재 참여자</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">380+</span>
              <span className="stat-lbl">당첨 인원</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">98%</span>
              <span className="stat-lbl">만족도</span>
            </div>
          </div>
        </div>

        <div className="hero-img-wrap">
          <div className="hero-img-glow" />
          <img
            src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=900&auto=format&fit=crop"
            alt="Nike raffle sneaker"
            className="hero-shoe"
          />
          <div className="hero-badge">
            <Ticket size={16} />
            <span>LIMITED DROP</span>
          </div>
        </div>
      </section>

      <main className="raffle-main">
        <div className="section-label">
          <div className="label-line" />
          <span>진행 중인 래플</span>
          <div className="label-line" />
        </div>

        <div className="raffle-column">
          <div className="main-raffle-card">
            <div className="card-text">
              <span className="drop-tag">LIMITED DROP</span>
              <h2>
                나이키 x 트래비스 스캇
                <br />
                에어 조던 1 로우
              </h2>

              <div className="raffle-meta">
                <div className="meta-item">
                  <Users size={15} />
                  <span>12,482명 참여 중</span>
                </div>
                <div className="meta-item">
                  <Clock3 size={15} />
                  <span>
                    {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                  </span>
                </div>
              </div>

              <button className="btn-raffle" onClick={handleRaffleClick}>
                래플 참여하기 (On-Chain)
              </button>
            </div>

            <div className="card-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop"
                alt="Raffle shoe"
              />
            </div>
          </div>

          <div className="info-cards-row">
            <div className="info-card dark">
              <div className="info-icon">
                <Zap size={22} />
              </div>
              <h3>왜 NOFAKE 래플인가요?</h3>
              <p>
                모든 추첨 로직은 스마트 컨트랙트를 통해 자동으로 실행됩니다. 결과 조작이 어렵고
                참여 기록을 투명하게 확인할 수 있습니다.
              </p>
            </div>

            <div className="info-card light">
              <div className="info-icon accent">
                <Award size={22} />
              </div>
              <h3>참여 즉시 NFT 발급</h3>
              <p>
                응모가 완료되면 지갑으로 참여 이력을 증명하는 NFT가 전송되어 온체인 기록으로
                남습니다.
              </p>
              <Ticket size={48} className="icon-watermark" />
            </div>
          </div>
        </div>
      </main>

      <footer className="nike-footer">
        <div className="footer-top">
          <div className="footer-col">
            <h4>안내</h4>
            <ul>
              <li>멤버가입 안내</li>
              <li>매장찾기</li>
              <li>제품 가이드</li>
              <li>사이즈 가이드</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>멤버 혜택</h4>
            <ul>
              <li>웰컴 쿠폰</li>
              <li>생일 쿠폰</li>
              <li>학생 할인 쿠폰</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>고객센터</h4>
            <ul>
              <li>주문배송조회</li>
              <li>반품 정책</li>
              <li>결제 방법</li>
              <li>공지사항</li>
              <li>문의하기</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>회사소개</h4>
            <ul>
              <li>About Nike</li>
              <li>소식</li>
              <li>채용</li>
              <li>투자자</li>
              <li>지속가능성</li>
              <li>콘텐츠</li>
              <li>광고안내</li>
            </ul>
          </div>

          <div className="footer-col align-end">
            <span className="footer-country">대한민국</span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-links">
            <span>© 2026 Nike, Inc. All Rights Reserved</span>
            <span>이용약관</span>
            <span className="highlight">개인정보처리방침</span>
            <span>위치정보이용약관</span>
            <span>영상정보처리기기 운영 방침</span>
          </div>

          <p className="footer-copy">
            나이키코리아 | 서울 강남구 테헤란로 152 강남파이낸스센터 30층
            <br />
            고객센터 전화 문의 080-022-0182 | 이메일 Nikekorea@nike.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NikeRaffle;
