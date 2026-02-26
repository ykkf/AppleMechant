// ===== Apple Merchant Idle - main.js =====
// 仕様書に基づいたクリーン実装

// --- Game Data ---
const ERAS = [
    { name: "木", class: "era-wood", reqTotalGold: 0, mult: 1.0, convertRate: 10, casinoEv: 0.80 },
    { name: "石", class: "era-stone", reqTotalGold: 5000, mult: 1.5, convertRate: 8, casinoEv: 0.85 },
    { name: "鉄", class: "era-iron", reqTotalGold: 50000, mult: 2.2, convertRate: 5, casinoEv: 0.90 },
    { name: "黄金", class: "era-gold", reqTotalGold: 500000, mult: 3.5, convertRate: 3, casinoEv: 0.95 },
    { name: "宇宙", class: "era-cosmic", reqTotalGold: 5000000, mult: 5.0, convertRate: 2, casinoEv: 1.00 },
    { name: "次元", class: "era-dimension", reqTotalGold: 50000000, mult: 8.0, convertRate: 1.5, casinoEv: 1.05 },
    { name: "神話", class: "era-myth", reqTotalGold: 500000000, mult: 12.0, convertRate: 1.2, casinoEv: 1.10 },
    { name: "超越", class: "era-transcend", reqTotalGold: 10000000000, mult: 20.0, convertRate: 1, casinoEv: 1.15 }
];

const SEED_UPGRADES = [
    { id: 'harvest', name: '豊穣の種', icon: '🌿', desc: '生産力 +20%', cost: 3, maxLevel: 5, effect: 0.20 },
    { id: 'thunder', name: '雷の種', icon: '⚡', desc: 'タップ力 +30%', cost: 2, maxLevel: 5, effect: 0.30 },
    { id: 'lucky', name: '幸運の種', icon: '🎯', desc: 'クリティカル率 +3%', cost: 5, maxLevel: 3, effect: 0.03 },
    { id: 'golden', name: '黄金の種', icon: '🎰', desc: 'カジノ期待値 +5%', cost: 4, maxLevel: 3, effect: 0.05 },
    { id: 'apple', name: 'リンゴの種', icon: '🍎', desc: '換金レート改善 -1', cost: 6, maxLevel: 2, effect: 1 },
    { id: 'flame', name: '炎の種', icon: '🔥', desc: 'フィーバー +3秒', cost: 3, maxLevel: 3, effect: 3 }
];

const INITIAL_BUILDINGS = {
    farmer: { id: "farmer", name: "農家", icon: "🏠", basePrice: 5, baseProd: 0, tapBonus: 1, count: 0 },
    cart: { id: "cart", name: "荷車", icon: "🛒", basePrice: 25, baseProd: 1, tapBonus: 0, count: 0 },
    hut: { id: "hut", name: "小屋", icon: "🛖", basePrice: 80, baseProd: 5, tapBonus: 0, count: 0 },
    plantation: { id: "plantation", name: "大農園", icon: "🌴", basePrice: 1000, baseProd: 50, tapBonus: 0, count: 0 },
    guild: { id: "guild", name: "ギルド", icon: "🏰", basePrice: 10000, baseProd: 500, tapBonus: 0, count: 0 },
    factory: { id: "factory", name: "工場", icon: "🏭", basePrice: 80000, baseProd: 3000, tapBonus: 0, count: 0 },
    lab: { id: "lab", name: "研究所", icon: "🔬", basePrice: 500000, baseProd: 10000, tapBonus: 0, count: 0 },
    observatory: { id: "observatory", name: "天文台", icon: "🔭", basePrice: 3000000, baseProd: 25000, tapBonus: 0, count: 0 },
    portal: { id: "portal", name: "次元門", icon: "🌀", basePrice: 20000000, baseProd: 50000, tapBonus: 0, count: 0 }
};

// --- Constants ---
const FPS = 10;
const TICK_RATE = 1000 / FPS;
const PRICE_GROWTH = 1.15;
const MAX_FEVER = 100;
const FEVER_DURATION = 10;    // seconds
const FEVER_COOLDOWN = 20;    // seconds
const FEVER_MULT = 5;
const ERA_BOOST_DURATION = 300; // 5 min
const ERA_BOOST_MULT = 2;
const GOLDEN_APPLE_CHANCE = 0.001; // 0.1% per tick

