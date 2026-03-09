/**
 * PING BRASIL 2.0 - CAMPEONATO BRASILEIRO
 * Mapeamento de Controle 3D:
 * Setas Esquerda/Direita: Lateral (Cantos da mesa)
 * Seta Cima: Avançar (Rede)
 * Seta Baixo: Recuar (Linha de fundo)
 */

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

const state = {
    screen: 'loading',
    playerTeam: null,
    aiTeam: null,
    difficulty: 'normal',
    score: { player: 0, ai: 0 },
    round: 0, 
    ball: { x: 400, y: 250, vx: 5, vy: 3, radius: 8, speed: 5 },
    player: {
        x: 60, y: 250, 
        radius: 35, // Anatomica (Borracha)
        handleWidth: 12, handleHeight: 45,
        targetX: 60, targetY: 250,
        isDragging: false
    },
    ai: {
        x: 740, y: 250, 
        radius: 35,
        handleWidth: 12, handleHeight: 45,
        speed: 3
    },
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

const assets = { shields: {}, loaded: 0 };

async function initAntigravityProtocol() {
    const log = document.getElementById('pre-load-log');
    const logOut = (msg) => {
        log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    };

    logOut("Ativando Sistema de Estabilidade...");
    for (const team of TEAMS) {
        try {
            const img = new Image();
            img.src = `${team.id}.png`; 
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = () => {
                    img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.substring(1)}`;
                    img.onload = resolve;
                };
            });
            assets.shields[team.id] = img;
            assets.loaded++;
        } catch (e) {}
    }
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        showScreen('main-menu');
    }, 1000);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    state.screen = id;
}

function renderTeams() {
    const grid = document.getElementById('teams-grid');
    grid.innerHTML = '';
    TEAMS.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<img class="team-logo-ui" src="${assets.shields[team.id].src}"><div class="team-name-ui">${team.name}</div>`;
        card.onclick = () => {
            document.querySelectorAll('.team-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.playerTeam = team;
            document.getElementById('start-btn').disabled = false;
        };
        grid.appendChild(card);
    });
}

document.getElementById('start-btn').onclick = () => {
    state.difficulty = document.getElementById('difficulty-level').value;
    state.round = 0;
    startMatch();
};

function startMatch() {
    state.score = { player: 0, ai: 0 };
    updateHUD();
    const pool = TEAMS.filter(t => t.id !== state.playerTeam.id);
    state.aiTeam = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('player-shield').src = assets.shields[state.playerTeam.id].src;
    document.getElementById('ai-shield').src = assets.shields[state.aiTeam.id].src;
    const rounds = ['OITAVAS', 'QUARTAS', 'SEMIFINAL', 'FINAL'];
    document.getElementById('match-info').innerText = rounds[state.round] + " DE FINAL";
    showScreen('game-screen');
    resetPositions();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('player-points').innerText = state.score.player;
    document.getElementById('ai-points').innerText = state.score.ai;
}

function resetPositions() {
    const speeds = { normal: 4, hard: 6, 'super-hard': 9 };
    state.ball.speed = speeds[state.difficulty];
    state.ball.x = 400;
    state.ball.y = 250;
    state.ball.vx = (Math.random() > 0.5 ? 1 : -1) * state.ball.speed;
    state.ball.vy = (Math.random() - 0.5) * 6;
    state.player.x = 80;
    state.player.y = 250;
}

window.addEventListener('keydown', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = true; });
window.addEventListener('keyup', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = false; });
canvas.addEventListener('mousedown', () => state.player.isDragging = true);
window.addEventListener('mouseup', () => state.player.isDragging = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    state.player.targetX = e.clientX - rect.left;
    state.player.targetY = e.clientY - rect.top;
});

