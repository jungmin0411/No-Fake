const mockDraw = [
  {
    id: 1,
    slug: "jordan-preorder",
    eventName: "조던 신발 선구매",
    banner: {
      title: "이벤트 당첨 결과 확인",
      revealedDescription:
        "추첨이 완료되었습니다. 내 지갑에서 당첨 결과를 확인하세요.",
      waitingDescription: "결과 공개 대기 중입니다. 잠시만 기다려주세요.",
      revealedButtonText: "당첨 확인하기",
    },
    products: [
      {
        rank: "1등",
        name: "특별 NFT 선구매권",
        description: "나이키에서 제공하는 한정판 상품을 선구매할 수 있습니다",
        quantity: "3개",
      },
      {
        rank: "2등",
        name: "퍼즐 조각 (1개)",
        description: "일정 개수를 모으면 퍼즐교환소에서 보상과 교환할 수 있습니다",
        quantity: "10개",
      },
      {
        rank: "3등",
        name: "퍼즐 조각 (3개)",
        description: "일정 개수를 모으면 퍼즐교환소에서 보상과 교환할 수 있습니다",
        quantity: "20개",
      },
    ],
    liveEntries: [],
    result: "first",
  },
  {
    id: 2,
    slug: "baekseok-collab",
    eventName: "백석대 콜라보",
    banner: {
      title: "이벤트 당첨 결과 확인",
      revealedDescription:
        "추첨이 완료되었습니다. 내 지갑에서 당첨 결과를 확인하세요.",
      waitingDescription: "결과 공개 대기 중입니다. 잠시만 기다려주세요.",
      revealedButtonText: "당첨 확인하기",
    },
    products: [
      {
        rank: "1등",
        name: "한정판 굿즈",
        description: "추첨을 통해 한정판 굿즈를 받을 수 있습니다",
        quantity: "2개",
      },
      {
        rank: "2등",
        name: "퍼즐 조각 (2개)",
        description: "퍼즐교환소에서 보상과 교환할 수 있습니다",
        quantity: "5개",
      },
      {
        rank: "3등",
        name: "퍼즐 조각 (1개)",
        description: "퍼즐교환소에서 보상과 교환할 수 있습니다",
        quantity: "8개",
      },
    ],
    liveEntries: [],
    result: "second",
  },
];

export default mockDraw;