// --- State ---
function getInitialGs() {
    return {
        apples: 0,
        gold: 0,
        totalGold: 0,
        seeds: 0,
        seedUpgrades: {},
        eraIndex: 0,
        buildings: JSON.parse(JSON.stringify(INITIAL_BUILDINGS)),
        fever: 0,
        feverActive: false,
        feverTimeLeft: 0,
        feverCooldown: 0,
        eraBoostTimeLeft: 0,
        casinoCooldown: false,
        lastTick: Date.now(),
        totalTaps: 0,
        totalJackpots: 0,
        achievements: {}
    };
}

let gs = getInitialGs();

// --- DOM Cache ---
const el = {
    body: document.body,
    gold: document.getElementById('gold-display'),
    ps: document.getElementById('ps-display'),
    era: document.getElementById('era-display'),
    apples: document.getElementById('apples-display'),
    totalGold: document.getElementById('total-gold-display'),
    bigApple: document.getElementById('big-apple'),
    floatContainer: document.getElementById('floating-texts-container'),
    toast: document.getElementById('conversion-toast'),
    feverBar: document.getElementById('fever-bar'),
    feverStatus: document.getElementById('fever-status'),
    buildingsList: document.getElementById('buildings-list'),
    tabs: document.querySelectorAll('.tab-btn'),
    panels: document.querySelectorAll('.panel'),
    btnEvolve: document.getElementById('btn-evolve'),
    nextEraInfo: document.getElementById('next-era-info'),
    maxEraInfo: document.getElementById('max-era-info'),
    nextEraName: document.getElementById('next-era-name'),
    nextEraReq: document.getElementById('next-era-req'),
    seedsContainer: document.getElementById('seeds-container'),
    seedsDisplay: document.getElementById('seeds-display'),
    tabPrestige: document.getElementById('tab-prestige'),
    goldenApple: document.getElementById('golden-apple'),
    notification: document.getElementById('notification-area'),
    casinoEv: document.getElementById('casino-ev'),
    btnSpin: document.getElementById('btn-spin'),
    casinoLog: document.getElementById('casino-log'),
    slotDisplay: document.getElementById('slot-display'),
    betAmount: document.getElementById('bet-amount'),
    casinoMaxChance: document.getElementById('casino-max-chance'),
    btnPrestige: document.getElementById('btn-prestige')
};

// --- Utilities ---
const formatNum = (n) => Math.floor(n).toLocaleString('en-US');
const formatFloat = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// --- Init ---
window.onload = init;

function init() {
    loadSave();
    setupEventListeners();
    renderBuildings();
    checkAchievements();
    updateUI();

    setInterval(gameLoop, TICK_RATE);
    setInterval(saveGame, 10000);
}

function loadSave() {
    const saved = localStorage.getItem('appleMerchantSave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gs = { ...getInitialGs(), ...parsed };

            // Rebuild building defs (preserve counts only)
            const oldCounts = {};
            for (let k in gs.buildings) {
                if (gs.buildings[k] && typeof gs.buildings[k].count === 'number') {
                    oldCounts[k] = gs.buildings[k].count;
                }
            }
            if (oldCounts['market']) {
                oldCounts['hut'] = (oldCounts['hut'] || 0) + oldCounts['market'];
                delete oldCounts['market'];
            }
            gs.buildings = JSON.parse(JSON.stringify(INITIAL_BUILDINGS));
            for (let k in oldCounts) {
                if (gs.buildings[k]) gs.buildings[k].count = oldCounts[k];
            }

            // Offline rewards
            const now = Date.now();
            const elapsedSec = (now - (gs.lastTick || now)) / 1000;
            if (elapsedSec > 60) {
                const offlineSec = Math.min(elapsedSec, 8 * 3600);
                const reward = calculateTotalPS() * offlineSec * 0.5;
                if (reward > 0) {
                    gs.apples += reward;
                    showNotification(`オフライン報酬: ${formatNum(reward)} 🍎`, 'success');
                }
            }
        } catch (e) {
            console.error('Save corrupted, resetting');
            gs = getInitialGs();
        }
    }
    gs.lastTick = Date.now();
    el.body.className = ERAS[gs.eraIndex].class;
}

function saveGame() {
    gs.lastTick = Date.now();
    localStorage.setItem('appleMerchantSave', JSON.stringify(gs));
}

