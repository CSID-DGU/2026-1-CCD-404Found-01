document.addEventListener("DOMContentLoaded", () => {
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

  const testRes = {
    filterStep: "3",
    serviceActive: true,
    personalKeywords: ["주작", "광고", "어그로"],
    userEmail: "cleaner@example.com",
    isLoggedIn: true,
  };

  // 1. 초기 설정 불러오기 및 UI 셋팅
  chrome.storage.local.get(["filterStep", "serviceActive", "personalKeywords", "userEmail", "isLoggedIn"], (res) => {
    res = testRes; // 테스트용

    // 필터 & 토글 설정
    if (res.filterStep) {
      const targetRadio = document.querySelector(`input[value="${res.filterStep}"]`);
      if (targetRadio) targetRadio.checked = true;
    }
    if (res.serviceActive !== undefined) mainToggle.checked = res.serviceActive;
    updateModeUI(mainToggle.checked);

    const isLoggedIn = res.isLoggedIn || false;
    if (isLoggedIn) {
      // 로그인 시: 바 전체를 보여줌 (공간 생성)
      userInfoBar.style.display = "flex";
      userEmailElem.innerText = res.userEmail || "";
      keywordInput.placeholder = "차단할 단어 입력";
    } else {
      // 비로그인 시: 바 전체를 완전히 제거 (공간 삭제)
      userInfoBar.style.display = "none";
      keywordInput.placeholder = "클릭하여 로그인 후 이용";
    }

    // 저장된 키워드 태그 불러오기
    if (res.personalKeywords) {
      keywordTagsContainer.innerHTML = "";
      res.personalKeywords.forEach((keyword) => addTag(keyword));
    }
  });

  // 2. 비로그인 상태에서 입력창 클릭 시 구글 로그인 창 띄우기
  keywordInput.addEventListener("mousedown", (e) => {
    chrome.storage.local.get(["isLoggedIn"], (res) => {
      if (!res.isLoggedIn) {
        e.preventDefault();
        keywordInput.blur();

        if (confirm("맞춤 키워드 설정은 로그인이 필요합니다.\n구글 로그인을 진행하시겠습니까?")) {
          chrome.runtime.sendMessage({ action: "login" }, () => {
            window.close();
          });
        }
      }
    });
  });

  // 3. 로그아웃 버튼 처리
  logoutBtn.addEventListener("click", () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;

    chrome.runtime.sendMessage({ action: "requestLogout" }, (response) => {
      if (response && response.status === "success") {
        alert("로그아웃 되었습니다.");
        window.location.reload();
      }
    });
  });

  // 4. 키워드 추가 버튼 로직 (로그인 체크 강화)
  addKeywordBtn.addEventListener("click", () => {
    chrome.storage.local.get(["isLoggedIn"], (res) => {
      if (!res.isLoggedIn) {
        alert("로그인이 필요한 서비스입니다.");
        return;
      }
      const keyword = keywordInput.value.trim();
      if (keyword) {
        addTag(keyword);
        keywordInput.value = "";
        saveKeywords();
      }
    });
  });

  // 보조 함수 및 이벤트 리스너

  // 1. 키워드 입력창에서 엔터키를 누르면 '추가' 버튼이 눌리도록 처리
  keywordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addKeywordBtn.click();
  });

  // 2. 정화 단계(1, 2, 3단계) 라디오 버튼 선택 시 설정값을 브라우저에 저장
  stepRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      chrome.storage.local.set({ filterStep: e.target.value });
    });
  });

  // 3. 메인 서비스 ON/OFF 토글 스위치 변경 시 상태 저장 및 UI 업데이트
  mainToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ serviceActive: e.target.checked });
    updateModeUI(e.target.checked);
  });

  // 4. '일반 모드' 글자 클릭 시 토글 스위치를 OFF 상태로 변경
  modeGeneralLabel.addEventListener("click", () => {
    if (mainToggle.checked) {
      mainToggle.checked = false;
      mainToggle.dispatchEvent(new Event("change"));
    }
  });

  // 5. '클린 모드' 글자 클릭 시 토글 스위치를 ON 상태로 변경
  modeCleanLabel.addEventListener("click", () => {
    if (!mainToggle.checked) {
      mainToggle.checked = true;
      mainToggle.dispatchEvent(new Event("change"));
    }
  });

  // 6. 현재 모드(일반/클린)에 따라 상단 탭의 활성화 스타일을 변경하는 함수
  function updateModeUI(isCleanMode) {
    if (isCleanMode) {
      modeCleanLabel.classList.add("active");
      modeGeneralLabel.classList.remove("active");
    } else {
      modeGeneralLabel.classList.add("active");
      modeCleanLabel.classList.remove("active");
    }
  }

  // 7. 입력한 키워드를 화면에 삭제 가능한 '태그' 형태로 그려주는 함수
  function addTag(keyword) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerText = keyword;
    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "✕";
    // 삭제 버튼 클릭 시 화면에서 지우고 저장소 동기화
    deleteBtn.addEventListener("click", () => {
      tag.remove();
      saveKeywords();
    });
    tag.appendChild(deleteBtn);
    keywordTagsContainer.appendChild(tag);
  }

  // 8. 현재 화면에 표시된 모든 키워드를 수집하여 브라우저 저장소에 최종 저장하는 함수
  function saveKeywords() {
    const tags = keywordTagsContainer.querySelectorAll(".tag");
    const keywords = Array.from(tags).map((tag) => tag.childNodes[0].textContent.trim());
    chrome.storage.local.set({ personalKeywords: keywords });
  }
});
