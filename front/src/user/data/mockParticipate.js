const mockParticipate = {
  qr: {
    title: "QR 코드 스캔",
    description: "이벤트 QR 코드를 스캔하여 참여하세요",
    subText: "오프라인 이벤트장에서 QR 코드를 찾아보세요",
    cameraButton: "카메라로 스캔",
    uploadButton: "이미지 업로드",
  },
  mint: {
    title: "미스터리 박스 민팅",
    description: "미스터리 박스를 민팅하고 이벤트에 참여하세요",
    subText: "당첨 시 선구매권과 퍼즐 조각을 획득할 수 있습니다",
    mintCost: "0.01 ETH",
    gasEstimate: "~0.002 ETH",
    totalCost: "~0.012 ETH",
    buttonText: "QR 스캔 후 민팅 가능",
  },
  login: {
    title: "카카오 로그인",
    description: "카카오 계정으로 간편하게 참여하세요",
    buttonText: "카카오로 로그인",
    guideText: "로그인 시 자동으로 지갑이 생성됩니다",
  },
  guide: {
    title: "참여 안내",
    items: [
      "QR 코드 스캔 또는 카카오 로그인으로 간편하게 참여할 수 있습니다",
      "미스터리 박스를 민팅하면 이벤트 참여가 완료됩니다",
      "결과 공개 후 내 지갑 메뉴에서 당첨 여부를 확인하세요",
      "모든 추첨 과정은 블록체인에 기록되어 투명하게 검증 가능합니다",
    ],
  },
};

export default mockParticipate;