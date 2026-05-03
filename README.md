# Dragon Dash 🐉

Chào mừng bạn đến với **Dragon Dash**! Một tựa game cuộn ngang (side-scrolling) thú vị, nơi bạn sẽ điều khiển những chú rồng với các bộ kỹ năng đặc biệt bay lượn qua các chướng ngại vật vô tận. Trò chơi lấy cảm hứng từ thể loại bay lượn truyền thống nhưng được nâng cấp với hệ thống nhân vật đa dạng, kỹ năng độc đáo và các cấp độ khó khác nhau.

🎮 **Chơi ngay tại đây:** [Dragon Dash](https://noanonoa.github.io/dragon-dash/)

---

## 🛠 Hướng Dẫn Cài Đặt (Chạy Offline)

Vì game được xây dựng hoàn toàn bằng HTML, CSS và JavaScript thuần (Vanilla JS), bạn không cần phải cài đặt bất kỳ môi trường server hay thư viện phức tạp nào.

1. **Tải source code về máy:**
   - Bạn có thể tải file `.zip` từ repository hoặc dùng lệnh `git clone`:
     ```bash
     git clone https://github.com/noanonoa/dragon-dash.git
     ```
2. **Mở game:**
   - Truy cập vào thư mục vừa tải về.
   - Nháy đúp chuột vào file `index.html` để mở bằng bất kỳ trình duyệt web nào (khuyên dùng Google Chrome, Edge hoặc Firefox).
   - *Hoặc:* Nếu bạn dùng VS Code, bạn có thể cài đặt extension **Live Server** và nhấn "Go Live" tại file `index.html` để trải nghiệm mượt mà nhất.

---

## 🎮 Hướng Dẫn Cách Chơi

**Mục tiêu:** Điều khiển chú rồng của bạn bay thật xa, vượt qua các cột đá và bẫy lửa mà không bị va chạm. Mỗi lần vượt qua một khe hở thành công, bạn sẽ nhận được 1 điểm.

### 🕹️ Thao tác điều khiển:
- **Chuột:** Click chuột trái (`Click`) vào màn hình để rồng lướt (dash) lên trên.
- **Bàn phím:** Nhấn phím `Space` (Phím cách) để rồng lướt lên.
- **Kích hoạt Kỹ Năng:** Nhấn các phím `Z`, `E`, `W`, `Q` tùy thuộc vào kỹ năng riêng của từng loại rồng.

---

## 🐲 Hệ Thống Nhân Vật & Kỹ Năng

Game cung cấp nhiều loại rồng khác nhau để bạn lựa chọn tại màn hình chờ (Nhấn nút **+** để mở Menu Rồng):

* **SHYVANA (Rồng Đỏ)**, **ANIVIA (Rồng Xanh Băng)**, **MORDEKAISER (Rồng Đen)**: Nhân vật cơ bản, không có kỹ năng đặc biệt. Phù hợp để luyện tập phản xạ thuần túy.
* **RAUMA (Rồng Xanh Lá):**
  - **Kỹ năng (Z): Năng Lượng Bạo Kích**
  - Nhấn phím `Z` để bắn tia năng lượng phá hủy hoàn toàn cột chướng ngại vật phía trước.
  - *Cơ chế:* Khởi đầu có 1 lượt bắn. Cứ mỗi 5 điểm ghi được sẽ hồi thêm 1 lượt (Tích trữ tối đa 3 lượt).
* **BANHCAY (Rồng Tối Thượng):**
  - **Kỹ năng: Hào Quang Hộ Mệnh (Nội tại)**
  - Tự động sở hữu một lớp lá chắn ma thuật giúp bỏ qua 1 lần va chạm với cột hoặc bẫy lửa. 
  - *Cơ chế:* Lá chắn tự động hồi phục sau mỗi 16 giây (Hiển thị qua thanh năng lượng).
* **THRESH (Rồng Xương):**
  - **Kỹ năng: Hấp Thụ Linh Hồn & Tiến Hóa**
  - Rồng phát ra vòng hào quang. Bay sát chướng ngại vật để vòng này chạm vào cột/lửa sẽ tích lũy Năng Lượng (NL).
  - Nhấn `E` (Tốn 5 NL): Tiến hóa rồng.
  - Nhấn `W` (Tốn 10 NL): Thu nhỏ chướng ngại vật phía trước.
  - Nhấn `Q` (Tốn 15 NL): Phá hủy hoàn toàn chướng ngại vật phía trước.

---

## 🎯 Chế Độ Chơi (Độ Khó)

Từ màn hình chính, bạn có thể chọn 1 trong 3 mức độ khó:
1. **NORMAL (Bình Thường):** Khe hở giữa các cột khá rộng, tốc độ bay tiêu chuẩn.
2. **HARD (Khó):** Khe hở hẹp lại đáng kể, tốc độ bay của rồng và tốc độ cuộn của chướng ngại vật nhanh hơn.
3. **CHALLENGE (Thử Thách):** 
   - Tốc độ bay cực nhanh, cột xuất hiện liên tục.
   - **Đặc biệt:** Kích hoạt hệ thống Cạm Bẫy Ẩn. Rồng bay càng xa, xác suất xuất hiện bẫy lửa trồi lên từ dưới đất hoặc bẫy sập (2 cột bất ngờ khép lại) càng cao.

*Lưu ý: Bất kể ở chế độ nào, cứ mỗi 25 điểm đạt được, tốc độ bay của rồng và chướng ngại vật sẽ tự động tăng dần lên, tạo nên thử thách không giới hạn.*

---

## 💻 Công Nghệ Sử Dụng
- **HTML5 Canvas:** Render đồ họa 2D động cho game.
- **Vanilla JavaScript:** Xử lý toàn bộ logic, thao tác điều khiển, vòng lặp game (Game Loop) và hệ thống va chạm (Collision Detection) dựa trên Pixel-perfect Hitbox.
- **CSS3:** Tạo kiểu dáng, hiệu ứng nút bấm, menu, UI động và các mảng Animation ngoài Canvas.

