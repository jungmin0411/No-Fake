const mockPuzzle = {
  progress: {
    target: 10,
  },
  pieces: [
    { id: 1234, selected: true },
    { id: 2345, selected: true },
    { id: 3456, selected: true },
    { id: 4567, selected: true },
    { id: 5678, selected: true },
    { id: 6789, selected: true },
  ],
  rewards: [
    {
      title: "20% 할인쿠폰",
      description: "퍼즐 10개를 모아 20% 할인쿠폰을 획득하세요",
      need: 10,
    },
    {
      title: "15% 할인쿠폰",
      description: "퍼즐 8개를 모아 15% 할인쿠폰을 획득하세요",
      need: 8,
    },
    {
      title: "10% 할인쿠폰",
      description: "퍼즐 6개를 모아 10% 할인쿠폰을 획득하세요",
      need: 6,
    },
  ],
  process: [
    "퍼즐 조각을 10개 이상 수집",
    "교환할 조각 선택",
    "선구매권 NFT 또는 쿠폰 발행",
  ],
};

export default mockPuzzle;