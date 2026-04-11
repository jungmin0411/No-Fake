import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, Check, FileCode2, FileSearch, Receipt, ShieldCheck } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
const DEFAULT_CONTRACT_ADDRESS = "0x398591b6257b8BA14Baf06728a706a5B73dd2795";
const FALLBACK_CONTRACT_ADDRESS =
  process.env.REACT_APP_NOFAKE_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
const FALLBACK_ETHERSCAN_URL =
  process.env.REACT_APP_ETHERSCAN_URL ||
  `https://sepolia.etherscan.io/address/${FALLBACK_CONTRACT_ADDRESS}`;

const verificationSteps = [
  {
    number: "1",
    title: "컨트랙트",
    description: "배포된 관리자 컨트랙트 주소와 실제 테스트넷 링크를 바로 확인할 수 있습니다.",
    icon: FileCode2,
  },
  {
    number: "2",
    title: "거래내역",
    description: "Sepolia Etherscan에서 민팅과 트랜잭션이 실제로 발생했는지 직접 검증합니다.",
    icon: Receipt,
  },
  {
    number: "3",
    title: "참여 집계",
    description: "대시보드 수치는 NoFake.sol의 totalSupply 기준으로 계산됩니다.",
    icon: FileSearch,
  },
  {
    number: "4",
    title: "검증 상태",
    description: "운영 로직과 공개된 정보가 일치하는지 사용자가 직접 확인할 수 있습니다.",
    icon: ShieldCheck,
  },
];

export default function TransparencyCenter() {
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    contractAddress: FALLBACK_CONTRACT_ADDRESS,
    networkName: "Ethereum Sepolia",
    etherscanUrl: FALLBACK_ETHERSCAN_URL,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchTransparencyStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/contract-stats`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "투명성 정보를 불러오지 못했습니다.");
        }

        if (!isMounted) return;

        const contractAddress = data.contractAddress || FALLBACK_CONTRACT_ADDRESS;

        setStats({
          totalParticipants: Number(data.totalParticipants || 0),
          contractAddress,
          networkName: data.networkName || "Ethereum Sepolia",
          etherscanUrl:
            data.etherscanUrl || `https://sepolia.etherscan.io/address/${contractAddress}`,
        });
        setError("");
      } catch (fetchError) {
        if (!isMounted) return;

        console.error("Failed to load transparency center stats:", fetchError);
        setStats((prev) => ({
          ...prev,
          contractAddress: FALLBACK_CONTRACT_ADDRESS,
          etherscanUrl: FALLBACK_ETHERSCAN_URL,
        }));
        setError(fetchError.message || "투명성 정보를 불러오지 못했습니다.");
      }
    };

    fetchTransparencyStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const contractAddressPreview = useMemo(() => {
    if (!stats.contractAddress) {
      return stats.contractAddress;
    }

    return `${stats.contractAddress.slice(0, 10)}...${stats.contractAddress.slice(-8)}`;
  }, [stats.contractAddress]);

  const handleCopyContract = async () => {
    if (!stats.contractAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(stats.contractAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error("Failed to copy contract address:", copyError);
    }
  };

  return (
    <section className="transparency-page">
      <div className="page-heading">
        <h2>투명성 센터</h2>
        <p>말로만 신뢰를 요구하지 않고, 사용자가 직접 로직과 거래 흐름을 검증할 수 있게 구성했습니다.</p>
      </div>

      <div className="transparency-hero-card">
        <div>
          <span className="transparency-kicker">직접 검증하기</span>
          <h3>운영 로직의 투명성을 4단계로 확인해보세요</h3>
          <p>
            참여 집계는 온체인 <code>totalSupply()</code> 기준으로 반영되며, 이동하기 버튼을 누르면 관리자
            컨트랙트 주소 <code>{contractAddressPreview}</code> 페이지로 이동합니다.
          </p>
        </div>
        <div className="transparency-stat-chip">
          <span>현재 전체 참여자</span>
          <strong>{stats.totalParticipants.toLocaleString()}명</strong>
        </div>
      </div>

      <div className="transparency-step-grid">
        {verificationSteps.map((step) => {
          const Icon = step.icon;

          return (
            <article key={step.number} className="transparency-step-card">
              <div className="transparency-step-top">
                <span className="transparency-step-number">{step.number}</span>
                <Icon size={18} />
              </div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </article>
          );
        })}
      </div>

      <div className="transparency-grid">
        <article className="transparency-panel">
          <div className="transparency-panel-head">
            <span className="transparency-kicker">온체인 컨트랙트 직접 검증</span>
            <h3>배포 주소와 테스트넷 링크를 공개합니다</h3>
          </div>

          <div className="transparency-highlight-box">
            <strong>왜 중요한가요?</strong>
            <p>
              투명성 센터의 이동하기 버튼은 항상 관리자 컨트랙트 주소를 기준으로 연결됩니다. 따라서 사용자는
              개인 지갑이 아니라 실제 서비스가 사용하는 계약 주소를 바로 검증할 수 있습니다.
            </p>
          </div>

          <div className="transparency-contract-card">
            <div className="transparency-contract-address">
              <span>공개 컨트랙트 주소</span>
              <strong>{stats.contractAddress}</strong>
            </div>

            <div className="transparency-contract-actions">
              <button type="button" className="transparency-secondary-btn" onClick={handleCopyContract}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "복사됨" : "주소 복사"}
              </button>
              <a className="transparency-link-btn" href={stats.etherscanUrl} target="_blank" rel="noreferrer">
                관리자 컨트랙트 주소로 이동하기
                <ArrowUpRight size={16} />
              </a>
            </div>

            <div className="transparency-contract-meta">
              <div>
                <span>네트워크</span>
                <strong>{stats.networkName}</strong>
              </div>
              <div>
                <span>참여 집계 기준</span>
                <strong>NoFake.sol totalSupply()</strong>
              </div>
              <div>
                <span>표시 주소</span>
                <strong>{contractAddressPreview}</strong>
              </div>
              <div>
                <span>라이선스</span>
                <strong>MIT</strong>
              </div>
            </div>
          </div>

          {error && <p className="transparency-error">{error}</p>}
        </article>

        <article className="transparency-panel transparency-panel--side">
          <div className="transparency-panel-head">
            <span className="transparency-kicker">사용자 검증 포인트</span>
            <h3>화면에서 바로 확인할 수 있는 기준</h3>
          </div>

          <div className="transparency-check-list">
            <div className="transparency-check-item">
              <strong>1. 참여자 수</strong>
              <p>관리자 대시보드 수치는 백엔드가 컨트랙트의 totalSupply를 읽은 값으로 표시됩니다.</p>
            </div>
            <div className="transparency-check-item">
              <strong>2. 거래 발생 여부</strong>
              <p>민팅과 이동 내역은 Sepolia Etherscan 링크를 통해 직접 추적할 수 있습니다.</p>
            </div>
            <div className="transparency-check-item">
              <strong>3. 주소 복사 확인</strong>
              <p>컨트랙트 주소를 복사한 뒤 테스트넷 탐색기에서 직접 검색해서 동일한 주소인지 확인할 수 있습니다.</p>
            </div>
            <div className="transparency-check-item">
              <strong>4. 운영 투명성</strong>
              <p>서비스 화면의 숫자만 믿지 않고, 외부 탐색기에서 실제 기록과 함께 교차 검증할 수 있습니다.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
