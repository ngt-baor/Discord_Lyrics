# DiscordLyrics v1.2

DiscordLyrics là ứng dụng Windows giúp hiển thị lời bài hát đang phát lên Discord Custom Status. App đọc nhạc từ Spotify, SpotX hoặc YouTube Music thông qua Windows Media Session, lấy lyric từ các nguồn bên ngoài, rồi tự cập nhật trạng thái Discord theo thời gian.

Ứng dụng hiện không cần Spotify Developer API để hoạt động cơ bản. Bạn chỉ cần Discord token để gửi status.

> Lưu ý bảo mật: Discord token là thông tin nhạy cảm. Không chia sẻ token, không commit `settings.json`, không gửi token lên GitHub.

## Tính Năng

- Đọc nhạc từ `Spotify`, `SpotX` hoặc `YouTube Music`.
- Chọn riêng chế độ Spotify/SpotX hoặc YouTube Music.
- Lấy lyric tự động từ nhiều nguồn.
- Gửi lyric hiện tại lên Discord Custom Status.
- Tự xóa status Discord khi dừng nhạc hoặc tắt app.
- Tự lưu token và setting.
- Giao diện tiếng Việt.
- Có pop-up nổi kiểu Spotify.
- Pop-up có thể kéo, resize và luôn nằm trên cùng.
- Thu nhỏ xuống system tray khi đóng app.

## Cài Đặt



### Cách 1: Dành cho người sử dụng phổ thông

1. Tải file [DiscordLyrics.zip](https://github.com/Baor-05/Discord_Lyrics/releases/download/v1.2/DiscordLyrics.zip) trong phần Releases.
2. Giải nén file `DiscordLyrics.zip`.
3. Mở file `DiscordLyrics.exe`.
4. Dán Discord token vào ô `Token Discord`.
5. Bấm `Kiểm tra`.
6. Mở Spotify, SpotX hoặc YouTube Music và phát nhạc.

Khi bấm nút `X`, app không tắt hẳn mà thu nhỏ xuống khay hệ thống. Muốn thoát hoàn toàn, bấm chuột phải vào icon tray và chọn `Quit`.

### Cách 2: Dành cho dev

Yêu cầu:

- Windows 10 hoặc Windows 11.
- Cài [Node.js](https://nodejs.org/en).

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

## Cách Lấy Discord Token

1. Mở discord.com/app trên trình duyệt (không phải app discord)
2. Nhấn F12 để mở DevTools → chọn Network
3. Thực hiện bất kỳ hành động nào (mở chat, gửi tin nhắn, v.v.)
4. Nhấp vào hành động bất kì → Request Headers → Tìm Authorization
5. Copy — dán vào ô token

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

Nên để chế độ Tự động chỉnh độ trễ gửi

### Giới hạn gửi Discord

`Giới hạn gửi Discord` là khoảng cách tối thiểu giữa hai lần đổi status. Tính năng này giúp giảm nguy cơ bị Discord rate limit khi lyric đổi quá nhanh.

Khuyên Dùng:
1. Bật tự chỉnh Độ Trễ Gửi
2. Giới hạn gửi Discord nên để 700 ~ 1200
3. Tính trung Bình: 3 ~ 6
4. hạn chế dùng icon (tùy dùng cũng được chỉ là khuyên không nên dùng)

## Ghi Chú Bảo Mật

DiscordLyrics sử dụng Discord token cá nhân để cập nhật custom status. Hãy tự chịu trách nhiệm khi sử dụng token cá nhân và chỉ chạy app trên máy của bạn.

Nếu lỡ commit token lên GitHub, hãy đổi token ngay bằng cách đăng xuất toàn bộ phiên Discord hoặc đổi mật khẩu Discord.
