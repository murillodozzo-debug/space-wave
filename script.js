const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const startScreen = document.getElementById("startScreen");
const gameBg = document.getElementById("gameBg");

let gameStarted = false;
let gameOver = false;
let score = 0;
let bestScore = 0;
let lastTime = 0;
let obstacleTimer = 0;
let particles = [];
let speed = 4.4;
let shake = 0;
let isHolding = false;

const player = {
  x: 120,
  y: canvas.height / 2,
  vy: 0,
  tilt: 0
};

const obstacles = [];
const flames = [];

function resetGame() {
  player.y = canvas.height / 2;
  player.vy = 0;
  player.tilt = 0;
  obstacles.length = 0;
  particles.length = 0;
  flames.length = 0;
  score = 0;
  obstacleTimer = 0;
  speed = 4.4;
  shake = 0;
  gameOver = false;
  gameStarted = true;
  isHolding = false;
  startScreen.style.display = "none";
  gameBg.classList.add("active");
  statusEl.textContent = "Jogo iniciado";
  scoreEl.textContent = "Score: 0";
}

function getDifficulty() {
  return Math.floor(score / 250);
}

function getGapSize() {
  const difficulty = getDifficulty();
  return Math.max(92, 220 - difficulty * 10);
}

function getSpawnDelay() {
  const difficulty = getDifficulty();
  return Math.max(420, 760 - difficulty * 28);
}

function getObstacleSpeed() {
  const difficulty = getDifficulty();
  return speed + Math.min(score / 850, 6) + difficulty * 0.18;
}

function spawnObstacle() {
  const difficulty = getDifficulty();
  const typeRoll = Math.random();

  if (difficulty >= 3 && typeRoll > 0.6) {
    const tunnelHeight = 150 + Math.min(difficulty * 5, 40);
    const tunnelY = 90 + Math.random() * (canvas.height - tunnelHeight - 180);
    obstacles.push({
      x: canvas.width + 50,
      type: "tunnel",
      y: tunnelY,
      h: tunnelHeight,
      w: 54,
      speed: getObstacleSpeed() + 0.4
    });
    return;
  }

  const gapSize = getGapSize();
  const gapY = 40 + Math.random() * (canvas.height - gapSize - 80);

  obstacles.push({
    x: canvas.width + 50,
    type: typeRoll > 0.5 ? "triangle" : "spike",
    w: 42 + Math.floor(Math.random() * 10),
    gapY,
    gapSize,
    speed: getObstacleSpeed()
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: -Math.random() * 3.8 - 0.5,
      vy: (Math.random() - 0.5) * 3.2,
      life: 28 + Math.random() * 18,
      color
    });
  }
}

