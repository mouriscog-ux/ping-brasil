/**
 * BRASILEIRÃO PING PONG PRO – CHAMPIONSHIP EDITION
 * 
 * CORE FEATURES:
 * - 3D Movement: Depth (X) and Lateral (Y) control.
 * - Dynamic Physics: Bonus speed on forward (smash) movement.
 * - Tournament: Oitavas to Final (6 pts per match).
 * - Stability: Antigravity asset validation protocol.
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
        x: 100, y: 250, 
        radius: 35,
        ax: 100, ay: 250, // Anchored/Previous position for velocity calc
        vx: 0, vy: 0,
        handleWidth: 12, handleHeight: 45,
        targetX: 100, targetY: 250,
        isDragging: false
    },
    ai: {
        x: 700, y: 250, 
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
    const logOut = (msg) => {
        const log = document.getElementById('pre-load-log');
        if(log) {
            log.innerHTML += `<div>[SYSTEM] ${msg}</div>`;
            log.scrollTop = log.scrollHeight;
        }
    };

    logOut("Validando integridade do motor gráfico...");
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
    
    const roundLabels = ["OITAVAS DE FINAL", "QUARTAS DE FINAL", "SEMIFINAL", "GRANDE FINAL"];
    document.getElementById('match-info').innerText = roundLabels[state.round];

    showScreen('game-screen');
    resetPositions();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('player-points').innerText = state.score.player;
    document.getElementById('ai-points').innerText = state.score.ai;
}

function resetPositions() {
    const dSpeeds = { normal: 4.5, hard: 6.5, 'super-hard': 9 };
    state.ball.speed = dSpeeds[state.difficulty];
    state.ball.x = 400;
    state.ball.y = 250;
    state.ball.vx = (Math.random() > 0.5 ? 1 : -1) * state.ball.speed;
    state.ball.vy = (Math.random() - 0.5) * 6;
    state.player.x = 100;
    state.player.y = 250;
    state.player.ax = 100;
    state.player.ay = 250;
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

    // Guardar posição anterior para cálculo de física de colisão
    p.ax = p.x;
    p.ay = p.y;

    // MOVIMENTAÇÃO HÍBRIDA (3D)
    let moveSpeed = 7;
    if (state.keys.ArrowUp) p.x += moveSpeed; // Frente (Ataque)
    if (state.keys.ArrowDown) p.x -= moveSpeed; // Trás (Defesa)
    if (state.keys.ArrowLeft) p.y -= moveSpeed; // Lateral
    if (state.keys.ArrowRight) p.y += moveSpeed; // Lateral

    if (p.isDragging) {
        p.x += (p.targetX - p.x) * 0.25;
        p.y += (p.targetY - p.y) * 0.25;
    }

    // Calcular Velocidade Atual do Jogador
    p.vx = p.x - p.ax;
    p.vy = p.y - p.ay;

    // Limites de Quadra (Player side)
    if (p.x < 50) p.x = 50;
    if (p.x > 360) p.x = 360; // Rede
    if (p.y < 50) p.y = 50;
    if (p.y > 450) p.y = 450;

    // IA - COMPORTAMENTO CONFORME DOC
    let aiSpeedY = 3.5;
    let aiSpeedX = 2;
    if (state.difficulty === 'hard') { aiSpeedY = 6; aiSpeedX = 4; }
    if (state.difficulty === 'super-hard') { aiSpeedY = 14; aiSpeedX = 10; }

    // IA Depth Logic
    if (state.difficulty === 'normal') {
        ai.x += (700 - ai.x) * 0.05; // Sempre fundo
    } else if (state.difficulty === 'hard') {
        // Alterna entre rede e fundo
        const targetX = (b.vx > 0 && b.x > 500) ? 550 : 700;
        ai.x += (targetX - ai.x) * 0.05;
    } else {
        // Super Hard: Agressivo (Avança na rede)
        const targetX = (b.vx > 0) ? 460 : 650;
        ai.x += (targetX - ai.x) * 0.1;
    }

    // IA Lateral Logic
    if (b.vx > 0 || state.difficulty === 'super-hard') {
        let aiTargetY = b.y;
        if (state.difficulty === 'super-hard' && b.vx < 0) {
            // Tenta ler a bola mesmo quando esta longe
            aiTargetY = b.y + (b.vy * 5); 
        }
        if (ai.y < aiTargetY - 10) ai.y += aiSpeedY;
        else if (ai.y > aiTargetY + 10) ai.y -= aiSpeedY;
    }

    // Limites IA
    if (ai.x < 440) ai.x = 440;
    if (ai.x > 750) ai.x = 750;
    if (ai.y < 50) ai.y = 50;
    if (ai.y > 450) ai.y = 450;

    // Física da Bola
    b.x += b.vx;
    b.y += b.vy;
    if (b.y < b.radius || b.y > canvas.height - b.radius) {
        b.vy *= -1;
        b.y = (b.y < b.radius) ? b.radius : canvas.height - b.radius;
    }

    // Colisões Real-Time
    checkCollision(b, p, true);
    checkCollision(b, ai, false);

    // Sistema de Pontuação (Vitória a 6 Pontos)
    if (b.x < -20) { pointScored('ai'); }
    else if (b.x > canvas.width + 20) { pointScored('player'); }
}

function checkCollision(ball, paddle, isPlayer) {
    const dx = ball.x - paddle.x;
    const dy = ball.y - paddle.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDist = ball.radius + paddle.radius;

    if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        
        // Direção base
        let speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
        ball.vx = (isPlayer ? 1 : -1) * Math.abs(state.ball.speed);
        ball.vy = Math.sin(angle) * (state.ball.speed + 1);

        // BÔNUS DE VELOCIDADE (FÍSICA DE COLISÃO):
        // Se a raquete for movida rápido para frente no impacto
        if (isPlayer && paddle.vx > 2) {
            ball.vx *= 1.5; // Efeito "Cortada"
            ball.vy *= 1.2;
        }

        // Se o Super Hard rebate, ganha bônus de ângulo fechado
        if (!isPlayer && state.difficulty === 'super-hard') {
            ball.vx *= 1.3;
            ball.vy *= 1.4;
        }

        // Reposicionar bola fora da raquete para evitar double-collision
        ball.x = paddle.x + Math.cos(angle) * (minDist + 2);
    }
}

function pointScored(winner) {
    state.score[winner]++;
    updateHUD();
    
    if (state.score[winner] >= 6) {
        if (winner === 'player') {
            state.round++;
            if (state.round > 3) {
                alert("🏆 PARABÉNS! VOCÊ É O GRANDE CAMPEÃO DO BRASILEIRÃO!");
                showScreen('main-menu');
            } else {
                alert("VITÓRIA! Avançando de fase...");
                startMatch();
            }
        } else {
            alert("ELIMINADO! Seu time lutou bravamente.");
            showScreen('main-menu');
        }
    } else {
        resetPositions();
    }
}

function draw() {
    ctx.fillStyle = '#10141d';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // 1. Identidade Visual (Marca D'água Central)
    if (state.playerTeam) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        const s = 280;
        ctx.drawImage(assets.shields[state.playerTeam.id], 400 - s/2, 250 - s/2, s, s);
        ctx.restore();
    }

    // 2. Mesa com Cores Dinâmicas
    const teamColor = state.playerTeam ? state.playerTeam.color : '#00ff88';
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(15, 15, 770, 470);
    
    // Rede Central
    ctx.beginPath();
    ctx.setLineDash([10, 8]);
    ctx.moveTo(400, 20); ctx.lineTo(400, 480);
    ctx.strokeStyle = teamColor;
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Raquetes Anatômicas
    drawAnatomicalPaddle(state.player, teamColor, true);
    drawAnatomicalPaddle(state.ai, state.aiTeam ? state.aiTeam.color : '#fff', false);

    // 4. Bola com Brilho
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawAnatomicalPaddle(p, color, isPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!isPlayer) ctx.rotate(Math.PI);

    // Cabo (Madeira)
    ctx.fillStyle = '#543b31';
    ctx.fillRect(-p.handleWidth/2, 5, p.handleWidth, p.handleHeight);

    // Borracha (Círculo)
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.arc(0, 0, p.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Detalhe de Borda
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 3;
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

// Inicializar Protocolo de Estabilidade
initAntigravityProtocol();
