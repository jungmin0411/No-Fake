import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { AuthAdapter } from "@web3auth/auth-adapter";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://outrage-overboard-unrevised.ngrok-free.dev";
const REDIRECT_TARGET = "/home";
const WALLET_STORAGE_KEY = "testWalletAddress";

const KakaoCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("로그인 상태를 확인하고 있습니다...");
  const hasExecuted = useRef(false);

  useEffect(() => {
    const persistWallet = (address) => {
      if (!address) return;
      localStorage.setItem(WALLET_STORAGE_KEY, address);
    };

    const getWeb3Auth = async () => {
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x1",
        rpcTarget: "https://ethereum-rpc.publicnode.com",
      };

      const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

      const web3authInstance = new Web3Auth({
        clientId: "BIM03bGrMy99Cg7hx7q8SllvgY1pkow31eE7BOBfOwAZj99GWAckaF8HofUp6LhGD7NXnp6KxJ7LGM473OnJeC8",
        web3AuthNetwork: "sapphire_devnet",
        privateKeyProvider,
        uiConfig: { uxMode: "redirect" },
      });

      const authAdapter = new AuthAdapter({
        adapterSettings: {
          uxMode: "redirect",
          loginConfig: {
            jwt: {
              verifier: "kakao-custom-auth",
              typeOfLogin: "jwt",
              clientId: "d9c3641e6babf0f0d91c93a7ec557c40",
            },
          },
        },
      });

      web3authInstance.configureAdapter(authAdapter);
      await web3authInstance.init();
      return web3authInstance;
    };

    const handleCallback = async () => {
      if (hasExecuted.current) return;
      hasExecuted.current = true;

      try {
        const web3authInstance = await getWeb3Auth();

        if (web3authInstance.connected && web3authInstance.provider) {
          const accounts = await web3authInstance.provider.request({ method: "eth_accounts" });
          const address = accounts?.[0];

          persistWallet(address);
          setStatus(`기존 지갑 연결 확인: ${address?.slice(0, 6)}...${address?.slice(-4)}`);
          navigate(REDIRECT_TARGET, { replace: true });
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          setStatus("인가 코드가 없어 로그인 화면으로 돌아갑니다.");
          navigate("/login", { replace: true });
          return;
        }

        setStatus("카카오 토큰을 요청하고 있습니다...");
        const tokenRes = await fetch(`${API_BASE_URL}/api/auth/kakao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!tokenRes.ok) {
          throw new Error(`백엔드 인증 서버 응답 오류 (${tokenRes.status})`);
        }

        const tokenData = await tokenRes.json();
        if (!tokenData.id_token) {
          throw new Error("카카오 id_token을 받지 못했습니다.");
        }

        setStatus("Web3 지갑을 연결하고 있습니다...");
        await web3authInstance.connectTo("auth", {
          loginProvider: "jwt",
          extraLoginOptions: {
            id_token: tokenData.id_token,
            verifierIdField: "sub",
          },
        });

        const accounts = await web3authInstance.provider?.request({ method: "eth_accounts" });
        const address = accounts?.[0];
        persistWallet(address);

        try {
          await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenData.id_token}`,
            },
            body: JSON.stringify({
              address,
              joinedAt: new Date().toISOString(),
            }),
          });
        } catch (registerError) {
          console.warn("로그인 사용자 저장은 실패했지만 대시보드 이동은 계속합니다.", registerError);
        }

        setStatus("사용자 대시보드로 이동합니다...");
        navigate(REDIRECT_TARGET, { replace: true });
      } catch (error) {
        console.error("카카오 콜백 처리 실패:", error);

        if (error instanceof TypeError) {
          setStatus(`오류 발생: 백엔드 서버(${API_BASE_URL})에 연결할 수 없습니다.`);
          return;
        }

        setStatus(`오류 발생: ${error.message}`);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ fontSize: "32px", fontWeight: 900, marginBottom: "24px" }}>NIKE</div>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #eee",
          borderTop: "4px solid #e00000",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p
        style={{
          marginTop: "20px",
          color: "#555",
          fontWeight: "bold",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        {status}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default KakaoCallback;
