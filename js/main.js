const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// === IMAGES === 
const bgImg = new Image();
bgImg.src = "images/flappybirdbg.png";

const birdImg = new Image();
birdImg.src = "images/flappybird.png";

let imagesLoaded = 0;

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === 4) {
    Pipe.createPatterns(ctx);
  }
}
birdImg.onload = onImageLoad;
bgImg.onload = onImageLoad;
Pipe.topImg.onload = onImageLoad;
Pipe.bottomImg.onload = onImageLoad;

// === AUDIO ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq, duration, type) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// === GAME STATE ===
const ST = { START: 0, PLAYING: 1, GAMEOVER: 2 };
let state = ST.START;

// === BIRD ===
const bird = new Bird();
bird.img = birdImg;

// === PIPES ===
const pipes = [];
let frameCount = 0;
const pipeInterval = 100;

// === GROUND ===
const groundY = 500;
let groundX = 0;
const groundSpeed = 2;

// === SCORE ===
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;

// === DIFFICULTY ===
function getPipeGap() {
  return Math.max(100, 150 - Math.floor(score / 5) * 5);
}

// === COLLISION ===
function checkCollision(pipe) {
  const pad = 4;
  if (
    bird.x + pad < pipe.x + pipe.width &&
    bird.x + bird.width - pad > pipe.x &&
    bird.y + pad < pipe.topHeight &&
    bird.y + bird.height - pad > 0
  )
    return true;
  if (
    bird.x + pad < pipe.x + pipe.width &&
    bird.x + bird.width - pad > pipe.x &&
    bird.y + bird.height - pad > pipe.bottomY &&
    bird.y + pad < canvas.height
  )
    return true;
  return false;
}

// === UPDATE ===
function update() {
  if (state === ST.START) {
    bird.updateFrame();
    groundX = (groundX - groundSpeed + canvas.width) % canvas.width;
    return;
  }
  if (state === ST.GAMEOVER) return;

  bird.update();
  groundX = (groundX - groundSpeed + canvas.width) % canvas.width;

  if (bird.y + bird.height >= groundY) {
    bird.y = groundY - bird.height;
    gameOver();
  }

  frameCount++;
  if (frameCount % pipeInterval === 0) {
    const pipe = new Pipe(canvas.width);
    pipe.gap = getPipeGap();
    pipe.topHeight = Math.random() * 200 + 50;
    pipe.bottomY = pipe.topHeight + pipe.gap;
    pipes.push(pipe);
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].update();
    if (pipes[i].x + pipes[i].width < 0) {
      pipes.splice(i, 1);
      continue;
    }
    if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
      pipes[i].passed = true;
      score++;
      playBeep(500, 0.12, "sine");
    }
    if (checkCollision(pipes[i])) {
      gameOver();
    }
  }
}

function gameOver() {
  if (state === ST.GAMEOVER) return;
  state = ST.GAMEOVER;
  playBeep(150, 0.4, "sawtooth");
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHighScore", highScore);
  }
}

// === DRAW ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  if (bgImg.complete) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, groundY);
  }

  // pipes
  pipes.forEach((p) => p.draw(ctx));

  // bird
  bird.draw(ctx);

  // ground overlay (semi-transparent)
  ctx.fillStyle = "#5a3d1a";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  ctx.fillStyle = "#4a2d0a";
  for (let x = groundX - canvas.width; x < canvas.width; x += 30) {
    ctx.fillRect(x, groundY + 2, 15, 4);
    ctx.fillRect(x + 15, groundY + 12, 15, 4);
  }

  // score
  if (state === ST.PLAYING || state === ST.GAMEOVER) {
    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.strokeText(score, canvas.width / 2, 60);
    ctx.fillText(score, canvas.width / 2, 60);
  }

  // start screen
  if (state === ST.START) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px Arial";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.strokeText("Flappy Bird", canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText("Flappy Bird", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "18px Arial";
    ctx.fillText(
      "Tekan Spasi / Tap untuk mulai",
      canvas.width / 2,
      canvas.height / 2 + 15,
    );
  }

  // game over screen
  if (state === ST.GAMEOVER) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let medalColor = null;
    let medalLabel = "";
    if (score >= 20) {
      medalColor = "#FFD700";
      medalLabel = "GOLD";
    } else if (score >= 10) {
      medalColor = "#C0C0C0";
      medalLabel = "SILVER";
    } else if (score >= 5) {
      medalColor = "#CD7F32";
      medalLabel = "BRONZE";
    }

    if (medalColor) {
      ctx.beginPath();
      ctx.arc(canvas.width / 2 - 90, canvas.height / 2 - 5, 24, 0, Math.PI * 2);
      ctx.fillStyle = medalColor;
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#333";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(medalLabel, canvas.width / 2 - 90, canvas.height / 2 - 1);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px Arial";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.strokeText("Game Over", canvas.width / 2, canvas.height / 2 - 70);
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 70);
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("Best: " + highScore, canvas.width / 2, canvas.height / 2 + 5);
    ctx.font = "16px Arial";
    ctx.fillText(
      "Enter / R / Click untuk restart",
      canvas.width / 2,
      canvas.height / 2 + 45,
    );
  }
}

// === CONTROLS ===
function restart() {
  bird.y = 250;
  bird.velocity = 0;
  bird.frame = 0;
  bird.frameTimer = 0;
  pipes.length = 0;
  frameCount = 0;
  score = 0;
  state = ST.START;
}

function flap() {
  if (state === ST.START) {
    state = ST.PLAYING;
    playBeep(400, 0.1, "sine");
  } else if (state === ST.PLAYING) {
    bird.velocity = -8;
    playBeep(350, 0.08, "sine");
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") flap();
  if ((e.code === "Enter" || e.code === "KeyR") && state === ST.GAMEOVER)
    restart();
});

canvas.addEventListener("click", () => {
  if (state === ST.GAMEOVER) restart();
  else flap();
});

// === LOOP ===
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
