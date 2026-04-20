chrome.runtime.sendMessage({ action: "login" }, (response) => {
  console.log("백그라운드에 로그인 요청 보냄");
});

document.addEventListener("DOMContentLoaded", () => {
  const stepRadios = document.querySelectorAll('input[name="filterStep"]');

  const mainToggle = document.getElementById("service-onoff");
  const modeGeneralLabel = document.getElementById("mode-general");
  const modeCleanLabel = document.getElementById("mode-clean");
  const modeIndicator = document.querySelector(".mode-indicator");

  const keywordInput = document.getElementById("keyword-input");

  const addKeywordBtn = document.getElementById("add-keyword");

  const keywordTagsContainer = document.getElementById("keyword-tags");

  // 1. 기존 설정 불러오기

  chrome.storage.local.get(["filterStep", "serviceActive", "personalKeywords"], (res) => {
    // 필터 단계 불러오기

    if (res.filterStep) {
      document.querySelector(`input[value="${res.filterStep}"]`).checked = true;
    }

    // 서비스 활성화 상태 불러오기

    if (res.serviceActive !== undefined) {
      mainToggle.checked = res.serviceActive;
    }

    updateModeLabels(mainToggle.checked);
    updateIndicator(mainToggle.checked);

    // 개인 키워드 태그 불러오기

    if (res.personalKeywords) {
      res.personalKeywords.forEach((keyword) => addTag(keyword));
    }
  });

  // 2. 단계 변경 시 저장

  stepRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      chrome.storage.local.set({ filterStep: e.target.value });

      console.log(`필터 단계 저장됨: ${e.target.value}단계`);
    });
  });

  // 3. 메인 토글 변경 시 저장

  mainToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ serviceActive: e.target.checked });
    updateModeLabels(e.target.checked);
    updateIndicator(e.target.checked);
  });

  modeGeneralLabel.addEventListener("click", () => {
    if (mainToggle.checked) {
      mainToggle.checked = false;
      mainToggle.dispatchEvent(new Event("change"));
    }
  });

  modeCleanLabel.addEventListener("click", () => {
    if (!mainToggle.checked) {
      mainToggle.checked = true;
      mainToggle.dispatchEvent(new Event("change"));
    }
  });

  function updateIndicator(isCleanMode) {
    modeIndicator.style.left = isCleanMode ? "50%" : "0";
  }

  // 4. 개인 키워드 추가

  addKeywordBtn.addEventListener("click", () => {
    const keyword = keywordInput.value.trim();

    if (keyword) {
      addTag(keyword);

      keywordInput.value = "";

      saveKeywords();
    }
  });

  function updateModeLabels(isCleanMode) {
    if (isCleanMode) {
      modeCleanLabel.classList.add("active");
      modeGeneralLabel.classList.remove("active");
    } else {
      modeGeneralLabel.classList.add("active");
      modeCleanLabel.classList.remove("active");
    }
  }

  // 태그 추가 함수

  function addTag(keyword) {
    const tag = document.createElement("span");

    tag.className = "tag";

    tag.innerText = keyword;

    const deleteBtn = document.createElement("button");

    deleteBtn.innerText = "x";

    deleteBtn.addEventListener("click", () => {
      tag.remove();

      saveKeywords();
    });

    tag.appendChild(deleteBtn);

    keywordTagsContainer.appendChild(tag);
  }

  // 키워드 목록 저장 함수

  function saveKeywords() {
    const keywords = Array.from(keywordTagsContainer.querySelectorAll(".tag")).map((tag) =>
      tag.innerText.replace("x", "").trim(),
    );

    chrome.storage.local.set({ personalKeywords: keywords });
  }
});