function resetPlaythrough() {
    const seeds = gs.seeds;
    const seedUpgrades = gs.seedUpgrades || {};
    gs = getInitialGs();
    gs.seeds = seeds;
    gs.seedUpgrades = seedUpgrades;
    el.body.className = ERAS[0].class;
    el.tabPrestige.style.display = 'none';
    el.tabs.forEach(t => t.classList.remove('active'));
    el.panels.forEach(p => p.classList.remove('active'));
    el.tabs[0].classList.add('active');
    document.getElementById(el.tabs[0].dataset.target).classList.add('active');
    updateShopVisuals();
    renderBuildings();
    updateUI();
}

// --- Core Mechanics ---

function calculateBuildingProduction() {
    let prod = 0;
    for (let key in gs.buildings) {
        prod += gs.buildings[key].baseProd * gs.buildings[key].count;
    }
    return prod;
}

function getEraMult() { return ERAS[gs.eraIndex].mult; }
function getSeedMult() {
    let mult = 1 + gs.seeds * 0.05;
    const harvestLv = (gs.seedUpgrades && gs.seedUpgrades.harvest) || 0;
    mult *= (1 + harvestLv * 0.20);
    return mult;
}
function getConvertRate() {
    let rate = ERAS[gs.eraIndex].convertRate;
    const appleLv = (gs.seedUpgrades && gs.seedUpgrades.apple) || 0;
    rate = Math.max(1, rate - appleLv * 1);
    return rate;
}

// --- Shop Visuals ---

function triggerShopUpgradeAnimation() {
    const shop = document.getElementById('shop-building');
    if (shop) {
        shop.classList.remove('shop-upgrade-anim');
        void shop.offsetWidth;
        shop.classList.add('shop-upgrade-anim');
    }
}

function calculateTotalPS() {
    let prod = calculateBuildingProduction();
    prod *= getEraMult();
    prod *= getSeedMult();
    prod *= getAchievementBonus();
    if (gs.feverActive) prod *= FEVER_MULT;
    if (gs.eraBoostTimeLeft > 0) prod *= ERA_BOOST_MULT;
    return prod;
}

function getBuildingPrice(basePrice, count) {
    return Math.floor(basePrice * Math.pow(PRICE_GROWTH, count));
}

function getTapPower() {
    let baseTap = 5;
    // 農家はタップ威力 +1/回
    if (gs.buildings.farmer) {
        baseTap += gs.buildings.farmer.tapBonus * gs.buildings.farmer.count;
    }
    let power = baseTap * (1 + 0.02 * gs.seeds);
    const thunderLv = (gs.seedUpgrades && gs.seedUpgrades.thunder) || 0;
    power *= (1 + thunderLv * 0.30);
    if (gs.feverActive) power *= FEVER_MULT;
    return power;
}

function getCritChance() {
    let chance = 0.05 + 0.001 * gs.seeds;
    const luckyLv = (gs.seedUpgrades && gs.seedUpgrades.lucky) || 0;
    chance += luckyLv * 0.03;
    if (gs.feverActive) chance += 0.15;
    return Math.min(1.0, chance);
}

function getFeverDuration() {
    let dur = FEVER_DURATION;
    const flameLv = (gs.seedUpgrades && gs.seedUpgrades.flame) || 0;
    dur += flameLv * 3;
    return dur;
}

// --- Shop Visuals ---

function updateShopVisuals() {
    const farmers = gs.buildings.farmer ? gs.buildings.farmer.count : 0;
    let level = 0;
    if (farmers >= 40) level = 5;
    else if (farmers >= 20) level = 4;
    else if (farmers >= 10) level = 3;
    else if (farmers >= 5) level = 2;
    else if (farmers >= 1) level = 1;

    const shopDiv = document.getElementById('shop-container');
    if (shopDiv) shopDiv.className = `shop-level-${level}`;
}

// --- Actions ---

function handleTap(e) {
    if ("vibrate" in navigator) navigator.vibrate(10);

    let tapPower = getTapPower();
    let isCrit = Math.random() < getCritChance();

    if (isCrit) {
        tapPower *= 20;
        if ("vibrate" in navigator) navigator.vibrate(50);
    }

    gs.apples += tapPower;
    gs.totalTaps = (gs.totalTaps || 0) + 1;
    addFever(2);

    showFloatingText(
        isCrit ? `💥 ${formatNum(tapPower)}` : `+${formatNum(tapPower)}`,
        e,
        isCrit
    );

    // Spawn particles
    spawnTapParticles(e, isCrit);

    checkAchievements();
    updateUI();
}

