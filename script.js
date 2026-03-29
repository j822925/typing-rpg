// ==========================================
// 1. 遊戲資料設定區
// ==========================================

// 這是你的 25 位英雄中文名單 (依照順序)
const heroNames = [
    "冒險家", "男術士", "男武道家", "女武道家", "女刺客", "男刺客", 
    "男弓箭手", "女弓箭手", "女騎士", "男騎士", "女術士", "男魔法師", 
    "女魔法師", "見習勇者", "伊賀上忍", "巴爾德", "艾絲梅拉達", "亞米斯", 
    "狄奧尼索斯", "芙洛拉", "月之魔法使", "星焰", "天使莉爾", "T.B.D", 
    "小白帽布蘭琪"
];

// 初始化遊戲狀態
let currentGameStage = 1; // 目前關卡 (測試用，設定為第 1 關)
let selectedHeroId = null; // 目前選中的英雄 ID (1~25)

// ==========================================
// 2. 抓取 HTML 元素 (DOM 元素)
// ==========================================
const characterGrid = document.querySelector('.character-grid');
const startBtn = document.getElementById('start-btn');
const charSelectScreen = document.getElementById('character-select-screen');
const battleScreen = document.getElementById('battle-screen');
const heroSpriteInBattle = document.getElementById('hero-sprite');

// ==========================================
// 3. 初始功能：生成角色選擇畫面
// ==========================================

function renderCharacterSelect() {
    // 每次生成前先清空格子
    characterGrid.innerHTML = '';

    // 開始跑點名 (i 號從 1 到 25)
    for (let i = 1; i <= heroNames.length; i++) {
        const heroName = heroNames[i - 1]; // 因為程式數數是從 0 開始，所以要減 1
        
        // 🌟 自動補零邏輯 (把 1 變成 01，10 變成 10)
        const imgNum = i < 10 ? '0' + i : i; 
        const spriteUrl = `char${imgNum}.png`;

        // 🌟 修正後的解鎖邏輯：
        let isUnlocked = false;
        let statusText = "";
        
        // 1. 冒險家永遠解鎖
        if (i === 1) {
            isUnlocked = true;
            statusText = "目前可用";
        } else {
            // 2. 計算這隻角色「需要第幾關」才能解鎖
            // 公式：第 (i-1)/2 關。例如 i=2 或 i=3 時，結果都是 ceil(0.5)=1，所以是第 1 關解鎖。
            // 老師希望第 1 關只用冒險家，所以我們要讓其他隻需求「關卡+1」
            // 修正公式：Math.ceil((i - 1) / 2) + 1。
            // 這樣男術士(i=2)的需求就會變成 Math.ceil(0.5)+1 = 第 2 關。
            const unlockAtStage = Math.ceil((i - 1) / 2) + 1; 

            // 判斷目前關卡是否達到需求
            if (currentGameStage >= unlockAtStage) {
                isUnlocked = true;
                statusText = "目前可用";
            } else {
                statusText = `第 ${unlockAtStage} 關解鎖`;
            }
        }

        // 🌟 產生 HTML 卡片結構 (修正顯示邏輯)
        const charCard = document.createElement('div');
        charCard.className = `character-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        charCard.dataset.heroId = i; // 把 ID 偷偷記在卡片上，之後點擊要用

        // ✨ 重點修正 1：如果沒解鎖，根本不設定圖片！ ✨
        let spriteHtml = '';
        if (isUnlocked) {
            // 如果已解鎖，生成圖片區塊。CSS 會處理裁切，JS 只需要給網址。
            spriteHtml = `<div class="sprite-preview" style="background-image: url('${spriteUrl}');"></div>`;
        } else {
            // 如果鎖定，只給一個帶有問號的空白佔位符，完全不載入圖片。
            spriteHtml = `<div class="sprite-preview locked-placeholder">？</div>`;
        }

        charCard.innerHTML = `
            ${spriteHtml}
            <div class="character-info">
                <h3>${heroName}</h3>
                <p class="status">${statusText}</p>
            </div>
        `;

        // 🌟 幫「已解鎖」的卡片加上點名功能 (Click Event)
        if (isUnlocked) {
            charCard.addEventListener('click', function() {
                handleCharacterSelect(i, charCard);
            });
        }

        // 把做好的卡片丟進格子裡
        characterGrid.appendChild(charCard);
    }
}

// ==========================================
// 4. 功能：處理角色點選動作
// ==========================================

function handleCharacterSelect(heroId, clickedCard) {
    // 1. 先把所有卡片的「選取中」框框拿掉
    const allCards = document.querySelectorAll('.character-card');
    allCards.forEach(card => card.classList.remove('selected'));

    // 2. 幫點擊的這張卡片加上「選取中」框框
    clickedCard.classList.add('selected');

    // 3. 記錄選中的英雄 ID，並亮起「準備出發」按鈕
    selectedHeroId = heroId;
    startBtn.disabled = false; // 亮起按鈕
}

// ==========================================
// 5. 功能：點擊「準備出發」，進入戰鬥畫面
// ==========================================

startBtn.addEventListener('click', function() {
    if (selectedHeroId !== null) {
        // 🌟 轉場魔法：隱藏選單，顯示戰鬥畫面
        charSelectScreen.classList.remove('active');
        charSelectScreen.classList.add('hidden');
        battleScreen.classList.remove('hidden');
        battleScreen.classList.add('active');

        // 🌟 召喚英雄：把選中的英雄圖片放到戰鬥畫面
        const imgNum = selectedHeroId < 10 ? '0' + selectedHeroId : selectedHeroId;
        const spriteUrl = `char${imgNum}.png`;
        
        // ✨ 重點修正 2：戰鬥畫面也只載入一張圖 (預設待機) ✨
        // 我們要在 CSS 裡把裁切設定好，JS 只要給圖片網址就好。
        heroSpriteInBattle.style.backgroundImage = `url('${spriteUrl}')`;
        heroSpriteInBattle.style.backgroundColor = 'transparent'; // 把測試用的灰色背景拿掉
    }
});

// ==========================================
// 🌟 遊戲一開始：執行初始化
// ==========================================
renderCharacterSelect();
