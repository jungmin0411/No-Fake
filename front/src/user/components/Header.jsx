import { useMemo, useState } from "react";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";

const ETHERSCAN_ADDRESS_BASE_URL =
  process.env.REACT_APP_ETHERSCAN_BASE_URL || "https://sepolia.etherscan.io/address";

function formatWalletAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function Header({ walletAddress, onLogout }) {
  const [copied, setCopied] = useState(false);
  const isConnected = Boolean(walletAddress);

  const walletExplorerUrl = useMemo(() => {
    if (!walletAddress) {
      return ETHERSCAN_ADDRESS_BASE_URL;
    }

    return `${ETHERSCAN_ADDRESS_BASE_URL}/${walletAddress}`;
  }, [walletAddress]);

  const handleCopyWallet = async () => {
    if (!walletAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy wallet address:", error);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/home" className="logo-link">
          <h1 className="logo">NoFAKE</h1>
        </Link>
        <p className="subtitle">공정하고 투명한 이벤트에 참여하세요.</p>
      </div>

      <div className="header-actions">
        {isConnected && (
          <div className="wallet-status connected">
            <span className="wallet-status-label">지갑 연결됨</span>
            <strong className="wallet-status-address" title={walletAddress}>
              {walletAddress}
            </strong>
            <div className="wallet-status-summary">{formatWalletAddress(walletAddress)}</div>
            <div className="wallet-status-actions">
              <button type="button" className="wallet-action-btn" onClick={handleCopyWallet}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사됨" : "주소 복사"}
              </button>
              <a
                className="wallet-action-btn wallet-action-btn--link"
                href={walletExplorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                테스트넷 확인
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        )}

        {isConnected && (
          <button type="button" className="header-logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        )}
      </div>
    </header>
  );
}
