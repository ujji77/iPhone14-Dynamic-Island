// Dino Game Logic for Dynamic Island

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('.score');
const startMessage = document.querySelector('.start-message');
const notchContainer = document.querySelector('.notch-container');
const highScoreElement = document.querySelector('.high-score');

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const GROUND_Y = 70;
const DINO_X = 20;

// Game State
let gameState = 'idle'; // idle, playing, gameover
let score = 0;
let highScore = 0;
let gameSpeed = 5;
let animationFrameId;

// View State
let currentView = 'compact'; // compact, minimal, expanded

// Dino Object
const dino = {
    x: DINO_X,
    y: GROUND_Y,
    width: 20,
    height: 20,
    dy: 0,
    jump: function () {
        if (this.y === GROUND_Y) {
            this.dy = JUMP_FORCE;
        }
    },
    update: function () {
        this.y += this.dy;
        if (this.y < GROUND_Y) {
            this.dy += GRAVITY;
        } else {
            this.y = GROUND_Y;
            this.dy = 0;
        }
    },
    draw: function () {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    }
};

// Obstacles
let obstacles = [];
const MIN_OBSTACLE_GAP = 150;

function createObstacle() {
    const obstacle = {
        x: canvas.width,
        y: GROUND_Y,
        width: 15,
        height: 20,
        markedForDeletion: false
    };
    obstacles.push(obstacle);
}

function handleObstacles() {
    if (obstacles.length === 0 || canvas.width - obstacles[obstacles.length - 1].x > MIN_OBSTACLE_GAP + Math.random() * 100) {
        if (Math.random() < 0.02) {
            createObstacle();
        }
    }

    obstacles.forEach(obstacle => {
        obstacle.x -= gameSpeed;
        ctx.fillStyle = '#ff5555'; // Reddish for danger
        ctx.fillRect(obstacle.x, obstacle.y - obstacle.height, obstacle.width, obstacle.height);

        // Collision Detection
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            gameOver();
        }

        if (obstacle.x + obstacle.width < 0) {
            obstacle.markedForDeletion = true;
            score++;
            scoreElement.innerText = score.toString().padStart(5, '0');
            if (score % 5 === 0) gameSpeed += 0.2; // Increase speed
        }
    });

    obstacles = obstacles.filter(o => !o.markedForDeletion);
}

// Game Loop
function animate() {
    if (gameState !== 'playing') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Ground
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    dino.update();
    dino.draw();
    handleObstacles();

    animationFrameId = requestAnimationFrame(animate);
}

function startGame() {
    gameState = 'playing';
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    scoreElement.innerText = '00000';
    startMessage.style.display = 'none';
    animate();
}

function gameOver() {
    gameState = 'gameover';
    cancelAnimationFrame(animationFrameId);
    startMessage.innerText = 'Game Over\nTap to Restart';
    startMessage.style.display = 'block';

    if (score > highScore) {
        highScore = score;
        highScoreElement.innerText = `HI ${highScore.toString().padStart(5, '0')}`;
    }
}

// State Management
function setView(view) {
    currentView = view;
    notchContainer.classList.remove('state-compact', 'state-minimal', 'state-expanded');
    notchContainer.classList.add(`state-${view}`);

    if (view === 'expanded') {
        if (gameState === 'idle' || gameState === 'gameover') {
            startGame();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            animate();
        }
    } else if (view === 'minimal') {
        if (gameState === 'playing') {
            gameState = 'paused';
            cancelAnimationFrame(animationFrameId);
        }
    }
}

// Input Handling
function handleInput(e) {
    // Prevent default only if interacting with the game
    if (currentView === 'expanded') {
        if (e.type === 'keydown' && e.code !== 'Space') return;
        e.preventDefault();

        if (gameState === 'playing') {
            dino.jump();
        } else if (gameState === 'gameover') {
            startGame();
        }
    }
}

// Click Handlers
notchContainer.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent bubbling to document
    if (currentView === 'compact' || currentView === 'minimal') {
        setView('expanded');
    }
});

document.addEventListener('click', (e) => {
    if (currentView === 'expanded') {
        // Click outside logic
        if (!notchContainer.contains(e.target)) {
            setView('minimal');
        }
    }
});

window.addEventListener('keydown', handleInput);
notchContainer.addEventListener('touchstart', (e) => {
    if (currentView === 'expanded') {
        handleInput(e);
    }
});

// Initial State
setView('compact');

// Initial Render
ctx.fillStyle = '#fff';
ctx.fillRect(dino.x, dino.y - dino.height, dino.width, dino.height);
ctx.moveTo(0, GROUND_Y);
ctx.lineTo(canvas.width, GROUND_Y);
ctx.stroke();
