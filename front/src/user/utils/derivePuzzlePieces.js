const PUZZLE_IMAGE_URL =
  "https://nofake.s3.ap-northeast-2.amazonaws.com/images/post-reveal/2.png";

const isSecondPrizeTicket = (ticket, revealState = {}) => {
  const revealKey = ticket.eventSlug || ticket.slug || ticket.event?.slug || "";
  const revealMeta = revealState[revealKey] || {};

  if (revealMeta.result === "second") return true;
  if (revealMeta.result && revealMeta.result !== "second") return false;

  const joinedText = `${ticket.status || ""} ${ticket.reward || ""} ${ticket.title || ""}`.toLowerCase();
  return joinedText.includes("second") || joinedText.includes("puzzle");
};

export function derivePuzzlePieces(tickets = [], revealState = {}) {
  return tickets
    .filter((ticket) => ticket?.source === "minted")
    .filter((ticket) => isSecondPrizeTicket(ticket, revealState))
    .map((ticket, index) => ({
      id: ticket.eventId || ticket.id || `${ticket.eventSlug || "puzzle"}-${index + 1}`,
      type: "퍼즐조각",
      title: ticket.eventName || ticket.title || `퍼즐조각 ${index + 1}`,
      image: PUZZLE_IMAGE_URL,
      selected: false,
      eventSlug: ticket.eventSlug || "",
    }));
}

export { PUZZLE_IMAGE_URL };
