// Dimensions & Grid Configuration
const COLS = 15;
const ROWS = 13;
const TILE_SIZE = 48; // Size of each tile in pixels
const CANVAS_WIDTH = COLS * TILE_SIZE;  // 720px
const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 624px

// Tile Types
const TILE = {
    EMPTY: 0,
    HARD_WALL: 1,
    SOFT_BLOCK: 2
};

// PowerUp Types
const POWERUP = {
    NONE: 0,
    BOMB_UP: 1,
    FIRE_UP: 2,
    SPEED_UP: 3,
    SHIELD: 4
};

// Player Definitions
const PLAYER_CONFIGS = [
    { id: 1, name: "P1 (Kuning)", color: "#f59e0b", accent: "#fbbf24", keys: { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", bomb: "Space" } },
    { id: 2, name: "P2 (Biru)", color: "#06b6d4", accent: "#22d3ee", keys: { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", bomb: "Enter" } },
    { id: 3, name: "P3 (Merah)", color: "#f43f5e", accent: "#fb7185", keys: { up: "KeyI", down: "KeyK", left: "KeyJ", right: "KeyL", bomb: "Semicolon" } },
    { id: 4, name: "P4 (Hijau)", color: "#10b981", accent: "#34d399", keys: { up: "KeyT", down: "KeyG", left: "KeyF", right: "KeyH", bomb: "KeyB", altUp: "Numpad8", altDown: "Numpad5", altLeft: "Numpad4", altRight: "Numpad6", altBomb: "Numpad0" } }
];

// Audio System (Web Audio API)
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'place') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'explode') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'powerup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (e) { console.error(e); }
}

function toggleAudio() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById("soundIcon");
    if (soundEnabled) {
        icon.className = "fa-solid fa-volume-high";
    } else {
        icon.className = "fa-solid fa-volume-xmark text-red-400";
    }
}

// State Variables
let canvas, ctx;
let grid = [];
let players = [];
let bombs = [];
let explosions = [];
let powerUps = [];
let keyState = {};
let gameTimer = 120; // 2 Minutes
let timerInterval = null;
let gameOver = false;

class Player {
    constructor(config, startGridX, startGridY) {
        this.id = config.id;
        this.name = config.name;
        this.color = config.color;
        this.accent = config.accent;
        this.keys = config.keys;
        
        this.x = startGridX * TILE_SIZE + TILE_SIZE / 2;
        this.y = startGridY * TILE_SIZE + TILE_SIZE / 2;
        this.radius = TILE_SIZE * 0.38;
        
        this.speed = 2.4;
        this.maxBombs = 1;
        this.activeBombs = 0;
        this.flameRange = 1;
        this.lives = 3;
        this.isShielded = false;
        this.invulnerableTimer = 0;
        this.alive = true;
    }

    update() {
        if (!this.alive) return;

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }

        let dx = 0;
        let dy = 0;

        // Check movements
        if (keyState[this.keys.up] || (this.keys.altUp && keyState[this.keys.altUp])) dy -= 1;
        if (keyState[this.keys.down] || (this.keys.altDown && keyState[this.keys.altDown])) dy += 1;
        if (keyState[this.keys.left] || (this.keys.altLeft && keyState[this.keys.altLeft])) dx -= 1;
        if (keyState[this.keys.right] || (this.keys.altRight && keyState[this.keys.altRight])) dx += 1;

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        // Proposed new position
        let newX = this.x + dx * this.speed;
        let newY = this.y + dy * this.speed;

        // Collision Check with walls/blocks/bombs
        if (!checkWallCollision(newX, this.y, this.radius)) this.x = newX;
        if (!checkWallCollision(this.x, newY, this.radius)) this.y = newY;

