const mockEvents = [
  {
    id: 1,
    slug: "jordan-preorder",
    title: "조던 신발 선구매 이벤트 래플 참여",
    shortTitle: "조던 신발 선구매",
    thumbnail: "/images/events/jordan-preorder.jpg",
    description:
      "한정판 조던 신발 선구매 기회를 위한 래플 이벤트입니다. 이벤트 개요를 확인하고 참여할 수 있습니다.",
    overviewSubtitle:
      "한정판 조던 신발 선구매 기회를 위한 래플 이벤트입니다.",
    result: "first",
    status: {
      participants: 12,
      maxParticipants: 30,
      winners: 3,
      statusText: "참여 가능",
      progress: 40,
      mintClosed: false,
      isRevealed: false,
      remainingTime: "민팅 마감",
    },
    transparency: {
      contractAddress: "0x1234...5678",
      provenanceHash: "0xabcd...ef01",
      description1: "모든 참여 기록과 추첨 결과는 블록체인에 기록됩니다.",
      description2: "누구나 검증 가능한 투명한 이벤트 흐름을 제공합니다.",
    },
    rewardInfo: {
      title: "보상 정보",
      first: "1등: 조던 선구매권",
      second: "2등: 퍼즐 조각 지급",
    },
    mintTitle: "미스터리 박스를 민팅하고 이벤트에 참여하세요",
    mintDescription:
      "당첨 시 조던 선구매권과 퍼즐 조각을 획득할 수 있습니다.",
    mintPrice: "0.01 ETH",
    gasEstimate: "~0.002 ETH",
    totalCost: "~0.012 ETH",
  },
  {
    id: 2,
    slug: "baekseok-collab",
    title: "백석대 콜라보 이벤트 래플 참여",
    shortTitle: "백석대 콜라보",
    thumbnail: "/images/events/baekseok-collab.jpg",
    description:
      "백석대 콜라보 굿즈와 특별 혜택을 위한 이벤트입니다. 현재 진행 상태와 보상 정보를 확인할 수 있습니다.",
    overviewSubtitle:
      "백석대 콜라보 굿즈와 특별 혜택을 위한 이벤트입니다.",
    result: "second",
    status: {
      participants: 18,
      maxParticipants: 50,
      winners: 5,
      statusText: "진행 중",
      progress: 36,
      mintClosed: false,
      isRevealed: false,
      remainingTime: "1일 2시간",
    },
    transparency: {
      contractAddress: "0x9876...4321",
      provenanceHash: "0xbcde...fa22",
      description1: "이벤트 참여 이력과 당첨 결과는 온체인에 반영됩니다.",
      description2:
        "콜라보 이벤트의 모든 절차는 투명성 센터에서 확인 가능합니다.",
    },
    rewardInfo: {
      title: "보상 정보",
      first: "1등: 콜라보 한정 선구매권",
      second: "2등: 퍼즐 조각 지급",
    },
    mintTitle: "콜라보 박스를 민팅하고 이벤트에 참여하세요",
    mintDescription:
      "당첨 시 콜라보 선구매권과 퍼즐 조각을 획득할 수 있습니다.",
    mintPrice: "0.02 ETH",
    gasEstimate: "~0.002 ETH",
    totalCost: "~0.022 ETH",
  },
];

export default mockEvents;