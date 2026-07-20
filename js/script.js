const board = document.getElementById("board");
const context = board.getContext("2d");
const boardWidth = 400;
const boardHeight = 600;

board.width = boardWidth;
board.height = boardHeight;

// Game states
const STATE = { START: 0, PLAYING: 1, GAMEOVER: 2 };
let state = STATE.START;
let score = 0;

// Bird
const birdImg = new Image();
birdImg.src = "assets/images/flappybird.png";
const bird = { x: 80, y: 250, width: 34, height: 24 };

// Physics
let velocityY = 0;
const gravity = 0.5;
const jumpStrength = -7;

// Pipes
const pipeArray = [];
const pipeWidth = 55;
const pipeGap = 140;

const topPipeImg = new Image();
topPipeImg.src = "assets/images/toppipe.png";
const bottomPipeImg = new Image();
bottomPipeImg.src = "assets/images/bottompipe.png";

// ---- Functions ----

function placePipes() {
  if (state !== STATE.PLAYING) return;
  let randomY = Math.random() * (boardHeight - pipeGap - 80) + 40;
  pipeArray.push({ x: boardWidth, y: randomY - 500, width: pipeWidth, height: 500, passed: false });
  pipeArray.push({ x: boardWidth, y: randomY + pipeGap, width: pipeWidth, height: boardHeight - randomY - pipeGap, passed: false });
}

function detectCollision(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function resetGame() {
  bird.y = 250;
  velocityY = 0;
  pipeArray.length = 0;
  score = 0;
  state = STATE.START;
}

// ---- Game Loop ----

function update() {
  requestAnimationFrame(update);

  if (state === STATE.START) {
    context.clearRect(0, 0, boardWidth, boardHeight);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    context.fillStyle = "rgba(0,0,0,0.3)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    context.fillStyle = "white";
    context.font = "bold 40px Arial";
    context.textAlign = "center";
    context.strokeStyle = "#333";
    context.lineWidth = 3;
    context.strokeText("Flappy Bird", boardWidth / 2, boardHeight / 2 - 30);
    context.fillText("Flappy Bird", boardWidth / 2, boardHeight / 2 - 30);
    context.font = "18px Arial";
    context.fillText("Tekan Spasi / Tap untuk mulai", boardWidth / 2, boardHeight / 2 + 20);
    return;
  }

  if (state === STATE.GAMEOVER) {
    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    context.fillStyle = "white";
    context.font = "bold 40px Arial";
    context.strokeStyle = "#333";
    context.lineWidth = 3;
    context.strokeText("GAME OVER", boardWidth / 2, boardHeight / 2 - 30);
    context.fillText("GAME OVER", boardWidth / 2, boardHeight / 2 - 30);
    context.font = "20px Arial";
    context.fillText("Score: " + score, boardWidth / 2, boardHeight / 2 + 15);
    context.font = "16px Arial";
    context.fillText("Tekan Spasi / Tap untuk restart", boardWidth / 2, boardHeight / 2 + 50);
    return;
  }

  // PLAYING
  context.clearRect(0, 0, boardWidth, boardHeight);

  // Bird physics
  velocityY += gravity;
  bird.y += velocityY;

  // Ground collision
  if (bird.y + bird.height >= boardHeight) {
    bird.y = boardHeight - bird.height;
    state = STATE.GAMEOVER;
  }
  if (bird.y <= 0) {
    bird.y = 0;
    velocityY = 0;
  }

  // Draw bird
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // Pipes
  for (let i = pipeArray.length - 1; i >= 0; i--) {
    pipeArray[i].x -= 2;

    if (pipeArray[i].x + pipeArray[i].width < 0) {
      pipeArray.splice(i, 1);
      continue;
    }

    // Draw pipe (top or bottom based on y position)
    if (pipeArray[i].y < boardHeight / 2) {
      context.drawImage(topPipeImg, pipeArray[i].x, pipeArray[i].y, pipeArray[i].width, pipeArray[i].height);
    } else {
      context.drawImage(bottomPipeImg, pipeArray[i].x, pipeArray[i].y, pipeArray[i].width, pipeArray[i].height);
    }

    // Collision
    if (detectCollision(bird, pipeArray[i])) {
      state = STATE.GAMEOVER;
    }
  }

  // Score: check pairs
  for (let i = 0; i < pipeArray.length; i += 2) {
    if (pipeArray[i] && !pipeArray[i].passed && pipeArray[i].x + pipeArray[i].width < bird.x) {
      pipeArray[i].passed = true;
      pipeArray[i + 1].passed = true;
      score++;
    }
  }

  // Score display
  context.fillStyle = "white";
  context.font = "bold 48px Arial";
  context.textAlign = "center";
  context.strokeStyle = "#333";
  context.lineWidth = 4;
  context.strokeText(score, 20, 50);
  context.fillText(score, 20, 50);
}

// ---- Events ----

function handleAction() {
  if (state === STATE.START) {
    state = STATE.PLAYING;
    velocityY = jumpStrength;
  } else if (state === STATE.PLAYING) {
    velocityY = jumpStrength;
  } else if (state === STATE.GAMEOVER) {
    resetGame();
  }
}

document.addEventListener("keydown", function (e) {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
    e.preventDefault();
    handleAction();
  }
});

board.addEventListener("click", handleAction);
board.addEventListener("touchstart", function (e) {
  e.preventDefault();
  handleAction();
});

// ---- Start ----

setInterval(placePipes, 1500);
update();