        // Powerup collection
        checkPowerUpCollision(this);
    }

    draw(ctx) {
        if (!this.alive) return;

        // Invulnerability Blink Effect
        if (this.invulnerableTimer % 10 > 5) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shield Aura Effect
        if (this.isShielded) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(52, 211, 153, 0.3)";
            ctx.strokeStyle = "#34d399";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        }

        // Body Circle
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.accent;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        // Inner Character Face
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        // Eyes
        ctx.beginPath();
        ctx.arc(-6, -4, 4, 0, Math.PI * 2);
        ctx.arc(6, -4, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(-5, -4, 2, 0, Math.PI * 2);
        ctx.arc(7, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Player Tag Indicator
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 11px Nunito";
        ctx.textAlign = "center";
        ctx.fillText(`P${this.id}`, 0, -this.radius - 6);

        ctx.restore();
    }

    placeBomb() {
        if (!this.alive || this.activeBombs >= this.maxBombs) return;

        const gx = Math.floor(this.x / TILE_SIZE);
        const gy = Math.floor(this.y / TILE_SIZE);

        // Ensure no existing bomb at position
        if (!bombs.some(b => b.gx === gx && b.gy === gy)) {
            bombs.push(new Bomb(gx, gy, this.flameRange, this));
            this.activeBombs++;
            playSound('place');
        }
    }

    hit() {
        if (this.invulnerableTimer > 0 || !this.alive) return;

        if (this.isShielded) {
            this.isShielded = false;
            this.invulnerableTimer = 60; // 1 sec invulnerability
            playSound('powerup');
            return;
        }

        this.lives--;
        playSound('hit');
        updateLivesUI();

        if (this.lives <= 0) {
            this.alive = false;
            checkVictoryCondition();
        } else {
            this.invulnerableTimer = 90; // 1.5 seconds invulnerability
        }
    }
}

class Bomb {
    constructor(gx, gy, range, owner) {
        this.gx = gx;
        this.gy = gy;
        this.range = range;
        this.owner = owner;
        this.timer = 180; // 3 seconds at 60fps
        this.pulse = 0;
    }

    update() {
        this.timer--;
        this.pulse += 0.1;
        if (this.timer <= 0) {
            this.explode();
        }
    }

    draw(ctx) {
        const x = this.gx * TILE_SIZE + TILE_SIZE / 2;
        const y = this.gy * TILE_SIZE + TILE_SIZE / 2;
        const scale = 1 + Math.sin(this.pulse) * 0.08;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Bomb Body
        ctx.beginPath();
        ctx.arc(0, 2, TILE_SIZE * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bomb Fuse Spark
        ctx.beginPath();
        ctx.arc(5, -12, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();

        ctx.restore();
    }

    explode() {
        // Remove bomb from owner active count
        if (this.owner) this.owner.activeBombs--;

        // Remove from global list
        bombs = bombs.filter(b => b !== this);

        playSound('explode');

        // Create Explosion Rays
        const affectedTiles = [{ gx: this.gx, gy: this.gy }];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ];

        directions.forEach(dir => {
            for (let r = 1; r <= this.range; r++) {
                const targetX = this.gx + dir.x * r;
                const targetY = this.gy + dir.y * r;

                if (targetX < 0 || targetX >= COLS || targetY < 0 || targetY >= ROWS) break;

                const tile = grid[targetY][targetX];

                if (tile === TILE.HARD_WALL) {
                    break; // Stopped by hard wall
                }

                affectedTiles.push({ gx: targetX, gy: targetY });

                if (tile === TILE.SOFT_BLOCK) {
                    // Destroy soft block & spawn powerup chance
                    grid[targetY][targetX] = TILE.EMPTY;
                    maybeSpawnPowerUp(targetX, targetY);
                    break; // Stop ray after destroying soft block
                }
            }
        });

        explosions.push(new Explosion(affectedTiles));
    }
}

class Explosion {
    constructor(tiles) {
        this.tiles = tiles;
        this.timer = 25; // Duration in frames
    }

    update() {
        this.timer--;

        // Check damage on players
        this.tiles.forEach(t => {
            players.forEach(player => {
                const px = Math.floor(player.x / TILE_SIZE);
                const py = Math.floor(player.y / TILE_SIZE);
                if (px === t.gx && py === t.gy) {
                    player.hit();
                }
            });

            // Chain explosion for other bombs
            bombs.forEach(b => {
                if (b.gx === t.gx && b.gy === t.gy) {
                    b.timer = 0;
                }
            });
        });
    }