function spawnTapParticles(e, isCrit) {
    const container = el.floatContainer;
    const count = isCrit ? 12 : 5;
    const emojis = isCrit ? ['🌟', '✨', '💥', '🍎'] : ['🍎', '✨', '🍃'];
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight * 0.35;
    if (e && (e.clientX !== undefined || e.touches)) {
        cx = e.touches ? e.touches[0].clientX : e.clientX;
        cy = e.touches ? e.touches[0].clientY : e.clientY;
    }
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'tap-particle';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        p.style.setProperty('--dx', `${dx}px`);
        p.style.setProperty('--dy', `${dy}px`);
        p.style.fontSize = isCrit ? `${16 + Math.random() * 16}px` : `${12 + Math.random() * 10}px`;
        container.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

function addFever(amount) {
    if (gs.feverActive || gs.feverCooldown > 0) return;
    gs.fever = Math.min(MAX_FEVER, gs.fever + amount);
    if (gs.fever >= MAX_FEVER) {
        gs.feverActive = true;
        gs.feverTimeLeft = getFeverDuration();
        gs.fever = MAX_FEVER;
        showNotification('🔥 フィーバータイム！ 🔥', 'fever');
    }
}

function buyBuilding(id) {
    const b = gs.buildings[id];
    const price = getBuildingPrice(b.basePrice, b.count);

    if (gs.gold >= price) {
        gs.gold -= price;
        b.count++;
        addFever(10);

        renderBuildings();
        updateUI();
        if ("vibrate" in navigator) navigator.vibrate(20);
    }
}

function tryEvolve() {
    const nextEraIdx = gs.eraIndex + 1;
    if (nextEraIdx >= ERAS.length) return;
    const nextEra = ERAS[nextEraIdx];
    if (gs.totalGold >= nextEra.reqTotalGold) {
        gs.eraIndex = nextEraIdx;
        gs.eraBoostTimeLeft = ERA_BOOST_DURATION;
        el.body.className = nextEra.class;
        triggerShopUpgradeAnimation();
        spawnConfetti();
        showNotification(`✨ ${nextEra.name}の時代に進化! お店がアップグレード! ✨`, 'evolution');
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
        checkAchievements();
        updateUI();
    }
}

function spawnConfetti() {
    const container = el.floatContainer;
    const colors = ['#ffd700', '#ff4b4b', '#7cfc00', '#00bfff', '#ff69b4', '#fff'];
    const shapes = ['✨', '🌟', '🎉', '🎊', '⭐'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-particle';
        p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        const x = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
        const startY = window.innerHeight * 0.2 + Math.random() * window.innerHeight * 0.3;
        p.style.left = `${x}px`;
        p.style.top = `${startY}px`;
        p.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
        p.style.setProperty('--fall', `${100 + Math.random() * 200}px`);
        p.style.fontSize = `${14 + Math.random() * 18}px`;
        p.style.animationDelay = `${Math.random() * 0.5}s`;
        container.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
}

function tryPrestige() {
    if (gs.eraIndex < ERAS.length - 1) return;
    if (gs.totalGold < 1000000) return;

    const newSeeds = Math.floor(Math.sqrt(gs.totalGold / 100000));
    gs.seeds += newSeeds;
    showNotification(`🌱 転生完了! +${newSeeds}個の種を獲得! 合計${gs.seeds}個`, 'prestige');
    resetPlaythrough();
    saveGame();
}

// --- Seed Shop ---
function buySeedUpgrade(id) {
    const upgrade = SEED_UPGRADES.find(u => u.id === id);
    if (!upgrade) return;
    if (!gs.seedUpgrades) gs.seedUpgrades = {};
    const currentLv = gs.seedUpgrades[id] || 0;
    if (currentLv >= upgrade.maxLevel) return;
    const cost = upgrade.cost + currentLv * Math.ceil(upgrade.cost * 0.5);
    if (gs.seeds < cost) return;
    gs.seeds -= cost;
    gs.seedUpgrades[id] = currentLv + 1;
    showNotification(`🌱 ${upgrade.icon} ${upgrade.name} Lv.${currentLv + 1} を習得!`, 'prestige');
    if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
    renderSeedShop();
    updateUI();
    saveGame();
}

function renderSeedShop() {
    const list = document.getElementById('seed-shop-list');
    if (!list) return;
    list.innerHTML = '';
    for (const u of SEED_UPGRADES) {
        const lv = (gs.seedUpgrades && gs.seedUpgrades[u.id]) || 0;
        const maxed = lv >= u.maxLevel;
        const cost = u.cost + lv * Math.ceil(u.cost * 0.5);
        const canBuy = !maxed && gs.seeds >= cost;
        const div = document.createElement('div');
        div.className = `seed-upgrade-item ${maxed ? 'seed-upgrade-maxed' : ''} ${!canBuy && !maxed ? 'disabled' : ''}`;
        div.innerHTML = `
            <div class="b-icon">${u.icon}</div>
            <div class="b-info">
                <div class="b-name">${u.name} <span class="b-count">Lv.${lv}/${u.maxLevel}</span></div>
                <div class="b-desc">${u.desc}</div>
            </div>
            <div class="b-action">
                <button class="action-btn seed-buy-btn" style="margin:0; padding:6px; font-size:13px;" ${!canBuy ? 'disabled' : ''}>
                    ${maxed ? 'MAX' : `${cost} 🌱`}
                </button>
            </div>
        `;
        if (!maxed) {
            div.querySelector('.seed-buy-btn').addEventListener('click', () => buySeedUpgrade(u.id));
        }
        list.appendChild(div);
    }
}

// --- Casino ---
const CASINO_PAYOUTS = [
    { mult: 20, weight: 0.5, label: '🍎🍎🍎 JACKPOT!' },
    { mult: 5, weight: 4.5, label: '🌟🌟🍎 大当たり!' },
    { mult: 2, weight: 15, label: '🌟🍎💰 当たり!' },
    { mult: 1, weight: 30, label: '💰🍎💰 引き分け' },
    { mult: 0, weight: 50, label: '💀💀💀 ハズレ...' }
];
let casinoSpinning = false;

function getCasinoEv() {
    let ev = ERAS[gs.eraIndex].casinoEv;
    ev += gs.seeds * 0.01; // +1% per seed
    const goldenLv = (gs.seedUpgrades && gs.seedUpgrades.golden) || 0;
    ev += goldenLv * 0.05;
    return Math.min(ev, 1.5);
}

function getBetAmount() {
    return Math.floor(gs.gold * 0.03); // 3% of gold
}

function spinCasino() {
    if (casinoSpinning) return;
    const bet = getBetAmount();
    if (bet <= 0) {
        showNotification('ベットするGoldが足りません!', 'info');
        return;
    }

    casinoSpinning = true;
    gs.gold -= bet;

    // Adjust weights by EV
    const ev = getCasinoEv();
    const evScale = ev / 0.80; // relative to base

    // Pick result
    let roll = Math.random() * 100;
    let result = CASINO_PAYOUTS[CASINO_PAYOUTS.length - 1];
    let cumulative = 0;
    for (const p of CASINO_PAYOUTS) {
        // Scale winning chances up with EV
        let adjustedWeight = p.mult > 0 ? p.weight * evScale : p.weight / evScale;
        cumulative += adjustedWeight;
        if (roll < cumulative) {
            result = p;
            break;
        }
    }

    const payout = Math.floor(bet * result.mult);
    const net = payout - bet;

    // Spin animation
    const symbols = ['🍎', '🌟', '💰', '💀', '🎰', '🌱'];
    let frames = 0;
    const maxFrames = 15;
    const spinInterval = setInterval(() => {
        const s1 = symbols[Math.floor(Math.random() * symbols.length)];
        const s2 = symbols[Math.floor(Math.random() * symbols.length)];
        const s3 = symbols[Math.floor(Math.random() * symbols.length)];
        if (el.slotDisplay) el.slotDisplay.textContent = `${s1} ${s2} ${s3}`;
        frames++;
        if (frames >= maxFrames) {
            clearInterval(spinInterval);
            // Show result
            if (el.slotDisplay) el.slotDisplay.textContent = result.label;

            gs.gold += payout;
            if (payout > 0) gs.totalGold += payout;

            // Log
            const logEntry = document.createElement('div');
            const color = net > 0 ? '#7cfc00' : net < 0 ? '#ff4b4b' : '#aaa';
            logEntry.innerHTML = `<span style="color:${color}">${result.mult}x (${net >= 0 ? '+' : ''}${formatNum(net)} 💰)</span>`;
            if (el.casinoLog) {
                el.casinoLog.prepend(logEntry);
                // Limit log entries
                while (el.casinoLog.children.length > 20) el.casinoLog.lastChild.remove();
            }

            if (result.mult >= 20) {
                showNotification(`🎰 JACKPOT! +${formatNum(payout)} 💰!`, 'golden');
                if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100]);
                gs.totalJackpots = (gs.totalJackpots || 0) + 1;
            } else if (result.mult >= 5) {
                showNotification(`🎰 大当たり! +${formatNum(payout)} 💰`, 'success');
            }

            checkAchievements();
            updateUI();
            casinoSpinning = false;
        }
    }, 80);
}

