const mockTransparency = {
  hero: {
    title: "완전 투명한 추첨 시스템",
    description:
      "NoFAKE는 블록체인 기반 기록을 사용하여 조작이 불가능한 무작위 추첨을 보장합니다. 모든 추첨 과정은 블록체인에 영구적으로 기록되어 누구나 검증할 수 있습니다.",
    tags: ["검증 가능", "조작 불가", "완전 무작위"],
  },
  contract: {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0EbDb",
    provenanceHash:
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    network: "Ethereum Mainnet",
    type: "ERC-721",
    status: "검증됨",
    buttonText: "Etherscan에서 보기",
  },
  blockchain: {
    title: "블록체인 기록",
    description:
      "모든 이벤트 참여 및 추첨 결과는 블록체인에 영구적으로 기록되어 누구나 검증할 수 있습니다.",
    totalEvents: 3,
    totalParticipants: 127,
    totalWinners: 45,
    items: [
      "모든 참여자의 티켓 발행 기록",
      "무작위 추첨 결과 및 당첨자",
      "NFT 소유권 및 전송 내역",
      "상품 수령 및 소각 기록",
    ],
  },
  history: [
    {
      eventId: "#1",
      txHash: "0x1a2b3c...",
      executedAt: "2026-04-03 14:30:22",
      participants: "40명",
      status: "완료",
    },
    {
      eventId: "#2",
      txHash: "0x4d5e6f...",
      executedAt: "2026-04-02 18:45:11",
      participants: "64명",
      status: "완료",
    },
    {
      eventId: "#3",
      txHash: "0x7g8h9i...",
      executedAt: "2026-04-01 09:15:33",
      participants: "52명",
      status: "완료",
    },
  ],
};

export default mockTransparency;