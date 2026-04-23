import { updateModeUI, updateStatisticsUI } from "./utils.js";
import { addTag, saveKeywords } from "./keywords.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 선택
  const stepRadios = document.querySelectorAll('input[name="filterStep"]');
  const mainToggle = document.getElementById("service-onoff");
  const modeGeneralLabel = document.getElementById("mode-general");
  const modeCleanLabel = document.getElementById("mode-clean");
  const keywordInput = document.getElementById("keyword-input");
  const addKeywordBtn = document.getElementById("add-keyword");
  const keywordTagsContainer = document.getElementById("keyword-tags");
  const logoutBtn = document.getElementById("btn-logout");
  const userEmailElem = document.getElementById("user-email");
  const userInfoBar = document.getElementById("user-info-bar");

  // export const testRes = {
  //   filterStep: "3",
  //   serviceActive: true,
  //   personalKeywords: ["주작", "광고", "어그로"],
  //   userEmail: "cleaner@example.com",
  //   isLoggedIn: true,
  // };

  // 1. 초기 데이터 로드
  chrome.storage.local.get(
    ["filterStep", "serviceActive", "personalKeywords", "userEmail", "isLoggedIn", "totalComments", "toxicComments"],
    (res) => {
      // res = testRes; // 테스트

      // 필터 단계 설정
      if (res.filterStep) {
        const targetRadio = document.querySelector(`input[value="${res.filterStep}"]`);
        if (targetRadio) targetRadio.checked = true;
      }

      // 서비스 온오프 및 모드 UI
      if (res.serviceActive !== undefined) mainToggle.checked = res.serviceActive;
      updateModeUI(mainToggle.checked);

      // 로그인 상태 처리
      if (res.isLoggedIn) {
        userInfoBar.style.display = "flex";
        userEmailElem.innerText = res.userEmail || "";
        keywordInput.placeholder = "차단할 단어 입력";
      } else {
        userInfoBar.style.display = "none";
        keywordInput.placeholder = "클릭하여 로그인 후 이용";
      }

      // 통계 및 키워드 로드
      updateStatisticsUI(res.totalComments || 0, res.toxicComments || 0);
      if (res.personalKeywords) {
        keywordTagsContainer.innerHTML = "";
        res.personalKeywords.forEach((k) => addTag(k, keywordTagsContainer));
      }
    },
  );

  // --- 이벤트 핸들러 ---

  function handleLoginRequired(e) {
    e.preventDefault();
    if (confirm("맞춤 키워드 설정은 로그인이 필요합니다.\n구글 로그인을 진행하시겠습니까?")) {
      chrome.runtime.sendMessage({ action: "login" }, () => window.close());
    }
  }

  // 입력창 클릭 시 로그인 체크
  keywordInput.addEventListener("mousedown", (e) => {
    chrome.storage.local.get(["isLoggedIn"], (res) => {
      if (!res.isLoggedIn) handleLoginRequired(e);
    });
  });

  // 키워드 추가
  const processAddKeyword = () => {
    chrome.storage.local.get(["isLoggedIn"], (res) => {
      if (!res.isLoggedIn) {
        handleLoginRequired(new Event("click"));
        return;
      }
      const keyword = keywordInput.value.trim();
      if (keyword) {
        addTag(keyword, keywordTagsContainer);
        keywordInput.value = "";
        saveKeywords(keywordTagsContainer);
      }
    });
  };

  addKeywordBtn.addEventListener("click", processAddKeyword);
  keywordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") processAddKeyword();
  });

  // 로그아웃
  logoutBtn.addEventListener("click", () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    chrome.runtime.sendMessage({ action: "requestLogout" }, (response) => {
      if (response?.status === "success") {
        alert("로그아웃 되었습니다.");
        window.location.reload();
      }
    });
  });

  // 기타 UI 설정 변경 이벤트
  stepRadios.forEach((r) =>
    r.addEventListener("change", (e) => chrome.storage.local.set({ filterStep: e.target.value })),
  );

  mainToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ serviceActive: e.target.checked });
    updateModeUI(e.target.checked);
  });

  [modeGeneralLabel, modeCleanLabel].forEach((label) => {
    label.addEventListener("click", () => {
      const targetState = label === modeCleanLabel;
      if (mainToggle.checked !== targetState) {
        mainToggle.checked = targetState;
        mainToggle.dispatchEvent(new Event("change"));
      }
    });
  });

  // 메시지 리스너
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "loginCancelled") alert("로그인이 취소되었습니다.");
    if (msg.action === "loginFinished") window.location.reload();
  });
});
