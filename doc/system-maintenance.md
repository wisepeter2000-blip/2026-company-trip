# 2026 靈知科技員工旅遊報名系統維護文件

最後更新：2026-10-31

本文件描述報名網站的架構、資料流、部署設定及日常維護方式。程式碼與設定變更應以本文件所列的實際來源為準。

## 系統架構

網站是無建置步驟的靜態前端；報名資料與名單透過 Google Apps Script 存取 Google 試算表。

```text
瀏覽器
  ├─ GitHub Pages：index.html、styles.css、app.js、cover.png
  ├─ GET /exec?callback=... ── JSONP 讀取公開報名姓名
  └─ POST 表單 ── 隱藏 iframe ── Apps Script 寫入試算表
                                      └─ postMessage 回報結果
```

### 程式檔案

| 路徑 | 職責 |
|---|---|
| `index.html` | 頁面結構、活動資訊、報名表單、名單區及隱藏提交 iframe。 |
| `styles.css` | 桌面雙欄版面、手機單欄版面與視覺樣式。 |
| `app.js` | 表單狀態、Apps Script URL、JSONP 名單載入及 iframe 訊息處理。 |
| `cover.png` | 活動主視覺。 |
| `apps-script/Code.gs` | Apps Script 的 GET/POST 入口、資料驗證、試算表初始化及寫入。 |
| `README.md` | 專案簡介、本機預覽與公開網站資訊。 |
| `spec/promt.md` | 原始需求規格；依專案設定不推送至 GitHub。 |

前端使用原生 HTML、CSS、JavaScript，沒有 npm 建置或執行階段依賴。

## 使用者流程與 API

### 載入報名名單

1. `app.js` 載入時建立唯一 callback 名稱，透過 `<script>` 載入 Apps Script `/exec?callback=...`。
2. `doGet` 讀取試算表，略過標題列與空白姓名，只回傳姓名。
3. 前端收到 JSONP 後更新人數及名單。空名單會顯示「還沒有夥伴報名」。

支援的回應格式：

```json
{"ok":true,"attendees":[{"name":"報名者姓名"}]}
```

未提供 callback 時，`doGet` 回傳 JSON；提供 callback 時，callback 名稱會先經 JavaScript identifier 格式檢查。

### 送出報名

1. HTML 表單以 `POST` 將 `name`、`email`、`phone`、`title` 傳至 `/exec`，目標為隱藏 iframe；每次提交另將隨機 `requestToken` 加在 URL query。
2. `doPost` 去除欄位首尾空白，檢查姓名、Email、電話必填及 Email 格式。
3. 驗證通過後，Apps Script 先將新列的「電話」儲存格設為純文字，再以 `setValues()` 寫入整列，並將結果用 `postMessage` 傳回頁面。不要改回 `appendRow()`，否則電話字串的前導零可能被轉成數字而遺失。
4. `doPost` 嘗試將 UUID request token 帶回回覆；若 Apps Script 未提供此參數，回覆中的 token 會是空值。因 HtmlService 回應可能在巢狀 iframe 中執行，前端以 Apps Script 訊息來源網域及目前有待處理的提交驗證回覆；若回覆含 token，必須與目前提交一致。不依賴 `event.source` 必須等於最外層 iframe；成功時清空表單並重新載入名單。

瀏覽器另有欄位長度與 `type="email"` 檢查；後端仍須保留自己的驗證，不能只依賴瀏覽器。
目前前端欄位長度上限為姓名 100、Email 254、電話 30、職稱 100 字元；後端驗證必填欄位及 Email 格式，尚未實作電話格式或欄位長度驗證。

## 資料表

- 試算表名稱：`2026_公司旅遊`（由 Apps Script 擁有者在 Google Drive 管理）。
- 欄位順序：`姓名`、`Email`、`電話`、`職稱`、`報名時間`。
- 第一列為凍結標題列；報名資料自第二列開始。
- 「電話」整欄使用純文字格式（`@`），避免前導零或其他字元遭試算表轉換。
- 試算表 ID 存在 Apps Script 的 Script Properties，屬性名稱為 `REGISTRATION_SPREADSHEET_ID`。不要刪除此屬性，否則程式會建立另一份試算表。
- 第一次呼叫 GET 或有效 POST 時，`getSheet_()` 會建立試算表、設定標題列及電話格式。

## 已部署服務與權限

| 項目 | 目前設定 |
|---|---|
| 公開網站 | <https://wisepeter2000-blip.github.io/2026-company-trip/> |
| GitHub 儲存庫 | `wisepeter2000-blip/2026-company-trip` |
| Pages 發布來源 | `main` 分支根目錄；推送後由 GitHub Actions 建置及發布。 |
| Apps Script 專案 ID | `15sun1seFrj03PwD_pODGmxpc-nEqO3mwrmUo4ExLRNaPm4wIdCqo5c8X` |
| Apps Script 網頁應用程式 | `https://script.google.com/macros/s/AKfycbzt34Sr57jIO2zHs1pyl3ajnHKxXWSC_ffx47XetAOrkqImq4WztC6Jzxev1a6DnJhldw/exec` |
| 標準 Google Cloud 專案 | ID：`omega-metric-513206-t2`；編號：`12973791529` |

