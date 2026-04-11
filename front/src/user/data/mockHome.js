const mockHome = {
  eventStatus: {
    participants: 12,
    maxParticipants: 30,
    winners: 3,
    statusText: "참여 가능",
    progress: 55,
  },
  rewards: {
    puzzleCount: 3,
    puzzleGoal: 10,
    hasPrePurchase: true,
    prePurchaseText: "당첨을 축하합니다! 선구매권이 지급되었습니다",
  },
  transparency: {
    contractAddress: "0x1234...5678",
    provenanceHash: "0xabcd...ef01",
    description1: "모든 추첨 과정은 블록체인에 기록됩니다",
    description2: "결과 조작이 불가능한 투명한 이벤트",
  },
  puzzleExchange: {
    currentPieces: 7,
    targetPieces: 10,
    rewardName: "특별 NFT 보상",
    neededText: "3개 더 필요",
    guideText: "이벤트에 참여하여 퍼즐 조각을 모으세요",
  },
};

export default mockHome;