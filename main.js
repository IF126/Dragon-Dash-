
let cvs
let ctx
let description
let theme1
let bg
let dragon
let pipes
let ground
let getReady
let gameOver
let map
let score
let gameState
let frame
let degree
const SFX_SCORE = new Audio()
const SFX_DASH = new Audio()
const SFX_COLLISION = new Audio()
const SFX_FALL = new Audio()
const SFX_SWOOSH = new Audio()
let currentDifficulty = 'normal';     //  'challenge', 'normal', 'hard'
let shakeTime = 0;                    //  Thời gian rung màn hình
cvs = document.getElementById('game')
ctx = cvs.getContext('2d')
description = document.getElementById('description')
theme1 = new Image()
theme1.src = 'img/og-theme.png'
function processFireTransparency(img) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(img, 0, 0);
    try {
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        let bgR = data[0], bgG = data[1], bgB = data[2];
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            let colorDist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
            // Nếu màu đỏ thấp (< 120) HOẶC màu khá giống với nền (tổng chênh lệch < 80)
            // Cắt thêm màu xám/trắng nhạt nhưng không phải lõi lửa rực rỡ
            let isArtifact = r < 120 || colorDist < 80;
            // Note: Bỏ viền nén JPEG, giữ lại core sáng
            if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 200 && r < 240) {
                isArtifact = true;
            }
            if (isArtifact) {
                data[i + 3] = 0; // Cắt sắc nét, xóa hoàn toàn
            } else {
                data[i + 3] = 255; // Phần lửa còn lại giữ đục 100% để nét căng
            }
        }
        context.putImageData(imageData, 0, 0);
        context.clearRect(0, 0, canvas.width, 3);
        context.clearRect(0, canvas.height - 3, canvas.width, 3);
        context.clearRect(0, 0, 3, canvas.height);
        context.clearRect(canvas.width - 3, 0, 3, canvas.height);
        return canvas;
    } catch (e) {
        return img;
    }
}
let fireSprites = [];
for (let i = 1; i <= 5; i++) {
    let img = new Image();
    img.onload = () => {
        // Tách nền khi ảnh tải xong
        fireSprites[i - 1] = processFireTransparency(img);
    };
    img.src = `img/fire-${i}.png`;
    fireSprites.push(img); // Đưa ảnh gốc vào trước tạm thời
}
frame = 0;
degree = Math.PI / 180
SFX_SCORE.src = 'audio/sfx_point.wav'
SFX_DASH.src = 'audio/sfx_wing.wav'
SFX_COLLISION.src = 'audio/sfx_hit.wav'
SFX_FALL.src = 'audio/sfx_die.wav'
SFX_SWOOSH.src = 'audio/sfx_swooshing.wav'
gameState = {
    current: 3, // Bắt đầu tại menu
    getReady: 0,
    play: 1,
    gameOver: 2,
    menu: 3
}
// Xử lý lựa chọn Menu
const menuScreen = document.getElementById('menu-screen');
const selectionBoxes = document.querySelectorAll('.selection-box');
selectionBoxes.forEach(box => {
    box.addEventListener('click', (e) => {
        const difficulty = box.getAttribute('data-difficulty');
        currentDifficulty = difficulty; // Lưu lại độ khó hiện tại
        // Cập nhật điểm Best cho độ khó tương ứng
        score.best = parseInt(localStorage.getItem('bestScore_' + currentDifficulty)) || 0;
        // Note: Cấu hình game parameters theo độ khó
        if (difficulty === 'challenge') {
            pipes.gap = 175; // Điều chỉnh khe hở về 175 theo yêu cầu
            pipes.dx = 2.4;  // Tăng tốc độ bay (từ 1.5)
            pipes.spawnInterval = 130; // Xuất hiện cột nhanh hơn (từ 240)
            pipes.minY = -400;
            pipes.maxY = -150;
        } else if (difficulty === 'normal') {
            pipes.gap = 140;
            pipes.dx = 2;
            pipes.spawnInterval = 140;
            pipes.minY = -420;
            pipes.maxY = -110; // Giảm độ cao cột dưới
        } else if (difficulty === 'hard') {
            pipes.gap = 110;
            pipes.dx = 3;
            pipes.spawnInterval = 100;
            pipes.minY = -440;
            pipes.maxY = -80;  // Cho phép cột dưới ngắn hơn nữa
        }
        SFX_SWOOSH.play();
        gameState.current = gameState.getReady;
        menuScreen.classList.add('hidden');
        description.style.visibility = "visible";
    });
});
// Xử lý lựa chọn nhân vật
const charBtn = document.getElementById('char-btn');
const charMenu = document.getElementById('char-menu');
const charOptions = document.querySelectorAll('.char-option');
charBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState.current === gameState.play) return;
    charMenu.classList.toggle('hidden');
    SFX_SWOOSH.play();
});
const charData = {
    red: { name: "SHYVANA", skill: "Skill: <span class='skill-highlight'>None</span>" },
    blue: { name: "ANIVIA", skill: "Skill: <span class='skill-highlight'>None</span>" },
    black: { name: "MORDEKAISER", skill: "Skill: <span class='skill-highlight'>None</span>" },
    bone: { name: "THRESH", skill: "Skill: <span class='skill-highlight'>Hấp Thụ Linh Hồn</span><br>• Hút linh hồn bằng cách để 2 vòng xám chạm vào chướng ngại vật (Cột: +1 NL, Lửa: +2 NL).<br>• Nhấn <b>E</b>: Kích hoạt trạng thái Tiến Hóa (Tốn 5 NL).<br>• Khi đã tiến hóa: Nhấn <b>W</b> để Thu nhỏ một phần (Tốn 10 NL) hoặc <b>Q</b> để Phá hủy chướng ngại vật (Tốn 15 NL). Mỗi chiêu dùng 1 lần/ván." },
    dark: { name: "BANHCAY", skill: "Skill: <span class='skill-highlight'>Hào Quang Hộ Mệnh</span><br>• Sở hữu lá chắn ma thuật giúp bỏ qua 1 lần va chạm với cột hoặc mặt đất.<br>• Lá chắn tự động hồi phục sau mỗi 16 giây (Theo dõi thanh năng lượng phía dưới màn hình)." },
    green: { name: "RAUMA", skill: "Skill: <span class='skill-highlight'>Năng Lượng Bạo Kích (Z)</span><br>• Nhấn <b>Z</b> để phóng luồng năng lượng cực mạnh tiêu diệt cột trụ.<br>• Khởi đầu với 1 đòn, nhận thêm 1 đòn sau mỗi 5 điểm ghi được (Tích trữ tối đa 3 đòn)." }
};
const charNameDisplay = document.getElementById('char-name-display');
const charSkillDisplay = document.getElementById('char-skill-display');
// Các phần tử UI chiêu thức
const skillUI = document.getElementById('skill-ui');
const btnZ = document.getElementById('skill-btn-z');
const btnE = document.getElementById('skill-btn-e');
const btnW = document.getElementById('skill-btn-w');
const btnQ = document.getElementById('skill-btn-q');
charOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = option.getAttribute('data-type');
        const isAlreadySelected = option.classList.contains('selected');
        if (!isAlreadySelected) {
            // LẦN CLICK 1: Xem kĩ năng và thông tin
            SFX_SWOOSH.cloneNode(true).play();
            charOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            const data = charData[type] || charData.red;
            charNameDisplay.innerText = data.name;
            charSkillDisplay.innerHTML = data.skill; // Dùng innerHTML để hiển thị màu và xuống dòng
            SFX_SWOOSH.play();
            // Không đóng menu, để người chơi xem kĩ năng
        } else {
            // LẦN CLICK 2: Đã chọn rồi, giờ là xác nhận để chơi
            dragon.type = type;
            // Cập nhật bộ animation tùy theo loại rồng
            if (type === 'bone') {
                dragon.animation = [0, 1, 2, 1];
            } else if (type === 'dark' || type === 'green') {
                dragon.animation = [2, 1, 0, 1];
            } else {
                dragon.animation = [0, 1, 2, 1];
            }
            dragon.fr = 0;
            SFX_SWOOSH.play();
            charMenu.classList.add('hidden'); // Đóng menu để bắt đầu chơi
        }
    });
});
// Đóng menu nếu click ra ngoài
document.addEventListener('click', (e) => {
    if (!charMenu.contains(e.target) && e.target !== charBtn) {
        charMenu.classList.add('hidden');
    }
});
// ==========================================
// QUẢN LÝ MÔI TRƯỜNG (BACKGROUND & GROUND)
// ==========================================
bg = {
    imgX: 0,
    imgY: 0,
    width: 276,
    height: 228,
    x: 0,
    y: cvs.height - 228,
    w: 276,
    h: 228,
    dx: .2,
    render: function () {
        const drawMidground = (offsetX) => {
            ctx.save();
            ctx.translate(offsetX, this.y);
            const groundTop = 116; // Tọa độ mặt đất tương đối so với bg
            // Lớp núi xa (màu đỏ nâu nhạt) - Xử lý Seamless
            ctx.fillStyle = '#a64d3c';
            ctx.beginPath();
            ctx.moveTo(-1, groundTop);
            ctx.lineTo(-1, groundTop - 80);
            ctx.lineTo(40, groundTop - 110);
            ctx.lineTo(90, groundTop - 60);
            ctx.lineTo(140, groundTop - 140);
            ctx.lineTo(200, groundTop - 80);
            ctx.lineTo(250, groundTop - 100);
            ctx.lineTo(277, groundTop - 80);
            ctx.lineTo(277, groundTop);
            ctx.fill();
            // Thêm bóng cho núi xa (chi tiết phụ)
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.moveTo(140, groundTop - 140);
            ctx.lineTo(170, groundTop - 80);
            ctx.lineTo(140, groundTop - 80);
            ctx.fill();
            // Lớp núi gần (màu nâu đỏ sẫm)
            ctx.fillStyle = '#7a2818';
            ctx.beginPath();
            ctx.moveTo(-1, groundTop);
            ctx.lineTo(-1, groundTop - 50);
            ctx.lineTo(30, groundTop - 40);
            ctx.lineTo(80, groundTop - 90);
            ctx.lineTo(130, groundTop - 30);
            ctx.lineTo(190, groundTop - 70);
            ctx.lineTo(240, groundTop - 40);
            ctx.lineTo(277, groundTop - 50);
            ctx.lineTo(277, groundTop);
            ctx.fill();
            // Chi tiết vách đá và đổ bóng cho núi gần
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1.5;
            // Vẽ các đường sống núi (Ridges)
            const drawRidge = (px, py, rx, ry) => {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(rx, ry);
                ctx.stroke();
                // Đổ bóng một bên sống núi
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(rx, ry);
                ctx.lineTo(px + 15, ry);
                ctx.fill();
            };
            drawRidge(80, groundTop - 90, 60, groundTop - 20);
            drawRidge(190, groundTop - 70, 175, groundTop - 10);
            drawRidge(240, groundTop - 40, 255, groundTop - 10);
            // Thêm các đốm đá cuội (Texture)
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for (let i = 0; i < 15; i++) {
                ctx.fillRect(Math.random() * 276, groundTop - Math.random() * 40, 2, 2);
            }
            ctx.restore();
            // Xương rồng chi tiết hơn
            const drawCactus = (cx, cy, s) => {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(s, s);
                // Thân xanh đậm sa mạc
                ctx.fillStyle = '#2d5a27';
                ctx.strokeStyle = '#1a3316';
                ctx.lineWidth = 1;
                // Hàm vẽ bộ phận xương rồng có bo góc và gai
                const drawPart = (x, y, w, h, r) => {
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
                    else ctx.rect(x, y, w, h);
                    ctx.fill();
                    ctx.stroke();
                    // Gai xương rồng (những điểm sáng nhỏ)
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    for (let i = 0; i < 6; i++) {
                        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 0.8, 0.8);
                    }
                    ctx.fillStyle = '#2d5a27';
                };
                drawPart(-4, -50, 8, 50, 4); // Thân chính
                drawPart(-12, -35, 10, 7, 3); // Nhánh trái
                drawPart(-14, -48, 6, 15, 3); // Ngọn nhánh trái
                drawPart(2, -28, 12, 7, 3);  // Nhánh phải
                drawPart(10, -42, 6, 18, 3); // Ngọn nhánh phải
                ctx.restore();
            };
            // Ngôi nhà sa mạc (Adobe style) đang sáng đèn
            const drawHouse = (hx, hy, scale) => {
                ctx.save();
                ctx.translate(hx, hy);
                ctx.scale(scale, scale);
                // Thân nhà màu đất sét nung
                ctx.fillStyle = '#8e5d3e';
                ctx.strokeStyle = '#5d3a24';
                ctx.lineWidth = 2;
                ctx.fillRect(0, -45, 55, 45);
                ctx.strokeRect(0, -45, 55, 45);
                // Mái nhà phẳng kiểu cổ điển
                ctx.fillStyle = '#5d3a24';
                ctx.fillRect(-5, -50, 65, 8);
                ctx.strokeRect(-5, -50, 65, 8);
                // Cửa chính
                ctx.fillStyle = '#3e2416';
                ctx.fillRect(10, -25, 14, 25);
                // Cửa sổ sáng đèn (Vàng rực rỡ)
                ctx.save();
                ctx.fillStyle = '#ffdb4d';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffdb4d';
                ctx.fillRect(32, -32, 10, 10);
                ctx.restore();
                // Ánh đèn hắt nhẹ ra xung quanh cửa sổ
                let lightGrad = ctx.createRadialGradient(37, -27, 2, 37, -27, 25);
                lightGrad.addColorStop(0, 'rgba(255, 219, 77, 0.4)');
                lightGrad.addColorStop(1, 'rgba(255, 219, 77, 0)');
                ctx.fillStyle = lightGrad;
                ctx.beginPath();
                ctx.arc(37, -27, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            // Note: Object placement trong cảnh
            drawHouse(60, groundTop, 0.7);
            drawCactus(30, groundTop, 1.1);
            drawCactus(130, groundTop - 5, 0.8);
            drawHouse(190, groundTop, 0.6);
            drawCactus(250, groundTop + 5, 1.3);
            ctx.restore();
        };
        drawMidground(this.x);
        drawMidground(this.x + this.w);
        drawMidground(this.x + this.w * 2);
    },
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0
        }
        if (gameState.current == gameState.play) {
            this.x = (this.x - this.dx) % (this.w)
        }
    }
}
// ==========================================
// QUẢN LÝ CHƯỚNG NGẠI VẬT (CỘT & LỬA)
// ==========================================
pipes = {
    top: {
        imgX: 56,
        imgY: 323,
    },
    bot: {
        imgX: 84,
        imgY: 323,
    },
    width: 26,
    height: 160,
    w: 55,
    h: 500,
    gap: 170,
    dx: 2,
    minY: -450,
    maxY: -50,
    spawnInterval: 140,
    pipeGenerator: [],
    totalSpawned: 0,
    reset: function () {
        this.pipeGenerator = [];
        this.totalSpawned = 0;
    },
    render: function () {
        for (let i = 0; i < this.pipeGenerator.length; i++) {
            let pipe = this.pipeGenerator[i]
            if (pipe.isDestroyed) continue; // Bỏ qua nếu đã bị RauMa bắn hạ
            let shrink = pipe.gapModifier || 0;
            let topShrinkOffset = pipe.topShrinkOffset || 0;
            let botShrinkOffset = pipe.botShrinkOffset || 0;
            let topPipeY = pipe.y + shrink / 2 - topShrinkOffset;
            let bottomPipeY = pipe.y + (pipe.gap || this.gap) + this.h - shrink / 2 + botShrinkOffset;
            // Vẽ Trụ Đá Phía Trên
            if (!pipe.isTopDestroyed) {
                this.drawPillar(pipe.x, topPipeY, this.w, this.h, true);
            }
            // Vẽ ngọn lửa trồi lên (thay thế khối vuông)
            if (pipe.hasSquare && !pipe.isBottomDestroyed) {
                let fireW = 90; // Tăng kích thước lên 90x90
                let fireH = 90;
                let fireX = pipe.x + this.w / 2 - fireW / 2;
                // Đẩy Y lên tương ứng với phần tăng chiều cao 
                let fireY = bottomPipeY - pipe.squareOffsetY - 20;
                ctx.save();
                // Hoạt ảnh lửa (đổi frame mỗi 6 tick)
                let fireFrame = Math.floor(frame / 6) % 5;
                let currentFireImg = fireSprites[fireFrame];
                if (currentFireImg && (currentFireImg.complete || currentFireImg.tagName === 'CANVAS')) {
                    ctx.drawImage(currentFireImg, fireX, fireY, fireW, fireH);
                } else {
                    // Fallback màu đỏ nếu ảnh chưa load kịp
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(pipe.x + this.w / 2 - 20, bottomPipeY - pipe.squareOffsetY, 40, 40);
                }
                ctx.restore();
            }
            // Vẽ Trụ Đá Phía Dưới
            if (!pipe.isBottomDestroyed) {
                this.drawPillar(pipe.x, bottomPipeY, this.w, this.h, false);
            }
        }
    },
    drawPillar: function (x, y, w, h, isTop) {
        ctx.save();
        let baseColor = '#2C2C2C';
        let highlightColor = '#4A4A4A';
        let shadowColor = '#111111';
        let grad = ctx.createLinearGradient(x, y, x + w, y);
        grad.addColorStop(0, shadowColor);
        grad.addColorStop(0.2, baseColor);
        grad.addColorStop(0.5, highlightColor);
        grad.addColorStop(0.8, baseColor);
        grad.addColorStop(1, shadowColor);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        let fluteCount = 6;
        let fluteSpacing = w / fluteCount;
        for (let i = 1; i < fluteCount; i++) {
            let fx = x + i * fluteSpacing;
            // Đường tối (Shadow)
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.moveTo(fx - 1, y);
            ctx.lineTo(fx - 1, y + h);
            ctx.stroke();
            // Đường sáng (Highlight) - Tạo cạnh vát
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.moveTo(fx + 1, y);
            ctx.lineTo(fx + 1, y + h);
            ctx.stroke();
        }
        const drawPedestal = (cx, cy, isTopPart) => {
            let layers = [
                { w: w + 24, h: 12 }, // Lớp ngoài cùng
                { w: w + 12, h: 10 }, // Lớp giữa (Sẽ vẽ hoa văn ở đây)
                { w: w + 4, h: 8 }   // Lớp sát thân
            ];
            let currentY = cy;
            if (!isTopPart) {
                layers.reverse();
                currentY = cy - 30;
            }
            layers.forEach((layer, index) => {
                let lx = cx - layer.w / 2;
                let ly = currentY;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(lx + 2, ly + 2, layer.w, layer.h);
                let layerGrad = ctx.createLinearGradient(lx, ly, lx, ly + layer.h);
                layerGrad.addColorStop(0, '#444');
                layerGrad.addColorStop(1, '#222');
                ctx.fillStyle = layerGrad;
                ctx.fillRect(lx, ly, layer.w, layer.h);
                if ((isTopPart && index === 1) || (!isTopPart && index === 1)) {
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)'; // Vàng mờ cổ kính
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let px = lx + 5; px < lx + layer.w - 5; px += 10) {
                        ctx.moveTo(px, ly + 2);
                        ctx.lineTo(px + 6, ly + 2);
                        ctx.lineTo(px + 6, ly + 8);
                        ctx.lineTo(px + 2, ly + 8);
                        ctx.lineTo(px + 2, ly + 4);
                        ctx.lineTo(px + 4, ly + 4);
                    }
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(lx, ly + layer.h); ctx.lineTo(lx, ly); ctx.lineTo(lx + layer.w, ly);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.beginPath();
                ctx.moveTo(lx + layer.w, ly); ctx.lineTo(lx + layer.w, ly + layer.h); ctx.lineTo(lx, ly + layer.h);
                ctx.stroke();
                currentY += layer.h;
            });
        };
        if (isTop) {
            drawPedestal(x + w / 2, y + h, false);
        } else {
            drawPedestal(x + w / 2, y, true);
        }
        ctx.save();
        const drawAdvancedCrack = (sx, sy, length) => {
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            let curX = sx, curY = sy;
            for (let i = 0; i < 4; i++) {
                curX += (Math.random() * 15 - 7);
                curY += (length / 4);
                ctx.lineTo(curX, curY);
                if (Math.random() > 0.5) {
                    ctx.moveTo(curX, curY);
                    ctx.lineTo(curX + (Math.random() * 10 - 5), curY + 5);
                    ctx.moveTo(curX, curY);
                }
            }
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.stroke();
        };
        if (frame % 2 === 0) { // Giữ vết nứt ổn định qua các frame (không dùng Math.random trực tiếp mỗi lần render nếu không muốn rung)
            // Lưu ý: Trong game này draw() gọi mỗi frame, để vết nứt cố định ta có thể dùng seed dựa trên tọa độ x
            let seed = Math.floor(x);
            if (seed % 3 === 0) drawAdvancedCrack(x + 10, y + 100, 80);
            if (seed % 5 === 0) drawAdvancedCrack(x + w - 10, y + 200, 60);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 60; i++) {
            let px = x + Math.random() * w;
            let py = y + Math.random() * h;
            ctx.fillRect(px, py, 1.5, 1.5);
        }
        ctx.restore();
        ctx.restore();
    },
    position: function () {
        if (gameState.current !== gameState.play) {
            return
        }
        if (gameState.current == gameState.play) {
            if (frame % this.spawnInterval == 0) {
                this.totalSpawned++;
                let hasSquare = false;
                let isNarrowing = false;
                // Cạm bẫy tiến hóa theo điểm số (CHỈ xuất hiện ở Challenge)
                if (currentDifficulty === 'challenge') {
                    let level = Math.floor(score.current / 7); // Tăng cấp độ mỗi 7 điểm
                    // Xác suất tổng cạm bẫy (Tăng nhanh theo level)
                    let totalTrapProb = Math.min(0.4 + level * 0.2, 0.9);
                    // Bắt đầu xuất hiện cạm bẫy ngay sau cột thứ 2
                    if (this.totalSpawned > 2 && Math.random() < totalTrapProb) {
                        // Tần suất Lửa và Thu hẹp phải đều nhau (50/50)
                        if (Math.random() < 0.5) {
                            hasSquare = true;
                        } else {
                            isNarrowing = true;
                        }
                    }
                }
                let level = Math.floor(score.current / 7);
                let currentGap = this.gap - (level * 1.75); // Giảm 1.75 mỗi level
                this.pipeGenerator.push(
                    {
                        x: cvs.width,
                        y: Math.floor((Math.random() * (this.maxY - this.minY + 1)) + this.minY),
                        passed: false,
                        gap: currentGap, // Lưu gap riêng cho từng cột
                        hasSquare: hasSquare,
                        squareOffsetY: 0, // Ban đầu ẩn bên dưới
                        isNarrowing: isNarrowing,
                        gapModifier: isNarrowing ? -40 : 0 // Bẫy sập bắt đầu rộng hơn (giảm từ -80 xuống -40)
                    }
                )
            }
            for (let i = 0; i < this.pipeGenerator.length; i++) {
                let pg = this.pipeGenerator[i]
                let currentShrink = pg.gapModifier || 0;
                let topShrinkOffset = pg.topShrinkOffset || 0;
                let botShrinkOffset = pg.botShrinkOffset || 0;
                let p = {
                    top: {
                        x: pg.x,
                        y: pg.y + currentShrink / 2 - topShrinkOffset, // Cột trên xệ xuống (hoặc bị thu lên nếu dính kỹ năng)
                        w: this.w,
                        h: this.h
                    },
                    bot: {
                        x: pg.x,
                        y: pg.y + this.h + (pg.gap || this.gap) - currentShrink / 2 + botShrinkOffset, // Cột dưới nhô lên
                        w: this.w,
                        h: this.h
                    }
                }
                pg.x -= this.dx
                if (pg.isNarrowing) {
                    // CỘT KHÉP BẤT NGỜ: Chờ đến khi rồng bay sát (140px) mới sập nhanh
                    if (pg.x - dragon.x < 140 && pg.x - dragon.x > -this.w) {
                        if (pg.gapModifier < 40) {
                            pg.gapModifier += 6; // Tốc độ khép cực nhanh để tạo sự bất ngờ
                        }
                    } else if (pg.x - dragon.x <= -this.w) {
                        // Rồng qua rồi thì mở bẫy lại 
                        if (pg.gapModifier > -40) {
                            pg.gapModifier -= 3;
                        }
                    }
                }
                // CHƯỚNG NGẠI VẬT LỬA: Hoạt ảnh trồi lên
                if (pg.hasSquare && !pg.isFireShrunk) {
                    // Cố tình chờ rồng bay thật gần (cách < 100px) mới bất ngờ phun lên
                    if (pg.x - dragon.x < 100 && pg.x - dragon.x > -this.w) {
                        if (pg.squareOffsetY < 55) { // Trồi lên 55px
                            pg.squareOffsetY += 4; // Tốc độ trồi cực nhanh để tạo bất ngờ
                        }
                    } else if (pg.x - dragon.x <= -this.w) {
                        // Rút xuống nhanh nếu rồng đã qua
                        if (pg.squareOffsetY > 0) {
                            pg.squareOffsetY -= 3;
                        }
                    }
                }
                // Ghi nhận điểm số ngay khi con rồng vừa bay qua cột
                if (dragon.x > pg.x + this.w && !pg.passed) {
                    score.current++;
                    SFX_SCORE.play();
                    pg.passed = true;
                    // Tăng tốc độ game mỗi 25 điểm
                    if (score.current % 25 === 0) {
                        pipes.dx += 0.3; // Tăng tốc độ ống
                        ground.dx += 0.3; // Tăng tốc độ mặt đất
                        bg.dx += 0.05; // Tăng tốc độ nền
                    }
                    // Kích hoạt hiệu ứng Siêu cấp khi đạt mốc
                    let milestone = (currentDifficulty === 'challenge') ? 25 : (currentDifficulty === 'hard') ? 8 : 12;
                    if (score.current === milestone && !dragon.superTriggered) {
                        shakeTime = 30; // Rung trong 30 frame
                        dragon.superTriggered = true;
                        dragon.boneEffects.push({
                            type: 'text',
                            text: 'SUPER!',
                            color: '#FFD700',
                            x: dragon.x,
                            y: dragon.y - 80,
                            life: 100,
                            maxLife: 100
                        });
                        SFX_SWOOSH.play();
                    }
                }
                if (pg.x < -this.w) {
                    this.pipeGenerator.shift()
                }
                const circleRectIntersect = (cx, cy, radius, rx, ry, rw, rh) => {
                    let testX = cx;
                    let testY = cy;
                    // Tìm cạnh gần nhất của hình chữ nhật
                    if (cx < rx) testX = rx; // Cạnh trái
                    else if (cx > rx + rw) testX = rx + rw; // Cạnh phải
                    if (cy < ry) testY = ry; // Cạnh trên
                    else if (cy > ry + rh) testY = ry + rh; // Cạnh dưới
                    let distX = cx - testX;
                    let distY = cy - testY;
                    let distance = Math.sqrt((distX * distX) + (distY * distY));
                    return distance <= radius;
                };
                // Note: Rồng hitbox (Radius: 22px)
                let cx = dragon.x;
                let cy = dragon.y;
                let radius = 22;
                // COLLISION HANDLING
                // Note: Hitbox elip cho Thresh (Bone) - Tích tụ năng lượng khi chạm
                if (dragon.type === 'bone') {
                    let pulse = Math.sin(frame * 0.1) * 5;
                    let auraRadius = 50 + pulse;
                    let rxMultiplier = 1.25;
                    if (dragon.boneSkillActive === 'Q') rxMultiplier = 1.25 * 3.0;
                    else if (dragon.boneSkillActive === 'W') rxMultiplier = 1.25 * 2.0;
                    else if (dragon.boneEvolutionLevel > 0) rxMultiplier = 1.25 * 1.45;
                    let ryMultiplier = rxMultiplier * (0.81 / 1.25);
                    let rx = (auraRadius - 5) * rxMultiplier;
                    let ry = (auraRadius - 5) * ryMultiplier;
                    let ringLeft = cx - rx;
                    let ringRight = cx + rx;
                    let ringTop = cy - ry;
                    let ringBottom = cy + ry;
                    const rectIntersect = (r1L, r1R, r1T, r1B, r2L, r2R, r2T, r2B) => {
                        return !(r2L > r1R || r2R < r1L || r2T > r1B || r2B < r1T);
                    };
                    let hitFireNow = false;
                    let hitTopNow = false;
                    let hitBotNow = false;
                    if (pg.hasSquare && !pg.isBottomDestroyed) {
                        let hitboxSize = 30;
                        let hitX = p.bot.x + this.w / 2 - hitboxSize / 2;
                        let hitY = p.bot.y - pg.squareOffsetY + 15;
                        if (rectIntersect(ringLeft, ringRight, ringTop, ringBottom, hitX, hitX + hitboxSize, hitY, hitY + hitboxSize)) {
                            hitFireNow = true;
                        }
                    }
                    if (!pg.isTopDestroyed && rectIntersect(ringLeft, ringRight, ringTop, ringBottom, p.top.x, p.top.x + p.top.w, p.top.y, p.top.y + p.top.h)) {
                        hitTopNow = true;
                    }
                    if (!pg.isBottomDestroyed && rectIntersect(ringLeft, ringRight, ringTop, ringBottom, p.bot.x, p.bot.x + p.bot.w, p.bot.y, p.bot.y + p.bot.h)) {
                        hitBotNow = true;
                    }
                    if (dragon.boneSkillActive === 'Q') {
                        if (hitFireNow && pg.hasSquare) {
                            pg.hasSquare = false;
                            dragon.boneEffects.push({ type: 'destroy', x: p.bot.x + this.w / 2, y: p.bot.y - pg.squareOffsetY + 15, life: 20, maxLife: 20 });
                            SFX_COLLISION.play();
                        }
                        if (hitTopNow && !pg.isTopDestroyed) {
                            pg.isTopDestroyed = true;
                            dragon.boneEffects.push({ type: 'destroy', x: pg.x + this.w / 2, y: p.top.y + p.top.h, life: 20, maxLife: 20 });
                            SFX_COLLISION.play();
                        }
                        if (hitBotNow && !pg.isBottomDestroyed) {
                            pg.isBottomDestroyed = true; pg.hasSquare = false;
                            dragon.boneEffects.push({ type: 'destroy', x: pg.x + this.w / 2, y: p.bot.y, life: 20, maxLife: 20 });
                            SFX_COLLISION.play();
                        }
                    } else if (dragon.boneSkillActive === 'W') {
                        if (hitFireNow && !pg.isFireShrunk) {
                            pg.isFireShrunk = true; pg.squareOffsetY = -100;
                            dragon.boneEffects.push({ type: 'shrink', x: p.bot.x + this.w / 2, y: p.bot.y + 15, life: 20, maxLife: 20 });
                        }
                        if (hitTopNow && !pg.isTopShrunk) {
                            pg.isTopShrunk = true; pg.topShrinkOffset = 80; p.top.y -= 80;
                            dragon.boneEffects.push({ type: 'shrink', x: pg.x + this.w / 2, y: p.top.y + p.top.h + 80, life: 20, maxLife: 20 });
                        }
                        if (hitBotNow && !pg.isBottomShrunk) {
                            pg.isBottomShrunk = true; pg.botShrinkOffset = 80; p.bot.y += 80;
                            dragon.boneEffects.push({ type: 'shrink', x: pg.x + this.w / 2, y: p.bot.y - 80, life: 20, maxLife: 20 });
                        }
                    } else {
                        // Trạng thái bình thường hoặc chỉ dùng E: Tích năng lượng
                        if (hitFireNow && !pg.boneAbsorbedFire) { pg.boneAbsorbedFire = true; dragon.boneEnergy += 2; }
                        if (hitTopNow && !pg.boneAbsorbedTop) { pg.boneAbsorbedTop = true; dragon.boneEnergy += 1; }
                        if (hitBotNow && !pg.boneAbsorbedBottom) { pg.boneAbsorbedBottom = true; dragon.boneEnergy += 1; }
                    }
                }
                if (dragon.invincible <= 0) {
                    let collided = false;
                    // Check collision with top pipe
                    if (!pg.isTopDestroyed && circleRectIntersect(cx, cy, radius, p.top.x, p.top.y, p.top.w, p.top.h)) {
                        collided = true;
                    }
                    // Check collision with bottom pipe
                    if (!collided && !pg.isBottomDestroyed && circleRectIntersect(cx, cy, radius, p.bot.x, p.bot.y, p.bot.w, p.bot.h)) {
                        collided = true;
                    }
                    // Check collision with fire
                    if (!collided && pg.hasSquare && !pg.isBottomDestroyed) {
                        let hitboxSize = 30;
                        let hitX = p.bot.x + this.w / 2 - hitboxSize / 2;
                        let hitY = p.bot.y - pg.squareOffsetY + 15;
                        if (circleRectIntersect(cx, cy, radius, hitX, hitY, hitboxSize, hitboxSize)) {
                            collided = true;
                        }
                    }
                    if (collided) {
                        if (dragon.hasAuraShield) {
                            dragon.hasAuraShield = false;
                            dragon.invincible = 100; // Tăng thời gian bất tử để đủ thời gian bay qua cột
                            dragon.velocity = -dragon.fly * 0.4; // Nảy nhẹ để dễ dàng bay xuyên qua cột
                            SFX_SWOOSH.play(); // Âm thanh báo hiệu dùng lá chắn
                        } else {
                            gameState.current = gameState.gameOver;
                            SFX_COLLISION.play();
                        }
                    }
                }
            }
        }
    }
}
ground = {
    imgX: 276,
    imgY: 0,
    width: 224,
    height: 112,
    x: 0,
    y: cvs.height - 112,
    w: 224,
    h: 112,
    dx: 2,
    render: function () {
        const drawDesertPatch = (offsetX) => {
            ctx.save();
            ctx.translate(offsetX, this.y);
            let grad = ctx.createLinearGradient(0, 0, 0, this.h);
            grad.addColorStop(0, '#d4a338');
            grad.addColorStop(1, '#7a5a1a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 2;
            for (let i = 25; i < this.h; i += 35) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                for (let j = 0; j < this.w; j += 32) {
                    ctx.quadraticCurveTo(j + 16, i - 5, j + 32, i);
                }
                ctx.stroke();
            }
            const drawDetailedGrass = (gx, gy, scale, seed) => {
                ctx.save();
                ctx.translate(gx, gy);
                ctx.scale(scale, scale);
                const bladeCount = 20;
                const sway = Math.sin(frame * 0.05 + seed) * 5;
                // Bóng đổ dưới gốc bụi cỏ
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                for (let i = 0; i < bladeCount; i++) {
                    ctx.beginPath();
                    let angleIdx = (i / bladeCount) * Math.PI - Math.PI / 2;
                    let length = 20 + (i % 7) * 4;
                    let startX = (i - bladeCount / 2) * 1.5;
                    // Tạo gốc cỏ màu đậm hơn
                    let baseColor = `hsl(40, 40%, 15%)`; // Màu nâu đất cho gốc
                    let tipColor = `hsl(70, ${30 + (i % 5) * 5}%, ${25 + (i % 3) * 10}%)`;
                    let grad = ctx.createLinearGradient(startX, 0, startX, -length);
                    grad.addColorStop(0, baseColor);
                    grad.addColorStop(0.2, tipColor);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 2.0 - (i / bladeCount); // Gốc dày hơn
                    ctx.moveTo(startX, 0);
                    let cpX = startX + Math.sin(angleIdx) * 15 + sway;
                    let cpY = -length * 0.7;
                    let endX = startX + Math.sin(angleIdx) * 30 + sway * 1.5;
                    let endY = -length;
                    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                    ctx.stroke();
                    // Gốc cỏ (Root dot) - Giúp lá cỏ bám chắc vào đất
                    ctx.fillStyle = baseColor;
                    ctx.fillRect(startX - 0.5, -1, 1.5, 2);
                }
                ctx.restore();
            };
            // Vẽ các bụi cỏ ở phần đất phía dưới (giảm bớt ở phía trên)
            drawDetailedGrass(40, 50, 0.5, 0.5);
            drawDetailedGrass(120, 85, 0.4, 1.2);
            drawDetailedGrass(190, 65, 0.6, 2.0);
            if (!this.sandParticles) {
                this.sandParticles = [];
                for (let i = 0; i < 40; i++) {
                    this.sandParticles.push({
                        x: Math.random() * this.w,
                        y: Math.random() * this.h,
                        s: Math.random() * 3 + 2, // Tốc độ bay
                        o: Math.random() * 0.5 + 0.1 // Độ trong suốt
                    });
                }
            }
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let p of this.sandParticles) {
                // Di chuyển hạt cát độc lập với nền để tạo hiệu ứng gió thổi
                p.x -= p.s;
                if (p.x < 0) p.x = this.w;
                ctx.globalAlpha = p.o;
                ctx.fillRect(p.x, p.y, 1.5, 1.5);
            }
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, this.w, 3);
            ctx.restore();
        };
        // Vẽ đủ số mảnh để bao phủ bề ngang canvas (cvs.width=450, this.w=224 => cần 3 mảnh)
        drawDesertPatch(this.x);
        drawDesertPatch(this.x + this.w);
        drawDesertPatch(this.x + this.w * 2);
    },
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0
        }
        if (gameState.current == gameState.play) {
            // Sử dụng % this.w để khớp với chiều rộng mảnh đất mới
            this.x = (this.x - this.dx) % this.w;
        }
    }
}
map = [
    num0 = {
        imgX: 496,
        imgY: 60,
        width: 12,
        height: 18
    },
    num1 = {
        imgX: 135,
        imgY: 455,
        width: 10,
        height: 18
    },
    num2 = {
        imgX: 292,
        imgY: 160,
        width: 12,
        height: 18
    },
    num3 = {
        imgX: 306,
        imgY: 160,
        width: 12,
        height: 18
    },
    num4 = {
        imgX: 320,
        imgY: 160,
        width: 12,
        height: 18
    },
    num5 = {
        imgX: 334,
        imgY: 160,
        width: 12,
        height: 18
    },
    num6 = {
        imgX: 292,
        imgY: 184,
        width: 12,
        height: 18
    },
    num7 = {
        imgX: 306,
        imgY: 184,
        width: 12,
        height: 18
    },
    num8 = {
        imgX: 320,
        imgY: 184,
        width: 12,
        height: 18
    },
    num9 = {
        imgX: 334,
        imgY: 184,
        width: 12,
        height: 18
    }
]
score = {
    current: 0,
    best: parseInt(localStorage.getItem('bestScore')) || 0,
    x: cvs.width / 2,
    y: 80, // Di chuyển điểm số chính xuống thêm nữa
    w: 15,
    h: 25,
    reset: function () {
        this.current = 0
    },
    updateBest: function () {
        if (this.current > this.best) {
            this.best = this.current;
            localStorage.setItem('bestScore_' + currentDifficulty, this.best);
        }
    },
    render: function () {
        if (gameState.current == gameState.play) {
            ctx.save();
            ctx.fillStyle = "#FFF";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.font = "45px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            // Vẽ bóng đổ (shadow)
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            // Vẽ viền đen
            ctx.strokeText(this.current, this.x, this.y);
            // Vẽ chữ trắng chính
            ctx.fillText(this.current, this.x, this.y);
            ctx.restore();
        }
    }
}
// Trang trí nền: Sao băng và Rồng
const skyDecorations = {
    stars: [],
    birds: [],
    staticStars: [], // Các ngôi sao lấp lánh tĩnh
    update: function () {
        if (this.staticStars.length === 0) {
            for (let i = 0; i < 50; i++) {
                this.staticStars.push({
                    x: Math.random() * cvs.width,
                    y: Math.random() * 250, // Chỉ ở nửa trên bầu trời (vùng tối)
                    size: Math.random() * 1.5 + 0.5,
                    opacity: Math.random(),
                    twinkleSpeed: Math.random() * 0.02 + 0.005
                });
            }
        }
        for (let s of this.staticStars) {
            s.opacity += s.twinkleSpeed;
            if (s.opacity > 1 || s.opacity < 0.1) s.twinkleSpeed = -s.twinkleSpeed;
        }
        // Spawn shooting stars (hiếm hơn)
        if (frame % 300 === 0 && Math.random() > 0.6) {
            this.stars.push({
                x: Math.random() * cvs.width + 100,
                y: -50,
                length: Math.random() * 60 + 40,
                speed: Math.random() * 8 + 6,
                opacity: 1
            });
        }
        // Update stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            let s = this.stars[i];
            s.x -= s.speed;
            s.y += s.speed;
            s.opacity -= 0.015;
            if (s.opacity <= 0 || s.x < -100 || s.y > cvs.height) this.stars.splice(i, 1);
        }
        // Spawn birds (xa xa) - Tăng mật độ rồng dày đặc hơn
        if (frame % 60 === 0 && Math.random() > 0.3) {
            this.birds.push({
                x: cvs.width + 50,
                y: Math.random() * 300 + 50,
                speed: Math.random() * 1.5 + 0.8,
                wingPhase: Math.random() * Math.PI * 2,
                size: Math.random() * 6 + 6
            });
        }
        // Update birds
        for (let i = this.birds.length - 1; i >= 0; i--) {
            let b = this.birds[i];
            b.x -= b.speed;
            b.wingPhase += 0.2; // Vỗ cánh nhanh hơn
            if (b.x < -100) this.birds.splice(i, 1);
        }
    },
    render: function () {
        // Draw Static Stars (Lấp lánh)
        ctx.save();
        for (let s of this.staticStars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        // Draw Shooting Stars
        ctx.save();
        ctx.lineWidth = 2;
        for (let s of this.stars) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + s.length, s.y - s.length);
            ctx.stroke();
        }
        ctx.restore();
        // Draw Birds (V-shape)
        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1.5;
        for (let b of this.birds) {
            // Tăng biên độ lướt
            let wingY = Math.sin(b.wingPhase) * b.size;
            ctx.beginPath();
            ctx.moveTo(b.x - b.size, b.y + wingY);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(b.x + b.size, b.y + wingY);
            ctx.stroke();
        }
        ctx.restore();
    }
}
let dragonSprites = {
    red: [],
    bone: []
};
function processTransparency(img, skinName) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let context = canvas.getContext('2d', { willReadFrequently: true });
    if (skinName === 'dark') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }
    context.drawImage(img, 0, 0);
    try {
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            let isWhite = (r > 240 && g > 240 && b > 240);
            // Cẩn thận không xóa nhầm xương rồng (thường có sắc vàng/nâu nhẹ)
            let isGray = (Math.abs(r - g) < 8 && Math.abs(g - b) < 8 && r > 180 && r < 230);
            if (isWhite || isGray) {
                data[i + 3] = 0;
            }
        }
        let alphaData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i++) alphaData[i] = data[i];
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        for (let y = 2; y < canvas.height - 2; y++) {
            for (let x = 2; x < canvas.width - 2; x++) {
                let j = (y * canvas.width + x) * 4;
                if (data[j + 3] > 0) {
                    let isEdge = false;
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (dx * dx + dy * dy <= 4) {
                                let nj = ((y + dy) * canvas.width + (x + dx)) * 4;
                                if (alphaData[nj + 3] === 0) {
                                    isEdge = true;
                                    break;
                                }
                            }
                        }
                        if (isEdge) break;
                    }
                    if (isEdge) {
                        data[j + 3] = 0;
                    } else {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
        }
        context.putImageData(imageData, 0, 0);
        if (maxX >= minX && maxY >= minY) {
            let cropW = maxX - minX + 1;
            let cropH = maxY - minY + 1;
            let cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            cropCanvas.getContext('2d').drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
            let snoutYSum = 0, snoutCount = 0;
            for (let y = minY; y <= maxY; y++) {
                for (let x = maxX - 10; x <= maxX; x++) {
                    let j = (y * canvas.width + x) * 4;
                    if (data[j + 3] > 0) {
                        snoutYSum += y;
                        snoutCount++;
                    }
                }
            }
            if (snoutCount > 0) {
                cropCanvas.cx = maxX - 5 - minX;
                cropCanvas.cy = (snoutYSum / snoutCount) - minY;
                cropCanvas.relCx = cropCanvas.cx / cropW;
                cropCanvas.relCy = cropCanvas.cy / cropH;
            } else {
                cropCanvas.relCx = 0.5;
                cropCanvas.relCy = 0.5;
            }
            return cropCanvas;
        }
        return canvas;
    } catch (e) {
        return img;
    }
}
function initializeDragonSprites(callback) {
    const skinsToLoad = {
        red: [
            'img/Ảnh chụp màn hình 2026-05-01 103507.png',
            'img/Ảnh chụp màn hình 2026-05-01 103758.png',
            'img/Ảnh chụp màn hình 2026-05-01 103801.png',
            'img/Ảnh chụp màn hình 2026-05-01 103805.png',
            'img/Ảnh chụp màn hình 2026-05-01 103812.png',
            'img/Ảnh chụp màn hình 2026-05-01 103815.png',
            'img/Ảnh chụp màn hình 2026-05-01 103823.png',
            'img/Ảnh chụp màn hình 2026-05-01 103827.png',
            'img/Ảnh chụp màn hình 2026-05-01 103830.png'
        ],
        bone: [
            'img/bone-0.png',
            'img/bone-1.png',
            'img/bone-2.png',
            'img/bone-3.png',
            'img/bone-4.png',
            'img/bone-5.png',
            'img/bone-6.png'
        ],
        dark: [
            'img/dark-0.png',
            'img/dark-1.png',
            'img/dark-2.png',
            'img/dark-3.png',
            'img/dark-4.png'
        ]
    };
    let skinTypes = Object.keys(skinsToLoad);
    let skinsRemaining = skinTypes.length;
    skinTypes.forEach(skinName => {
        let paths = skinsToLoad[skinName];
        let loadedCount = 0;
        let buffer = [];
        paths.forEach((path, i) => {
            let img = new Image();
            img.onload = () => {
                buffer[i] = processTransparency(img, skinName);
                loadedCount++;
                if (loadedCount === paths.length) {
                    // Xử lý các khung hình hợp lệ
                    let sumW = 0, validCount = 0;
                    buffer.forEach(b => { if (b && b.width > 10) { sumW += b.width; validCount++; } });
                    let avgW = validCount > 0 ? sumW / validCount : 0;
                    dragonSprites[skinName] = buffer.filter(b => b && b.width > 10 && Math.abs(b.width - avgW) < avgW * 0.5);
                    // Cập nhật UI Preview cho từng loại rồng
                    if (dragonSprites[skinName].length > 0) {
                        const previewEl = document.querySelector(`.char-preview.${skinName}`);
                        if (previewEl) {
                            previewEl.style.backgroundImage = `url(${dragonSprites[skinName][0].toDataURL()})`;
                        }
                        // Đặc biệt cho Blue/Black/Green: dùng chung ảnh gốc nhưng áp filter (đã có trong CSS)
                        if (skinName === 'red') {
                            const dataUrl = dragonSprites['red'][0].toDataURL();
                            document.querySelector('.char-preview.blue').style.backgroundImage = `url(${dataUrl})`;
                            document.querySelector('.char-preview.black').style.backgroundImage = `url(${dataUrl})`;
                        }
                        if (skinName === 'dark') {
                            const dataUrl = dragonSprites['dark'][0].toDataURL();
                            const greenPreview = document.querySelector('.char-preview.green');
                            if (greenPreview) greenPreview.style.backgroundImage = `url(${dataUrl})`;
                        }
                    }
                    skinsRemaining--;
                    if (skinsRemaining === 0 && callback) {
                        // Tất cả các skin đã được xử lý
                        // Khởi tạo hoạt ảnh đầu tiên cho rồng
                        if (dragonSprites.red.length > 0) {
                            dragon.animation = dragonSprites.red.length >= 5 ? [0, 1, 2, 3, 4] : Array.from({ length: dragonSprites.red.length }, (_, i) => i);
                        }
                        callback();
                    }
                }
            };
            img.onerror = () => {
                console.error("Failed to load:", path);
                loadedCount++;
                if (loadedCount === paths.length) {
                    skinsRemaining--;
                    if (skinsRemaining === 0 && callback) callback();
                }
            };
            img.src = path;
        });
    });
}
// ==========================================
// LOGIC NHÂN VẬT & KỸ NĂNG (BIRD)
// ==========================================
dragon = {
    animation: [0], // Sẽ được tự động đắp mảng khi lọc frame xong
    fr: 0,
    x: cvs.width * 0.25,
    y: 160,
    width: 65,
    height: 65,
    fly: 6.2,
    gravity: .32,
    velocity: 0,
    rotation: 0,
    type: 'red', // Default skin
    trail: [],
    maxTrailLength: 35, // Tăng độ dài dải băng
    hasAuraShield: false,
    invincible: 0,
    shieldCooldown: 0,
    maxShieldCooldown: 960, // 16 giây (60fps * 16)
    lastScore: 0,
    blastCount: 1,
    boneEnergy: 0,
    boneEvolutionLevel: 0,
    boneSkillActive: null,
    boneSkillTimer: 0,
    usedW: false,
    usedQ: false,
    boneEffects: [],
    lastBlastScore: 0,
    blasts: [],
    drawTrail: function () {
        let isGreen = this.type === 'green';
        if (this.hasAuraShield || this.type === 'green' || this.type === 'bone') {
            ctx.save();
            ctx.translate(this.x, this.y);
            let pulse = Math.sin(frame * 0.1) * 5;
            let auraRadius = 50 + pulse;
            let isGreen = this.type === 'green';
            let isBone = this.type === 'bone';
            let auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRadius);
            if (isGreen) {
                auraGrad.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
                auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else if (isBone) {
                auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.55)');   // Vàng rực ở tâm
                auraGrad.addColorStop(0.4, 'rgba(255, 165, 0, 0.3)');    // Cam vàng giữa
                auraGrad.addColorStop(0.8, 'rgba(180, 110, 0, 0.1)');    // Vàng đậm nhạt dần
                auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');          // Trong suốt ở rìa
            } else {
                auraGrad.addColorStop(0, 'rgba(191, 0, 255, 0.5)');
                auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            if (isBone) {
                // Vẽ Elip cho Bone
                ctx.ellipse(0, 0, auraRadius * 1.2, auraRadius * 0.8, 0, 0, Math.PI * 2);
            } else {
                ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
            }
            ctx.fill();
            if (isGreen || this.type === 'dark') {
                // (Logic tia sáng hiện có)
                let rayCount = 20;
                let rotation = frame * 0.02;
                for (let i = 0; i < rayCount; i++) {
                    let angle = (i / rayCount) * Math.PI * 2 + frame * 0.03;
                    let cloverR = Math.abs(Math.sin(2 * (angle - rotation))) * (auraRadius * 1.3);
                    let endX = Math.cos(angle) * cloverR;
                    let endY = Math.sin(angle) * cloverR;
                    let rayGrad = ctx.createLinearGradient(0, 0, endX, endY);
                    if (isGreen) {
                        rayGrad.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
                        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    } else {
                        rayGrad.addColorStop(0, 'rgba(224, 102, 255, 0.4)');
                        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    }
                    ctx.strokeStyle = rayGrad;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            ctx.strokeStyle = isGreen ? 'rgba(255, 255, 150, 0.4)' : (isBone ? 'rgba(180, 180, 180, 0.7)' : 'rgba(255, 150, 255, 0.4)');
            ctx.lineWidth = isBone ? 3.5 : 2;
            ctx.shadowBlur = isBone ? 12 : 8;
            ctx.shadowColor = isGreen ? '#ffff00' : (isBone ? '#ffffff' : '#ff00ff');
            if (isBone) {
                if (this.boneSkillActive === 'Q') {
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'; // Đỏ rực rỡ hơn
                    ctx.shadowBlur = 45; // Tăng sáng cực mạnh
                    ctx.shadowColor = '#ff0000';
                    ctx.lineWidth = 5;
                } else if (this.boneSkillActive === 'W') {
                    ctx.strokeStyle = 'rgba(100, 220, 255, 0.9)'; // Xanh lam sáng hơn
                    ctx.shadowBlur = 35; // Tăng sáng mạnh
                    ctx.shadowColor = '#00ccff';
                    ctx.lineWidth = 4;
                } else if (this.boneEvolutionLevel > 0) {
                    ctx.strokeStyle = 'rgba(220, 220, 220, 0.8)'; // Rất sáng
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ffffff';
                    ctx.lineWidth = 4.5;
                }
            }
            ctx.beginPath();
            if (isGreen) {
                ctx.setLineDash([]);
                let rotation = frame * 0.02;
                let baseR = auraRadius - 15;
                let bump = 12;
                for (let i = 0; i <= Math.PI * 2 + 0.1; i += 0.05) {
                    let r = baseR + bump * Math.abs(Math.sin(2 * i));
                    let x = Math.cos(i + rotation) * r;
                    let y = Math.sin(i + rotation) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
            } else if (isBone) {
                let rxMultiplier = 1.25;
                if (this.boneSkillActive === 'Q') rxMultiplier = 1.25 * 3.0;
                else if (this.boneSkillActive === 'W') rxMultiplier = 1.25 * 2.0;
                else if (this.boneEvolutionLevel > 0) rxMultiplier = 1.25 * 1.45;
                let ryMultiplier = rxMultiplier * (0.81 / 1.25);
                // Vòng 1 - Nửa sau ("phía sau" rồng): Vẽ từ π → 2π (nửa trên màn hình)
                ctx.setLineDash([5, 10]);
                ctx.beginPath();
                ctx.ellipse(0, 0, (auraRadius - 5) * rxMultiplier, (auraRadius - 5) * ryMultiplier, frame * 0.02, Math.PI, Math.PI * 2);
                ctx.stroke();
                // Vòng 2 - Nửa sau nhiều hơn (nét liền xoay ngược)
                ctx.beginPath();
                ctx.setLineDash([]);
                ctx.ellipse(0, 0, (auraRadius - 12) * rxMultiplier, (auraRadius - 12) * ryMultiplier, -frame * 0.02, Math.PI, Math.PI * 2);
                ctx.stroke();
                // Hiệu ứng ánh sao đen lấp lánh (phía sau)
                if (this.boneSkillActive === 'W' || this.boneSkillActive === 'Q') {
                    ctx.setLineDash([]);
                    for (let i = 0; i < 14; i++) {
                        let angle = (i * Math.PI * 2 / 14) + frame * 0.08;
                        let normA = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                        if (normA >= Math.PI && normA <= Math.PI * 2) {
                            let starX = Math.cos(angle) * (auraRadius - 8) * rxMultiplier;
                            let starY = Math.sin(angle) * (auraRadius - 8) * ryMultiplier;
                            ctx.fillStyle = '#000';
                            ctx.shadowBlur = 15;
                            ctx.shadowColor = '#000';
                            let size = 2 + Math.sin(frame * 0.3 + i) * 1.5;
                            ctx.beginPath();
                            ctx.arc(starX, starY, size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            } else {
                ctx.setLineDash([10, 5]);
                ctx.arc(0, 0, auraRadius - 5, frame * 0.02, frame * 0.02 + Math.PI * 2);
            }
            ctx.stroke();
            // Hiệu ứng ánh sao lấp lánh xoay quanh Aura (Dành cho trạng thái Siêu cấp)
            let milestone = (currentDifficulty === 'challenge') ? 25 : (currentDifficulty === 'hard') ? 8 : 12;
            let isSuper = score.current >= milestone;
            if (isSuper) {
                let rxMultiplier = isBone ? 1.25 : 1.0;
                if (isBone) {
                    if (this.boneSkillActive === 'Q') rxMultiplier = 1.25 * 3.0;
                    else if (this.boneSkillActive === 'W') rxMultiplier = 1.25 * 2.0;
                    else if (this.boneEvolutionLevel > 0) rxMultiplier = 1.25 * 1.45;
                }
                let ryMultiplier = isBone ? rxMultiplier * (0.81 / 1.25) : 1.0;
                ctx.setLineDash([]);
                let isSpecial = this.type === 'green' || this.type === 'dark';
                let starCount = isBone ? 4 : (isSpecial ? 32 : 16);
                for (let i = 0; i < starCount; i++) {
                    let angle = (i * Math.PI * 2 / starCount) + frame * 0.05;
                    let starX, starY;
                    if (isGreen) {
                        let baseR = auraRadius - 15;
                        let bump = 12;
                        let r = baseR + bump * Math.abs(Math.sin(2 * angle));
                        starX = Math.cos(angle + frame * 0.02) * r;
                        starY = Math.sin(angle + frame * 0.02) * r;
                    } else {
                        starX = Math.cos(angle) * (auraRadius - 8) * rxMultiplier;
                        starY = Math.sin(angle) * (auraRadius - 8) * ryMultiplier;
                    }
                    let sColor = `hsl(${(frame * 5 + i * 40) % 360}, 100%, 75%)`;
                    ctx.fillStyle = sColor;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = sColor;
                    // Vẽ ngôi sao nhỏ
                    let size = 3 + Math.sin(frame * 0.2 + i) * 2;
                    ctx.beginPath();
                    for (let j = 0; j < 4; j++) {
                        let a = j * Math.PI / 2;
                        ctx.lineTo(starX + Math.cos(a) * size, starY + Math.sin(a) * size);
                        ctx.lineTo(starX + Math.cos(a + Math.PI / 4) * (size / 3), starY + Math.sin(a + Math.PI / 4) * (size / 3));
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    },
    drawFrontRing: function () {
        // Vẽ phần phía TRƯỚC rồng của vòng elip (góc 0 → π = nửa dưới màn hình)
        ctx.save();
        ctx.translate(this.x, this.y);
        let pulse = Math.sin(frame * 0.1) * 5;
        let auraRadius = 50 + pulse;
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.7)';
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        if (this.boneSkillActive === 'Q') {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
            ctx.shadowBlur = 45;
            ctx.shadowColor = '#ff0000';
            ctx.lineWidth = 5;
        } else if (this.boneSkillActive === 'W') {
            ctx.strokeStyle = 'rgba(100, 220, 255, 0.9)';
            ctx.shadowBlur = 35;
            ctx.shadowColor = '#00ccff';
            ctx.lineWidth = 4;
        } else if (this.boneEvolutionLevel > 0) {
            ctx.strokeStyle = 'rgba(220, 220, 220, 0.8)';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
            ctx.lineWidth = 4.5;
        }
        let rxMultiplier = 1.25;
        if (this.boneSkillActive === 'Q') rxMultiplier = 1.25 * 3.0;
        else if (this.boneSkillActive === 'W') rxMultiplier = 1.25 * 2.0;
        else if (this.boneEvolutionLevel > 0) rxMultiplier = 1.25 * 1.45;
        let ryMultiplier = rxMultiplier * (0.81 / 1.25);
        // Vòng 1 phía trước: nét đứt
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.ellipse(0, 0, (auraRadius - 5) * rxMultiplier, (auraRadius - 5) * ryMultiplier, frame * 0.02, 0, Math.PI);
        ctx.stroke();
        // Vòng 2 phía trước: nét liền xoay ngược
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(0, 0, (auraRadius - 12) * rxMultiplier, (auraRadius - 12) * ryMultiplier, -frame * 0.02, 0, Math.PI);
        ctx.stroke();
        // Hiệu ứng ánh sao đen lấp lánh (phía trước)
        if (this.boneSkillActive === 'W' || this.boneSkillActive === 'Q') {
            ctx.setLineDash([]);
            for (let i = 0; i < 14; i++) {
                let angle = (i * Math.PI * 2 / 14) + frame * 0.08;
                let normA = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                if (normA >= 0 && normA <= Math.PI) {
                    let starX = Math.cos(angle) * (auraRadius - 8) * rxMultiplier;
                    let starY = Math.sin(angle) * (auraRadius - 8) * ryMultiplier;
                    ctx.fillStyle = '#000';
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#000';
                    let size = 2 + Math.sin(frame * 0.3 + i) * 1.5;
                    ctx.beginPath();
                    ctx.arc(starX, starY, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    },
    drawTrailRibbon: function () {
        // 2. Vẽ dải băng đa tầng (Dải băng vẫn luôn tồn tại)
        if (this.trail.length < 2) return;
        ctx.save();
        for (let i = 0; i < this.trail.length - 1; i++) {
            let p1 = this.trail[i];
            let p2 = this.trail[i + 1];
            let ratio = i / this.trail.length;
            let opacity = (1 - ratio);
            let width = 40 * (1 - ratio);
            let sColor, sStroke, innerStroke;
            if (this.type === 'green') {
                sColor = 'rgba(218, 165, 32, 0.9)';
                sStroke = `rgba(184, 134, 11, ${opacity * 0.4})`;
                innerStroke = `rgba(255, 255, 150, ${opacity * 0.7})`;
            } else if (this.type === 'dark') {
                sColor = 'rgba(157, 80, 187, 0.9)';
                sStroke = `rgba(106, 13, 173, ${opacity * 0.4})`;
                innerStroke = `rgba(255, 150, 255, ${opacity * 0.7})`;
            } else if (this.type === 'bone') {
                sColor = 'rgba(150, 150, 150, 0.9)';
                sStroke = `rgba(100, 100, 100, ${opacity * 0.4})`;
                innerStroke = `rgba(220, 220, 220, ${opacity * 0.7})`;
            } else {
                continue; // Không vẽ trail cho các loại rồng thường
            }
            ctx.shadowBlur = 25;
            ctx.shadowColor = sColor;
            ctx.strokeStyle = sStroke;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.type === 'bone' ? 'rgba(0,0,0,0.5)' : '#fff';
            ctx.strokeStyle = innerStroke;
            ctx.lineWidth = width * 0.3;
            ctx.stroke();
            // Thêm chấm đen riêng cho Thresh (Bone) - Nhỏ dần và ít dần về phía đuôi
            if (this.type === 'bone' && Math.random() > (0.4 + ratio * 0.5)) {
                ctx.fillStyle = "#000";
                ctx.shadowBlur = 0;
                // Kích thước nhỏ dần theo tỉ lệ đuôi (đã tăng nhẹ kích cỡ)
                let dotSize = (1.0 + Math.random() * 2.5) * (1 - ratio);
                let offsetX = (Math.random() - 0.5) * (20 * (1 - ratio));
                let offsetY = (Math.random() - 0.5) * (20 * (1 - ratio));
                ctx.beginPath();
                ctx.arc(p1.x + offsetX, p1.y + offsetY, dotSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();
    },
    drawBlasts: function () {
        for (let b of this.blasts) {
            ctx.save();
            ctx.translate(b.x, b.y);
            // 1. Quầng sáng rực rỡ bên ngoài (Aura)
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#00ff88";
            // 2. Vẽ các tia lửa/năng lượng xoáy (Swirling energy)
            for (let i = 0; i < 12; i++) {
                ctx.save();
                ctx.rotate(frame * 0.15 + i * (Math.PI * 2 / 12));
                let wispLen = 15 + Math.sin(frame * 0.2 + i) * 10;
                let wispWidth = 4 + Math.random() * 4;
                let gradWisp = ctx.createLinearGradient(0, 0, wispLen, 0);
                gradWisp.addColorStop(0, "#00ffcc");
                gradWisp.addColorStop(0.5, "rgba(0, 255, 100, 0.4)");
                gradWisp.addColorStop(1, "transparent");
                ctx.fillStyle = gradWisp;
                ctx.beginPath();
                // Vẽ hình dạng giống ngọn lửa xoáy
                ctx.moveTo(10, -wispWidth / 2);
                ctx.quadraticCurveTo(10 + wispLen, 0, 10, wispWidth / 2);
                ctx.fill();
                ctx.restore();
            }
            // 3. Lõi năng lượng (Core)
            let gradCore = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            gradCore.addColorStop(0, "#fff");       // Tâm trắng rực
            gradCore.addColorStop(0.3, "#aaffcc");  // Xanh nhạt
            gradCore.addColorStop(0.7, "#00ff88");  // Xanh lục rực rỡ
            gradCore.addColorStop(1, "transparent");
            ctx.fillStyle = gradCore;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            // 4. Các hạt năng lượng nhỏ (Sparks)
            for (let i = 0; i < 6; i++) {
                let sparkAngle = Math.random() * Math.PI * 2;
                let sparkDist = 15 + Math.random() * 20;
                let sparkSize = 1 + Math.random() * 2;
                ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#00ffcc";
                ctx.beginPath();
                ctx.arc(Math.cos(sparkAngle) * sparkDist, Math.sin(sparkAngle) * sparkDist, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    },
    drawBoneEnergy: function () {
        if (this.type !== 'bone' || gameState.current !== gameState.play) return;
        ctx.save();
        let w = 130; // Tăng chiều dài khung
        let h = 45;  // Tăng chiều cao khung
        let x = cvs.width - w - 20;
        let y = cvs.height - 80;
        // 1. Vẽ khung nền Capsule Glassmorphism (Tone xám vàng)
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        let r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 2. Vẽ biểu tượng E (Energy)
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px 'Be Vietnam Pro'"; // Phóng to chữ E
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        // Căn giữa biểu tượng E theo chiều dọc khung mới (45 - 24 = 21 -> y + 10.5)
        ctx.strokeRect(x + 15, y + 10, 24, 24);
        ctx.fillText("E", x + 27, y + h / 2 + 1);
        // 3. Vẽ số lượng
        ctx.textAlign = "center"; // Căn giữa chữ
        ctx.fillStyle = "#FFD700";
        ctx.font = "18px 'Press Start 2P'"; // Tăng font chữ to hơn nữa
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFD700";
        // Căn giữa vào phần khoảng trống còn lại của khung (130 - 45 = 85 -> tâm là 45 + 42.5 = 87.5)
        ctx.fillText(`x${this.boneEnergy}`, x + 87, y + h / 2 + 2);
        ctx.restore();
    },
    drawBoneEffects: function () {
        for (let i = this.boneEffects.length - 1; i >= 0; i--) {
            let e = this.boneEffects[i];
            ctx.save();
            ctx.globalAlpha = e.life / e.maxLife;
            if (e.type === 'shockwave') {
                ctx.translate(e.x, e.y);
                ctx.beginPath();
                ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 10 * (e.life / e.maxLife);
                ctx.stroke();
                e.radius += 15; // Phóng to cực nhanh
            } else if (e.type === 'shrink') {
                ctx.translate(e.x, e.y);
                // Đã bỏ chi tiết mũi tên theo yêu cầu
                ctx.fillStyle = 'rgba(0, 204, 255, 0.5)';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00ccff';
                ctx.beginPath();
                ctx.arc(0, 0, e.life * 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === 'destroy') {
                ctx.translate(e.x, e.y);
                let progress = (e.maxLife - e.life) / e.maxLife;
                let size = progress * 60; // Kích thước bùng nổ
                // 1. Quầng nhiệt (Heat distortion/glow)
                let heatGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
                heatGrad.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
                heatGrad.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
                heatGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = heatGrad;
                ctx.beginPath();
                ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                // 2. Hàm vẽ sao chi tiết
                const drawDetailedStar = (radius, innerRadius, points, color, glow) => {
                    ctx.fillStyle = color;
                    ctx.shadowBlur = glow;
                    ctx.shadowColor = color;
                    ctx.beginPath();
                    for (let j = 0; j < points * 2; j++) {
                        let angle = j * Math.PI / points - Math.PI / 2;
                        let r = j % 2 === 0 ? radius : innerRadius;
                        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                    ctx.closePath();
                    ctx.fill();
                };
                // Vẽ 2 tầng sao chồng lên nhau
                drawDetailedStar(size, size * 0.4, 8, '#ff3333', 25); // Tầng ngoài đỏ
                drawDetailedStar(size * 0.7, size * 0.2, 12, '#ffcc00', 15); // Tầng trong vàng cam
                // 3. Tia năng lượng bắn ra (Energy Sparks)
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fff';
                for (let j = 0; j < 6; j++) {
                    let angle = j * Math.PI / 3 + progress * 2;
                    let sDist = size * 0.5;
                    let sLen = size * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * sDist, Math.sin(angle) * sDist);
                    ctx.lineTo(Math.cos(angle) * (sDist + sLen), Math.sin(angle) * (sDist + sLen));
                    ctx.stroke();
                }
                // 4. Lõi trắng rực rỡ
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === 'text') {
                ctx.translate(e.x, e.y);
                // Hiệu ứng bùng nổ: bắt đầu to rồi thu nhỏ về cỡ chuẩn
                let progress = (e.maxLife - e.life) / e.maxLife;
                let scale = 1.0;
                if (progress < 0.2) {
                    scale = 2.5 - (progress / 0.2) * 1.5; // Từ 2.5 về 1.0
                }
                ctx.scale(scale, scale);
                ctx.fillStyle = e.color;
                ctx.font = "bold 24px 'Press Start 2P', sans-serif";
                ctx.textAlign = "center";
                ctx.shadowBlur = 20;
                ctx.shadowColor = e.color;
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#fff';
                ctx.strokeText(e.text, 0, 0);
                ctx.fillText(e.text, 0, 0);
                e.y -= 1.5; // Nổi chậm hơn để dễ quan sát
            } else if (e.type === 'sparkle') {
                ctx.translate(e.x, e.y);
                let alpha = e.life / e.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = e.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.color;
                // Vẽ hình ngôi sao 4 cánh lấp lánh
                let size = 4 + Math.random() * 6;
                ctx.beginPath();
                for (let j = 0; j < 4; j++) {
                    let angle = j * Math.PI / 2;
                    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
                    ctx.lineTo(Math.cos(angle + Math.PI / 4) * (size / 3), Math.sin(angle + Math.PI / 4) * (size / 3));
                }
                ctx.closePath();
                ctx.fill();
                e.x += e.vx;
                e.y += e.vy;
            }
            ctx.restore();
            e.life--;
            if (e.life <= 0) this.boneEffects.splice(i, 1);
        }
    },
    drawBlastCount: function () {
        if (this.type !== 'green' || gameState.current !== gameState.play) return;
        ctx.save();
        let w = 160;
        let h = 35;
        let x = cvs.width - w - 20;
        let y = cvs.height - 70;
        // 1. Vẽ khung nền Capsule Glassmorphism
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.strokeStyle = "rgba(0, 255, 136, 0.4)";
        ctx.lineWidth = 2;
        // Vẽ hình chữ nhật bo tròn (giả lập capsule)
        let r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 2. Vẽ biểu tượng phím Z (Kỹ năng)
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px 'Be Vietnam Pro'";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Khung phím Z
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 12, y + 8, 20, 20);
        ctx.fillText("Z", x + 22, y + h / 2);
        // 3. Vẽ số lượng đòn
        ctx.textAlign = "left";
        ctx.fillStyle = "#00ff88";
        ctx.font = "12px 'Press Start 2P'";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff88";
        ctx.fillText(`x${this.blastCount}`, x + 45, y + h / 2 + 2);
        // 4. Vẽ các viên ngọc năng lượng nhỏ lấp lánh (tối đa 5 viên)
        let displayOrbs = Math.min(this.blastCount, 5);
        for (let i = 0; i < displayOrbs; i++) {
            ctx.fillStyle = "#00ff88";
            ctx.beginPath();
            ctx.arc(x + 95 + i * 12, y + h / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            // Hiệu ứng lấp lánh nhẹ
            if (frame % 30 < 15) {
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(x + 95 + i * 12, y + h / 2, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    },
    drawManaBar: function () {
        if (this.type !== 'dark' || this.hasAuraShield || gameState.current !== gameState.play) return;
        let barWidth = 200; // Làm thanh mana dài hơn khi để dưới màn hình
        let barHeight = 10;
        let bx = cvs.width - barWidth - 20;
        let by = cvs.height - 60; // Nằm ở sát cạnh dưới màn hình
        let progress = this.shieldCooldown / this.maxShieldCooldown;
        ctx.save();
        // Vẽ chữ "RECHARGING AURA"
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "right";
        ctx.fillText("RECHARGING AURA", bx + barWidth, by - 10);
        // Vẽ bóng đổ cho thanh mana
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(148, 0, 211, 0.5)';
        // Khung nền thanh mana
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, barWidth, barHeight, 5);
        else ctx.rect(bx, by, barWidth, barHeight);
        ctx.fill();
        // Thanh tiến trình (Gradient tím huyền bí rực rỡ)
        let grad = ctx.createLinearGradient(bx, 0, bx + barWidth, 0);
        grad.addColorStop(0, '#4B0082');
        grad.addColorStop(0.5, '#9400D3');
        grad.addColorStop(1, '#E066FF');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.9 + Math.sin(frame * 0.1) * 0.1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, barWidth * progress, barHeight, 5);
        else ctx.rect(bx, by, barWidth * progress, barHeight);
        ctx.fill();
        // Viền rực sáng
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    },
    render: function () {
        // Vẽ hào quang và dải băng - Hiện ở chế độ chơi và chế độ chờ (Menu/Sẵn sàng)
        if ((this.type === 'dark' || this.type === 'green' || this.type === 'bone') && gameState.current !== gameState.gameOver) {
            this.drawTrail();
            this.drawTrailRibbon();
        }
        // Vẽ thanh mana hồi chiêu cho Dark
        if (this.type === 'dark') {
            this.drawManaBar();
        }
        // Điều khiển hiển thị nút chiêu thức
        if (gameState.current === gameState.play) {
            skillUI.classList.remove('hidden');
            if (this.type === 'green') {
                btnZ.classList.remove('hidden');
                btnE.classList.add('hidden');
                btnW.classList.add('hidden');
                btnQ.classList.add('hidden');
                // Trạng thái nút Z
                if (this.blastCount > 0) btnZ.classList.remove('disabled');
                else btnZ.classList.add('disabled');
            } else if (this.type === 'bone') {
                btnZ.classList.add('hidden');
                btnE.classList.remove('hidden');
                btnW.classList.remove('hidden');
                btnQ.classList.remove('hidden');
                // Trạng thái nút E
                if (this.boneEvolutionLevel === 0 && this.boneEnergy >= 5) btnE.classList.remove('disabled');
                else btnE.classList.add('disabled');
                btnE.setAttribute('data-cost', '5');
                // Trạng thái nút W
                if (this.boneEvolutionLevel >= 1 && this.boneEnergy >= 10 && !this.usedW && !this.boneSkillActive) btnW.classList.remove('disabled');
                else btnW.classList.add('disabled');
                btnW.setAttribute('data-cost', '10');
                // Trạng thái nút Q
                if (this.boneEvolutionLevel >= 1 && this.boneEnergy >= 15 && !this.usedQ && !this.boneSkillActive) btnQ.classList.remove('disabled');
                else btnQ.classList.add('disabled');
                btnQ.setAttribute('data-cost', '15');
            } else {
                skillUI.classList.add('hidden');
            }
        } else {
            skillUI.classList.add('hidden');
        }
        // Vẽ đòn năng lượng của RauMa
        if (this.type === 'green') {
            this.drawBlasts();
            this.drawBlastCount();
        }
        // Vẽ hiệu ứng (Phá hủy, Thu nhỏ, Ánh sao...) cho tất cả nhân vật
        this.drawBoneEffects();
        // Vẽ năng lượng của Bone
        if (this.type === 'bone') {
            this.drawBoneEnergy();
        }
        // Kiểm tra mốc điểm Siêu cấp
        let milestone = (currentDifficulty === 'challenge') ? 25 : (currentDifficulty === 'hard') ? 8 : 12;
        let isSuper = score.current >= milestone;
        // Chọn bộ sprite tương ứng với loại rồng
        let sprites = (this.type === 'bone') ? dragonSprites.bone : (this.type === 'dark' || this.type === 'green') ? dragonSprites.dark : dragonSprites.red;
        let img = sprites[this.animation[this.fr]];
        if (!img) return;
        ctx.save();
        // Hiệu ứng nhấp nháy khi bất tử
        if (this.invincible > 0 && Math.floor(frame / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        let shakeY = 0;
        // Độ rung: khi rồng đang ở trạng thái lơ lửng (Chuẩn bị hoặc Menu)
        if (gameState.current === gameState.getReady || gameState.current === gameState.menu) {
            shakeY = Math.sin(Date.now() * 0.05) * 1;
        }
        ctx.translate(Math.floor(this.x), Math.floor(this.y + shakeY));
        ctx.rotate(this.rotation);
        ctx.imageSmoothingEnabled = true;
        // Bỏ Multiply vì nó làm mất chi tiết rồng khi dùng skin tối màu
        ctx.globalCompositeOperation = 'source-over';
        // Áp dụng Skin Filter
        if (this.type === 'blue') {
            ctx.filter = 'hue-rotate(200deg) brightness(1.2) saturate(1.5)';
        } else if (this.type === 'black') {
            // Filter xám đen/than chì: Sáng hơn một chút để rõ chi tiết nhất
            ctx.filter = 'grayscale(1) brightness(1.0) contrast(1.2)';
        } else if (this.type === 'green') {
            // Filter xanh lá rực rỡ dựa trên rồng tối
            ctx.filter = 'sepia(1) hue-rotate(80deg) saturate(5) brightness(1.1)';
        } else if (this.type === 'dark' && this.hasAuraShield) {
            // Hiệu ứng rực rỡ huyền ảo cho Dark khi có lá chắn
            ctx.filter = 'brightness(1.2) saturate(1.2) drop-shadow(0 0 8px #ff00ff)';
        } else {
            ctx.filter = 'none';
        }
        // Áp dụng hiệu ứng Siêu cấp (Glow rực rỡ)
        if (isSuper) {
            let hue = (frame * 2) % 360;
            ctx.shadowBlur = 30 + Math.sin(frame * 0.1) * 15;
            ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
            if (ctx.filter === 'none') ctx.filter = 'brightness(1.5) saturate(1.5)';
            else ctx.filter += ' brightness(1.5) saturate(1.5)';
        }
        // Hiệu ứng "xuyên thấu" khi bất tử
        if (this.invincible > 0) {
            ctx.globalCompositeOperation = 'lighter';
        }
        // Tính toán scale đồng nhất cho từng loại rồng
        let currentAvgW = 0;
        sprites.forEach(s => currentAvgW += s.width);
        currentAvgW /= sprites.length;
        let baseScale = currentAvgW > 0 ? 65 / currentAvgW : 1;
        let scaleMultiplier = (this.type === 'bone' || this.type === 'dark' || this.type === 'green') ? 1.2 : 1.0;
        let currentScale = baseScale * scaleMultiplier;
        let dWidth = img.width * currentScale;
        let dHeight = img.height * currentScale;
        // Căn chỉnh tâm: Sử dụng ctx.translate để đưa điểm neo về tâm khối thân rồng
        // Rồng xương và rồng tối có sải cánh lớn hơn nên cần chỉnh lại offset
        let isLargeDragon = (this.type === 'bone' || this.type === 'dark' || this.type === 'green');
        let bodyOffset = img.width * (isLargeDragon ? 0.45 : 0.35);
        let bodyCx = img.cx !== undefined ? img.cx - bodyOffset : img.width / 2;
        let bodyCy = img.cy !== undefined ? img.cy : img.height / 2;
        let drawX = -bodyCx * currentScale;
        let drawY = -bodyCy * currentScale;
        ctx.drawImage(img, 0, 0, img.width, img.height, Math.floor(drawX), Math.floor(drawY), dWidth, dHeight);
        ctx.restore();
        // Vẽ phần vòng elip phía TRƯỜC rồng (sau khi vẽ sprite)
        if (this.type === 'bone' && gameState.current !== gameState.gameOver) {
            this.drawFrontRing();
        }
        // Vẽ hiệu ứng hạt lấp lánh cho trạng thái Siêu cấp (Chỉ dành cho Bone theo yêu cầu)
        if (isSuper && gameState.current === gameState.play && this.type === 'bone') {
            let sparkleColor;
            if (this.type === 'green') sparkleColor = `hsl(${(frame * 3) % 40 + 40}, 100%, 70%)`; // Tông vàng/xanh
            else if (this.type === 'dark') sparkleColor = `hsl(${(frame * 3) % 60 + 260}, 100%, 75%)`; // Tông tím/hồng
            else if (this.type === 'bone') sparkleColor = `hsl(${(frame * 3) % 20 + 0}, 0%, 85%)`; // Tông xám bạc
            else sparkleColor = `hsl(${(frame * 5) % 360}, 100%, 75%)`; // Cầu vồng cho rồng thường
            let isSpecial = this.type === 'green' || this.type === 'dark';
            let spawnCount = (this.type === 'bone') ? (frame % 2 === 0 ? 1 : 0) : (isSpecial ? 8 : 4);
            for (let i = 0; i < spawnCount; i++) {
                this.boneEffects.push({
                    type: 'sparkle',
                    x: this.x - 40 + Math.random() * 80,
                    y: this.y - 40 + Math.random() * 80,
                    color: sparkleColor,
                    life: 45,
                    maxLife: 45,
                    vx: -3 - Math.random() * 4,
                    vy: (Math.random() - 0.5) * 5
                });
            }
        }
    },
    dash: function () {
        this.velocity = - this.fly;
    },
    position: function () {
        // Note: Frame delay lướt - nhỏ: 8, lớn (Bone): 10
        let frameDelay = (this.type === 'bone') ? 10 : 8;
        if (gameState.current == gameState.getReady || gameState.current == gameState.menu) {
            this.y = 160;
            this.rotation = 0 * degree;
            this.fr = Math.floor(frame / frameDelay) % this.animation.length;
            this.trail = []; // Đặt lại dải băng khi không chơi
            // Khởi tạo lá chắn cho Dark và Green
            // Khởi tạo lá chắn CHỈ cho Dark
            if (this.type === 'dark') {
                this.hasAuraShield = true;
            } else {
                this.hasAuraShield = false;
            }
            this.invincible = 0;
            this.shieldCooldown = 0;
            this.lastScore = 0;
            this.blastCount = 1;
            this.boneEnergy = 0;
            this.boneEvolutionLevel = 0; // Reset vòng về như cũ khi chết
            this.boneSkillActive = null;
            this.boneSkillTimer = 0;
            this.usedW = false;
            this.usedQ = false;
            this.superTriggered = false; // Reset trạng thái kích hoạt siêu cấp
            this.boneEffects = [];
            this.lastBlastScore = 0;
            this.blasts = [];
        } else {
            this.fr = Math.floor(frame / frameDelay) % this.animation.length;
            if (this.invincible > 0) this.invincible--;
            if (this.boneSkillTimer > 0) {
                this.boneSkillTimer--;
                if (this.boneSkillTimer <= 0) {
                    this.boneSkillActive = null; // Trở về trạng thái tiến hóa E
                }
            }
            this.velocity += this.gravity;
            this.y += this.velocity;
            // Kỹ năng RauMa: Tăng số đòn năng lượng mỗi 5 điểm (Tối đa 3)
            if (this.type === 'green') {
                let currentTotalEarned = Math.floor(score.current / 5);
                let lastTotalEarned = Math.floor(this.lastBlastScore / 5);
                if (currentTotalEarned > lastTotalEarned) {
                    if (this.blastCount < 3) {
                        this.blastCount++;
                    }
                    this.lastBlastScore = score.current;
                }
            }
            // Cập nhật và kiểm tra va chạm đòn năng lượng
            for (let i = this.blasts.length - 1; i >= 0; i--) {
                let b = this.blasts[i];
                b.x += b.speed;
                // Va chạm với cột
                for (let pg of pipes.pipeGenerator) {
                    if (b.x > pg.x && b.x < pg.x + pipes.w) {
                        let currentGap = pg.gap || pipes.gap;
                        let shrink = pg.gapModifier || 0;
                        let topPipeBottomEdge = pg.y + pipes.h + shrink / 2;
                        let bottomPipeTopEdge = pg.y + pipes.h + currentGap - shrink / 2;
                        // 1. Phá hủy cột trên
                        if (!pg.isTopDestroyed && b.y < topPipeBottomEdge) {
                            pg.isTopDestroyed = true;
                            this.blasts.splice(i, 1);
                            break;
                        }
                        // 2. Phá hủy LỬA (chỉ mất lửa, không mất cột)
                        else if (pg.hasSquare && b.y > bottomPipeTopEdge - pg.squareOffsetY - 40 && b.y < bottomPipeTopEdge) {
                            pg.hasSquare = false;
                            this.blasts.splice(i, 1);
                            break;
                        }
                        // 3. Phá hủy cột dưới (mất cả cột và lửa nếu còn)
                        else if (!pg.isBottomDestroyed && b.y > bottomPipeTopEdge) {
                            pg.isBottomDestroyed = true;
                            pg.hasSquare = false;
                            this.blasts.splice(i, 1);
                            break;
                        }
                        // 4. Bắn vào khoảng trống (bị triệt tiêu)
                        else {
                            this.blasts.splice(i, 1);
                            break;
                        }
                    }
                }
                if (b && b.x > cvs.width) this.blasts.splice(i, 1);
            }
            // Hồi chiêu lá chắn cho Dark (12 giây)
            if (this.type === 'dark' && !this.hasAuraShield) {
                this.shieldCooldown++;
                if (this.shieldCooldown >= this.maxShieldCooldown) {
                    this.hasAuraShield = true;
                    this.shieldCooldown = 0;
                    SFX_SWOOSH.play(); // Âm thanh báo hiệu hồi xong
                }
            }
            // Trail logic: Cập nhật vị trí gắn vào thân
            if (this.type === 'dark' || this.type === 'green' || this.type === 'bone') {
                // Di chuyển các điểm cũ của dải băng sang trái để tạo hiệu ứng "bay ngang"
                for (let p of this.trail) {
                    p.x -= 3; // Tốc độ bay ngang ra phía sau
                }
                let tailOffsetX = -15;
                let tailOffsetY = 0;
                let tx = this.x + tailOffsetX * Math.cos(this.rotation) - tailOffsetY * Math.sin(this.rotation);
                let ty = this.y + tailOffsetX * Math.sin(this.rotation) + tailOffsetY * Math.cos(this.rotation);
                this.trail.unshift({ x: tx, y: ty });
                if (this.trail.length > this.maxTrailLength) this.trail.pop();
            } else {
                this.trail = [];
            }
            // Xóa dải băng ngay lập tức nếu chết
            if (gameState.current === gameState.gameOver) {
                this.trail = [];
            }
            // Rồng chúi đầu xuống nhiều hơn và nhanh hơn khi đang rơi (velocity > 0)
            let targetRot = this.velocity > 0 ? this.velocity * 0.1 : this.velocity * 0.05;
            // Khống chế góc xoay: Ngóc lên tối đa 25 độ, gập xuống tối đa 45 độ
            targetRot = Math.max(-25 * degree, Math.min(targetRot, 45 * degree));
            this.rotation += (targetRot - this.rotation) * 0.1;
            let bh = this.height * 0.7;
            // Ground collision
            if (this.y + bh / 2 >= cvs.height - ground.h) {
                this.y = cvs.height - ground.h - bh / 2; // Không bị xuyên qua mặt đất
                if (frame % 1 == 0) {
                    this.fr = 2;
                    this.rotation = 20 * degree;
                }
                if (gameState.current == gameState.play) {
                    if (this.hasAuraShield) {
                        this.hasAuraShield = false;
                        this.invincible = 100; // Tăng thời gian bất tử
                        this.velocity = -this.fly; // Nảy lên một chút để cứu mạng
                        SFX_SWOOSH.play();
                    } else {
                        gameState.current = gameState.gameOver;
                        SFX_FALL.play();
                    }
                }
            }
            if (this.y - bh / 2 <= 0) {
                this.y = bh / 2;
            }
        }
    }
}
getReady = {
    imgX: 0,
    imgY: 228,
    width: 174,
    height: 160,
    x: cvs.width / 2 - 174 / 2,
    y: cvs.height / 2 - 160,
    w: 174,
    h: 160,
    render: function () {
        if (gameState.current == gameState.getReady) {
            // Hiệu ứng nhịp đập (pulse) và bay bổng (bobbing) cho chữ
            let pulse = Math.sin(frame * 0.1) * 0.05 + 1; // Scale nhẹ từ 0.95 đến 1.05
            let bob = Math.sin(frame * 0.08) * 8;         // Bay lên xuống 8px
            ctx.save();
            // Di chuyển tâm về vị trí vẽ chữ để thực hiện hiệu ứng (Dịch xuống 55px thay vì 22px)
            ctx.translate(cvs.width / 2, this.y + 55 + bob);
            ctx.scale(pulse, pulse);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Font chữ cổ điển (Classic) - Bỏ bold để chữ thanh mảnh hơn
            ctx.font = "44px 'Carter One', serif";
            // Hiệu ứng phát sáng (Glow) thay đổi theo frame để thêm màu sắc sinh động
            let hue = (frame * 2) % 360;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
            // Hiệu ứng Gradient 3 màu (Lửa) rực rỡ hơn
            let textGrad = ctx.createLinearGradient(0, -25, 0, 25);
            textGrad.addColorStop(0, "#FFFF00");  // Vàng (Top)
            textGrad.addColorStop(0.5, "#FF8C00"); // Cam (Mid)
            textGrad.addColorStop(1, "#FF4500");   // Đỏ cam (Bottom)
            ctx.fillStyle = textGrad;
            ctx.strokeStyle = "#FFF"; // Viền trắng
            ctx.lineWidth = 2;        // Giảm độ dày viền xuống 2
            // Vẽ viền và chữ (tại tọa độ 0,0 vì đã translate)
            ctx.strokeText("TAKE FLIGHT", 0, 0);
            ctx.fillText("TAKE FLIGHT", 0, 0);
            ctx.restore();
            // Chỉ vẽ phần "Bàn tay TAP" ở dưới (từ y=85, cao 75px) từ theme1
            ctx.drawImage(theme1, this.imgX, this.imgY + 85, this.width, 75, this.x, this.y + 85, this.w, 75);
        }
    }
}
gameOver = {
    imgX: 174,
    imgY: 228,
    width: 226,
    height: 158,
    x: cvs.width / 2 - 226 / 2,
    y: cvs.height / 2 - 160,
    w: 226,
    h: 160,
    render: function () {
        if (gameState.current == gameState.gameOver) {
            // Chỉ vẽ phần bảng điểm (bỏ qua chữ GAME OVER ở trên cùng của sprite)
            // Giả sử chữ GAME OVER cao khoảng 45px, ta bắt đầu vẽ từ imgY + 45
            ctx.drawImage(theme1, this.imgX, this.imgY + 45, this.width, this.height - 45, this.x, this.y + 45, this.w, this.h - 45);
            // Vẽ chữ "Wings Broken" thay thế
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "28px 'Press Start 2P'"; // Đổi sang phông chữ Pixel giống tiêu đề
            // Hiệu ứng đổ bóng đỏ rực rỡ
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            // Gradient màu xám/bạc u buồn
            let textGrad = ctx.createLinearGradient(0, this.y - 10, 0, this.y + 30);
            textGrad.addColorStop(0, "#E0E0E0"); // Xám sáng
            textGrad.addColorStop(1, "#757575"); // Xám đậm
            ctx.fillStyle = textGrad;
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 4;
            ctx.strokeText("Wings Broken", cvs.width / 2, this.y + 10);
            ctx.fillText("Wings Broken", cvs.width / 2, this.y + 10);
            // Reset shadow sau khi vẽ để không ảnh hưởng các phần khác
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.restore();
            description.style.visibility = "visible"
            // Cập nhật điểm cao nhất
            score.updateBest();
            // Vẽ điểm hiện tại (Dịch xuống nhiều hơn để tránh đè chữ SCORE)
            this.drawValue(score.current, this.x + 195, this.y + 90);
            // Vẽ điểm cao nhất (Dịch xuống nhiều hơn để tránh đè chữ BEST)
            this.drawValue(score.best, this.x + 195, this.y + 135);
        }
    },
    drawValue: function (value, x, y) {
        ctx.save();
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3; // Làm đậm nét hơn bằng cách tăng viền
        ctx.font = "20px 'Press Start 2P'";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.strokeText(value, x, y);
        ctx.fillText(value, x, y);
        ctx.restore();
    }
}
// tất cả những gì được vẽ trên canvas đi vào đây
let draw = () => {
    ctx.save();
    // Hiệu ứng rung màn hình
    if (shakeTime > 0) {
        let dx = Math.random() * 6 - 3;
        let dy = Math.random() * 6 - 3;
        ctx.translate(dx, dy);
        shakeTime--;
    }
    // Gradient bầu trời sa mạc - Màu dịu và chuyển màu cực mượt
    let grad = ctx.createLinearGradient(0, 0, 0, cvs.height);
    grad.addColorStop(0, '#050911');    // Đen xanh sâu (Top)
    grad.addColorStop(0.25, '#1a2a44'); // Xanh đêm dịu
    grad.addColorStop(0.45, '#5c4d5d'); // Tím xám bụi (Dusty Rose - dịu mắt)
    grad.addColorStop(0.65, '#9e6a5b'); // Cam đất trầm (Terracotta)
    grad.addColorStop(0.85, '#d9905e'); // Cam ấm nhẹ
    grad.addColorStop(1, '#f2a65a');    // Chân trời cam nhạt
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    // Mặt trời lớn ở trung tâm
    ctx.fillStyle = '#ffda75';
    ctx.beginPath();
    ctx.arc(cvs.width / 2, cvs.height - 220, 70, 0, Math.PI * 2);
    ctx.fill();
    // Trang trí bầu trời (sao băng, rồng bay)
    skyDecorations.render();
    // những thứ cần vẽ
    bg.render()
    pipes.render()
    ground.render()
    score.render()
    dragon.render()
    getReady.render()
    gameOver.render()
    ctx.restore();
}
// cập nhật về hoạt ảnh và vị trí đi vào đây
let update = () => {
    // những thứ cần cập nhật
    skyDecorations.update();
    dragon.position()
    bg.position()
    pipes.position()
    ground.position()
}
// vòng lặp game
let loop = () => {
    draw()
    update()
    frame++
    // trung bình của requestAnimationFrame là 50-60fps
    // requestAnimationFrame(loop)
}
initializeDragonSprites(() => {
    description.style.visibility = "hidden"; // Ẩn ban đầu cho menu
    loop()
    setInterval(loop, 17)
})
// khi click chuột // chạm màn hình
cvs.addEventListener('click', () => {
    if (gameState.current == gameState.menu) return; // Bỏ qua click nếu menu đang mở
    // nếu màn hình chuẩn bị >> chuyển sang trạng thái chơi
    if (gameState.current == gameState.getReady) {
        gameState.current = gameState.play
    }
    // nếu trạng thái chơi >> rồng tiếp tục bay
    if (gameState.current == gameState.play) {
        dragon.dash()
        SFX_DASH.play()
        description.style.visibility = "hidden"
    }
    // nếu màn hình kết thúc >> quay lại màn hình menu
    if (gameState.current == gameState.gameOver) {
        pipes.reset()
        score.reset()
        gameState.current = gameState.menu
        menuScreen.classList.remove('hidden')
        description.style.visibility = "hidden"
        SFX_SWOOSH.play()
    }
})
// phím spacebar
document.body.addEventListener('keydown', (e) => {
    if (gameState.current == gameState.menu) return; // Bỏ qua phím nếu menu đang mở
    // nếu màn hình chuẩn bị >> chuyển sang trạng thái chơi
    if (e.keyCode == 32) {
        if (gameState.current == gameState.getReady) {
            gameState.current = gameState.play
        }
        // nếu trạng thái chơi >> rồng tiếp tục bay
        if (gameState.current == gameState.play) {
            dragon.dash()
            SFX_DASH.play()
            description.style.visibility = "hidden"
        }
        // nếu màn hình kết thúc >> quay lại màn hình menu
        if (gameState.current == gameState.gameOver) {
            pipes.reset()
            score.reset()
            gameState.current = gameState.menu
            menuScreen.classList.remove('hidden')
            description.style.visibility = "hidden"
            SFX_SWOOSH.play()
        }
    }
    // Phím Z: Kỹ năng RauMa
    if (e.keyCode == 90 && dragon.type === 'green' && gameState.current == gameState.play) {
        if (dragon.blastCount > 0) {
            dragon.blastCount--;
            dragon.blasts.push({ x: dragon.x + 30, y: dragon.y, speed: 8 });
            SFX_SWOOSH.play();
        }
    }
    // Phím E: Kỹ năng tiến hóa Thresh (Chỉ dùng được 1 lần mỗi ván)
    if (e.keyCode == 69 && dragon.type === 'bone' && gameState.current == gameState.play) {
        if (dragon.boneEnergy >= 5 && dragon.boneEvolutionLevel === 0) {
            dragon.boneEnergy -= 5;
            dragon.boneEvolutionLevel = 1;
            SFX_SWOOSH.play(); // Âm thanh báo hiệu tiến hóa
        }
    }
    // Phím W: Thu nhỏ chướng ngại vật (Yêu cầu E đã kích hoạt)
    if (e.keyCode == 87 && dragon.type === 'bone' && gameState.current == gameState.play) {
        if (dragon.boneEvolutionLevel >= 1 && dragon.boneEnergy >= 10 && dragon.boneSkillActive !== 'W' && dragon.boneSkillActive !== 'Q' && !dragon.usedW) {
            dragon.boneEnergy -= 10;
            dragon.boneSkillActive = 'W';
            dragon.boneSkillTimer = 60 * 5; // 5 giây
            dragon.usedW = true;
            // Hiệu ứng kích hoạt
            dragon.boneEffects.push({ type: 'text', text: 'THU NHỎ!', color: '#00ccff', x: dragon.x, y: dragon.y - 40, life: 60, maxLife: 60 });
            dragon.boneEffects.push({ type: 'shockwave', color: 'rgba(50, 200, 255, 1)', radius: 50, x: dragon.x, y: dragon.y, life: 20, maxLife: 20 });
            SFX_SWOOSH.play();
        }
    }
    // Phím Q: Tiêu diệt chướng ngại vật (Yêu cầu E đã kích hoạt)
    if (e.keyCode == 81 && dragon.type === 'bone' && gameState.current == gameState.play) {
        if (dragon.boneEvolutionLevel >= 1 && dragon.boneEnergy >= 15 && dragon.boneSkillActive !== 'W' && dragon.boneSkillActive !== 'Q' && !dragon.usedQ) {
            dragon.boneEnergy -= 15;
            dragon.boneSkillActive = 'Q';
            dragon.boneSkillTimer = 60 * 9; // 9 giây
            dragon.usedQ = true;
            // Hiệu ứng kích hoạt
            dragon.boneEffects.push({ type: 'text', text: 'PHÁ HỦY!', color: '#ff3333', x: dragon.x, y: dragon.y - 40, life: 60, maxLife: 60 });
            dragon.boneEffects.push({ type: 'shockwave', color: 'rgba(255, 50, 50, 1)', radius: 50, x: dragon.x, y: dragon.y, life: 20, maxLife: 20 });
            SFX_SWOOSH.play();
        }
    }
})
// Xử lý sự kiện Click cho các nút chiêu thức
btnZ.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragon.type === 'green' && gameState.current == gameState.play && dragon.blastCount > 0) {
        dragon.blastCount--;
        dragon.blasts.push({ x: dragon.x + 30, y: dragon.y, speed: 8 });
        SFX_SWOOSH.play();
    }
});
btnE.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragon.type === 'bone' && gameState.current == gameState.play && dragon.boneEnergy >= 5 && dragon.boneEvolutionLevel === 0) {
        dragon.boneEnergy -= 5;
        dragon.boneEvolutionLevel = 1;
        SFX_SWOOSH.play();
    }
});
btnW.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragon.type === 'bone' && gameState.current == gameState.play && dragon.boneEvolutionLevel >= 1 && dragon.boneEnergy >= 10 && !dragon.usedW && !dragon.boneSkillActive) {
        dragon.boneEnergy -= 10;
        dragon.boneSkillActive = 'W';
        dragon.boneSkillTimer = 60 * 5;
        dragon.usedW = true;
        dragon.boneEffects.push({ type: 'text', text: 'THU NHỎ!', color: '#00ccff', x: dragon.x, y: dragon.y - 40, life: 60, maxLife: 60 });
        dragon.boneEffects.push({ type: 'shockwave', color: 'rgba(50, 200, 255, 1)', radius: 50, x: dragon.x, y: dragon.y, life: 20, maxLife: 20 });
        SFX_SWOOSH.play();
    }
});
btnQ.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragon.type === 'bone' && gameState.current == gameState.play && dragon.boneEvolutionLevel >= 1 && dragon.boneEnergy >= 15 && !dragon.usedQ && !dragon.boneSkillActive) {
        dragon.boneEnergy -= 15;
        dragon.boneSkillActive = 'Q';
        dragon.boneSkillTimer = 60 * 9;
        dragon.usedQ = true;
        dragon.boneEffects.push({ type: 'text', text: 'PHÁ HỦY!', color: '#ff3333', x: dragon.x, y: dragon.y - 40, life: 60, maxLife: 60 });
        dragon.boneEffects.push({ type: 'shockwave', color: 'rgba(255, 50, 50, 1)', radius: 50, x: dragon.x, y: dragon.y, life: 20, maxLife: 20 });
        SFX_SWOOSH.play();
    }
});