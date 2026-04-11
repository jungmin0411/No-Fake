import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";

function formatWalletAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function fallbackCopyText(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Fallback copy failed");
  }
}

export default function Header({ walletAddress, onLogout }) {
  const [copied, setCopied] = useState(false);
  const isConnected = Boolean(walletAddress);

  const handleCopyWallet = async () => {
    if (!walletAddress) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(walletAddress);
      } else {
        fallbackCopyText(walletAddress);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      try {
        fallbackCopyText(walletAddress);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch (fallbackError) {
        console.error("Failed to copy wallet address:", fallbackError || error);
      }
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/home" className="logo-link">
          <h1 className="logo">NoFAKE</h1>
        </Link>
        <p className="subtitle">공정하고 투명한 이벤트에 참여하세요</p>
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