    draw(ctx) {
        ctx.fillStyle = "#f43f5e";
        this.tiles.forEach(t => {
            const x = t.gx * TILE_SIZE;
            const y = t.gy * TILE_SIZE;

            ctx.save();
            ctx.fillStyle = "rgba(251, 113, 133, 0.8)";
            ctx.shadowColor = "#f43f5e";
            ctx.shadowBlur = 12;
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.restore();
        });
    }
}

function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            // Fixed Outer Walls and Grid Hard Walls
            if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 || (r % 2 === 0 && c % 2 === 0)) {
                row.push(TILE.HARD_WALL);
            } else {
                // Reserve player spawn safe zones (Corners)
                const isSpawnZone =
                    (r <= 2 && c <= 2) || // Top-Left P1
                    (r <= 2 && c >= COLS - 3) || // Top-Right P2
                    (r >= ROWS - 3 && c <= 2) || // Bottom-Left P3
                    (r >= ROWS - 3 && c >= COLS - 3); // Bottom-Right P4

                if (!isSpawnZone && Math.random() < 0.65) {
                    row.push(TILE.SOFT_BLOCK);
                } else {
                    row.push(TILE.EMPTY);
                }
            }
        }
        grid.push(row);
    }
}

function checkWallCollision(x, y, radius) {
    const left = Math.floor((x - radius) / TILE_SIZE);
    const right = Math.floor((x + radius) / TILE_SIZE);
    const top = Math.floor((y - radius) / TILE_SIZE);
    const bottom = Math.floor((y + radius) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                if (grid[r][c] !== TILE.EMPTY) return true;
                // Check Bomb Collision
                if (bombs.some(b => b.gx === c && b.gy === r)) return true;
            }
        }
    }
    return false;
}

function maybeSpawnPowerUp(gx, gy) {
    if (Math.random() < 0.35) { // 35% Chance for powerup
        const types = [POWERUP.BOMB_UP, POWERUP.FIRE_UP, POWERUP.SPEED_UP, POWERUP.SHIELD];
        const chosen = types[Math.floor(Math.random() * types.length)];
        powerUps.push({ gx, gy, type: chosen });
    }
}

function checkPowerUpCollision(player) {
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);

    powerUps = powerUps.filter(p => {
        if (p.gx === px && p.gy === py) {
            playSound('powerup');
            if (p.type === POWERUP.BOMB_UP) player.maxBombs++;
            if (p.type === POWERUP.FIRE_UP) player.flameRange++;
            if (p.type === POWERUP.SPEED_UP) player.speed = Math.min(player.speed + 0.6, 4.2);
            if (p.type === POWERUP.SHIELD) player.isShielded = true;
            return false; // Remove collected powerup
        }
        return true;
    });
}

function drawPowerUps(ctx) {
    powerUps.forEach(p => {
        const x = p.gx * TILE_SIZE + TILE_SIZE / 2;
        const y = p.gy * TILE_SIZE + TILE_SIZE / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let symbol = "⭐";
        if (p.type === POWERUP.BOMB_UP) symbol = "💣";
        if (p.type === POWERUP.FIRE_UP) symbol = "🔥";
        if (p.type === POWERUP.SPEED_UP) symbol = "⚡";
        if (p.type === POWERUP.SHIELD) symbol = "🛡️";

        ctx.fillText(symbol, 0, 0);
        ctx.restore();
    });
}

