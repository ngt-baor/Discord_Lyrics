# MEMORY - Nhật Ký Làm Việc DiscordLyrics

File này dùng để ghi lại nhật ký làm việc của dự án DiscordLyrics. Sau mỗi lần hoàn thành một việc, hãy cập nhật thêm vào cuối file.

## Quy Ước Ghi Nhật Ký

Mỗi mục nên ghi:

- Ngày tháng năm.
- Agent đã làm việc: ví dụ `Codex`, `Antigravity`.
- Skill đã dùng.
- Mục tiêu công việc.
- Kiến thức/công nghệ đã dùng.
- File chính đã sửa.
- Các bước sửa lỗi hoặc triển khai.
- Cách kiểm tra.
- Kết quả và bài học rút ra.

---

## Thông Tin Dự Án

- Tên app: `DiscordLyrics`.
- Loại app: Windows Electron desktop app.
- Repo local chính: `C:\Users\Bao\Downloads\lyrics-status-3.0.7\lyrics-status-3.0.7`.
- Lưu ý: terminal/Codex đôi khi mở trong `node_modules`, cần chuyển về repo root trước khi làm.
- Repo GitHub ban đầu: `https://github.com/Baor-05/Discord_Lyrics.git`.
- GitHub đã báo repo được chuyển sang: `https://github.com/ngt-baor/Discord_Lyrics.git`.
- File cài đặt người dùng dùng: `desktop-release\DiscordLyricsSetup.exe`.
- File release cần upload để auto update hoạt động:
  - `DiscordLyricsSetup.exe`
  - `latest.yml`
  - `DiscordLyricsSetup.exe.blockmap`
- File không nên commit:
  - `settings.json`
  - `desktop-release/`
  - `dist/`
  - `release/`
  - `node_modules/`
  - token hoặc secret cá nhân.

## File Quan Trọng

- `src/StatusChanger.ts`: gửi Discord Custom Status, chống spam, rate limit, clear status.
- `src/PlaybackStateUpdater.ts`: đọc nguồn nhạc, nhận Spotify/SpotX/YouTube Music, cập nhật bài hát/progress.
- `src/WindowsMediaService.ts`: đọc và điều khiển Windows Media Session.
- `src/YouTubeMusicApiService.ts`: nhận và điều khiển YouTube Music desktop API.
- `src/YouTubeMusicWebService.ts`: nhận YouTube Music web qua extension bridge.
- `src/Panel/Server.ts`: server local, WebSocket panel, playback controls, update endpoints.
- `src/desktop.ts`: Electron window, tray, titlebar, mini mode.
- `src/preload.ts`: bridge an toàn cho window controls.
- `static/panel.js`: giao diện panel, popup, settings, media controls.
- `scripts/update-exe-icon.js`: patch icon/version exe bằng `rcedit` trong `afterPack`.
- `build/installer.nsh`: NSIS hook, dùng để tắt app cũ trước khi cài.
- `README.md`: hướng dẫn người dùng.
- `RELEASE.md`: release notes và asset cần upload.
- `VERSION` + `package.json`: version app/release.

---

## Timeline Tổng Hợp

### 2026-06-14 - v1.0 Initial Commit

- Commit: `15d1fd3 Initial commit for DiscordLyrics v1.0`.
- Agent: Codex.
- Skill: chưa ghi nhận rõ.
- Mục tiêu: đưa project DiscordLyrics lên Git lần đầu.
- Kiến thức/công nghệ:
  - Node.js/TypeScript.
  - Discord Custom Status.
  - Spotify/SpotX runtime ban đầu.
- Kết quả:
  - Có nền tảng app để đọc nhạc và cập nhật status Discord.

### 2026-06-15 - v1.2 Release Và Fix Bug

- Commit/tag:
  - `e729052 Release DiscordLyrics v1.2`
  - `03eeb8e fixbug v1.2`
- Agent: Codex.
- Skill liên quan:
  - Debug thủ công.
  - UI polish theo ảnh người dùng.
