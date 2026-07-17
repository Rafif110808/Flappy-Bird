// ==========================================
// FLAPPY BIRD — Vanilla JavaScript
// ==========================================

const board = document.getElementById("board");
const ctx = board.getContext("2d");

const W = 400;
const H = 600;
board.width = W;
board.height = H;

// --- Images ---
const birdImg = new Image();
birdImg.src = "assets/images/flappybird.png";

const topPipeImg = new Image();
topPipeImg.src = "assets/images/toppipe.png";

const bottomPipeImg = new Image();
bottomPipeImg.src = "assets/images/bottompipe.png";

// --- Audio ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq, duration, type) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// --- Game State ---
const state = { START: 0, PLAYING: 1, GAMEOVER: 2 };
let currentState = state.START;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;

// --- Bird ---
const bird = { x: 80, y: 250, w: 40, h: 28 };
let velocityY = 0;
const GRAVITY = 0.5;
const JUMP = -7;


// --- Pipes ---
const pipes = [];
const PIPE_W = 52;
const PIPE_SPEED = 2;
const PIPE_INTERVAL = 1500;

function getPipeGap() {
  return Math.max(110, 150 - Math.floor(score / 5) * 5);
}

// --- Ground ---
const GROUND_Y = 560;
let groundX = 0;

// ==========================================
// Collision Detection
// ==========================================
function detectCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ==========================================
// Place pipes
// ==========================================
function placePipes() {
  if (currentState !== state.PLAYING) return;
  const gap = getPipeGap();
  const gapY = Math.random() * (H - gap - 120) + 60;
  pipes.push({ x: W, y: 0, w: PIPE_W, h: gapY, passed: false });
  pipes.push({ x: W, y: gapY + gap, w: PIPE_W, h: H - gapY - gap, passed: false });
}

// ==========================================
// Bird actions
// ==========================================
function moveBird() {
  if (currentState === state.PLAYING) {
    velocityY = JUMP;
    playBeep(350, 0.08, "sine");
  }
}

// ==========================================
// Reset game
// ==========================================
function resetGame() {
  bird.y = 250;
  velocityY = 0;
  pipes.length = 0;
  score = 0;
  currentState = state.START;
}

// ==========================================
// Update logic
// ==========================================
function update() {
  if (currentState !== state.PLAYING) return;

  // Gravity
  velocityY += GRAVITY;
  bird.y += velocityY;

  // Top boundary
  if (bird.y < 0) {
    bird.y = 0;
    velocityY = 0;
  }

  // Ground collision
  if (bird.y + bird.h >= GROUND_Y) {
    bird.y = GROUND_Y - bird.h;
    currentState = state.GAMEOVER;
    playBeep(150, 0.4, "sawtooth");
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("flappyHighScore", highScore);
    }
    return;
  }

  // Move pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= PIPE_SPEED;
    if (pipes[i].x + pipes[i].w < 0) {
      pipes.splice(i, 1);
      continue;
    }
    if (detectCollision(bird, pipes[i])) {
      currentState = state.GAMEOVER;
      playBeep(150, 0.4, "sawtooth");
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyHighScore", highScore);
      }
      return;
    }
  }

  // Score
  for (let i = 0; i < pipes.length; i += 2) {
    if (pipes[i] && !pipes[i].passed && pipes[i].x + pipes[i].w < bird.x) {
      pipes[i].passed = true;
      pipes[i + 1].passed = true;
      score++;
      playBeep(500, 0.12, "sine");
    }
  }

  // Ground scroll
  groundX = (groundX - PIPE_SPEED + W) % W;
}

// ==========================================
// Draw everything
// ==========================================
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Bird with rotation
  const angle = Math.max(-0.5, Math.min(0.5, velocityY * 0.05));
  ctx.save();
  ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
  ctx.rotate(angle);
  ctx.drawImage(birdImg, -bird.w / 2, -bird.h / 2, bird.w, bird.h);
  ctx.restore();

  // Pipes
  for (const p of pipes) {
    const img = p.y === 0 ? topPipeImg : bottomPipeImg;
    ctx.drawImage(img, p.x, p.y, p.w, p.h);
  }

  // Scrolling ground
  ctx.fillStyle = "#5a3d1a";
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = "#4a2d0a";
  for (let x = groundX - W; x < W; x += 30) {
    ctx.fillRect(x, GROUND_Y + 3, 14, 4);
    ctx.fillRect(x + 15, GROUND_Y + 12, 14, 4);
  }

  // Score
  if (currentState === state.PLAYING || currentState === state.GAMEOVER) {
    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 4;
    ctx.strokeText(score, W / 2, 60);
    ctx.fillText(score, W / 2, 60);
  }

  // Start screen
  if (currentState === state.START) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.strokeText("Flappy Bird", W / 2, H / 2 - 40);
    ctx.fillText("Flappy Bird", W / 2, H / 2 - 40);
    ctx.font = "18px Arial";
    ctx.fillText("Spasi / ArrowUp / X untuk mulai", W / 2, H / 2 + 20);
  }

  // Game Over screen
  if (currentState === state.GAMEOVER) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.strokeText("GAME OVER", W / 2, H / 2 - 40);
    ctx.fillText("GAME OVER", W / 2, H / 2 - 40);

    // Medal
    let medalColor = null;
    let medalLabel = "";
    if (score >= 20) { medalColor = "#FFD700"; medalLabel = "GOLD"; }
    else if (score >= 10) { medalColor = "#C0C0C0"; medalLabel = "SILVER"; }
    else if (score >= 5) { medalColor = "#CD7F32"; medalLabel = "BRONZE"; }
    if (medalColor) {
      ctx.beginPath();
      ctx.arc(W / 2 - 90, H / 2 - 5, 24, 0, Math.PI * 2);
      ctx.fillStyle = medalColor;
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#333";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(medalLabel, W / 2 - 90, H / 2 - 1);
    }

    ctx.font = "22px Arial";
    ctx.fillText("Score: " + score, W / 2, H / 2 + 15);
    ctx.fillText("Best: " + highScore, W / 2, H / 2 + 45);
    ctx.font = "16px Arial";
    ctx.fillText("Spasi / ArrowUp / X untuk restart", W / 2, H / 2 + 80);
  }
}

// ==========================================
// Game Loop
// ==========================================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ==========================================
// User Input
// ==========================================
function onAction() {
  if (currentState === state.START) {
    currentState = state.PLAYING;
    velocityY = JUMP;
    playBeep(350, 0.08, "sine");
  } else if (currentState === state.PLAYING) {
    velocityY = JUMP;
    playBeep(350, 0.08, "sine");
  } else {
    resetGame();
  }
}

document.addEventListener("keydown", function (e) {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
    e.preventDefault();
    onAction();
  }
});

board.addEventListener("click", onAction);
board.addEventListener("touchstart", function (e) {
  e.preventDefault();
  onAction();
});

// ==========================================
// Start
// ==========================================
setInterval(placePipes, PIPE_INTERVAL);
gameLoop();