// --- Game Loop ---

function gameLoop() {
    const dt = 1 / FPS;

    // Production
    const ps = calculateTotalPS();
    gs.apples += ps * dt;

    // Auto convert: apples -> gold
    const rate = getConvertRate();
    if (gs.apples >= rate) {
        const convertible = Math.floor(gs.apples / rate);
        gs.apples -= convertible * rate;
        gs.gold += convertible;
        gs.totalGold += convertible;
    }

    // Fever timer
    if (gs.feverActive) {
        gs.feverTimeLeft -= dt;
        if (gs.feverTimeLeft <= 0) {
            gs.feverActive = false;
            gs.feverTimeLeft = 0;
            gs.fever = 0;
            gs.feverCooldown = FEVER_COOLDOWN;
        }
    }

    // Fever cooldown
    if (gs.feverCooldown > 0) {
        gs.feverCooldown -= dt;
        if (gs.feverCooldown <= 0) gs.feverCooldown = 0;
    }

    // Era boost timer
    if (gs.eraBoostTimeLeft > 0) {
        gs.eraBoostTimeLeft -= dt;
        if (gs.eraBoostTimeLeft <= 0) gs.eraBoostTimeLeft = 0;
    }

    // Golden apple random event
    if (Math.random() < GOLDEN_APPLE_CHANCE && !el.goldenApple.style.display !== 'block') {
        showGoldenApple();
    }

    updateUI();
}