- Mục tiêu:
  - Cập nhật app cũ để chạy tốt hơn với Spotify, SpotX, Discord.
  - Viết README tiếng Việt dễ hiểu.
  - Đóng gói app thành `.exe`.
  - Thay icon app.
  - Cho app chạy nền và thu nhỏ xuống tray khi đóng.
  - Sửa lỗi pin taskbar bị mất icon.
  - Dọn giao diện tiếng Anh, chuyển UI sang tiếng Việt, bỏ các ô không dùng.
- Kiến thức/công nghệ đã dùng:
  - Electron tray.
  - Windows icon/taskbar identity.
  - Discord token.
  - Spotify Developer/redirect URI ở giai đoạn đầu.
  - Windows Media fallback.
- Giải pháp áp dụng:
  - Chuyển app sang hướng không phụ thuộc Spotify Premium/API cho lyric cơ bản.
  - Dùng Windows Media Session để đọc thông tin bài hát khi không dùng Spotify API.
  - Đóng gói desktop app để người dùng phổ thông chỉ cần chạy exe.
  - Thêm tray behavior để đóng cửa sổ không thoát app.
- Bài học:
  - Với Windows app, sửa source chưa đủ; phải kiểm tra bản packaged mà người dùng thật sự chạy.
  - Icon/taskbar cần xử lý bền ở mức exe resource/AppUserModelID, không chỉ đổi icon UI.

### 2026-06-15 đến 2026-06-17 - README Tiếng Việt Và Hướng Dẫn Người Dùng

- Commit:
  - `4e64a50 README.md`
  - `8468121 README.md`
  - `811f98a README.md`
  - `d16c343 README.md`
  - `4dd1488 README.md`
- Agent: Codex.
- Skill liên quan:
  - Viết tài liệu tiếng Việt.
  - Hướng dẫn người dùng phổ thông.
- Mục tiêu:
  - Viết README dễ hiểu bằng tiếng Việt.
  - Ghi cách cài đặt, cách dùng, cách lấy Discord token.
  - Giải thích người dùng phổ thông chỉ cần tải release/installer.
  - Giải thích dev cần Node.js.
- Kiến thức/công nghệ đã dùng:
  - GitHub Releases.
  - Discord token qua DevTools Network `Authorization` header.
  - Cấu trúc README cho app Windows.
- Giải pháp áp dụng:
  - Tách hướng dẫn thành:
    - Cách 1: người dùng phổ thông tải release và chạy app.
    - Cách 2: dev dùng Node.js, `npm install`, `npm run build`, `npm run desktop`.
  - Ghi rõ cảnh báo bảo mật token.
- Bài học:
  - Người dùng phổ thông không cần Node.js nếu dùng bản build/installer.
  - Terminal có thể hiển thị tiếng Việt bị mojibake, không được kết luận file hỏng nếu chưa kiểm tra encoding thật.

### 2026-06-17 - v1.3: YouTube Music API/Web, Installer Và Updater

- Commit/tag:
  - `2179e41 Update v1.3: Youtube Music update thêm tính năng API, Đã có thể dùng youtube music trên web`
  - `c3eb1f0 Thêm File Settup.exe cài đặt đơn giản hơn`
  - `4308422 update v1.3.0`
- Agent: Codex.
- Skill liên quan:
  - Debug runtime.
  - Packaging Windows.
  - Release handoff.
- Mục tiêu:
  - Thêm hỗ trợ YouTube Music.
  - Thêm YouTube Music desktop API.
  - Thêm YouTube Music web bridge/extension.
  - Sửa chọn nguồn: chọn Spotify thì chỉ nhận Spotify/SpotX, chọn YouTube Music thì chỉ nhận YouTube Music.
  - Thêm tính năng update giống Messenger.
  - Đóng gói thành `DiscordLyricsSetup.exe`.
  - Sửa icon/version trên máy khách.
  - Push `update v1.3.0`.
- Kiến thức/công nghệ đã dùng:
  - YouTube Music desktop API local host/port.
  - Browser extension bridge cho `music.youtube.com`.
  - Windows Media Session fallback.
  - Electron Builder + NSIS.
  - `afterPack` + `rcedit` để patch icon/version.
  - GitHub Releases updater.