Apps Script 網頁應用程式設定為「以擁有者身分執行」及「所有人可存取」。訪客不需登入 Google；Apps Script 使用擁有者授權存取試算表。Apps Script 已連結標準 Google Cloud 專案，切換至標準專案後不可還原為 Apps Script 預設專案。

OAuth 同意畫面目前為外部測試模式。若需重新授權，確認 Apps Script 擁有者仍可使用該 OAuth 專案，從 Apps Script 編輯器觸發授權，並完成 Google 帳戶同意流程。不要為了解決授權問題任意更換已連結的 Cloud 專案。

## 維護與部署

### 前端（GitHub Pages）

1. 在 `index.html`、`styles.css` 或 `app.js` 修改網站。
2. 若變更 `app.js`，同時將 `index.html` 中 `app.js?v=...` 的查詢版本改成新的唯一值，避免瀏覽器沿用舊 JavaScript 快取。
3. 本機預覽可在專案根目錄執行 `python -m http.server 8000`，再開啟 <http://localhost:8000>。
4. 執行 `node --check app.js` 及 `git diff --check`，再提交並推送至 `main`。
5. 確認 GitHub Actions 的 `pages build and deployment` 成功，並以公開網址檢查頁面及名單載入。

不要將 `spec/` 推送到 GitHub；該目錄已由 `.gitignore` 忽略。

### Apps Script

目前沒有 `clasp` 同步設定。`apps-script/Code.gs` 是存放在此儲存庫的維護副本；修改後需手動同步至上述 Apps Script 專案。

1. 在 Apps Script 編輯器更新程式碼並儲存。
2. 選擇「部署」→「管理部署作業」，編輯現有網頁應用程式部署並建立新版本。
3. 保留「以擁有者身分執行」及「所有人可存取」，避免因新建部署而更換 `/exec` URL。
4. 呼叫 `/exec?callback=healthCheck` 確認回應；有效 POST 後再確認試算表新增資料及電話格式。
5. 若 URL 不慎變更，更新 `app.js` 的 `SCRIPT_URL`，依前端部署步驟重新發布 Pages。

## 維護驗證清單

- [ ] `node --check app.js` 通過。
- [ ] `git diff --check` 通過。
- [ ] GitHub Pages workflow 成功，公開頁面載入最新版本。
- [ ] `/exec?callback=healthCheck` 回傳 `healthCheck({"ok":true,...});`。
- [ ] 使用無效 Email 驗證前端會收到 Apps Script 錯誤回覆，且不新增資料。
- [ ] 試算表標題列及電話欄文字格式正確。
- [ ] 有效報名能寫入資料；頁面顯示成功並更新名單。
- [ ] 測試有效 POST 時只使用明確標示的合成資料，並先約定是否保留或清除。本次驗證的兩筆合成測試報名依維護者決定保留。

## 權限、隱私與已知限制

- 報名者資料包含姓名、Email、電話及職稱；試算表應只分享給必要管理者，不要公開試算表連結權限。
- 公開 GET API 只回傳姓名，因此網站的「報名名單」會公開顯示報名者姓名。
- `/exec` 可由任何人存取；目前沒有 CAPTCHA、速率限制、重複報名檢查或 Email 驗證。若要公開長期使用，應評估垃圾報名防護及個資告知/保存政策。
- Apps Script 的 `doPost` 會記錄例外至執行記錄，但向使用者顯示一般錯誤訊息。排查寫入失敗時，檢查 Apps Script「執行項目」及部署權限，不要在公開網頁回傳完整錯誤或試算表 ID。

## 常見問題排查

| 現象 | 檢查方式 |
|---|---|
| 名單一直載入中或顯示載入失敗 | 檢查 `SCRIPT_URL` 是否為有效 `/exec` 網址、現有部署是否可由所有人存取，以及 Apps Script GET 是否正常。 |
| 頁面顯示部署尚未設定 | 檢查部署後的前端版本是否已發布；確認 `app.js` 內的 `SCRIPT_URL` 非空。 |
| 報名送出後逾時 | 檢查瀏覽器網路錯誤、Apps Script 執行記錄、擁有者授權與試算表 Script Property。 |
| 電話前導零消失 | 確認新列的「電話」儲存格在 `setValues()` 前已執行 `setNumberFormat("@")`，並檢查該欄格式；避免使用 `appendRow()`。 |
| 修改 JavaScript 後網站仍執行舊版 | 更新 `index.html` 的 `app.js?v=...`，確認 Pages workflow 成功後以新網址重新載入。 |
| 新建了第二份試算表 | 確認 Script Properties 中的 `REGISTRATION_SPREADSHEET_ID` 未遺失，並在部署環境中使用正確的 Apps Script 專案。 |