// --- Golden Apple ---
function showGoldenApple() {
    el.goldenApple.style.display = 'block';
    setTimeout(() => { el.goldenApple.style.display = 'none'; }, 5000);
}

function handleGoldenApple() {
    const reward = calculateTotalPS() * 30;
    gs.apples += reward;
    el.goldenApple.style.display = 'none';
    showNotification(`🌟 黄金リンゴ! +${formatNum(reward)} 🍎`, 'golden');
    if ("vibrate" in navigator) navigator.vibrate([50, 50, 50]);
}

// --- UI ---

function updateUI() {
    const ps = calculateTotalPS();
    el.gold.textContent = formatNum(gs.gold);
    el.ps.textContent = `${formatFloat(ps)} /s`;
    el.era.textContent = ERAS[gs.eraIndex].name;
    el.apples.textContent = formatNum(gs.apples);
    el.totalGold.textContent = formatNum(gs.totalGold);

    // Fever bar
    const feverDur = getFeverDuration();
    const feverPct = gs.feverActive ? (gs.feverTimeLeft / feverDur * 100) : (gs.fever / MAX_FEVER * 100);
    el.feverBar.style.width = `${feverPct}%`;
    el.feverBar.parentElement.parentElement.className = gs.feverActive ? 'fever-container fever-active' : 'fever-container';

    if (gs.feverActive) {
        el.feverStatus.textContent = `${Math.ceil(gs.feverTimeLeft)}s`;
    } else if (gs.feverCooldown > 0) {
        el.feverStatus.textContent = `CD ${Math.ceil(gs.feverCooldown)}s`;
    } else {
        el.feverStatus.textContent = '';
    }

    // Seeds
    if (gs.seeds > 0) {
        el.seedsContainer.style.display = '';
        el.seedsDisplay.textContent = gs.seeds;
    }

    // Evolution
    const nextIdx = gs.eraIndex + 1;
    if (nextIdx < ERAS.length) {
        el.nextEraInfo.style.display = '';
        el.maxEraInfo.style.display = 'none';
        el.nextEraName.textContent = ERAS[nextIdx].name;
        el.nextEraReq.textContent = formatNum(ERAS[nextIdx].reqTotalGold);
        el.btnEvolve.disabled = gs.totalGold < ERAS[nextIdx].reqTotalGold;
    } else {
        el.nextEraInfo.style.display = 'none';
        el.maxEraInfo.style.display = '';
    }

    // Prestige visibility
    if (gs.eraIndex >= ERAS.length - 1) {
        el.tabPrestige.style.display = '';
        el.btnPrestige.disabled = gs.totalGold < 1000000;
    }

    // Casino
    const casinoEvVal = getCasinoEv();
    if (el.casinoEv) el.casinoEv.textContent = casinoEvVal.toFixed(2);
    if (el.betAmount) el.betAmount.textContent = formatNum(getBetAmount());
    if (el.casinoMaxChance) el.casinoMaxChance.textContent = '0.5';
    if (el.btnSpin) el.btnSpin.disabled = getBetAmount() <= 0;

    // Toast
    const rate = getConvertRate();
    el.toast.textContent = `自動換金: ${rate}🍎 → 1💰`;

    // Building buy buttons
    for (let key in gs.buildings) {
        const b = gs.buildings[key];
        const btn = document.getElementById(`btn-buy-${key}`);
        if (btn) {
            const price = getBuildingPrice(b.basePrice, b.count);
            btn.textContent = `${formatNum(price)} 💰`;
            btn.disabled = gs.gold < price;
            btn.closest('.building-item').classList.toggle('disabled', gs.gold < price);
        }
    }
}

