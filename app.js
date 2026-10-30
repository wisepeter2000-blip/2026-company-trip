const SCRIPT_URL = "";

const form = document.querySelector("#signup-form");
const submitButton = document.querySelector("#submit-button");
const statusMessage = document.querySelector("#form-status");
const attendeeList = document.querySelector("#attendee-list");
const attendeeCount = document.querySelector("#attendee-count");
const submissionFrame = document.querySelector(".submission-frame");

let submitted = false;
let attendeeCallbackName = "";

if (SCRIPT_URL) {
  form.action = SCRIPT_URL;
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function renderAttendees(attendees) {
  attendeeList.replaceChildren();
  attendeeCount.textContent = `目前已有 ${attendees.length} 位夥伴報名`;

  if (attendees.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "還沒有夥伴報名，歡迎成為第一位！";
    attendeeList.append(emptyMessage);
    return;
  }

  for (const attendee of attendees) {
    const item = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "attendee-dot";
    dot.setAttribute("aria-hidden", "true");
    item.append(dot, document.createTextNode(attendee.name));
    attendeeList.append(item);
  }
}

function loadAttendees() {
  if (!SCRIPT_URL) {
    attendeeCount.textContent = "完成 Apps Script 部署後即可查看名單";
    return;
  }

  attendeeCallbackName = `receiveAttendees${Date.now()}`;
  window[attendeeCallbackName] = (result) => {
    const script = document.querySelector("#attendee-loader");
    if (script) script.remove();
    delete window[attendeeCallbackName];

    if (!result || result.ok !== true || !Array.isArray(result.attendees)) {
      attendeeCount.textContent = "名單載入失敗，請稍後再試";
      return;
    }

    renderAttendees(result.attendees);
  };

  const script = document.createElement("script");
  script.id = "attendee-loader";
  script.src = `${SCRIPT_URL}?callback=${encodeURIComponent(attendeeCallbackName)}&t=${Date.now()}`;
  script.onerror = () => {
    script.remove();
    delete window[attendeeCallbackName];
    attendeeCount.textContent = "名單載入失敗，請確認 Apps Script 部署網址";
  };
  document.head.append(script);
}

form.addEventListener("submit", () => {
  if (!SCRIPT_URL) {
    showStatus("報名功能尚未設定：請先部署 Apps Script 並填入網址。", true);
    return;
  }

  submitted = false;
  submitButton.disabled = true;
  showStatus("正在送出報名…");
  window.setTimeout(() => {
    if (!submitted) {
      submitButton.disabled = false;
      showStatus("送出結果尚未確認，請檢查網路後再試一次。", true);
    }
  }, 15000);
});

window.addEventListener("message", (event) => {
  if (event.source !== submissionFrame.contentWindow) return;
  if (!event.data || event.data.type !== "event-registration") return;

  submitted = true;
  submitButton.disabled = false;
  if (event.data.ok) {
    form.reset();
    showStatus("報名成功！期待活動當天見到你。");
    loadAttendees();
  } else {
    showStatus(event.data.message || "報名失敗，請確認資料後再試一次。", true);
  }
});

loadAttendees();