function drawMap(ctx) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            if (grid[r][c] === TILE.HARD_WALL) {
                // Concrete Unbreakable Wall
                ctx.fillStyle = "#1e293b";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "#0f172a";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (grid[r][c] === TILE.SOFT_BLOCK) {
                // Breakable Wood / Brick Block
                ctx.fillStyle = "#78350f";
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.strokeStyle = "#92400e";
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else {
                // Ground Floor Pattern
                ctx.fillStyle = (r + c) % 2 === 0 ? "#0f172a" : "#1e293b";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function updateLivesUI() {
    players.forEach(p => {
        const heartElem = document.getElementById(`p${p.id}Hearts`);
        const cardElem = document.getElementById(`p${p.id}Card`);
        
        if (heartElem) {
            heartElem.innerText = "❤️".repeat(Math.max(0, p.lives));
        }

        if (cardElem && !p.alive) {
            cardElem.classList.add("player-dead");
        }
    });
}

function checkVictoryCondition() {
    const alivePlayers = players.filter(p => p.alive);

    if (alivePlayers.length <= 1 && !gameOver) {
        gameOver = true;
        clearInterval(timerInterval);

        const overlay = document.getElementById("victoryOverlay");
        const winnerText = document.getElementById("winnerText");
        const winnerSub = document.getElementById("winnerSub");
        const winnerEmoji = document.getElementById("winnerEmoji");

        overlay.classList.remove("hidden");
        overlay.classList.add("flex");

        if (alivePlayers.length === 1) {
            const w = alivePlayers[0];
            winnerText.innerText = `${w.name.toUpperCase()} MENANG!`;
            winnerSub.innerText = "Tahniah! Anda adalah juara pertempuran bom hari ini!";
            winnerEmoji.innerText = "🏆";
        } else {
            winnerText.innerText = "SERI!";
            winnerSub.innerText = "Semua pemain telah terhapus dalam perlawanan.";
            winnerEmoji.innerText = "💥";
        }
    }
}

function startTimer() {
    gameTimer = 120;
    const timerDisplay = document.getElementById("timerDisplay");

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        gameTimer--;
        const mins = Math.floor(gameTimer / 60).toString().padStart(2, '0');
        const secs = (gameTimer % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `${mins}:${secs}`;

        if (gameTimer <= 0) {
            clearInterval(timerInterval);
            gameOver = true;
            checkVictoryCondition();
        }
    }, 1000);
}

function gameLoop() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!gameOver) {
        // Update Game Objects
        players.forEach(p => p.update());
        bombs.forEach(b => b.update());
        explosions.forEach(e => e.update());
        explosions = explosions.filter(e => e.timer > 0);
    }

    // Render Game Objects
    drawMap(ctx);
    drawPowerUps(ctx);
    bombs.forEach(b => b.draw(ctx));
    explosions.forEach(e => e.draw(ctx));
    players.forEach(p => p.draw(ctx));

    requestAnimationFrame(gameLoop);
}

function restartGame() {
    initAudio();
    gameOver = false;
    document.getElementById("victoryOverlay").classList.add("hidden");
    document.getElementById("victoryOverlay").classList.remove("flex");

    // Clear Player Dead Classes
    PLAYER_CONFIGS.forEach(c => {
        const cardElem = document.getElementById(`p${c.id}Card`);
        if (cardElem) cardElem.classList.remove("player-dead");
    });

    initGrid();
    bombs = [];
    explosions = [];
    powerUps = [];

    // Spawn 4 Players in corners
    players = [
        new Player(PLAYER_CONFIGS[0], 1, 1),             // P1 Top Left
        new Player(PLAYER_CONFIGS[1], COLS - 2, 1),        // P2 Top Right
        new Player(PLAYER_CONFIGS[2], 1, ROWS - 2),        // P3 Bottom Left
        new Player(PLAYER_CONFIGS[3], COLS - 2, ROWS - 2)  // P4 Bottom Right
    ];

    updateLivesUI();
    startTimer();
}

// Event Listeners for Keyboard
window.addEventListener("keydown", (e) => {
    initAudio();
    keyState[e.code] = true;

    // Check bomb placement keypress trigger
    players.forEach(p => {
        if (e.code === p.keys.bomb || (p.keys.altBomb && e.code === p.keys.altBomb)) {
            p.placeBomb();
        }
    });
});

window.addEventListener("keyup", (e) => {
    keyState[e.code] = false;
});

// Window Load Initialization
window.onload = function () {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    restartGame();
    gameLoop();
};