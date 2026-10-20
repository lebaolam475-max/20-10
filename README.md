# Một bó hoa dành tặng bạn · 20/10

Trang tặng hoa và thiệp chúc mừng ngày Phụ nữ Việt Nam 20/10, dùng HTML, CSS và JavaScript thuần. Hoạt động offline, không cần cài thư viện hoặc build.

## Chạy

Mở `index.html` trực tiếp trong trình duyệt, hoặc chạy từ thư mục này:

```bash
python3 -m http.server 8080
```

Truy cập http://localhost:8080.

## Trang vườn hoa mới

Mở `garden.html` trực tiếp trong trình duyệt, chọn **Ngắm vườn hoa** ở góc trên bên phải trang `index.html`, hoặc truy cập http://localhost:8080/garden.html khi chạy server ở trên. Trang hoạt động offline; khi sao chép sang nơi khác, chép kèm `garden-botany.js` và thư mục `assets`.

- Ban đầu chỉ có một bông hoa giữa màn hình. Bấm vào hoa (hoặc dùng Tab rồi Enter/Space) để cả vườn hoa dần nở từ giữa ra hai bên.
- Sau khoảng 7 giây, thiệp chúc 20/10 tự hiện. Chọn **Ngắm vườn hoa**, nút × hoặc Escape để đóng thiệp.
- Chọn **Đọc lại thiệp** để mở lại, hoặc **Cho hoa nở lại** để trở về bông hoa đầu tiên.
- Trang tự điều chỉnh theo màn hình và bỏ qua hoạt ảnh nở khi người xem bật chế độ giảm chuyển động.
- Hoa hồng dùng cùng cách dựng cánh với `index.html`: nhiều vòng cánh cong, tâm xoắn, bóng giữa các cánh, viền bắt sáng và giọt sương. Các hàm vẽ được lấy từ `script.js` sang `garden-botany.js` cho vườn hoa. Lá có gân, thân lay theo gió, hoa nghiêng nhẹ khi rê chuột gần và có cánh hoa bay; chuyển động tạm dừng khi tab bị ẩn.
- Hoa hồng, kem được xen với hoa xanh lá nhạt, xanh dương và trắng. Nền trời xanh có mây mỏng trôi chậm; gió làm thân, lá và đầu hoa lắc lư cùng nhau.
- Có thêm 20 nụ hoa nhiều màu xen qua các lớp của khu vườn, cánh còn khép và đài xanh ôm quanh gốc nụ. Nụ xuất hiện cùng đợt hoa và giữ dáng khép khi vườn đã nở.
- Trang dùng Noto Serif (chữ đứng và nghiêng) cho tiêu đề, lời gửi và chữ ký; Noto Sans cho nội dung. Font có đầy đủ dấu tiếng Việt, được lưu tại `assets/fonts` kèm giấy phép để dùng offline. Khi sao chép trang sang nơi khác, chép kèm thư mục này.

## Trải nghiệm

- Bó hoa nở trước, sau đó xuất hiện phong bì để người xem tự mở thiệp.
- Chạm từng bông hoa để nhận một lời chúc nhỏ. Khi dùng bàn phím, Tab đến bó hoa rồi nhấn Enter, Space hoặc các phím mũi tên.
- Chọn **Mở thiệp** để đọc lời chúc; đóng bằng nút ×, phím Escape hoặc **Gấp thiệp** trên phong bì.
- Hoa và tiêu đề được căn giữa khi vào trang. Khi mở thiệp, cả cụm hoa và thiệp được cân giữa; trang tự chia cột trên màn hình rộng và xếp thiệp xuống dưới trên màn hình hẹp. Thiệp nằm trong luồng trang, nên tiêu đề, ảnh, hoa và lời chúc không bị che; có thể tiếp tục tương tác với hoa khi thiệp mở.
- Chọn **Cho hoa nở lại** để xem lại hiệu ứng.
- Thiệp dài tự tăng chiều cao và cuộn cùng trang. Trang tôn trọng thiết lập giảm chuyển động và tạm dừng hoạt ảnh khi tab bị ẩn.

## Nhập tên và nhạc nền

- Lần đầu mở `index.html`, hộp **Bạn tên là gì nhé?** hiện ra. Tên được ghi vào dòng chữ dưới tiêu đề và dòng "Gửi …," của thiệp, lưu trên trình duyệt này. Chọn **Để sau** để bỏ qua, hoặc **Đổi tên** dưới tiêu đề để nhập lại.
- Muốn gửi một liên kết đã có sẵn tên, thêm `?ten=` vào địa chỉ, ví dụ `index.html?ten=Lan`. Trang sẽ không hỏi lại tên.
- Hiệu ứng bất ngờ: bướm lượn quanh trang sau khi hoa nở (cả `index.html` và `garden.html`); trái tim bay lên khi chạm một bông hoa, nhập tên xong hoặc mở thiệp. Tắt khi người xem bật chế độ giảm chuyển động.
- Nhạc nền cất lên một lần sau thao tác đầu tiên của người xem (nhập tên, mở thiệp; ở `garden.html` là chạm bông hoa đầu tiên). Nút **Bật nhạc / Tắt nhạc** ở góc trên bên trái (trên `garden.html` nằm cùng hàng nút ở dưới); lựa chọn tắt nhạc được nhớ cho các lần sau. Nhạc tạm dừng khi chuyển tab.
- Mặc định là giai điệu hộp nhạc nhẹ tự tạo bằng Web Audio, không cần tệp. Muốn dùng bài hát riêng, chép tệp vào `assets/music.mp3`; trang sẽ phát tệp này lặp lại thay cho giai điệu mặc định. Nên dùng bài mà bạn có quyền sử dụng.
- Các tệp thêm: `welcome.js` (hộp nhập tên), `music.js` (nhạc nền).


## Các tệp

- `index.html`: bố cục, Canvas, thiệp và form cá nhân hóa.
- `style.css`: nền hồng, phong bì, giấy gấp, bố cục responsive và chuyển động.
- `script.js`: vẽ bó hoa, hiệu ứng nở hoa, parallax, cánh hoa bay và tương tác từng bông.
- `card.js`: mở/đóng thiệp, chuyển bố cục, lời chúc và lưu nội dung cá nhân hóa.
- `tests/layout.cjs`: kiểm tra hồi quy bố cục trên 11 kích thước màn hình, hoa căn giữa, thiệp dài và các tương tác. Chạy `node tests/layout.cjs` trong môi trường có Playwright (hoặc đặt `NODE_PATH` đến thư mục chứa Playwright đã cài).

Đổi nội dung thiệp tại `defaultGreeting` trong `card.js` (ở `garden.html` sửa trực tiếp trong HTML của thiệp); đổi các lời chúc theo bông hoa tại `WHISPER_NOTES` trong `script.js`. Nội dung được render dưới dạng văn bản thuần.

# flowers-20-10