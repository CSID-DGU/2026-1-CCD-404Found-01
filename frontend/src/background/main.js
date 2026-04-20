chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "login") {
    console.log("시그널 감지: 팝업에서 로그인 요청이 들어왔습니다.");
    getAuthToken();
    sendResponse({ status: "로그인 프로세스 시작" });
  }
  return true;
});

chrome.action.onClicked.addListener(() => {
  console.log("아이콘 클릭 감지: 로그인을 시도합니다.");
  getAuthToken();
});

function getAuthToken() {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error("토큰 발급 실패:", chrome.runtime.lastError.message);
      return;
    }

    if (!token) {
      console.error("토큰을 받지 못했습니다. 구글 콘솔 설정을 확인하세요.");
      return;
    }

    console.log("획득한 액세스 토큰:", token);

    sendTokenToBackend(token);
  });
}

async function sendTokenToBackend(token) {
  const TEST_URL = "https://404foundserver-h3cwawecfch5fbf2.koreacentral-01.azurewebsites.net/test/google-tokentest";

  try {
    const response = await fetch(TEST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      throw new Error(`서버 에러: ${response.status} - ${data}`);
    }

    console.log("백엔드 통신 성공:", data);
  } catch (error) {
    console.error("백엔드 통신 실패:", error);
  }
}

chrome.action.onClicked.addListener(() => {
  getAuthToken();
});
