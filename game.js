const TEAMS = [
    { id: 'palmeiras', name: 'Palmeiras', color: '#006437', secondary: '#ffffff' },
    { id: 'flamengo', name: 'Flamengo', color: '#c20000', secondary: '#000000' },
    { id: 'gremio', name: 'Grêmio', color: '#00adef', secondary: '#ffffff' },
    { id: 'atletico-mg', name: 'Atlético-MG', color: '#000000', secondary: '#ffffff' },
    { id: 'botafogo', name: 'Botafogo', color: '#000000', secondary: '#ffffff' },
    { id: 'bragantino', name: 'Bragantino', color: '#ffffff', secondary: '#ff0000' },
    { id: 'fluminense', name: 'Fluminense', color: '#8b0000', secondary: '#006400' },
    { id: 'athletico-pr', name: 'Athletico-PR', color: '#ff0000', secondary: '#000000' },
    { id: 'internacional', name: 'Internacional', color: '#ff0000', secondary: '#ffffff' },
    { id: 'fortaleza', name: 'Fortaleza', color: '#1a3c8a', secondary: '#ff0000' },
    { id: 'sao-paulo', name: 'São Paulo', color: '#ff0000', secondary: '#000000' },
    { id: 'cuiaba', name: 'Cuiabá', color: '#006400', secondary: '#ffff00' },
    { id: 'corinthians', name: 'Corinthians', color: '#000000', secondary: '#ffffff' },
    { id: 'cruzeiro', name: 'Cruzeiro', color: '#0000ff', secondary: '#ffffff' },
    { id: 'vasco', name: 'Vasco', color: '#000000', secondary: '#ffffff' },
    { id: 'bahia', name: 'Bahia', color: '#0000ff', secondary: '#ff0000' },
    { id: 'vitoria', name: 'Vitória', color: '#ff0000', secondary: '#000000' },
    { id: 'juventude', name: 'Juventude', color: '#ffffff', secondary: '#006400' },
    { id: 'atletico-go', name: 'Atlético-GO', color: '#ff0000', secondary: '#000000' },
    { id: 'criciuma', name: 'Criciúma', color: '#ffff00', secondary: '#000000' }
];

const gameState = {
    screen: 'main-menu',
    playerTeam: null,
    aiTeam: null,
    difficulty: 'normal',
    round: 0, // 0: Oitavas, 1: Quartas, 2: Semi, 3: Final
    score: { player: 0, ai: 0 },
    tournamentTeams: [],
    ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 10, speed: 5 },
    playerPaddle: { x: 0, y: 0, width: 20, height: 100, isDragging: false, lastY: 0, velocityY: 0 },
    aiPaddle: { x: 0, y: 0, width: 20, height: 100, speed: 4 }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

// --- Assets Hub ---
const assets = {
    shields: {},
    isLoaded: false
};

async function preLoadAssets() {
    const log = document.getElementById('pre-load-log');
    let loadedCount = 0;

    for (const team of TEAMS) {
        try {
            // Em um cenário real, as imagens estariam em /assets/. 
            // Para demonstração, usamos logos genéricos ou cores.
            const img = new Image();
            img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.replace('#','')}`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => {
                    log.innerHTML += `<p style="color:red">Erro: Escudo de ${team.name} não encontrado.</p>`;
                    reject();
                };
            });
            assets.shields[team.id] = img;
            loadedCount++;
        } catch (e) {
            console.error(e);
        }
    }

    if (loadedCount === TEAMS.length) {
        assets.isLoaded = true;
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
        }, 500);
    }
}

// --- UI Logic ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    gameState.screen = screenId;

    if (screenId === 'team-selection') renderTeams();
    if (screenId === 'game-screen') startGame();
}

function renderTeams() {
    const grid = document.getElementById('teams-grid');
    grid.innerHTML = '';
    TEAMS.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <img class="team-logo" src="${assets.shields[team.id].src}" alt="${team.name}">
            <span class="team-name">${team.name}</span>
        `;
        card.onclick = () => selectTeam(team, card);
        grid.appendChild(card);
    });
}

function selectTeam(team, card) {
    document.querySelectorAll('.team-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    gameState.playerTeam = team;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('start-btn').onclick = () => {
        gameState.difficulty = document.getElementById('difficulty-level').value;
        startTournament();
    };
}

// --- Tournament Logic ---
function startTournament() {
    gameState.round = 0;
    // Shuffle and pick 16 teams
    const others = TEAMS.filter(t => t.id !== gameState.playerTeam.id);
    const shuffled = others.sort(() => 0.5 - Math.random());
    gameState.tournamentTeams = [gameState.playerTeam, ...shuffled.slice(0, 15)];
    setupMatch();
}

function setupMatch() {
    const rounds = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Grande Final'];
    document.getElementById('match-info').innerText = rounds[gameState.round];
    
    // Pick AI opponent (always index 1 in the current bracket logic for simplicity)
    gameState.aiTeam = gameState.tournamentTeams[1]; 
    
    document.getElementById('player-shield').src = assets.shields[gameState.playerTeam.id].src;
    document.getElementById('ai-shield').src = assets.shields[gameState.aiTeam.id].src;
    gameState.score = { player: 0, ai: 0 };
    updateScore();
    showScreen('game-screen');
}