function update() {
    if (state.screen !== 'game-screen') return;
    const p = state.player;
    const ai = state.ai;
    const b = state.ball;

    // CONTROLE 3D (Teclado)
    let moveSpeed = 6;
    if (state.keys.ArrowUp) p.x += moveSpeed; // Frente (Rede)
    if (state.keys.ArrowDown) p.x -= moveSpeed; // Tras (Fundo)
    if (state.keys.ArrowLeft) p.y -= moveSpeed; // Lateral (Cantos)
    if (state.keys.ArrowRight) p.y += moveSpeed; // Lateral (Cantos)

    if (p.isDragging) {
        p.x += (p.targetX - p.x) * 0.2;
        p.y += (p.targetY - p.y) * 0.2;
    }

    // Limites Mesa Player
    if (p.x < 40) p.x = 40;
    if (p.x > 360) p.x = 360; // Nao passa da rede
    if (p.y < 40) p.y = 40;
    if (p.y > 460) p.y = 460;

    // IA - Inteligencia e Dificuldade
    let aiSpeedY = 3;
    let aiSpeedX = 2;
    if (state.difficulty === 'hard') { aiSpeedY = 5; aiSpeedX = 4; }
    if (state.difficulty === 'super-hard') { aiSpeedY = 12; aiSpeedX = 8; }

    // IA Movimento X (Depth)
    if (state.difficulty === 'super-hard') {
        if (b.vx > 0) ai.x += (500 - ai.x) * 0.1; // Avanca para pressionar
        else ai.x += (720 - ai.x) * 0.1;
    } else {
        ai.x += (740 - ai.x) * 0.1; // Fica mais no fundo
    }

    // IA Movimento Y (Track ball)
    if (b.vx > 0) {
        if (ai.y < b.y - 10) ai.y += aiSpeedY;
        else if (ai.y > b.y + 10) ai.y -= aiSpeedY;
    }

    // Limites IA
    if (ai.x < 440) ai.x = 440;
    if (ai.x > 760) ai.x = 760;
    if (ai.y < 40) ai.y = 40;
    if (ai.y > 460) ai.y = 460;

    // Fisica Bola
    b.x += b.vx;
    b.y += b.vy;
    if (b.y < b.radius || b.y > canvas.height - b.radius) b.vy *= -1;

    // Colisao Anatomica
    checkCollision(b, p, true);
    checkCollision(b, ai, false);

    // Score a 6 Pontos
    if (b.x < 0) { state.score.ai++; finishPoint(); }
    else if (b.x > canvas.width) { state.score.player++; finishPoint(); }
}

function finishPoint() {
    updateHUD();
    if (state.score.player >= 6) {
        state.round++;
        if (state.round > 3) { alert("CAMPEAO! TAÇA DO BRASILEIRÃO É SUA!"); showScreen('main-menu'); }
        else { alert("Vitoria! Proxima Fase."); startMatch(); }
    } else if (state.score.ai >= 6) {
        alert("Eliminado! Tente novamente."); showScreen('main-menu');
    } else { resetPositions(); }
}

function checkCollision(ball, paddle, isPlayer) {
    const dx = ball.x - paddle.x;
    const dy = ball.y - paddle.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < ball.radius + paddle.radius) {
        const angle = Math.atan2(dy, dx);
        ball.vx = (isPlayer ? 1 : -1) * Math.abs(state.ball.speed + 2);
        ball.vy = Math.sin(angle) * (state.ball.speed + 1);
        ball.x = paddle.x + Math.cos(angle) * (paddle.radius + ball.radius + 2);
    }
}

function draw() {
    ctx.fillStyle = '#0a1a10';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Marca d'Agua - Símbolo no Gramado (Centro)
    if (state.playerTeam) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        const s = 250;
        ctx.drawImage(assets.shields[state.playerTeam.id], 400 - s/2, 250 - s/2, s, s);
        ctx.restore();
    }

    // Mesa e Rede
    const color = state.playerTeam ? state.playerTeam.color : '#00ff88';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 780, 480);
    
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(400, 10); ctx.lineTo(400, 490);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);

    // Desenha Raquetes Anatomicas
    drawAnatomicalPaddle(state.player, color, true);
    drawAnatomicalPaddle(state.ai, state.aiTeam ? state.aiTeam.color : '#fff', false);

    // Bola
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI*2);
    ctx.fill();
}

function drawAnatomicalPaddle(p, color, isPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!isPlayer) ctx.rotate(Math.PI);

    // Cabo
    ctx.fillStyle = '#5c3c2e';
    ctx.fillRect(-p.handleWidth/2, 5, p.handleWidth, p.handleHeight);

    // Borracha Circular
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.arc(0, 0, p.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Detalhe Aro
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.arc(0, 0, p.radius, 0, Math.PI*2);
    ctx.stroke();

    ctx.restore();
}

function gameLoop() {
    if (state.screen === 'game-screen') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

initAntigravityProtocol();
