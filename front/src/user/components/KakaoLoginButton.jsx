import React from 'react';

const KakaoLoginButton = ({ web3auth }) => {
  
  const handleLogin = async () => {
    if (!web3auth) {
      console.log("Web3Auth가 아직 준비되지 않았습니다.");
      return;
    }

    try {
      // 카카오 로그인을 위해 Web3Auth의 connectTo 기능을 사용합니다.
      // (단, Web3Auth 대시보드에서 카카오 어댑터 설정이 완료되어 있어야 합니다.)
      await web3auth.connectTo("openlogin", {
        loginProvider: "kakao",
      });
      
      console.log("카카오 로그인 성공!");
    } catch (error) {
      console.error("로그인 중 에러 발생:", error);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      style={{
        backgroundColor: '#FEE500',
        color: '#000000',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span role="img" aria-label="kakao">💬</span>
      카카오로 시작하기
    </button>
  );
};

export default KakaoLoginButton;