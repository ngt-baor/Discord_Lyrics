# DiscordLyrics v1.2

DiscordLyrics là ứng dụng Windows giúp hiển thị lời bài hát đang phát lên Discord Custom Status. App đọc nhạc từ Spotify, SpotX hoặc YouTube Music thông qua Windows Media Session, lấy lyric từ các nguồn bên ngoài, rồi tự cập nhật trạng thái Discord theo thời gian.

Ứng dụng hiện không cần Spotify Developer API để hoạt động cơ bản. Bạn chỉ cần Discord token để gửi status.

> Lưu ý bảo mật: Discord token là thông tin nhạy cảm. Không chia sẻ token, không commit `settings.json`, không gửi token lên GitHub.

## Tính Năng

- Đọc bài hát đang phát từ Spotify Desktop, SpotX hoặc YouTube Music.
- Không yêu cầu Spotify Premium cho chế độ Windows Media fallback.
- Lấy lyric từ nhiều nguồn: LRCLib, NetEase Music, QQ Music và cache cục bộ.
- Cache lyric vào máy để lần sau đổi bài nhanh hơn.
- Tự lọc các dòng metadata như composer, lyricist, producer, `作曲`, `作词`.
- Gửi lyric hiện tại lên Discord Custom Status.
- Nếu bài hát không có lyric, status hiển thị biểu tượng nhạc và tên bài.
- Nếu đang ở đoạn intro hoặc đoạn nhạc không có lời, status hiển thị biểu tượng nhạc.
- Tự xóa Discord status khi dừng nhạc hoặc tắt app.
- Có giới hạn gửi Discord để giảm nguy cơ rate limit.
- Tự đo độ trễ phản hồi Discord và có thể tự chỉnh độ trễ gửi.
- Lưu token và toàn bộ setting vào `%APPDATA%\DiscordLyrics\settings.json`.
- Giao diện tiếng Việt.
- Giao diện chính dạng Discord + Spotify.
- Pop-up nổi giống mini player, luôn nằm trên cùng.
- Pop-up có thể kéo thả, resize tự do, min size `250x50`.
- Icon pop-up tự đổi theo nguồn đang chạy: Spotify hoặc YouTube Music.
- Thu nhỏ xuống system tray khi bấm nút đóng cửa sổ.
- Có shortcut và icon app riêng khi đóng gói desktop.

## Cài Đặt Cho Người Dùng

### Cách 1: Chạy bản desktop đã đóng gói

1. Tải hoặc mở thư mục bản build.
2. Vào thư mục:

```text
desktop-release/win-unpacked/
```

3. Chạy file:

```text
DiscordLyrics.exe
```

4. Dán Discord token vào ô `Token Discord`.
5. Bấm `Kiểm tra`.
6. Mở Spotify, SpotX hoặc YouTube Music và phát nhạc.

Khi bấm nút `X`, app không tắt hẳn mà thu nhỏ xuống khay hệ thống. Muốn thoát hoàn toàn, bấm chuột phải vào icon tray và chọn `Quit`.

### Cách 2: Chạy từ mã nguồn

Yêu cầu:

- Windows 10 hoặc Windows 11.
- Node.js 18 trở lên.
- npm.

Cài thư viện:

```powershell
npm install
```

Build TypeScript:

```powershell
npm run build
```

Chạy app console:

```powershell
npm start
```

Mở bảng điều khiển:

```text
http://localhost:8999
```

Chạy bản desktop khi phát triển:

```powershell
npm run desktop
```

Đóng gói bản desktop:

```powershell
npm run package:desktop
```

Đóng gói bản console:

```powershell
npm run package:win
```

## Luồng Chạy Của Ứng Dụng

1. App khởi động server nội bộ tại `http://localhost:8999`.
2. Giao diện panel kết nối WebSocket tới server nội bộ.
3. App đọc setting từ:

```text
%APPDATA%\DiscordLyrics\settings.json
```