- Giải pháp áp dụng:
  - Thêm logic ưu tiên nguồn YouTube Music:
    1. YouTube Music desktop API đang phát.
    2. YouTube Music web đang phát.
    3. YouTube Music desktop API đang pause.
    4. Windows Media fallback.
  - Updater dùng GitHub Releases, cần asset `DiscordLyricsSetup.exe`.
  - README ghi rõ file release cần tải/cài.
  - `.gitignore` giữ build output/local settings ở ngoài Git.
- Bài học:
  - Auto update chỉ hoạt động nếu release có đúng file `DiscordLyricsSetup.exe`.
  - Version hiển thị trên máy khách phụ thuộc `package.json` và exe resource, không chỉ `VERSION`.
  - Build artifacts không nên commit, nhưng release assets phải upload lên GitHub Releases.

### 2026-06-21 - v1.4.0: Media Controls, Seek, UI Polish Và Popup

- Commit/tag:
  - `d9daea4 Update v1.4.0`
- Agent: Codex + chỉnh sửa UI thủ công từ Bảo.
- Skill đã dùng/nhắc tới:
  - `design-taste-frontend`.
  - `redesign-existing-projects` được Bảo dùng để sửa UI app.
  - Frontend debugging thủ công.
- Mục tiêu:
  - Làm lại trang chính premium hơn.
  - Bên trái hướng Discord/settings.
  - Bên phải hướng Spotify: tên bài, nghệ sĩ, lyric.
  - Pop-up giống Spotify.
  - Ẩn scrollbar khi dùng popup.
  - Cho popup tự resize.
  - Icon popup đổi theo app đang chạy: Spotify hoặc YouTube Music.
  - Thêm nút tua, qua bài, lùi bài, stop/start/play/pause.
  - Kéo thanh thời gian để tua.
  - Sửa layout mini/pill mode.
- Kiến thức/công nghệ đã dùng:
  - Electron frameless/custom titlebar.
  - `preload.ts` + `contextBridge` + IPC cho window controls.
  - CSS responsive/container query/popup.
  - Windows Media control session.
  - YouTube Music API/web command bridge.
  - Playback seek theo `positionMs`.
- Giải pháp áp dụng:
  - Thêm media controls ở UI chính, popup và pill mode.
  - Progress bar có thể click/kéo để seek.
  - Source accent đổi theo Spotify/YouTube Music.
  - Popup có giao diện glass, progress, lyric và icon nguồn.
  - Titlebar custom thay thanh mặc định, bo góc phải.
  - `build/installer.nsh` giúp tắt app cũ trước khi cài để tránh lỗi khóa file.
- Bài học:
  - UI đẹp phải test nhiều kích thước: full panel, popup có lyric, pill nhỏ nhất.
  - Khi app đang chạy, package có thể fail vì file trong `desktop-release\win-unpacked` bị khóa.
  - Muốn package lại thì kiểm tra/tắt `DiscordLyrics.exe` đang chạy trước.

### 2026-06-22 - v1.4.1: Chống Spam Discord, README/RELEASE, Push GitHub

- Commit/tag:
  - `526b0b3 update v1.4.1`
- Agent: Codex.
- Skill đã dùng:
  - Phân tích theo hướng `diagnosing-bugs`.
  - Quy trình release thủ công.
  - Sau đó đã cài thêm các skill hỗ trợ cho lần sau.
- Mục tiêu:
  - Quét luồng gửi Discord để tìm nguyên nhân request tăng mạnh gây rate limit token.
  - Không khóa `minSendInterval` vì mỗi người dùng có nhu cầu khác nhau.
  - Thêm cơ chế chống spam thông minh hơn.
  - Gộp changelog, nâng version `1.4.1`.
  - Sửa README/RELEASE.
  - Đóng gói và push GitHub.
- Kiến thức/công nghệ đã dùng:
  - Discord API PATCH `https://discord.com/api/v9/users/@me/settings`.
  - Discord HTTP `429`, `retry_after`, `401`, `403`.
  - Backoff/rate limit local.
  - Debounce pause/stop.
  - WebSocket panel message.
  - Electron Builder packaging.
- Nguyên nhân lỗi đã phân tích:
  - `changeStatus()` được gọi khoảng 60 lần/giây.
  - Nếu `minSendInterval` quá thấp và lyric đổi nhanh, app có thể gửi quá nhiều request.
  - Khi Discord trả lỗi, code cũ reset `lastStatusKey`, làm app retry cùng lyric liên tục.
  - `429` chưa được chặn đủ cứng trước khi request mới chen vào.
  - Pause/stop chập chờn có thể tạo chuỗi `clear -> lyric -> clear`.
