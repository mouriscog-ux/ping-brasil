/**
 * BRASILEIRÃO PING PONG XP - ESTABILIDADE TOTAL
 * 
 * CORREÇÕES:
 * - Sem telas de "Sincronização" bloqueantes.
 * - Centralização garantida via Viewport Fixo.
 * - Movimento 360: Arrows (Frente, Trás, Lados).
 * - Pontuação: 6 pontos vitória.
 */

const TEAMS = [
    { id: 'palmeiras', name: 'Palmeiras', color: '#006437' },
    { id: 'flamengo', name: 'Flamengo', color: '#c20000' },
    { id: 'gremio', name: 'Grêmio', color: '#00adef' },
    { id: 'atletico-mg', name: 'Atlético-MG', color: '#000000' },
    { id: 'botafogo', name: 'Botafogo', color: '#000000' },
    { id: 'bragantino', name: 'Bragantino', color: '#ffffff' },
    { id: 'fluminense', name: 'Fluminense', color: '#8b0000' },
    { id: 'athletico-pr', name: 'Athletico-PR', color: '#ff0000' },
    { id: 'internacional', name: 'Internacional', color: '#ff0000' },
    { id: 'fortaleza', name: 'Fortaleza', color: '#1a3c8a' },
    { id: 'sao-paulo', name: 'São Paulo', color: '#ff0000' },
    { id: 'cuiaba', name: 'Cuiabá', color: '#006400' },
    { id: 'corinthians', name: 'Corinthians', color: '#000000' },
    { id: 'cruzeiro', name: 'Cruzeiro', color: '#0000ff' },
    { id: 'vasco', name: 'Vasco', color: '#000000' },
    { id: 'bahia', name: 'Bahia', color: '#0000ff' },
    { id: 'vitoria', name: 'Vitória', color: '#ff0000' },
    { id: 'juventude', name: 'Juventude', color: '#ffffff' },
    { id: 'atletico-go', name: 'Atlético-GO', color: '#ff0000' },
    { id: 'criciuma', name: 'Criciúma', color: '#ffff00' }
];

