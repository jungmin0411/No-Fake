/**
 * 카카오 인증 관련 설정을 관리합니다.
 */
export const getKakaoAuthConfig = () => {
  return {
    name: "Kakao Login",
    verifier: "YOUR_KAKAO_VERIFIER_NAME", // Web3Auth 대시보드에서 만든 Verifier 이름
    typeOfLogin: "kakao",
    clientId: "YOUR_KAKAO_CLIENT_ID", // 카카오 개발자 센터에서 발급받은 REST API 키
  };
};

/**
 * 카카오 로그인을 실행하는 함수 (추가됨)
 * Login.jsx에서 이 함수를 호출하여 로그인을 진행합니다.
 */
export const loginWithKakao = async (web3auth) => {
  if (!web3auth) {
    console.error("Web3Auth 객체가 초기화되지 않았습니다.");
    return;
  }

  try {
    // 커스텀 인증(Kakao)을 사용하여 로그인 시도
    const web3authProvider = await web3auth.connectTo("openlogin", {
      loginProvider: "kakao",
      extraLoginOptions: {
        // 카카오 개발자 센터에서 설정한 Redirect URI와 일치해야 합니다.
        redirect_uri: window.location.origin + "/user/pages/KakaoCallback", 
      },
    });
    return web3authProvider;
  } catch (error) {
    console.error("카카오 로그인 도중 에러가 발생했습니다:", error);
    throw error;
  }
};

/**
 * 로그인이 완료된 후 사용자 정보를 가져오는 함수
 */
export const getUserInfo = async (web3auth) => {
  if (!web3auth) return null;
  try {
    const user = await web3auth.getUserInfo();
    console.log("카카오 사용자 정보:", user);
    return user;
  } catch (error) {
    console.error("사용자 정보를 가져오는 데 실패했습니다.", error);
    return null;
  }
};