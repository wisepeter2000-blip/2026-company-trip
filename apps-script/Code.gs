const SPREADSHEET_NAME = "2026_公司旅遊";
const SPREADSHEET_ID_PROPERTY = "REGISTRATION_SPREADSHEET_ID";
const HEADERS = ["姓名", "Email", "電話", "職稱", "報名時間"];

function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : "";
  const payload = JSON.stringify({
    ok: true,
    attendees: getSheet_()
      .getDataRange()
      .getValues()
      .slice(1)
      .filter((row) => row[0])
      .map((row) => ({ name: String(row[0]) })),
  });

  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return ContentService.createTextOutput("Invalid callback")
        .setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput(`${callback}(${payload});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const parameters = e && e.parameter ? e.parameter : {};
    const name = String(parameters.name || "").trim();
    const email = String(parameters.email || "").trim();
    const phone = String(parameters.phone || "").trim();
    const title = String(parameters.title || "").trim();

    if (!name || !email || !phone) {
      return submissionResult_(false, "請填寫姓名、Email 和電話。");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return submissionResult_(false, "Email 格式不正確。");
    }

    const sheet = getSheet_();
    const phoneColumn = HEADERS.indexOf("電話") + 1;
    sheet.getRange(1, phoneColumn, sheet.getMaxRows(), 1).setNumberFormat("@");
    sheet.appendRow([name, email, phone, title, new Date()]);
    return submissionResult_(true, "報名成功！");
  } catch (error) {
    console.error(error);
    return submissionResult_(false, "系統暫時無法處理報名，請稍後再試。");
  }
}

function getSheet_() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(SPREADSHEET_ID_PROPERTY);
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(SPREADSHEET_ID_PROPERTY, spreadsheetId);
  }

  let sheet = spreadsheet.getSheets()[0];
  if (!sheet) {
    sheet = spreadsheet.insertSheet();
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (firstRow.every((value) => value === "")) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }
  }

  sheet.getRange(1, HEADERS.indexOf("電話") + 1, sheet.getMaxRows(), 1)
    .setNumberFormat("@");
  return sheet;
}

function submissionResult_(ok, message) {
  const payload = JSON.stringify({
    type: "event-registration",
    ok: ok,
    message: message,
  });
  const html = `<script>window.top.postMessage(${payload}, "*");</script>`;
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
