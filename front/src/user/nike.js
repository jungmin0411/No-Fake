import React, { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, Ticket, ShieldCheck, Timer } from 'lucide-react';
import './nike.css';
import { useNavigate } from 'react-router-dom';

const NikeWebsite = () => {
  const [wishlist, setWishlist] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 39 });
  const navigate = useNavigate();

  const navLinks = ['남성', '여성', '키즈', '래플', '컬렉션', 'SALE'];

  const products = [
    { id: 1, name: '나이키 에어맥스 90', category: '라이프스타일', price: 179000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600' },
    { id: 2, name: '나이키 줌 베이퍼플라이', category: '러닝', price: 299000, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=600' },
    { id: 3, name: '나이키 리액트 인피니티', category: '러닝', price: 199000, image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=600' },
    { id: 4, name: '나이키 조던 1 레트로', category: '농구', price: 219000, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600' },
  ];

  // 타이머 로직
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  // ✅ 버튼 클릭 시 즉시 대시보드로 이동
  const handleRaffleClick = () => {
    console.log("래플 참여 버튼 클릭됨 - 로그인 페이지로 이동합니다.");
    navigate('/login'); // 로그인 페이지로 이동 (추후 로그인 후 대시보드로 리디렉션)
  };

  return (
    <div className="nike-page">
      <nav className="nike-nav">
        <div className="nav-inner">
          <div className="nav-logo">NIKE</div>
          <div className="nav-menu">
            {navLinks.map(link => (
              <span key={link} className={link === '래플' ? 'active' : ''}>
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

      <main className="raffle-main">
        <div className="section-header">
          <div className="badge"><ShieldCheck size={14} /> ON-CHAIN VERIFIED</div>
          <h1>진행 중인 래플</h1>
          <div className="timer-box">
            <Timer size={20} />
            <span>
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="raffle-column">
          <div className="main-raffle-card">
            <div className="card-text">
              <span className="drop-tag">LIMITED DROP</span>
              <h2>나이키 x 트래비스 스캇<br />에어 조던 1 로우</h2>
              <div className="count"><Ticket size={18} /> 현재 12,482명 참여 중</div>

              {/* ✅ 버튼이 항상 활성화되어 있으며 클릭 시 작동합니다. */}
              <button
                className="btn-raffle"
                onClick={handleRaffleClick}
              >
                래플 참여하기 (On-Chain)
              </button>
            </div>
            <div className="card-img-wrap">
              <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800" alt="shoe" />
            </div>
          </div>

          <div className="info-card dark">
            <h3>왜 NOFAKE 래플인가요?</h3>
            <p>모든 추첨 로직은 스마트 컨트랙트에 의해 자동으로 실행됩니다. 결과 조작이 불가능하며 모든 기록은 투명하게 공개됩니다.</p>
          </div>

          <div className="info-card light">
            <div>
              <h3>참여 즉시 NFT 발급</h3>
              <p>응모 완료 시 본인의 지갑으로 디지털 응모 티켓이 전송됩니다.</p>
            </div>
            <Ticket size={40} className="icon-red" />
          </div>
        </div>
      </main>

      <section className="product-section">
        <h2>신상품 추천</h2>
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="img-box">
                <img src={product.image} alt={product.name} />
                <button onClick={() => toggleWishlist(product.id)} className="heart-btn">
                  <Heart size={20} style={{ color: wishlist.includes(product.id) ? 'red' : 'gray' }} />
                </button>
              </div>
              <div className="product-info">
                <span className="category">{product.category}</span>
                <h3 className="name">{product.name}</h3>
                <p className="price">{product.price.toLocaleString()}원</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="nike-footer">
        <div className="footer-top">
          <div className="footer-col">
            <h4>안내</h4>
            <ul>
              <li>멤버가입</li>
              <li>매장찾기</li>
              <li>제품 가이드</li>
              <li>러닝화 가이드</li>
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
              <li>코칭</li>
              <li>신고하기</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>🌐 대한민국</h4>
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
            (유)나이키코리아 대표 Chase Louis Taylor, 체이스 루이스 테일러 | 서울 강남구 테헤란로 152 강남파이낸스센터 30층 |
            통신판매업신고번호 2011-서울강남-03461 | 사업자등록번호 220-88-09068<br />
            고객센터 전화 문의 080-022-0182 FAX 02-6744-5880 | 이메일 Nikekorea@nike.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NikeWebsite;