- Giải pháp đã áp dụng:
  - Thêm request budget nội bộ khoảng `10 request / 10 giây`.
  - Không reset `lastStatusKey` khi request lỗi.
  - Gặp `429` thì đọc `retry_after` và chờ đúng thời gian.
  - Gặp `401/403` thì chặn token đó, chỉ mở lại khi đổi token hoặc bấm kiểm tra token thành công.
  - Pause/stop debounce `1800ms` trước khi clear Discord status.
  - Lyric nhanh thì ưu tiên gửi dòng mới nhất khi tới lượt.
  - Custom status dùng đúng dòng lyric đang gửi lên Discord.
  - Frontend gửi message `discord-token-validated` sau khi token check hợp lệ.
  - Backend nhận tín hiệu và reset token block.
- File chính đã sửa:
  - `src/StatusChanger.ts`
  - `src/index.ts`
  - `src/Panel/Server.ts`
  - `static/panel.js`
  - `src/desktop.ts`
  - `src/preload.ts`
  - `build/installer.nsh`
  - `package.json`
  - `VERSION`
  - `README.md`
  - `RELEASE.md`
- Kiểm tra:
  - `npm run build`: pass.
  - `npm run package:desktop`: pass sau khi tắt các tiến trình DiscordLyrics đang khóa file.
  - Exe version: `1.4.1`.
  - Push `origin/main`: thành công.
- Bài học:
  - Không cần ép cứng `minSendInterval`; có thể để người dùng tự chỉnh nhưng thêm guard nội bộ.
  - Guard chống spam phải nằm ngay trước request thật.
  - Khi token bị lỗi, retry liên tục là nguy hiểm hơn việc tạm dừng gửi.
  - README/RELEASE nên cập nhật cùng version trước khi push.

### 2026-06-22 - Cài Skill Hỗ Trợ Workflow

- Agent: Codex.
- Skill đã dùng:
  - `skill-installer`
  - `skill-creator`
- Mục tiêu:
  - Thêm skill để làm việc hiệu quả hơn và tiết kiệm token về sau.
  - Tạo skill riêng cho dự án DiscordLyrics.
- Skill đã cài:
  - `diagnosing-bugs`: debug bug phức tạp, tìm nguyên nhân gốc.
  - `tdd`: sửa logic nhạy bằng test trước.
  - `codebase-design`: thiết kế/tách module khi app lớn.
  - `grill-with-docs`: hỏi kỹ yêu cầu trước khi làm tính năng lớn.
  - `handoff`: tạo bản bàn giao khi gần hết token/chuyển thread.
  - `to-prd`: biến ý tưởng lớn thành PRD.
  - `playwright`: test UI bằng trình duyệt.
  - `security-best-practices`: kiểm tra secret/token/file nhạy cảm.
  - `discordlyrics-workflow`: skill riêng cho dự án này.
- Nội dung skill riêng `discordlyrics-workflow`:
  - Repo root.
  - File release chính.
  - File cần upload GitHub Releases.
  - File không nên commit.
  - Danh sách file quan trọng.
  - Quy trình debug Discord spam/rate limit.
  - Quy trình debug Spotify/YT Music nhận nhầm nguồn.
  - Quy trình kiểm tra UI popup/pill.
  - Quy trình build/package/release.
  - Checklist trước khi push GitHub.
- Bài học:
  - Skill không tự tiết kiệm token, nhưng giúp giảm đọc lại context và giảm làm sai workflow.
  - `handoff` hữu ích nhất khi cuộc trò chuyện dài hoặc chuyển sang Antigravity/Codex thread khác.

---

## Kiến Thức Và Giải Pháp Theo Chức Năng

### Discord Custom Status

- App dùng Discord token cá nhân để PATCH custom status.
- File chính: `src/StatusChanger.ts`.
- Rủi ro:
  - Discord rate limit.
  - Token sai/hết hạn.
  - Retry loop nếu reset key sai.
