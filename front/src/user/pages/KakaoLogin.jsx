import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"; // ✅ 추가
import './KakaoLogin.css';

const Login = () => {
  const [web3auth, setWeb3auth] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        // ✅ privateKeyProvider 설정 (v8+ 필수)
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x1",
          rpcTarget: "https://rpc.ankr.com/eth",
          displayName: "Ethereum Mainnet",
          ticker: "ETH",
          tickerName: "Ethereum",
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3authInstance = new Web3Auth({
          clientId: "BIM03bGrMy99Cg7hx7q8SllvgY1pkow31eE7BOBfOwAZj99GWAckaF8HofUp6LhGD7NXnp6KxJ7LGM473OnJeC8",
          web3AuthNetwork: "sapphire_devnet", // ✅ 사파이어 데브넷으로 변경
          privateKeyProvider, // ✅ 필수
          uiConfig: {
            appName: "NIKE RAFFLE",
            theme: { primary: "#FF0000" },
            loginMethodsOrder: ["kakao"],
            defaultLanguage: "ko",
          },
        });

        // ✅ 카카오 어댑터에도 privateKeyProvider 전달
        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider,
          adapterSettings: {
            loginConfig: {
              kakao: {
                verifier: "nike-kakao-verifier",
                typeOfLogin: "kakao",
                clientId: "YOUR_KAKAO_REST_API_KEY",
              },
            },
          },
        });

        web3authInstance.configureAdapter(openloginAdapter);

        await web3authInstance.init();
        setWeb3auth(web3authInstance);
        setIsInitialized(true);

        if (web3authInstance.connected) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Web3Auth 초기화 실패:", error);
      }
    };

    initWeb3Auth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleKakaoLogin = async () => {
  if (!isInitialized || !web3auth) return;

  setIsLoading(true);
  try {
    // 1. 카카오 OAuth 팝업 열기
    const KAKAO_CLIENT_ID = "d9c3641e6babf0f0d91c93a7ec557c40";
    const REDIRECT_URI = "http://localhost:3000/auth/kakao/callback";
    
    window.location.href = 
      `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
      
  } catch (error) {
    console.error("카카오 로그인 실패:", error);
    setIsLoading(false);
  }
};

  return (
    <div className="login-page">
      <nav className="login-nav">
        <span className="nav-logo" onClick={() => navigate('/')}>NIKE</span>
      </nav>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="nike-swoosh">NIKE</div>
            <h1>로그인</h1>
            <p>래플 참여를 위해 로그인하세요.<br />카카오 계정으로 간편하게 시작할 수 있습니다.</p>
          </div>

          <button
            className="kakao-btn"
            onClick={handleKakaoLogin}
            disabled={!isInitialized || isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" />
                로그인 중...
              </span>
            ) : (
              <span className="btn-inner">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 2C5.582 2 2 4.91 2 8.5c0 2.27 1.387 4.262 3.488 5.42l-.888 3.305a.25.25 0 0 0 .376.271L8.94 15.2A9.87 9.87 0 0 0 10 15.27c4.418 0 8-2.91 8-6.5S14.418 2 10 2Z"
                    fill="#3A1D1D"
                  />
                </svg>
                카카오로 로그인
              </span>
            )}
          </button>

          <div className="login-notice">
            <p>로그인 시 블록체인 지갑이 자동으로 생성됩니다.</p>
            <p>별도의 지갑 설치나 니모닉 저장이 필요 없습니다.</p>
          </div>

          <div className="divider">
            <span>ON-CHAIN VERIFIED RAFFLE</span>
          </div>

          <p className="login-terms">
            로그인하면 나이키의 <span>이용약관</span> 및 <span>개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;