function spawnFlame() {
  flames.push({
    x: player.x - 38,
    y: player.y + (Math.random() - 0.5) * 8,
    vx: -Math.random() * 4 - 2.5,
    vy: (Math.random() - 0.5) * 1.1,
    life: 18 + Math.random() * 10
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = flames.length - 1; i >= 0; i--) {
    const f = flames[i];
    f.x += f.vx;
    f.y += f.vy;
    f.life--;
    if (f.life <= 0) flames.splice(i, 1);
  }
}

function flap() {
  if (!gameStarted) {
    gameStarted = true;
    startScreen.style.display = "none";
    gameBg.classList.add("active");
    statusEl.textContent = "Jogo iniciado";
  }
  if (gameOver) return;
  player.vy = -8.5;
}

function update(delta) {
  if (!gameStarted || gameOver) return;

  if (isHolding) {
    player.vy -= 0.5;
    if (player.vy < -9.5) player.vy = -9.5;
  } else {
    player.vy += 0.38;
  }

  player.vy *= 0.98;
  player.y += player.vy;
  player.tilt = Math.max(-0.7, Math.min(0.7, -player.vy * 0.08));

  if (player.y < 20) {
    player.y = 20;
    player.vy = 0;
  }
  if (player.y > canvas.height - 20) {
    player.y = canvas.height - 20;
    player.vy = 0;
  }

  spawnFlame();

  obstacleTimer += delta;
  if (obstacleTimer > getSpawnDelay()) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  for (const ob of obstacles) {
    ob.x -= ob.speed;
    if (ob.type === "tunnel") {
      burst(ob.x + ob.w, ob.y, "#7df9ff", 1);
      burst(ob.x + ob.w, ob.y + ob.h, "#ff9cf0", 1);
    } else {
      burst(ob.x + ob.w, ob.gapY - 4, "#ff9cf0", 1);
      burst(ob.x + ob.w, ob.gapY + ob.gapSize + 4, "#7df9ff", 1);
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].x + obstacles[i].w < 0) {
      obstacles.splice(i, 1);
      score += 10;
    }
  }

  for (const ob of obstacles) {
    const px = player.x;
    const py = player.y;
    const shipW = 30;
    const shipH = 16;

    if (ob.type === "tunnel") {
      const hitX = px + shipW > ob.x && px - shipW < ob.x + ob.w;
      const hitY = py - shipH < ob.y || py + shipH > ob.y + ob.h;
      if (hitX && hitY) {
        gameOver = true;
        shake = 14;
        bestScore = Math.max(bestScore, Math.floor(score));
        statusEl.textContent = "Game Over! Pressione Espaço para reiniciar";
        startScreen.style.display = "flex";
        gameBg.classList.remove("active");
        startScreen.querySelector("h2").textContent = "GAME OVER";
        startScreen.querySelector(".start-hint").textContent = "Pressione Espaço para reiniciar";
        break;
      }
      continue;
    }

    const hitX = px + shipW > ob.x && px - shipW < ob.x + ob.w;
    const hitTop = py - shipH < ob.gapY;
    const hitBottom = py + shipH > ob.gapY + ob.gapSize;

    if (hitX && (hitTop || hitBottom)) {
      gameOver = true;
      shake = 14;
      bestScore = Math.max(bestScore, Math.floor(score));
      statusEl.textContent = "Game Over! Pressione Espaço para reiniciar";
      startScreen.style.display = "flex";
      gameBg.classList.remove("active");
      startScreen.querySelector("h2").textContent = "GAME OVER";
      startScreen.querySelector(".start-hint").textContent = "Pressione Espaço para reiniciar";
      break;
    }
  }

  speed += delta * 0.00002;
  score += delta * 0.01 * (speed / 4.4);
  bestScore = Math.max(bestScore, Math.floor(score));
  scoreEl.textContent = `Score: ${Math.floor(score)} | Best: ${bestScore}`;

  updateParticles();
}