const state = {
    screen: 'main-menu',
    playerTeam: null, aiTeam: null,
    difficulty: 'normal',
    score: { player: 0, ai: 0 },
    round: 0,
    ball: { x: 400, y: 250, vx: 5, vy: 3, radius: 10, speed: 6 },
    player: {
        x: 100, y: 250, 
        lastX: 100, lastY: 250,
        vx: 0, vy: 0,
        radius: 40, handleW: 10, handleH: 50
    },
    ai: { x: 700, y: 250, radius: 40, handleW: 10, handleH: 50, speed: 4 },
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; // Estabilidade fixa
canvas.height = 500;

const assets = { shields: {} };

// Carregamento Silencioso para não bloquear o jogo
function preloadAssets() {
    TEAMS.forEach(t => {
        const img = new Image();
        img.src = `${t.id}.png`;
        img.onload = () => assets.shields[t.id] = img;
        img.onerror = () => {
            const fallback = new Image();
            fallback.src = `https://api.dicebear.com/7.x/initials/svg?seed=${t.name}&backgroundColor=${t.color.substring(1)}`;
            assets.shields[t.id] = fallback;
        };
    });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    state.screen = id;
    if (id === 'team-selection') renderTeams();
}

function renderTeams() {
    const grid = document.getElementById('teams-grid');
    grid.innerHTML = '';
    TEAMS.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<img src="https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.substring(1)}" style="width:50px"><span>${team.name}</span>`;
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
    const others = TEAMS.filter(t => t.id !== state.playerTeam.id);
    state.aiTeam = others[Math.floor(Math.random() * others.length)];
    
    document.getElementById('player-shield').src = assets.shields[state.playerTeam.id]?.src || "";
    document.getElementById('ai-shield').src = assets.shields[state.aiTeam.id]?.src || "";
    
    const rounds = ["OITAVAS", "QUARTAS", "SEMIFINAL", "GRANDE FINAL"];
    document.getElementById('match-label').innerText = rounds[state.round];

    showScreen('game-screen');
    resetPositions();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('player-points').innerText = state.score.player;
    document.getElementById('ai-points').innerText = state.score.ai;
}

function resetPositions() {
    const dSpeeds = { normal: 6, hard: 9, 'super-hard': 14 };
    state.ball.speed = dSpeeds[state.difficulty];
    state.ball.x = 400; state.ball.y = 250;
    state.ball.vx = (Math.random() > 0.5 ? 1 : -1) * state.ball.speed;
    state.ball.vy = (Math.random() - 0.5) * 8;
    state.player.x = 100; state.player.y = 250;
}

window.addEventListener('keydown', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = true; });
window.addEventListener('keyup', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = false; });

function update() {
    if (state.screen !== 'game-screen') return;
    const p = state.player;
    const ai = state.ai;
    const b = state.ball;

    p.lastX = p.x; p.lastY = p.y;

    // MOVIMENTAÇÃO 360 (SETAS)
    const moveSpd = 8;
    if (state.keys.ArrowUp) p.x += moveSpd; // Avanço XP
    if (state.keys.ArrowDown) p.x -= moveSpd; // Recuo XP
    if (state.keys.ArrowLeft) p.y -= moveSpd; 
    if (state.keys.ArrowRight) p.y += moveSpd;

    p.vx = p.x - p.lastX; p.vy = p.y - p.lastY;

    // Limites Dinâmicos do Campo
    if (p.x < 50) p.x = 50; if (p.x > 380) p.x = 380;
    if (p.y < 50) p.y = 50; if (p.y > 450) p.y = 450;

    // IA XP (CONFORME DOC)
    let aiSpeedY = 4;
    if (state.difficulty === 'hard') aiSpeedY = 8;
    if (state.difficulty === 'super-hard') aiSpeedY = 16;

    // IA Depth
    if (state.difficulty !== 'normal') {
        const targetX = (b.vx > 0) ? 450 : 700;
        ai.x += (targetX - ai.x) * 0.1;
    }

    if (b.vx > 0 || state.difficulty === 'super-hard') {
        if (ai.y < b.y - 10) ai.y += aiSpeedY;
        else if (ai.y > b.y + 10) ai.y -= aiSpeedY;
    }

    // Bola
    b.x += b.vx; b.y += b.vy;
    if (b.y < b.radius || b.y > canvas.height - b.radius) b.vy *= -1;

    // Colisão 360
    checkCollision(b, p, true);
    checkCollision(b, ai, false);

    // Sistema de 6 Pontos
    if (b.x < -20) score('ai');
    else if (b.x > canvas.width + 20) score('player');
}

function checkCollision(ball, paddle, isPlayer) {
    const dx = ball.x - paddle.x;
    const dy = ball.y - paddle.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDist = ball.radius + paddle.radius;

    if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        ball.vx = (isPlayer ? 1 : -1) * Math.abs(ball.speed);
        ball.vy = Math.sin(angle) * (ball.speed + 2);

        // SMASH XP (Avanço da Seta)
        if (isPlayer && paddle.vx > 2) {
            ball.vx *= 1.7;
            ball.vy *= 1.4;
        }

        ball.x = paddle.x + Math.cos(angle) * (minDist + 2);
    }
}

function score(winner) {
    state.score[winner]++;
    updateHUD();
    if (state.score[winner] >= 6) {
        if (winner === 'player') {
            state.round++;
            if (state.round > 3) { alert("🏆 CAMPEÃO XP! O TRABALHO FOI CONCLUÍDO!"); showScreen('main-menu'); }
            else { alert("Boa! Proxima fase."); startMatch(); }
        } else { alert("Eliminado! Tente novamente."); showScreen('main-menu'); }
    } else resetPositions();
}

function draw() {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // ESCUDO CENTRAL (MARCA D'ÁGUA)
    if (state.playerTeam && assets.shields[state.playerTeam.id]) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        const s = 320;
        ctx.drawImage(assets.shields[state.playerTeam.id], 400 - s/2, 250 - s/2, s, s);
        ctx.restore();
    }

    // MESA XP (CORES DINÂMICAS)
    const color = state.playerTeam ? state.playerTeam.color : '#00ff88';
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 760, 460);
    
    ctx.setLineDash([15, 12]);
    ctx.beginPath();
    ctx.moveTo(400, 25); ctx.lineTo(400, 475);
    ctx.stroke();
    ctx.setLineDash([]);

    // RAQUETES XP
    drawPaddle(state.player, color, true);
    drawPaddle(state.ai, state.aiTeam ? state.aiTeam.color : '#fff', false);

    // BOLA XP
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle(p, color, isPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!isPlayer) ctx.rotate(Math.PI);

    // Cabo Profissional
    ctx.fillStyle = '#4a2c1d';
    ctx.fillRect(-p.handleW/2, 5, p.handleW, p.handleH);

    // Borracha Circular
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.arc(0, 0, p.radius, 0, Math.PI*2);
    ctx.fill();
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

// Inicia silenciosamente
preloadAssets();
