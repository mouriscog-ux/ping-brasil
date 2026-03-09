/**
 * BRASILEIRÃO PING PONG ULTIMATE
 * - Correção de Inicialização: Non-blocking asset loading.
 * - Correção de Vídeo: Auto-viewport alignment.
 * - Mecânica: 3D Control (Arrows: X, Y) + Smash (Bonus on Up movement).
 * - Vitórias: 6 pontos por set.
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
    screen: 'main-menu',
    playerTeam: null,
    aiTeam: null,
    difficulty: 'normal',
    score: { player: 0, ai: 0 },
    round: 0, // 0-3
    ball: { x: 400, y: 250, vx: 5, vy: 3, radius: 10, speed: 6 },
    player: {
        x: 100, y: 250, 
        lastX: 100, lastY: 250,
        radius: 38, // Formato circular real
        handleW: 10, handleH: 45,
        vx: 0, vy: 0
    },
    ai: {
        x: 700, y: 250, 
        radius: 38,
        handleW: 10, handleH: 45,
        speed: 4
    },
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; // Resolução lógica fixa
canvas.height = 500;

const assets = { shields: {} };

// Inicialização Assíncrona: Não bloqueia a visão do usuário
async function loadAssetsAsync() {
    for (const team of TEAMS) {
        const img = new Image();
        img.src = `${team.id}.png`; 
        img.onload = () => assets.shields[team.id] = img;
        img.onerror = () => {
            // Low-poly / Fallback instantâneo
            const fallback = new Image();
            fallback.src = `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.substring(1)}`;
            assets.shields[team.id] = fallback;
        };
    }
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
        // Usa o shield se já carregou, senão espera
        card.innerHTML = `<img src="https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.substring(1)}" style="width:60px"><span>${team.name}</span>`;
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
    
    // Oponente aleatório
    const others = TEAMS.filter(t => t.id !== state.playerTeam.id);
    state.aiTeam = others[Math.floor(Math.random() * others.length)];
    
    // Atualiza HUD shields (tenta carregar se falhar usa dicebear)
    document.getElementById('player-shield').src = assets.shields[state.playerTeam.id]?.src || "";
    document.getElementById('ai-shield').src = assets.shields[state.aiTeam.id]?.src || "";
    
    const phases = ["OITAVAS", "QUARTAS", "SEMIFINAL", "GRANDE FINAL"];
    document.getElementById('match-phase').innerText = phases[state.round];

    showScreen('game-screen');
    resetPositions();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('player-points').innerText = state.score.player;
    document.getElementById('ai-points').innerText = state.score.ai;
}

function resetPositions() {
    const diffs = { normal: 6, hard: 9, 'super-hard': 13 };
    state.ball.speed = diffs[state.difficulty];
    state.ball.x = 400;
    state.ball.y = 250;
    state.ball.vx = (Math.random() > 0.5 ? 1 : -1) * state.ball.speed;
    state.ball.vy = (Math.random() - 0.5) * 8;
    
    state.player.x = 100; state.player.y = 250;
    state.ai.x = 700; state.ai.y = 250;
}

// Controles Diretos
window.addEventListener('keydown', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = true; });
window.addEventListener('keyup', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = false; });

function update() {
    if (state.screen !== 'game-screen') return;
    const p = state.player;
    const ai = state.ai;
    const b = state.ball;

    p.lastX = p.x; p.lastY = p.y;

    // MOVIMENTAÇÃO 3D (SETAS)
    let spd = 7;
    if (state.keys.ArrowUp) p.x += spd; // Avanço Elite
    if (state.keys.ArrowDown) p.x -= spd; // Recuo Elite
    if (state.keys.ArrowLeft) p.y -= spd;
    if (state.keys.ArrowRight) p.y += spd;

    p.vx = p.x - p.lastX; p.vy = p.y - p.lastY;

    // Constraints Fixas (Foco na Mesa)
    if (p.x < 50) p.x = 50;
    if (p.x > 380) p.x = 380; // Não atravessa a rede
    if (p.y < 50) p.y = 50;
    if (p.y > 450) p.y = 450;

    // IA LÓGICA (CONFORME DOC)
    let aiSpeed = 3.5;
    if (state.difficulty === 'hard') aiSpeed = 7;
    if (state.difficulty === 'super-hard') aiSpeed = 15;

    // IA Depth Control
    if (state.difficulty === 'super-hard' && b.vx > 0) {
        ai.x += (450 - ai.x) * 0.1; // Avança na rede para pressionar
    } else {
        ai.x += (720 - ai.x) * 0.05; // Fundo
    }

    // IA Lateral Control
    if (b.vx > 0) {
        if (ai.y < b.y - 10) ai.y += aiSpeed;
        else if (ai.y > b.y + 10) ai.y -= aiSpeed;
    }

    // AI Constraints
    if (ai.y < 50) ai.y = 50;
    if (ai.y > 450) ai.y = 450;

    // Movimento Bola
    b.x += b.vx;
    b.y += b.vy;
    if (b.y < b.radius || b.y > canvas.height - b.radius) b.vy *= -1;

    // Colisão Circular Realista
    checkCollision(b, p, true);
    checkCollision(b, ai, false);

    // Sistema de 6 Pontos Vitória
    if (b.x < -20) resolvePoint('ai');
    else if (b.x > canvas.width + 20) resolvePoint('player');
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

        // SMASH: Seta para frente + Impacto
        if (isPlayer && paddle.vx > 2) {
            ball.vx *= 1.6; // Bônus Ultimate
            ball.vy *= 1.3;
        }

        // Recuperação de posição (Anti-stuck)
        ball.x = paddle.x + Math.cos(angle) * (minDist + 2);
    }
}

function resolvePoint(winner) {
    state.score[winner]++;
    updateHUD();
    if (state.score[winner] >= 6) {
        if (winner === 'player') {
            state.round++;
            if (state.round > 3) { alert("🏆 CAMPEÃO ULTIMATE DO BRASILEIRÃO!"); showScreen('main-menu'); }
            else { alert("Boa! Indo para as " + (state.round === 1 ? "Quartas" : state.round === 2 ? "Semis" : "Final")); startMatch(); }
        } else {
            alert("Eliminado! Tente novamente."); showScreen('main-menu');
        }
    } else resetPositions();
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // ESCUDO CENTRAL (MARCA D'ÁGUA)
    if (state.playerTeam && assets.shields[state.playerTeam.id]) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        const s = 300;
        ctx.drawImage(assets.shields[state.playerTeam.id], 400 - s/2, 250 - s/2, s, s);
        ctx.restore();
    }

    // MESA DINÂMICA
    const pColor = state.playerTeam ? state.playerTeam.color : '#00ff88';
    ctx.strokeStyle = pColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 770, 470);
    
    // REDE
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(400, 20); ctx.lineTo(400, 480);
    ctx.stroke();
    ctx.setLineDash([]);

    // RAQUETES ANATÔMICAS (CÍRCULO + CABO)
    drawPaddle(state.player, pColor, true);
    drawPaddle(state.ai, state.aiTeam ? state.aiTeam.color : '#fff', false);

    // BOLA ULTIMATE
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle(p, color, isPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!isPlayer) ctx.rotate(Math.PI);

    // Cabo
    ctx.fillStyle = '#593a2e';
    ctx.fillRect(-p.handleW/2, 5, p.handleW, p.handleH);

    // Borracha Circ
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
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

// Inicia carregamento sem travar a tela
loadAssetsAsync();