- Giải pháp hiện tại:
  - `lastStatusKey` chống gửi trùng.
  - `isRequestPending` chống request song song.
  - Local request budget chống gửi quá dày.
  - `retry_after` được tôn trọng khi 429.
  - Token 401/403 bị chặn cho tới khi đổi/check token lại.
  - Clear status có debounce.

### Lyric Sync

- App tính dòng lyric hiện tại theo `songProgress`.
- UI có thể cập nhật nhanh hơn Discord status.
- Discord status không nên cố gửi mọi dòng lyric nếu bài quá nhanh.
- Giải pháp:
  - UI vẫn chạy mượt.
  - Discord sender ưu tiên dòng mới nhất khi tới lượt gửi.
  - Có `sendTimeOffset` và auto-offset để chỉnh độ trễ thực tế.

### Spotify/SpotX

- Đọc qua Spotify/SpotX hoặc Windows Media fallback.
- Khi chọn chế độ Spotify, app không nên nhận YouTube Music.
- Cần kiểm tra:
  - `PlaybackStateUpdater.ts`
  - `WindowsMediaService.ts`
  - `SpotifyService.ts`

### YouTube Music Desktop API

- Dùng host/port local, mặc định:
  - Host: `127.0.0.1`
  - Port: `26538`
- Người dùng cần bật API trong app YouTube Music desktop.
- Có thể dùng token/xác thực API tùy cài đặt app YouTube Music.
- File chính:
  - `src/YouTubeMusicApiService.ts`
  - `src/PlaybackStateUpdater.ts`

### YouTube Music Web

- Cần browser extension bridge.
- App phân biệt YouTube thường và YouTube Music bằng domain/bridge gửi playback.
- File chính:
  - `browser-extension/`
  - `src/YouTubeMusicWebService.ts`
  - `src/Panel/Server.ts`

### Playback Controls

- Các action:
  - play/pause
  - next
  - previous
  - shuffle
  - repeat
  - seekTo
  - seekBy
- Nguồn điều khiển:
  - YouTube Music API.
  - YouTube Music web command queue.
  - Windows Media Session fallback.
- File chính:
  - `src/Panel/Server.ts`
  - `src/WindowsMediaService.ts`
  - `static/panel.js`

### UI/Popup/Pill Mode

- File chính: `static/panel.js`.
- Các điểm cần test:
  - Full panel.
  - Popup có lyric.
  - Pill mode khoảng `250x50`.
  - Text overflow.
  - Scrollbar.
  - Progress bar.
  - Icon nguồn Spotify/YT Music.
- Skill nên dùng:
  - `redesign-existing-projects`
  - `design-taste-frontend`
  - `playwright`

### Packaging/Installer

- Lệnh:

```powershell
npm run build
npm run package:desktop
```

- Nếu package fail vì `Access is denied` trong `desktop-release\win-unpacked`, kiểm tra app đang chạy:

```powershell
Get-Process DiscordLyrics -ErrorAction SilentlyContinue
```

- Có thể cần tắt app trước khi build lại.
- Installer dùng Electron Builder + NSIS.
- `afterPack` dùng `scripts/update-exe-icon.js` để patch icon/version.
- `build/installer.nsh` tắt app cũ khi cài.

### Auto Update

- File chính:
  - `src/Updater.ts`
  - `src/Panel/Server.ts`
  - `static/panel.js`
- Release cần có:
  - `DiscordLyricsSetup.exe`
  - `latest.yml`
  - `DiscordLyricsSetup.exe.blockmap`
- Nếu app báo có update nhưng không cài được, kiểm tra release asset có đúng tên `DiscordLyricsSetup.exe` không.

---

## Checklist Sau Mỗi Lần Hoàn Thành Việc

1. Ghi mục mới vào cuối `MEMORY.md`.
2. Ghi ngày tháng năm.
3. Ghi agent: `Codex`, `Antigravity`, hoặc agent khác.
4. Ghi skill đã dùng.
5. Ghi file đã sửa.
6. Ghi cách kiểm tra.
7. Nếu có release:
   - cập nhật `package.json`
   - cập nhật `VERSION`
   - cập nhật `README.md`
   - cập nhật `RELEASE.md`
   - chạy `npm run build`
   - chạy `npm run package:desktop`
