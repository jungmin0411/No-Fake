const WALLET_ADDRESS_KEY = "testWalletAddress";
const LEGACY_MINTED_TICKETS_KEY = "mintedTickets";
const LEGACY_MINTED_EVENTS_KEY = "mintedEventsById";
const LEGACY_REVEAL_STATE_KEY = "revealState";

const normalizeWalletAddress = (walletAddress = "") => String(walletAddress || "").trim().toLowerCase();

const buildWalletKey = (prefix, walletAddress) => {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  return normalizedAddress ? `${prefix}:${normalizedAddress}` : prefix;
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Failed to parse wallet storage value:", error);
    return fallback;
  }
};

export const getWalletAddressStorageKey = () => WALLET_ADDRESS_KEY;

export const getWalletMintedTicketsKey = (walletAddress) => buildWalletKey("mintedTickets", walletAddress);
export const getWalletMintedEventsKey = (walletAddress) => buildWalletKey("mintedEventsById", walletAddress);
export const getWalletRevealStateKey = (walletAddress) => buildWalletKey("revealState", walletAddress);

export const getWalletMintedTickets = (walletAddress) => {
  const walletKey = getWalletMintedTicketsKey(walletAddress);
  const storedValue = localStorage.getItem(walletKey);

  if (storedValue) {
    return safeParse(storedValue, []);
  }

  if (normalizeWalletAddress(walletAddress)) {
    return safeParse(localStorage.getItem(LEGACY_MINTED_TICKETS_KEY), []);
  }

  return [];
};

export const saveWalletMintedTickets = (walletAddress, tickets = []) => {
  localStorage.setItem(getWalletMintedTicketsKey(walletAddress), JSON.stringify(tickets));
};

export const getWalletMintedEventsById = (walletAddress) => {
  const walletKey = getWalletMintedEventsKey(walletAddress);
  const storedValue = localStorage.getItem(walletKey);

  if (storedValue) {
    return safeParse(storedValue, {});
  }

  if (normalizeWalletAddress(walletAddress)) {
    return safeParse(localStorage.getItem(LEGACY_MINTED_EVENTS_KEY), {});
  }

  return {};
};

export const saveWalletMintedEventsById = (walletAddress, value = {}) => {
  localStorage.setItem(getWalletMintedEventsKey(walletAddress), JSON.stringify(value));
};

export const getWalletRevealState = (walletAddress) => {
  const walletKey = getWalletRevealStateKey(walletAddress);
  const storedValue = localStorage.getItem(walletKey);

  if (storedValue) {
    return safeParse(storedValue, {});
  }

  if (normalizeWalletAddress(walletAddress)) {
    return safeParse(localStorage.getItem(LEGACY_REVEAL_STATE_KEY), {});
  }

  return {};
};

export const saveWalletRevealState = (walletAddress, value = {}) => {
  localStorage.setItem(getWalletRevealStateKey(walletAddress), JSON.stringify(value));
};

export const clearWalletScopedStorage = (walletAddress) => {
  localStorage.removeItem(getWalletMintedTicketsKey(walletAddress));
  localStorage.removeItem(getWalletMintedEventsKey(walletAddress));
  localStorage.removeItem(getWalletRevealStateKey(walletAddress));
};
