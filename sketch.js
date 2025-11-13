let circles = [];
let colors = ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'];
let popParticles = [];
let popSound; 
let audioContextUnlocked = false; 
let score = 0; // 新增：計分變數

// --- 確保您在 index.html 中引用了 p5.sound.js ---

function preload() {
  // 請確保您的音效檔名是 pop.mp3 且放在正確的路徑
  popSound = loadSound('pop.mp3'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#e9c46a');

  noStroke();
  rectMode(CENTER);
  textAlign(LEFT, BOTTOM); // 設定文字對齊方式為左下角

  // 初始化 30 個圓形
  for (let i = 0; i < 30; i++) {
    circles.push(createCircle());
  }
}

// ------------------------------------------------
// **關鍵修改：處理滑鼠點擊和爆破邏輯**
// ------------------------------------------------
function mousePressed() {
  // 1. 處理音訊解鎖 (只需在第一次點擊時執行)
  if (!audioContextUnlocked) {
    userStartAudio(); 
    audioContextUnlocked = true;
  }
  
  // 2. 檢查是否點擊到氣球 (從後往前迭代，確保處理最上層的氣球)
  for (let i = circles.length - 1; i >= 0; i--) {
    let circle = circles[i];
    
    // 計算滑鼠點擊位置與圓心的距離
    let d = dist(mouseX, mouseY, circle.x, circle.y);
    let radius = circle.diameter / 2;
    
    // 判斷滑鼠是否在圓形範圍內，且圓形未爆破
    if (d < radius && !circle.isPopped) {
      
      // 3. 執行爆破與計分邏輯
      circle.isPopped = true;
      
      // 播放音效
      if (audioContextUnlocked && popSound) {
        // 為了讓連續點擊的音效可以疊加，這裡不檢查 isPlaying()
        popSound.play(); 
      }
      
      // 產生粒子效果
      createPopEffect(circle.x, circle.y, circle.diameter, circle.color);
      
      // 計分邏輯：將 RGB 顏色轉換回十六進位進行比對
      let hexColor = rgbToHex(circle.color.r, circle.color.g, circle.color.b);

      if (hexColor.toUpperCase() === '#FB5607') { // 目標顏色 fb5607
        score += 1; // 加 1 分
      } else {
        score -= 1; // 扣 1 分 (其他顏色)
      }
      
      // 找到氣球後就跳出迴圈，防止點擊到多個重疊的氣球
      return; 
    }
  }
}

function draw() {
  background('#e9c46a');

  // --- 處理氣球漂浮、爆破重置與粒子繪製 (大部分邏輯保留) ---
  for (let i = circles.length - 1; i >= 0; i--) {
    let circle = circles[i];

    if (!circle.isPopped) {
      // 繪製圓形和方形
      fill(circle.color.r, circle.color.g, circle.color.b, circle.alpha);
      ellipse(circle.x, circle.y, circle.diameter, circle.diameter);

      fill(255, 255, 255, 150);
      let squareSize = circle.diameter / 5;
      let radius = circle.diameter / 2;
      let offsetAngle = -PI/4;
      let safeOffsetDistance = radius * 0.4;
      let squareCenterX = circle.x + cos(offsetAngle) * safeOffsetDistance;
      let squareCenterY = circle.y + sin(offsetAngle) * safeOffsetDistance;
      rect(squareCenterX, squareCenterY, squareSize, squareSize);

      // 更新圓形的位置
      circle.y -= circle.speed;

      // 圓形飄出畫布頂端重置 (爆破邏輯已移除)
      if (circle.y < -circle.diameter / 2) {
        circles[i] = createCircle();
        circles[i].y = height + circles[i].diameter / 2;
      }

    } else {
      // 圓形爆破後重置
      circles[i] = createCircle();
      circles[i].y = height + circles[i].diameter / 2;
    }
  }

  // 更新並繪製爆破粒子
  for (let i = popParticles.length - 1; i >= 0; i--) {
    let particle = popParticles[i];
    fill(particle.color.r, particle.color.g, particle.color.b, particle.alpha);
    ellipse(particle.x, particle.y, particle.size, particle.size);

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.alpha -= particle.fadeRate;
    particle.size -= particle.shrinkRate;

    if (particle.alpha <= 0 || particle.size <= 0) {
      popParticles.splice(i, 1);
    }
  }
  
  // ------------------------------------------------
  // **新增：顯示文字與得分**
  // ------------------------------------------------
  textSize(32);
  fill('#eb6424'); // 文字顏色

  // 1. 左下角顯示 "413730911"
  textAlign(LEFT, BOTTOM);
  text("413730911", 10, height - 10); // 距離左邊和底部 10 像素

  // 2. 右下角顯示得分
  textAlign(RIGHT, BOTTOM);
  text("得分: " + score, width - 10, height - 10); // 距離右邊和底部 10 像素
}

// 函式：創建一個新的圓形物件 (無變動)
function createCircle() {
  let circle = {};
  circle.x = random(width);
  circle.y = random(height, height * 2);
  circle.diameter = random(50, 200);
  
  let c = colors[floor(random(colors.length))];
  circle.color = hexToRgb(c);

  circle.alpha = random(50, 200);
  circle.speed = random(0.5, 3);
  circle.isPopped = false;

  return circle;
}

// 函式：產生爆破粒子效果 (無變動)
function createPopEffect(x, y, diameter, color) {
  let numParticles = floor(random(10, 20));
  let particleSize = diameter / 10;
  let speedFactor = diameter / 100;

  for (let i = 0; i < numParticles; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 3) * speedFactor;
    let particle = {
      x: x,
      y: y,
      size: random(particleSize * 0.5, particleSize * 1.5),
      color: color,
      alpha: 255,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      fadeRate: random(5, 15),
      shrinkRate: random(0.5, 2)
    };
    popParticles.push(particle);
  }
}

// 輔助函式：將十六進位顏色字串轉換為 RGB 物件 (無變動)
function hexToRgb(hex) {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  return { r, g, b };
}

// 輔助函式：將 RGB 值轉換回十六進位，用於準確的顏色比對 (新增)
function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  // 注意：這裡只返回顏色部分的十六進位字串，不包含透明度
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// 當視窗大小改變時重新調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background('#e9c46a');
  
  circles = [];
  popParticles = [];
  for (let i = 0; i < 30; i++) {
    circles.push(createCircle());
  }
}