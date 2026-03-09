/**
 * BRASILEIRÃO PING PONG ELITE - PRO CHAMPIONSHIP
 * 
 * ESPECIFICAÇÕES TÉCNICAS:
 * - Resolução: 16:9 Centralizada
 * - Progressão: Oitavas (Normal) -> Quartas (Hard) -> Semi (Hard) -> Final (Super Hard)
 * - IA Super Hard: Predição de posição e ataque no canto oposto.
 * - Física: Peso na bola e aumento de 5% de velocidade por hit no modo Hard.
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
    baseDifficulty: 'normal',
    currentDifficulty: 'normal',
    score: { player: 0, ai: 0 },
    round: 0, 
    ball: { x: 400, y: 250, vx: 5, vy: 3, radius: 10, speed: 6, weight: 1.2 },
    player: {
        x: 80, y: 250, ax: 80, ay: 250, vx: 0, vy: 0,
        radius: 40, handleW: 12, handleH: 50,
        isDragging: false, targetX: 80, targetY: 250
    },
    ai: {
        x: 720, y: 250, radius: 40, handleW: 12, handleH: 50, speed: 4
    },
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuste Fixo de Resolução (Auto-Centralização via CSS)
function resize() {
    canvas.width = 800;
    canvas.height = 500;
}
resize();

const assets = { shields: {}, loaded: 0 };

async function initEliteProtocol() {
    for (const team of TEAMS) {
        try {
            const img = new Image();
            img.src = `${team.id}.png`;
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = () => {
                    img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.substring(1)}`;
                    img.onload = resolve;
                };
            });
            assets.shields[team.id] = img;
            assets.loaded++;
        } catch(e){}
    }
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        showScreen('main-menu');
    }, 800);
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
    state.baseDifficulty = document.getElementById('difficulty-level').value;
    state.round = 0;
    startMatch();
};

function startMatch() {
    state.score = { player: 0, ai: 0 };
    updateHUD();
    
    // Determinar Dificuldade por Rodada (Progressão Elite)
    const prog = ['normal', 'hard', 'hard', 'super-hard'];
    state.currentDifficulty = prog[state.round];
    
    const pool = TEAMS.filter(t => t.id !== state.playerTeam.id);
    state.aiTeam = pool[Math.floor(Math.random() * pool.length)];
    
    document.getElementById('player-shield').src = assets.shields[state.playerTeam.id].src;
    document.getElementById('ai-shield').src = assets.shields[state.aiTeam.id].src;
    
    const labels = ["OITAVAS", "QUARTAS", "SEMIFINAL", "GRANDE FINAL"];
    document.getElementById('match-info').innerText = labels[state.round];

    showScreen('game-screen');
    resetRound();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('player-points').innerText = state.score.player;
    document.getElementById('ai-points').innerText = state.score.ai;
}

function resetRound() {
    const diff = state.currentDifficulty;
    let bSpeed = 6;
    if (diff === 'hard') bSpeed = 8;
    if (diff === 'super-hard') bSpeed = 12; // 150% do base

    state.ball.speed = bSpeed;
    state.ball.x = 400;
    state.ball.y = 250;
    state.ball.vx = (Math.random() > 0.5 ? 1 : -1) * bSpeed;
    state.ball.vy = (Math.random() - 0.5) * 8;
    
    state.player.x = 100; state.player.y = 250;
    state.ai.x = 700; state.ai.y = 250;
}

window.addEventListener('keydown', e => { if(state.keys.hasOwnProperty(e.code)) state.keys[e.code] = true; });
window.addEventListener('keyup', e => { if(state.keys.hasOwnProperty(e.code)) state.keys[e.code] = false; });
canvas.addEventListener('mousedown', () => state.player.isDragging = true);
window.addEventListener('mouseup', () => state.player.isDragging = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    state.player.targetX = (e.clientX - rect.left) * scaleX;
    state.player.targetY = (e.clientY - rect.top) * scaleY;
});

function update() {
    if (state.screen !== 'game-screen') return;
    const p = state.player;
    const ai = state.ai;
    const b = state.ball;

    p.ax = p.x; p.ay = p.y; // Salvar rastro para fisica

    // MOVIMENTAÇÃO 3D (SETAS)
    let moveSpd = 8;
    if (state.keys.ArrowUp) p.x += moveSpd; // Avanço Elite
    if (state.keys.ArrowDown) p.x -= moveSpd; // Recuo Elite
    if (state.keys.ArrowLeft) p.y -= moveSpd;
    if (state.keys.ArrowRight) p.y += moveSpd;

    // SUPORTE MOUSE (FLUIDEZ)
    if (p.isDragging) {
        p.x += (p.targetX - p.x) * 0.3;
        p.y += (p.targetY - p.y) * 0.3;
    }

    p.vx = p.x - p.ax; p.vy = p.y - p.ay;

    // Limites de Segurança (Nunca foge da tela)
    if (p.x < 50) p.x = 50;
    if (p.x > 380) p.x = 380;
    if (p.y < 50) p.y = 50;
    if (p.y > 450) p.y = 450;

    // IA ELITE LOGIC
    let aiSpd = 4;
    if (state.currentDifficulty === 'hard') aiSpd = 7;
    if (state.currentDifficulty === 'super-hard') aiSpd = 16;

    // Comportamento Super Hard: Ataca o oposto
    if (state.currentDifficulty === 'super-hard' && b.vx > 0) {
        const targetY = (p.y < 250) ? 400 : 100; // Se player está em cima, joga pra baixo
        if (ai.y < targetY) ai.y += aiSpd;
        else ai.y -= aiSpd;
    } else {
        // Normal/Hard: Track ball
        if (ai.y < b.y - 10) ai.y += aiSpd;
        else if (ai.y > b.y + 10) ai.y -= aiSpd;
    }

    // IA Depth
    if (state.currentDifficulty !== 'normal') {
        const targetX = (b.vx > 0) ? 450 : 700;
        ai.x += (targetX - ai.x) * 0.05;
    }

    // Física Bola
    b.x += b.vx;
    b.y += b.vy;
    if (b.y < b.radius || b.y > canvas.height - b.radius) b.vy *= -1;

    // Colisões Realistas
    checkCollision(b, p, true);
    checkCollision(b, ai, false);

    // Sistema de 6 Pontos
    if (b.x < -20) scoring('ai');
    else if (b.x > canvas.width + 20) scoring('player');
}

function checkCollision(ball, paddle, isPlayer) {
    const dx = ball.x - paddle.x;
    const dy = ball.y - paddle.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < ball.radius + paddle.radius) {
        const angle = Math.atan2(dy, dx);
        ball.vx = (isPlayer ? 1 : -1) * Math.abs(ball.speed);
        ball.vy = Math.sin(angle) * (ball.speed + 2);

        // SMASH (Bônus de Seta para Cima)
        if (isPlayer && paddle.vx > 2) {
            ball.vx *= (1.5 * ball.weight); 
            ball.vy *= 1.3;
        }

        // Hard: Acelera 5% por hit
        if (state.currentDifficulty === 'hard') {
            ball.vx *= 1.05;
            ball.vy *= 1.05;
        }

        // Super Hard: Efeito/Spin
        if (!isPlayer && state.currentDifficulty === 'super-hard') {
            ball.vx *= 1.2;
            ball.vy = (paddle.y < ball.y ? 10 : -10); // Cortada seca
        }

        ball.x = paddle.x + Math.cos(angle) * (paddle.radius + ball.radius + 2);
    }
}

function scoring(winner) {
    state.score[winner]++;
    updateHUD();
    if (state.score[winner] >= 6) {
        if (winner === 'player') {
            state.round++;
            if (state.round > 3) { alert("🏆 ELITE BRASIL: CAMPEÃO ABSOLUTO!"); showScreen('main-menu'); }
            else { alert("Vencemos! Rumo à próxima fase."); startMatch(); }
        } else {
            alert("Eliminado! A elite não perdoa."); showScreen('main-menu');
        }
    } else resetRound();
}

function draw() {
    ctx.fillStyle = '#050608';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Símbolo Sagrado na Mesa
    if (state.playerTeam) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        const size = 300;
        ctx.drawImage(assets.shields[state.playerTeam.id], 400 - size/2, 250 - size/2, size, size);
        ctx.restore();
    }

    // Mesa Elitista (Cores Dinâmicas)
    const color = state.playerTeam ? state.playerTeam.color : '#00ff88';
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 760, 460);
    
    ctx.beginPath();
    ctx.setLineDash([15, 10]);
    ctx.moveTo(400, 20); ctx.lineTo(400, 480);
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Raquetes Acadêmicas/Profissionais
    drawPaddle(state.player, color, true);
    drawPaddle(state.ai, state.aiTeam ? state.aiTeam.color : '#fff', false);

    // Bola Elitista
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fff';
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle(p, color, isPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!isPlayer) ctx.rotate(Math.PI);

    // Cabo
    ctx.fillStyle = '#452b1f';
    ctx.fillRect(-p.handleW/2, 5, p.handleW, p.handleH);

    // Borracha Circular Profissional
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.arc(0, 0, p.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Acabamento
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
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

initEliteProtocol();