4. Người dùng chọn nguồn nhạc: Spotify hoặc YouTube Music.
5. App đọc bài hát đang phát qua Windows Media Session.
6. Khi phát hiện bài mới, app xóa lyric cũ và bắt đầu tìm lyric mới.
7. `LyricsFetcher` kiểm tra cache trước.
8. Nếu cache chưa có, app gọi song song các nguồn lyric.
9. Lyric được chuẩn hóa, lọc metadata và lưu lại vào cache.
10. `StatusChanger` tính dòng lyric hiện tại dựa trên thời gian bài hát và độ trễ gửi.
11. Nếu cần đổi status, app gửi request tới Discord.
12. UI nhận playback qua WebSocket và cập nhật tên bài, nghệ sĩ, lyric, progress, nguồn lyric và trạng thái gửi Discord.
13. Khi pause, stop hoặc thoát app, app gửi yêu cầu xóa Discord Custom Status.

## Cách Dùng

### Kết nối Discord

1. Mở app.
2. Dán Discord token vào ô `Token Discord`.
3. Bấm `Kiểm tra`.
4. Nếu trạng thái báo đã kết nối, app có thể cập nhật Discord Custom Status.

Token chỉ được lưu trên máy của bạn trong file setting cục bộ. Không commit file này lên Git.

### Chọn nguồn nhạc

Ở thanh icon bên trái:

- Chọn icon Spotify để đọc Spotify hoặc SpotX.
- Chọn icon YouTube Music để đọc YouTube Music.

Khi đổi nguồn, giao diện và icon pop-up sẽ đổi theo nguồn đang chạy.

### Dùng pop-up

1. Bấm nút thu nhỏ ở góc phải khu vực đang phát.
2. App chuyển sang cửa sổ pop-up nhỏ.
3. Kéo pop-up đến vị trí mong muốn.
4. Kéo góc dưới phải để resize.
5. Bấm icon mở rộng để quay lại panel đầy đủ.

Kích thước nhỏ nhất của pop-up là `250x50`.

### Chỉnh độ trễ

`Độ trễ gửi (ms)` là thời gian app gửi lyric sớm hơn hoặc muộn hơn so với timestamp lyric.

Ví dụ:

- `200ms` nghĩa là gửi sớm khoảng 0.2 giây.
- `500ms` nghĩa là gửi sớm khoảng 0.5 giây.

Discord có độ trễ riêng, nên đặt `1ms` không có nghĩa là status sẽ hiện tức thì. Mức thực tế nên dùng thường là `200ms` đến `500ms`.

### Giới hạn gửi Discord

`Giới hạn gửi Discord` là khoảng cách tối thiểu giữa hai lần đổi status. Tính năng này giúp giảm nguy cơ bị Discord rate limit khi lyric đổi quá nhanh.

## Cấu Trúc Thư Mục Quan Trọng

```text
src/
  desktop.ts              Electron desktop window, tray, mini pop-up
  index.ts                Luồng chạy chính
  Settings.ts             Lưu và đọc setting
  PlaybackState.ts        Trạng thái bài hát hiện tại
  PlaybackStateUpdater.ts Đọc nhạc từ Spotify API hoặc Windows Media
  LyricsFetcher.ts        Tìm lyric, cache lyric
  StatusChanger.ts        Tính lyric hiện tại và gửi Discord status
  WindowsMediaService.ts  Đọc phiên media từ Windows
  Sources/                Các nguồn lyric
  Panel/Server.ts         Server Express và WebSocket

static/
  panel.js                Giao diện panel và pop-up
  index.html              Trang panel
  logo_*.svg/png          Icon giao diện

assets/
  icon.ico                Icon app

scripts/
  update-exe-icon.js
  create-desktop-shortcut.ps1
```

## File Không Được Đẩy Lên Git

Các file/thư mục sau chứa dữ liệu cá nhân hoặc build output, đã được `.gitignore` chặn:

```text
settings.json
desktop-release/
dist/
release/
node_modules/
cache/
log.txt
```

Không dùng `git add -f` với các file trên.

## Ghi Chú Bảo Mật

DiscordLyrics sử dụng Discord token cá nhân để cập nhật custom status. Hãy tự chịu trách nhiệm khi sử dụng token cá nhân và chỉ chạy app trên máy của bạn.

Nếu lỡ commit token lên GitHub, hãy đổi token ngay bằng cách đăng xuất toàn bộ phiên Discord hoặc đổi mật khẩu Discord.
