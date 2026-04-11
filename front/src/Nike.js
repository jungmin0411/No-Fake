import React, { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, ChevronRight, Play } from 'lucide-react';
import './Nike.css';
import { useNavigate } from 'react-router-dom';

const NikeWebsite = () => {
  const [wishlist, setWishlist] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('전체');
  const navigate = useNavigate();

  const navLinks = ['남성', '여성', '키즈', '래플', '컬렉션', 'SALE'];
  const categories = ['전체', '러닝', '농구', '라이프스타일', '트레이닝'];

  const products = [
    { id: 1, name: '나이키 에어맥스 90', category: '라이프스타일', price: 179000, tag: 'BEST', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600' },
    { id: 2, name: '나이키 줌 베이퍼플라이', category: '러닝', price: 299000, tag: 'NEW', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=600' },
    { id: 3, name: '나이키 리액트 인피니티', category: '러닝', price: 199000, tag: null, image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=600' },
    { id: 4, name: '나이키 조던 1 레트로', category: '농구', price: 219000, tag: 'HOT', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600' },
    { id: 5, name: '나이키 에어포스 1', category: '라이프스타일', price: 139000, tag: null, image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=600' },
    { id: 6, name: '나이키 페가수스 40', category: '러닝', price: 159000, tag: 'NEW', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600' },
  ];

  const collections = [
    { title: 'AIR MAX DAY', sub: '클래식의 귀환', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800', dark: true },
    { title: 'JUST RUN IT', sub: '2026 러닝 컬렉션', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800', dark: false },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleNavClick = (link) => {
    if (link === '래플') { navigate('/raffle'); return; }
    // 다른 링크 라우팅은 여기에 추가
  };

  const filteredProducts = activeCategory === '전체'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="nike-home">

      {/* ── NAV ── */}
      <nav className={`nike-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>NIKE</div>
          <div className="nav-menu">
            {navLinks.map(link => (
              <span
                key={link}
                className={link === '래플' ? 'raffle-link' : ''}
                onClick={() => handleNavClick(link)}
              >
                {link}
                {link === '래플' && <span className="raffle-dot" />}
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

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="home-hero-bg">
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600" alt="hero" />
          <div className="hero-overlay" />
        </div>
        <div className="home-hero-content">
          <span className="home-hero-eyebrow">2026 NEW ARRIVAL</span>
          <h1 className="home-hero-title">JUST<br />DO IT.</h1>
          <p className="home-hero-sub">한계를 넘어서는 것,<br />그것이 나이키의 시작입니다.</p>
          <div className="home-hero-actions">
            <button className="btn-hero-primary">지금 쇼핑하기</button>
            <button className="btn-hero-secondary" onClick={() => navigate('/raffle')}>
              <Play size={14} fill="currentColor" />
              래플 참여하기
            </button>
          </div>
        </div>

        {/* 래플 배너 플로팅 */}
        <div className="raffle-float-banner" onClick={() => navigate('/raffle')}>
          <div className="rfb-pulse" />
          <div className="rfb-content">
            <span className="rfb-tag">LIVE</span>
            <div>
              <div className="rfb-title">래플 진행 중</div>
              <div className="rfb-sub">에어 조던 1 × 트래비스 스캇</div>
            </div>
          </div>
          <ChevronRight size={16} />
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      <section className="collections-section">
        <div className="collections-header">
          <h2>컬렉션</h2>
          <span className="view-all">전체보기 →</span>
        </div>
        <div className="collections-grid">
          {collections.map((col, i) => (
            <div key={i} className="collection-card">
              <img src={col.image} alt={col.title} />
              <div className={`col-overlay${col.dark ? ' dark' : ''}`}>
                <div>
                  <div className="col-sub">{col.sub}</div>
                  <div className="col-title">{col.title}</div>
                </div>
                <button className="col-btn">보러가기 →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RAFFLE 띠 배너 ── */}
      <div className="raffle-strip" onClick={() => navigate('/raffle')}>
        <div className="strip-inner">
          <span className="strip-tag">HOT 래플</span>
          <span className="strip-text">에어 조던 1 로우 × 트래비스 스캇 — 지금 12,482명 참여 중</span>
          <span className="strip-cta">참여하기 →</span>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <section className="product-section">
        <div className="product-section-header">
          <h2>신상품 추천</h2>
          <span className="view-all">전체보기 →</span>
        </div>
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {filteredProducts.map((product, i) => (
            <div key={product.id} className="product-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="img-box">
                <img src={product.image} alt={product.name} />
                {product.tag && <span className="product-tag">{product.tag}</span>}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`heart-btn${wishlist.includes(product.id) ? ' wished' : ''}`}
                >
                  <Heart size={18} />
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

      {/* ── FOOTER ── */}
      <footer className="nike-footer">
        <div className="footer-top">
          <div className="footer-col"><h4>안내</h4><ul><li>멤버가입</li><li>매장찾기</li><li>제품 가이드</li><li>러닝화 가이드</li></ul></div>
          <div className="footer-col"><h4>멤버 혜택</h4><ul><li>웰컴 쿠폰</li><li>생일 쿠폰</li><li>학생 할인 쿠폰</li></ul></div>
          <div className="footer-col"><h4>고객센터</h4><ul><li>주문배송조회</li><li>반품 정책</li><li>결제 방법</li><li>공지사항</li><li>문의하기</li></ul></div>
          <div className="footer-col"><h4>회사소개</h4><ul><li>About Nike</li><li>소식</li><li>채용</li><li>투자자</li><li>지속가능성</li><li>코칭</li><li>신고하기</li></ul></div>
          <div className="footer-col align-end"><span className="footer-country">🌐 대한민국</span></div>
        </div>
        <div className="footer-bottom">
          <div className="footer-links">
            <span>© 2026 Nike, Inc. All Rights Reserved</span>
            <span>이용약관</span><span className="highlight">개인정보처리방침</span>
            <span>위치정보이용약관</span><span>영상정보처리기기 운영 방침</span>
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