function updateScore() {
    document.getElementById('player-points').innerText = gameState.score.player;
    document.getElementById('ai-points').innerText = gameState.score.ai;
}

// --- Game Loop & Physics ---
function startGame() {
    resetBall();
    gameState.playerPaddle.y = canvas.height / 2 - 50;
    gameState.playerPaddle.x = 30;
    gameState.aiPaddle.y = canvas.height / 2 - 50;
    gameState.aiPaddle.x = canvas.width - 50;
    
    requestAnimationFrame(gameLoop);
}

function resetBall() {
    gameState.ball.x = canvas.width / 2;
    gameState.ball.y = canvas.height / 2;
    gameState.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
    gameState.ball.dy = (Math.random() - 0.5) * 4;
    
    // Set speed based on difficulty
    const speeds = { normal: 4, hard: 6, 'super-hard': 8 };
    gameState.ball.speed = speeds[gameState.difficulty];
}

// Mouse Controls (Mouse Drag Logic per documentation)
canvas.addEventListener('mousedown', (e) => {
    gameState.playerPaddle.isDragging = true;
    const rect = canvas.getBoundingClientRect();
    gameState.playerPaddle.lastY = e.clientY - rect.top;
});

window.addEventListener('mouseup', () => {
    gameState.playerPaddle.isDragging = false;
    gameState.playerPaddle.velocityY = 0;
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameState.playerPaddle.isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    
    // Deslocamento físico traduzido em movimento
    const deltaY = currentY - gameState.playerPaddle.lastY;
    gameState.playerPaddle.y += deltaY;
    
    // Transferência de Energia (velocidade do arraste)
    gameState.playerPaddle.velocityY = deltaY;
    
    // Constraints
    if (gameState.playerPaddle.y < 0) gameState.playerPaddle.y = 0;
    if (gameState.playerPaddle.y > canvas.height - gameState.playerPaddle.height) 
        gameState.playerPaddle.y = canvas.height - gameState.playerPaddle.height;
    
    gameState.playerPaddle.lastY = currentY;
});

function update() {
    const ball = gameState.ball;
    const p1 = gameState.playerPaddle;
    const ai = gameState.aiPaddle;

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall bounce
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // AI Logic (Per Documentation)
    const aiCenter = ai.y + ai.height / 2;
    let aiSpeed = 3;
    if (gameState.difficulty === 'hard') aiSpeed = 5;
    if (gameState.difficulty === 'super-hard') aiSpeed = 8;

    if (ball.dx > 0) { // Only move when ball is coming
        if (gameState.difficulty === 'normal') {
            if (ball.x > canvas.width / 2) {
                if (aiCenter < ball.y - 10) ai.y += aiSpeed;
                else if (aiCenter > ball.y + 10) ai.y -= aiSpeed;
            }
        } else {
            // Hard/Super Hard move faster and always track
            if (aiCenter < ball.y - 10) ai.y += aiSpeed;
            else if (aiCenter > ball.y + 10) ai.y -= aiSpeed;
        }
    }

    // AI Constraints
    if (ai.y < 0) ai.y = 0;
    if (ai.y > canvas.height - ai.height) ai.y = canvas.height - ai.height;

    // Collisions
    checkPaddleCollision(ball, p1, true);
    checkPaddleCollision(ball, ai, false);

    // Scoring
    if (ball.x < 0) {
        gameState.score.ai++;
        checkWin();
        resetBall();
    } else if (ball.x > canvas.width) {
        gameState.score.player++;
        checkWin();
        resetBall();
    }
}

function checkPaddleCollision(ball, paddle, isPlayer) {
    if (ball.x + ball.radius > paddle.x && 
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y && 
        ball.y - ball.radius < paddle.y + paddle.height) {
        
        ball.dx *= -1;
        
        // Transferência de energia: se o jogador estava arrastando rápido, a bola acelera
        if (isPlayer && Math.abs(paddle.velocityY) > 5) {
            ball.dx *= 1.2; // Speed up
            ball.dy += paddle.velocityY * 0.2; // Add spin/angle
        }
        
        // Posicionamento extra para evitar "colar" na raquete
        ball.x = isPlayer ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;
    }
}

function checkWin() {
    updateScore();
    if (gameState.score.player >= 12 || gameState.score.ai >= 12) {
        const winner = gameState.score.player >= 12 ? 'player' : 'ai';
        if (winner === 'player') {
            if (gameState.round === 3) {
                alert('PARABÉNS! VOCÊ É O CAMPEÃO BRASILEIRO!');
                showScreen('main-menu');
            } else {
                alert('Você venceu! Indo para a próxima fase.');
                gameState.round++;
                setupMatch();
            }
        } else {
            alert('Eliminado! Seu time lutou bem.');
            showScreen('main-menu');
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Table Line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Player Paddle
    ctx.fillStyle = gameState.playerTeam ? gameState.playerTeam.color : '#fff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(gameState.playerPaddle.x, gameState.playerPaddle.y, gameState.playerPaddle.width, gameState.playerPaddle.height);
    
    // Draw AI Paddle
    ctx.fillStyle = gameState.aiTeam ? gameState.aiTeam.color : '#fff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(gameState.aiPaddle.x, gameState.aiPaddle.y, gameState.aiPaddle.width, gameState.aiPaddle.height);

    // Draw Ball
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (gameState.screen !== 'game-screen') return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
preLoadAssets();