function drawObstacle(ob) {
  ctx.save();

  if (ob.type === "tunnel") {
    const grad = ctx.createLinearGradient(ob.x, 0, ob.x + ob.w, 0);
    grad.addColorStop(0, "#ff4fd8");
    grad.addColorStop(0.5, "#7df9ff");
    grad.addColorStop(1, "#ff4fd8");
    ctx.fillStyle = grad;

    ctx.fillRect(ob.x, 0, ob.w, ob.y);
    ctx.fillRect(ob.x, ob.y + ob.h, ob.w, canvas.height - (ob.y + ob.h));

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

    ctx.beginPath();
    ctx.moveTo(ob.x, ob.y);
    ctx.lineTo(ob.x + ob.w / 2, ob.y + ob.h / 2);
    ctx.lineTo(ob.x, ob.y + ob.h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ob.x + ob.w, ob.y);
    ctx.lineTo(ob.x + ob.w / 2, ob.y + ob.h / 2);
    ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
    ctx.stroke();

    ctx.restore();
    return;
  }

  const centerX = ob.x + ob.w / 2;
  const topEnd = ob.gapY;
  const bottomStart = ob.gapY + ob.gapSize;

  const grad = ctx.createLinearGradient(ob.x, 0, ob.x + ob.w, 0);
  grad.addColorStop(0, "#ff4fd8");
  grad.addColorStop(0.5, "#7df9ff");
  grad.addColorStop(1, "#ff4fd8");
  ctx.fillStyle = grad;

  if (ob.type === "spike") {
    ctx.beginPath();
    ctx.moveTo(ob.x, 0);
    ctx.lineTo(ob.x + ob.w, 0);
    ctx.lineTo(centerX, topEnd);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ob.x, canvas.height);
    ctx.lineTo(ob.x + ob.w, canvas.height);
    ctx.lineTo(centerX, bottomStart);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(ob.x, 0);
    ctx.lineTo(ob.x + ob.w, 0);
    ctx.lineTo(centerX, topEnd);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ob.x, canvas.height);
    ctx.lineTo(ob.x + ob.w, canvas.height);
    ctx.lineTo(centerX, bottomStart);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(ob.x, 0);
  ctx.lineTo(centerX, topEnd);
  ctx.lineTo(ob.x + ob.w, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ob.x, canvas.height);
  ctx.lineTo(centerX, bottomStart);
  ctx.lineTo(ob.x + ob.w, canvas.height);
  ctx.stroke();

  ctx.restore();
}

function drawShip(x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  for (const f of flames) {
    const alpha = Math.max(0, f.life / 30);
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = "rgba(90, 190, 255, 0.9)";
    ctx.beginPath();
    ctx.ellipse(-34, 0, 10 + (30 - f.life) * 0.5, 4 + (30 - f.life) * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 36);
  glow.addColorStop(0, "rgba(125,249,255,0.9)");
  glow.addColorStop(0.45, "rgba(255,79,216,0.25)");
  glow.addColorStop(1, "rgba(255,79,216,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "#7df9ff";
  ctx.shadowBlur = 18;

  ctx.fillStyle = "#eaf2ff";
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(14, -8);
  ctx.lineTo(2, -14);
  ctx.lineTo(-18, -10);
  ctx.lineTo(-34, 0);
  ctx.lineTo(-18, 10);
  ctx.lineTo(2, 14);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#b8c8e8";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(4, -8);
  ctx.lineTo(-10, 0);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7df9ff";
  ctx.beginPath();
  ctx.ellipse(-4, 0, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff4fd8";
  ctx.beginPath();
  ctx.moveTo(-24, -5);
  ctx.lineTo(-40, 0);
  ctx.lineTo(-24, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.ellipse(9, -4, 5, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGameOverText() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 76px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 18);
  ctx.font = "bold 22px Arial";
  ctx.fillText("Pressione Espaço para reiniciar", canvas.width / 2, canvas.height / 2 + 42);
  ctx.restore();
}

function draw() {
  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.92;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const flame of flames) {
    ctx.fillStyle = "rgba(125,249,255,0.6)";
    ctx.fillRect(flame.x, flame.y, 2, 2);
  }

  for (const ob of obstacles) {
    drawObstacle(ob);
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 50);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  ctx.globalAlpha = 1;

  drawShip(player.x, player.y, player.tilt);

  if (!gameStarted) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameOver) drawGameOverText();

  ctx.restore();
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    isHolding = true;
    if (!gameStarted || gameOver) resetGame();
    flap();
    e.preventDefault();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    isHolding = false;
  }
});

document.addEventListener("mousedown", () => {
  isHolding = true;
  if (!gameStarted || gameOver) resetGame();
});

document.addEventListener("mouseup", () => {
  isHolding = false;
});

canvas.addEventListener("mousedown", () => {
  isHolding = true;
  if (!gameStarted || gameOver) resetGame();
});

canvas.addEventListener("mouseup", () => {
  isHolding = false;
});

startScreen.style.display = "flex";
gameBg.classList.remove("active");
requestAnimationFrame(loop);