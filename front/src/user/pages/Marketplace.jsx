import { useMemo, useState } from "react";

const seedListings = [
  {
    id: 1,
    title: "조던 퍼즐 조각 3개 묶음",
    category: "퍼즐 조각",
    price: "0.08 ETH",
    seller: "0xf989...e94a",
    status: "판매 중",
    description: "조던 이벤트 퍼즐 조각 3개를 한 번에 거래합니다.",
  },
  {
    id: 2,
    title: "오프화이트 응모권 교환",
    category: "응모권",
    price: "협의",
    seller: "0xa120...7b12",
    status: "교환 제안",
    description: "오프화이트 응모권과 다른 이벤트 응모권 교환 원합니다.",
  },
  {
    id: 3,
    title: "에어맥스 한정 굿즈 판매",
    category: "굿즈",
    price: "35,000원",
    seller: "0x54de...31cc",
    status: "판매 중",
    description: "이벤트 참여 굿즈 미개봉 상태입니다.",
  },
];

const initialForm = {
  title: "",
  category: "퍼즐 조각",
  price: "",
  description: "",
};

export default function Marketplace() {
  const [listings, setListings] = useState(seedListings);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("전체");

  const filteredListings = useMemo(() => {
    if (filter === "전체") {
      return listings;
    }
    return listings.filter((listing) => listing.status === filter);
  }, [filter, listings]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.price.trim()) {
      return;
    }

    const nextListing = {
      id: Date.now(),
      title: form.title.trim(),
      category: form.category,
      price: form.price.trim(),
      seller: "내 지갑",
      status: "판매 중",
      description: form.description.trim() || "상세 설명이 아직 등록되지 않았습니다.",
    };

    setListings((prev) => [nextListing, ...prev]);
    setForm(initialForm);
  };

  return (
    <section className="marketplace-page">
      <div className="page-heading">
        <h2>거래소</h2>
        <p>사용자끼리 퍼즐, 응모권, 굿즈를 등록하고 거래할 수 있는 공간입니다.</p>
      </div>

      <div className="marketplace-layout">
        <aside className="marketplace-form-card">
          <div className="marketplace-card-top">
            <span className="marketplace-kicker">거래 등록</span>
            <h3>내 물품 올리기</h3>
          </div>

          <form className="marketplace-form" onSubmit={handleSubmit}>
            <label>
              제목
              <input
                type="text"
                value={form.title}
                onChange={(event) => handleChange("title", event.target.value)}
                placeholder="예: 조던 퍼즐 조각 3개"
              />
            </label>

            <label>
              카테고리
              <select
                value={form.category}
                onChange={(event) => handleChange("category", event.target.value)}
              >
                <option>퍼즐 조각</option>
                <option>응모권</option>
                <option>굿즈</option>
                <option>기타</option>
              </select>
            </label>

            <label>
              가격 / 조건
              <input
                type="text"
                value={form.price}
                onChange={(event) => handleChange("price", event.target.value)}
                placeholder="예: 0.08 ETH 또는 협의"
              />
            </label>

            <label>
              설명
              <textarea
                value={form.description}
                onChange={(event) => handleChange("description", event.target.value)}
                placeholder="거래 조건과 물품 상태를 적어주세요."
              />
            </label>

            <button type="submit" className="marketplace-submit-btn">
              거래 글 등록
            </button>
          </form>
        </aside>

        <div className="marketplace-list-panel">
          <div className="marketplace-toolbar">
            <div>
              <span className="marketplace-kicker">실시간 목록</span>
              <h3>등록된 거래</h3>
            </div>

            <div className="marketplace-filters">
              {["전체", "판매 중", "교환 제안"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? "market-filter active" : "market-filter"}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="marketplace-list">
            {filteredListings.map((listing) => (
              <article key={listing.id} className="marketplace-item">
                <div className="marketplace-item-top">
                  <span className={`market-status ${listing.status === "판매 중" ? "sale" : "trade"}`}>
                    {listing.status}
                  </span>
                  <span className="market-category">{listing.category}</span>
                </div>

                <h4>{listing.title}</h4>
                <p>{listing.description}</p>

                <div className="marketplace-item-meta">
                  <div>
                    <span>판매자</span>
                    <strong>{listing.seller}</strong>
                  </div>
                  <div>
                    <span>가격</span>
                    <strong>{listing.price}</strong>
                  </div>
                </div>

                <button type="button" className="marketplace-action-btn">
                  거래 문의
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
