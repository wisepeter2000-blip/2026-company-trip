# 2026 靈知科技公司員工旅遊

活潑明亮的員工旅遊活動報名頁面，依序呈現活動標題、主視覺，以及活動內容與報名名單。報名資料由 Google Apps Script 儲存至 Google 試算表。

## 本機預覽

在專案根目錄執行：

```powershell
python -m http.server 8000
```

接著開啟 <http://localhost:8000>。

## Google 試算表與 Apps Script

1. Apps Script 專案使用 `apps-script/Code.gs`。
2. 部署為網頁應用程式，執行身分選「我」、存取權選「所有人」，並完成 Google 登入與授權。
3. 第一次載入報名名單時，Apps Script 會在 Google Drive 建立 `2026_公司旅遊` 試算表、標題列，並將「電話」欄設為純文字。
4. 已部署的 `/exec` 網址設定於 `app.js` 的 `SCRIPT_URL`。更新前端程式後，請重新更新 GitHub Pages。
5. 網頁報名成功後，資料會寫入試算表，報名名單也會隨之更新。

## GitHub Pages

GitHub Pages 已使用 `main` 分支根目錄發佈。

網站網址：https://wisepeter2000-blip.github.io/2026-company-trip/

## 維護文件

系統架構、資料流、部署設定與故障排除請參考 [`doc/system-maintenance.md`](./doc/system-maintenance.md)。
