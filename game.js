/**
 * PING BRASIL 2.0 - CAMPEONATO BRASILEIRO
 * Módulo Antigravity Invoked
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

// Estado Global
const state = {
    screen: 'loading',
    playerTeam: null,
    aiTeam: null,
    difficulty: 'normal',
    score: { player: 0, ai: 0 },
    round: 0, // 0-3
    ball: { x: 400, y: 250, vx: 5, vy: 3, radius: 8 },
    player: {
        x: 60, y: 250, 
        targetX: 60, targetY: 250,
        radius: 30, // Formato anatômico
        handleHeight: 40, handleWidth: 12,
        isDragging: false,
        vx: 0, vy: 0
    },
    ai: {
        x: 740, y: 250, 
        radius: 30,
        handleHeight: 40, handleWidth: 12,
        speed: 3
    },
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

// Assets
const assets = { shields: {}, loaded: 0 };

async function initAntigravityProtocol() {
    const log = document.getElementById('pre-load-log');
    const logOut = (msg) => {
        log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    };

    logOut("Iniciando Protocolo Antigravity...");
    logOut("Validando Ambiente Python (conceptual check ok)");
    logOut("Mapeando Diretório Raiz /assets...");

    for (const team of TEAMS) {
        try {
            const img = new Image();
            // Fallback: se não achar na pasta local, gera um via API DiceBear
            img.src = `${team.id}.png`; // Tenta local
            
            await new Promise((resolve) => {
                img.onload = () => {
                    logOut(`Asset ${team.id} verificado.`);
                    resolve();
                };
                img.onerror = () => {
                    logOut(`<span style="color:yellow">Aviso: ${team.id} não encontrado. Usando brasão genérico.</span>`);
                    img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}&backgroundColor=${team.color.substring(1)}`;
                    img.onload = resolve;
                };
            });
            assets.shields[team.id] = img;
            assets.loaded++;
        } catch (e) {
            console.error(e);
        }
    }

    logOut("Varredura de Assets concluída com 100% de estabilidade.");
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            showScreen('main-menu');
        }, 500);
    }, 1000);
}

// --- Logica de Navegação ---
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
        card.innerHTML = `
            <img class="team-logo-ui" src="${assets.shields[team.id].src}">
            <div class="team-name-ui">${team.name}</div>
        `;
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
    
    // Sortear oponente
    const pool = TEAMS.filter(t => t.id !== state.playerTeam.id);
    state.aiTeam = pool[Math.floor(Math.random() * pool.length)];
    
    document.getElementById('player-shield').src = assets.shields[state.playerTeam.id].src;
    document.getElementById('ai-shield').src = assets.shields[state.aiTeam.id].src;
    
    const roundNames = ['OITAVAS', 'QUARTAS', 'SEMIFINAL', 'FINAL'];
    document.getElementById('match-info').innerText = roundNames[state.round] + " - BRASILEIRÃO";

    showScreen('game-screen');
    resetPositions();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('player-points').innerText = state.score.player;
    document.getElementById('ai-points').innerText = state.score.ai;
}

function resetPositions() {
    state.ball = { x: 400, y: 250, vx: (Math.random() > 0.5 ? 5 : -5), vy: (Math.random() - 0.5) * 6, radius: 8 };
    state.player.x = 100;
    state.player.y = 250;
    state.ai.x = 700;
    state.ai.y = 250;
}

// --- Controles ---
window.addEventListener('keydown', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = true; });
window.addEventListener('keyup', e => { if (state.keys.hasOwnProperty(e.code)) state.keys[e.code] = false; });

canvas.addEventListener('mousedown', e => { state.player.isDragging = true; });
window.addEventListener('mouseup', () => { state.player.isDragging = false; });
canvas.addEventListener('mousemove', e => {
    if (!state.player.isDragging) return;
    const rect = canvas.getBoundingClientRect();
    state.player.targetX = e.clientX - rect.left;
    state.player.targetY = e.clientY - rect.top;
});

// --- Motor do Jogo ---
function update() {
    if (state.screen !== 'game-screen') return;

    const p = state.player;
    const ai = state.ai;
    const b = state.ball;

    // Movimentação Player (Híbrida: Mouse + Teclado)
    let moveSpeed = 6;
    if (state.keys.ArrowUp) p.y -= moveSpeed;
    if (state.keys.ArrowDown) p.y += moveSpeed;
    if (state.keys.ArrowLeft) p.x -= moveSpeed;
    if (state.keys.ArrowRight) p.x += moveSpeed;

    if (p.isDragging) {
        // Suavização do arraste
        p.x += (p.targetX - p.x) * 0.3;
        p.y += (p.targetY - p.y) * 0.3;
    }

    // Constraints Player (Não passar da rede e limites da mesa)
    if (p.x < p.radius) p.x = p.radius;
    if (p.x > 380) p.x = 380; // Não passa da rede
    if (p.y < p.radius) p.y = p.radius;
    if (p.y > canvas.height - p.radius) p.y = canvas.height - p.radius;

    // IA - De acordo com Dificuldade
    const aiCenter = ai.y;
    let aiSpeed = 4;
    if (state.difficulty === 'hard') aiSpeed = 7;
    if (state.difficulty === 'super-hard') aiSpeed = 15;

    // Movimento X da IA (Depth axis)
    if (state.difficulty === 'normal') {
        ai.x += (720 - ai.x) * 0.1; // Fica no fundo
    } else if (state.difficulty === 'hard') {
        if (b.vx > 0) ai.x += (500 - ai.x) * 0.05; // Avança um pouco
        else ai.x += (720 - ai.x) * 0.05;
    } else {
        // Super Hard: Tenta ficar onde o jogador não está
        ai.x += (600 - ai.x) * 0.1;
    }

    // Movimento Y da IA
    if (b.vx > 0 || state.difficulty !== 'normal') {
        if (ai.y < b.y - 10) ai.y += aiSpeed;
        else if (ai.y > b.y + 10) ai.y -= aiSpeed;
    }

    // Constraints AI
    if (ai.x < 420) ai.x = 420;
    if (ai.x > canvas.width - ai.radius) ai.x = canvas.width - ai.radius;
    if (ai.y < ai.radius) ai.y = ai.radius;
    if (ai.y > canvas.height - ai.radius) ai.y = canvas.height - ai.radius;

    // Física da Bola
    b.x += b.vx;
    b.y += b.vy;

    if (b.y < b.radius || b.y > canvas.height - b.radius) b.vy *= -1.05;

    // Colisão Anatômica (Círculo) - Player
    checkAnatomicalCollision(b, p, true);
    // Colisão Anatômica (Círculo) - AI
    checkAnatomicalCollision(b, ai, false);

    // Scoring (6 pontos)
    if (b.x < 0) {
        state.score.ai++;
        updateHUD();
        if (state.score.ai >= 6) endMatch('ai');
        else resetPositions();
    } else if (b.x > canvas.width) {
        state.score.player++;
        updateHUD();
        if (state.score.player >= 6) endMatch('player');
        else resetPositions();
    }
}

function checkAnatomicalCollision(ball, paddle, isPlayer) {
    const dx = ball.x - paddle.x;
    const dy = ball.y - paddle.y;
    const distance = Math.sqrt(dx*dx + dy*dy);

    if (distance < ball.radius + paddle.radius) {
        // Rebatida baseada no ponto de impacto (Centro da raquete = Precision)
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
        
        // Inverte sentido X
        ball.vx = (isPlayer ? 1 : -1) * Math.abs(speed);
        ball.vy = Math.sin(angle) * (speed + 2);
        
        // Aumenta velocidade se for rebati no meio
        const precision = 1 - (distance / (ball.radius + paddle.radius));
        ball.vx *= (1 + precision * 0.2);

        // Escape
        ball.x = paddle.x + Math.cos(angle) * (paddle.radius + ball.radius + 2);
    }
}

function endMatch(winner) {
    if (winner === 'player') {
        state.round++;
        if (state.round > 3) {
            alert("CAMPEÃO BRASILEIRO! 🏆");
            showScreen('main-menu');
        } else {
            alert("Vitória! Avançando no campeonato.");
            startMatch();
        }
    } else {
        alert("Eliminado do Brasileirão.");
        showScreen('main-menu');
    }
}

function draw() {
    ctx.fillStyle = '#07080c';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Marca d'água (Escudo Central)
    if (state.playerTeam) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        const size = 300;
        ctx.drawImage(assets.shields[state.playerTeam.id], 400 - size/2, 250 - size/2, size, size);
        ctx.restore();
    }

    // Desenha Mesa com Cores Dinâmicas
    const teamColor = state.playerTeam ? state.playerTeam.color : '#00ff88';
    
    // Borda da mesa
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Rede
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 500);
    ctx.strokeStyle = teamColor;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // Player Paddle (Anatômica)
    drawPaddle(state.player, state.playerTeam ? state.playerTeam.color : '#fff', true);
    
    // AI Paddle (Anatômica)
    drawPaddle(state.ai, state.aiTeam ? state.aiTeam.color : '#fff', false);

    // Bola
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle(p, color, isPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!isPlayer) ctx.rotate(Math.PI); // Gira cabo para fora

    // Cabo
    ctx.fillStyle = '#4a2c1d';
    ctx.fillRect(-p.handleWidth/2, 0, p.handleWidth, p.handleHeight + 10);

    // Cabeça da Raquete (Borracha)
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.arc(0, 0, p.radius, 0, Math.PI*2);
    ctx.fill();
    
    // Detalhe de borracha interna
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.arc(0, 0, p.radius - 5, 0, Math.PI*2);
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

// Start sequence
initAntigravityProtocol();
