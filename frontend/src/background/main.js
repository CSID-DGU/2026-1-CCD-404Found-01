import { performLogout, fetchIDToken } from "./auth.js";

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 로그인 요청이 들어오면 auth.js의 함수를 실행해 JWT를 가져옴
  if (request.action === "login" || request.action === "forceLogin") {
    fetchIDToken(
      (jwt) => {
        // 1. 성공 시: 서버로 보냄
        sendTokenToBackend(jwt);
      },
      () => {
        // 2. 실패/취소 시: 팝업에게 로그인 이 취소되었다고 메시지를 보냄
        chrome.runtime.sendMessage({ action: "loginCancelled" });
      },
    );
    sendResponse({ status: "인증 프로세스 시작됨" });
  }

  // 로그아웃 요청이 들어오면 세션을 끊고 성공 응답을 보냄
  if (request.action === "requestLogout") {
    performLogout(() => {
      // 브라우저 로컬 저장소의 로그인 관련 정보를 삭제/초기화
      chrome.storage.local.set(
        {
          isLoggedIn: false,
          userEmail: "",
          personalKeywords: [],
        },
        () => {
          console.log("로컬 데이터 초기화 완료");
          sendResponse({ status: "success" });
        },
      );
    });
    return true;
  }
});

// 백엔드 전송 로직
async function sendTokenToBackend(jwt) {
  const LOGIN_URL = "https://404foundserver-h3cwawecfch5fbf2.koreacentral-01.azurewebsites.net/test/google-tokentest";
  const INFO_URL = "https://404foundserver-h3cwawecfch5fbf2.koreacentral-01.azurewebsites.net/test/test";

  try {
    console.log("1단계: 서버에 구글 JWT 전송 중");
    const loginResponse = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token: jwt }),
    });

    // 서버 응답이 실패(400, 500번대 에러)라면 예외 처리
    if (!loginResponse.ok) throw new Error(`로그인 서버 에러: ${loginResponse.status}`);
    const loginData = await loginResponse.json();
    console.log("1단계 성공: 서버 전용 토큰을 획득했습니다.");

    // 응답 데이터에서 토큰 꺼내기
    const serverToken = loginData.token;

    console.log("2단계: 사용자 정보 조회를 시도합니다...");
    const infoResponse = await fetch(INFO_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${serverToken}`, "Content-Type": "application/json" },
    });

    if (!infoResponse.ok) throw new Error(`정보 조회 에러: ${infoResponse.status}`);
    // 사용자 상세 정보 파싱
    const infoData = await infoResponse.json();

    if (infoData.email) {
      chrome.storage.local.set({ userEmail: infoData.email, isLoggedIn: true }, () => {
        console.log("최종 성공! 서버로부터 받아온 데이터:", infoData.email);

        chrome.runtime.sendMessage({ action: "loginFinished", email: infoData.email });
      });
    }
  } catch (error) {
    console.error("통신 흐름 실패:", error.message);
    chrome.storage.local.set({ isLoggedIn: false, userEmail: "" });
  }
}