function renderBuildings() {
    el.buildingsList.innerHTML = '';
    for (let key in gs.buildings) {
        const b = gs.buildings[key];
        const price = getBuildingPrice(b.basePrice, b.count);
        const descText = b.id === 'farmer'
            ? `タップ威力: +${b.tapBonus}/回`
            : `生産量: +${formatNum(b.baseProd * getEraMult() * getSeedMult())}/s`;

        const html = `
            <div class="building-item ${gs.gold < price ? 'disabled' : ''}">
                <div class="b-icon">${b.icon}</div>
                <div class="b-info">
                    <div class="b-name">${b.name} <span class="b-count">Lv.${b.count}</span></div>
                    <div class="b-desc">${descText}</div>
                </div>
                <div class="b-action">
                    <button id="btn-buy-${key}" class="action-btn" style="margin:0; padding:6px; font-size:14px;">${formatNum(price)} 💰</button>
                </div>
            </div>`;
        el.buildingsList.insertAdjacentHTML('beforeend', html);
        document.getElementById(`btn-buy-${key}`).addEventListener('click', () => buyBuilding(key));
    }
}

// --- Event Listeners ---

function setupEventListeners() {
    // Tap
    el.bigApple.addEventListener('click', handleTap);
    el.bigApple.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(e); }, { passive: false });

    // Tabs & Bottom Sheet
    const sheetOverlay = document.getElementById('sheet-overlay');
    const bottomSheet = document.getElementById('bottom-sheet');
    const closeSheetBtn = document.getElementById('btn-close-sheet');
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    function closeSheet() {
        bottomSheet.classList.remove('open');
        sheetOverlay.classList.remove('active');
        tabs.forEach(t => t.classList.remove('active'));
    }

    function openSheet() {
        bottomSheet.classList.add('open');
        sheetOverlay.classList.add('active');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.target;

            // If already active, close it
            if (tab.classList.contains('active')) {
                closeSheet();
                return;
            }

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active panel
            panels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Open sheet
            openSheet();

            // Render dynamic content when opening tabs
            if (targetId === 'panel-achievements') {
                renderAchievements();
            }
            if (targetId === 'panel-prestige') {
                renderSeedShop();
            }
        });
    });

    sheetOverlay.addEventListener('click', closeSheet);
    closeSheetBtn.addEventListener('click', closeSheet);

    // Initial state: hide panels until a tab is clicked
    panels.forEach(p => p.classList.remove('active'));

    // Evolution
    el.btnEvolve.addEventListener('click', tryEvolve);

    // Casino
    el.btnSpin.addEventListener('click', spinCasino);

    // Prestige
    el.btnPrestige.addEventListener('click', tryPrestige);

    // Golden Apple
    el.goldenApple.addEventListener('click', handleGoldenApple);
}

// --- Visual Effects ---

function showFloatingText(text, e, isCrit = false, isShopText = false) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text' + (isCrit ? ' crit' : '') + (isShopText ? ' shop-text' : '');
    floatEl.innerText = text;

    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.4;

    if (e && (e.clientX !== undefined || e.touches)) {
        x = e.touches ? e.touches[0].clientX : e.clientX;
        y = e.touches ? e.touches[0].clientY : e.clientY;
    } else if (isShopText) {
        y = window.innerHeight * 0.3;
    }

    if (!isShopText) {
        x += (Math.random() - 0.5) * 40;
        y += (Math.random() - 0.5) * 40;
    }

    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    el.floatContainer.appendChild(floatEl);

    setTimeout(() => floatEl.remove(), isCrit || isShopText ? 1500 : 1000);
}

function showNotification(msg, type = 'info') {
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.textContent = msg;
    el.notification.appendChild(note);
    setTimeout(() => {
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 500);
    }, 3000);
}

// --- Achievement System ---

