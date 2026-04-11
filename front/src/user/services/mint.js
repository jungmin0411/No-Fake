const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";

export async function mintMysteryBox({ raffleId, walletAddress }) {
  if (!walletAddress) {
    throw new Error("WALLET_NOT_CONNECTED");
  }

  if (!raffleId) {
    throw new Error("RAFFLE_ID_REQUIRED");
  }

  const response = await fetch(`${API_BASE_URL}/api/mint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userAddress: walletAddress,
      raffleId,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "MINT_FAILED");
  }

  return data;
}
