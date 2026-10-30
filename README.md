# 2026 宇宙科技公司員工旅遊

活潑明亮的員工旅遊活動報名頁面，使用 GitHub Pages 發佈，並以 Google Apps Script 將報名資料儲存至 Google 試算表。

## 本機預覽

在專案根目錄執行：

```powershell
python -m http.server 8000
```

接著開啟 <http://localhost:8000>。

## Google 試算表與 Apps Script

1. 在 Google Apps Script 建立新專案，將 `apps-script/Code.gs` 貼入編輯器。
2. 部署為網頁應用程式，執行身分選「我」，存取權選「所有人」，完成 Google 登入與授權。
3. 複製部署產生的 `/exec` 網址，填入 `app.js` 的 `SCRIPT_URL`。
4. 第一次開啟網頁應用程式時，Apps Script 會在 Google Drive 建立 `2026_公司旅遊` 試算表；欄位標題列會自動建立，電話欄設定為純文字。
5. 重新部署 Apps Script 的新版本後，報名表單會將資料寫入該試算表，並讀取報名名單。

## GitHub Pages

將網站推送至 GitHub 後，在儲存庫設定的 **Pages** 頁面，將來源設為 `Deploy from a branch`、分支設為 `main`、資料夾設為 `/ (root)`。部署完成後，將網站網址補入下方。

網站網址：https://wisepeter2000-blip.github.io/2026-company-trip/