const ACHIEVEMENTS = [
    { id: 'tap100', name: 'お試しタップ', desc: '100回タップ', icon: '👌', check: () => (gs.totalTaps || 0) >= 100 },
    { id: 'tap1000', name: 'タップ職人', desc: '1,000回タップ', icon: '👏', check: () => (gs.totalTaps || 0) >= 1000 },
    { id: 'tap10000', name: 'タップマスター', desc: '10,000回タップ', icon: '✨', check: () => (gs.totalTaps || 0) >= 10000 },
    { id: 'eraStone', name: '石の先駆者', desc: '石の時代に到達', icon: '🪨', check: () => gs.eraIndex >= 1 },
    { id: 'eraIron', name: '鉄の意志', desc: '鉄の時代に到達', icon: '⚙️', check: () => gs.eraIndex >= 2 },
    { id: 'eraGold', name: '黄金の王', desc: '黄金の時代に到達', icon: '👑', check: () => gs.eraIndex >= 3 },
    { id: 'eraCosmic', name: '宇宙の支配者', desc: '宇宙の時代に到達', icon: '🚀', check: () => gs.eraIndex >= 4 },
    { id: 'eraDimension', name: '次元を超えし者', desc: '次元の時代に到達', icon: '🌌', check: () => gs.eraIndex >= 5 },
    { id: 'eraMyth', name: '神話の創造者', desc: '神話の時代に到達', icon: '🔮', check: () => gs.eraIndex >= 6 },
    { id: 'eraTranscend', name: '超越者', desc: '超越の時代に到達', icon: '♾️', check: () => gs.eraIndex >= 7 },
    { id: 'gold10k', name: '小金持ち', desc: '累計10,000 Gold獲得', icon: '💰', check: () => gs.totalGold >= 10000 },
    { id: 'gold1m', name: '大富豪', desc: '累計1,000,000 Gold獲得', icon: '💸', check: () => gs.totalGold >= 1000000 },
    { id: 'gold1b', name: '財閥', desc: '累計1,000,000,000 Gold獲得', icon: '🏦', check: () => gs.totalGold >= 1000000000 },
    { id: 'jackpot', name: '一検千金', desc: 'カジノでジャックポット', icon: '🎰', check: () => (gs.totalJackpots || 0) >= 1 },
    { id: 'prestige1', name: '輪廻転生', desc: '初めての転生', icon: '🌀', check: () => gs.seeds > 0 },
    { id: 'seedUpgrade1', name: '種の力', desc: '種アップグレードを1つ購入', icon: '🌱', check: () => { if (!gs.seedUpgrades) return false; return Object.values(gs.seedUpgrades).some(v => v > 0); } },
    { id: 'fever10', name: 'フィーバーマニア', desc: 'フィーバーを発動', icon: '🔥', check: () => gs.feverActive || gs.feverCooldown > 0 || (gs.totalTaps || 0) >= 50 }
];

function getAchievementBonus() {
    let count = 0;
    for (const a of ACHIEVEMENTS) {
        if (gs.achievements && gs.achievements[a.id]) count++;
    }
    return 1 + count * 0.02; // +2% per achievement
}

function checkAchievements() {
    if (!gs.achievements) gs.achievements = {};
    for (const a of ACHIEVEMENTS) {
        if (!gs.achievements[a.id] && a.check()) {
            gs.achievements[a.id] = Date.now();
            showNotification(`🏆 実績解除！「${a.name}」(生産力+2%)`, 'achievement');
            spawnConfetti();
            if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
        }
    }
}

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    if (!list) return;
    list.innerHTML = '';
    const unlocked = ACHIEVEMENTS.filter(a => gs.achievements && gs.achievements[a.id]).length;
    const header = document.createElement('div');
    header.className = 'achievement-summary';
    header.innerHTML = `<span>解除: ${unlocked} / ${ACHIEVEMENTS.length}</span><span>ボーナス: +${unlocked * 2}%</span>`;
    list.appendChild(header);
    for (const a of ACHIEVEMENTS) {
        const done = gs.achievements && gs.achievements[a.id];
        const div = document.createElement('div');
        div.className = `achievement-item ${done ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <div class="ach-icon">${done ? a.icon : '❓'}</div>
            <div class="ach-info">
                <div class="ach-name">${done ? a.name : '???'}</div>
                <div class="ach-desc">${a.desc}</div>
            </div>
            <div class="ach-status">${done ? '✅' : '🔒'}</div>
        `;
        list.appendChild(div);
    }
}