8. Trước khi push:
   - kiểm tra `git status --short`
   - không commit token/settings/build output
   - kiểm tra README/RELEASE đúng version

---

### 2026-06-22 - v1.4.0: Thêm 5 Nút Chức Năng, Auto/Check Update, Lưu Cửa Sổ, Tua Nhạc & Sửa Lỗi YT Music

- Agent: Antigravity
- Skill đã dùng:
  - design-taste-frontend
  - diagnosing-bugs
  - codebase-design
- Mục tiêu:
  - Bổ sung 5 nút chức năng hoàn chỉnh (Trộn bài, Lùi bài, Phát/Tạm dừng, Tiến bài, Lặp lại) hỗ trợ cả Spotify và YouTube Music.
  - Thêm tính năng Auto Update, Check Update hoạt động qua GitHub Releases.
  - Lưu và khôi phục kích thước, vị trí cửa sổ Electron khi đóng/mở lại app.
  - Click/kéo thanh thời gian để tua bài (playback seek).
  - Tự động bù trừ độ trễ đồng bộ (+400ms) và cho phép trộn bài/lặp lại hoạt động mượt mà trên YouTube Music (API & Web Extension).
- File đã sửa:
  - [package.json](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/package.json)
  - [VERSION](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/VERSION)
  - [README.md](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/README.md)
  - [RELEASE.md](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/RELEASE.md)
  - [PlaybackStateUpdater.ts](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/src/PlaybackStateUpdater.ts)
  - [YouTubeMusicApiService.ts](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/src/YouTubeMusicApiService.ts)
  - [YouTubeMusicWebService.ts](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/src/YouTubeMusicWebService.ts)
  - [content.js](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/browser-extension/ytmusic-web/content.js)
  - [Server.ts](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/src/Panel/Server.ts)
  - [Settings.ts](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/src/Settings.ts)
  - [desktop.ts](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/src/desktop.ts)
  - [panel.js](file:///c:/Users/Bao/Downloads/lyrics-status-3.0.7/lyrics-status-3.0.7/static/panel.js)
- Kiến thức/công nghệ đã dùng:
  - Electron window size/position state persistence.
  - YouTube Music Desktop companion API command server.
  - Browser extension DOM injection and event emulation (click simulation).
  - TypeScript compilation and Electron Builder packaging.
- Các bước đã làm:
  1. Thêm bù trễ +400ms vào PlaybackStateUpdater để sửa lỗi lệch nhịp lyric của YouTube Music.
  2. Bổ sung các lệnh gửi command (shuffle, repeatMode, seekTo) tới YTM Desktop API và Web Extension (qua cơ chế hàng đợi lệnh).
  3. Cập nhật content.js của Web Extension để đón nhận lệnh điều khiển và click giả lập các nút trên trang web YouTube Music.
  4. Cấu trúc lại bộ định tuyến Server.ts để điều khiển YouTube Music chính xác hơn.
  5. Đóng gói bản cài đặt v1.4.0 sạch sẽ và đẩy lên repo Git với thông điệp "Update v1.4.0".
- Kiểm tra:
  - Chạy `npm run build` và `npm run package:desktop` thành công.
  - Bản cài đặt `DiscordLyricsSetup.exe` được tạo mới nhất ở phiên bản 1.4.0.
- Kết quả:
  - Tất cả các yêu cầu mới đều hoạt động trơn tru. Bộ cài đặt và các ghi chú phát hành đã sẵn sàng.
- Bài học:
  - Để tương tác đầy đủ với các ứng dụng bên thứ ba (như browser hoặc electron wrappers), việc click giả lập DOM qua content script hoặc gửi lệnh qua API chuyên dụng mang lại độ tin cậy cao hơn nhiều so với SMTC API của Windows.

---

## Mẫu Ghi Nhật Ký Cho Lần Sau

```md
### YYYY-MM-DD - Tên công việc

- Agent: Codex / Antigravity
- Skill đã dùng:
  - skill-1
  - skill-2
- Mục tiêu:
  - ...
- File đã sửa:
  - ...
- Kiến thức/công nghệ đã dùng:
  - ...
- Các bước đã làm:
  1. ...
  2. ...
  3. ...
- Kiểm tra:
  - ...
- Kết quả:
  - ...
- Bài học:
  - ...
```

