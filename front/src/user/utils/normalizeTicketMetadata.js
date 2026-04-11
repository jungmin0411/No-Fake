function getAttributeValue(attributes = [], traitType) {
  return attributes.find((item) => item.trait_type === traitType)?.value ?? "";
}

function formatDateValue(value) {
  if (!value || value === 0) return "-";
  return new Date(value * 1000).toLocaleDateString("ko-KR");
}

export function normalizeTicketMetadata(metadata, extra = {}) {
  const attributes = metadata?.attributes || [];

  const rawStatus = getAttributeValue(attributes, "Status");
  const winningPrize = getAttributeValue(attributes, "Winning Prize");
  const eventName = getAttributeValue(attributes, "Event Name");
  const issuer = getAttributeValue(attributes, "Issuer");
  const contractAddress = getAttributeValue(attributes, "Contract Address");
  const mintedDate = getAttributeValue(attributes, "Minted Date");
  const ticketExpiration = getAttributeValue(attributes, "Ticket Expiration");
  const provenanceHash = getAttributeValue(attributes, "Provenance Hash");
  const shoeSerialNumber = getAttributeValue(attributes, "Shoe Serial Number");

  const isUnrevealed = rawStatus === "Unrevealed";
  const isLose = Boolean(winningPrize?.includes("꽝"));
  const isPrePurchaseReward = Boolean(winningPrize?.includes("선구매권"));

  let statusText = rawStatus || "-";

  if (rawStatus === "Unrevealed") {
    statusText = "미공개";
  } else if (rawStatus === "Revealed" && isLose) {
    statusText = "미당첨";
  } else if (rawStatus === "Revealed") {
    statusText = "당첨";
  }

  let usageGuide = "결과 공개 후 내 지갑에서 당첨 여부를 확인할 수 있습니다.";

  if (!isUnrevealed && isPrePurchaseReward) {
    usageGuide =
      "유효기간 내 선구매권을 사용하면 상품 결제가 가능하며, 사용 후에는 더 이상 이용할 수 없습니다.";
  } else if (!isUnrevealed && isLose) {
    usageGuide = "참여 기념 티켓입니다.";
  } else if (!isUnrevealed) {
    usageGuide = "당첨 상품 정보를 확인해 주세요.";
  }

  return {
    title: metadata?.name || "NOFAKE Ticket",
    description: metadata?.description || "",
    image: metadata?.image || "",
    eventName: eventName || "-",
    issuer: issuer || "-",
    contractAddress: contractAddress || "-",
    mintedDate: formatDateValue(mintedDate),
    expiryDate: formatDateValue(ticketExpiration),
    status: statusText,
    reward: isUnrevealed ? "-" : winningPrize || "-",
    provenanceHash: provenanceHash || "-",
    shoeSerialNumber: shoeSerialNumber || "-",
    usageGuide,
    isPrePurchaseReward,
    rawMetadata: metadata,
    ...extra,
  };
}