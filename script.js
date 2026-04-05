// ==========================================
// 1. 遊戲資料設定區 (維持不變)
// ==========================================

const heroNames = [
    "冒險家", "男術士", "男武道家", "女武道家", "女刺客", "男刺客", 
    "男弓箭手", "女弓箭手", "女騎士", "男騎士", "女術士", "男魔法師", 
    "女魔法師", "見習勇者", "伊賀上忍", "巴爾德", "艾絲梅拉達", "亞米斯", 
    "狄奧尼索斯", "芙洛拉", "月之魔法使", "星焰", "天使莉爾", "T.B.D", 
    "小白帽布蘭琪"
];

let currentGameStage = 1; 
let selectedHeroId = null; 

// ==========================================
// 2. 抓取 HTML 元素 (DOM 元素 - 修正版)
// ==========================================

// ✨ 新增：兩個獨立的角色選單區域
const heroStarterArea = document.getElementById('hero-starter-area');
const heroCollectionArea = document.getElementById('hero-collection-area');

const startBtn = document.getElementById('start-btn');
const charSelectScreen = document.getElementById('character-select-screen');
const battleScreen = document.getElementById('battle-screen');
const heroSpriteInBattle = document.getElementById('hero-sprite');
const stageDisplay = document.getElementById('current-stage-display');

const questionBubble = document.getElementById('question-bubble');
const monsterHpBar = document.getElementById('monster-hp');
const comboCountDisplay = document.getElementById('combo-count');
const potionCountDisplay = document.getElementById('potion-count');
const feedbackMessage = document.getElementById('feedback-message');

// ==========================================
// 3. 生成角色選擇畫面 (🌟 重點修正：拆分排版邏輯 🌟)
// ==========================================

function renderCharacterSelect() {
    // 每次生成前先清空格子
    heroStarterArea.innerHTML = '';
    heroCollectionArea.innerHTML = '';

    // 開始跑點名 (i 號從 1 到 25)
    for (let i = 1; i <= heroNames.length; i++) {
        const heroName = heroNames[i - 1]; 
        const imgNum = i < 10 ? '0' + i : i; 
        const spriteUrl = `char${imgNum}.png`;

        let isUnlocked = false;
        let statusText = "";
        
        // 冒險家(i=1)永遠解鎖
        if (i === 1) {
            isUnlocked = true;
            statusText = "目前可用";
        } else {
            // 男術士(i=2)需求第2關
            const unlockAtStage = Math.ceil((i - 1) / 2) + 1; 
            if (currentGameStage >= unlockAtStage) {
                isUnlocked = true;
                statusText = "目前可用";
            } else {
                statusText = `第 ${unlockAtStage} 關解鎖`;
            }
        }

        // 產生卡片基礎結構
        const charCard = document.createElement('div');
        charCard.className = `character-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        charCard.dataset.heroId = i; 

        let spriteHtml = '';
        if (isUnlocked) {
            spriteHtml = `<div class="sprite-preview" style="background-image: url('${spriteUrl}');"></div>`;
        } else {
            spriteHtml = `<div class="sprite-preview locked-placeholder">？</div>`;
        }

        charCard.innerHTML = `
            ${spriteHtml}
            <div class="character-info">
                <h3>${heroName}</h3>
                <p class="status">${statusText}</p>
            </div>
        `;

        // 幫「已解鎖」的卡片加上點名功能
        if (isUnlocked) {
            charCard.addEventListener('click', function() {
                handleCharacterSelect(i, charCard);
            });
        }

        // ✨ 🌟 關鍵修正：判斷要把卡片塞到哪裡 🌟 ✨
        if (i === 1) {
            // 如果是冒險家，塞到上方主角區
            heroStarterArea.appendChild(charCard);
        } else {
            // 如果是其他角色，塞到下方收集區
            heroCollectionArea.appendChild(charCard);
        }
    }
}

function handleCharacterSelect(heroId, clickedCard) {
    // 把選單中所有的「選取中」框框拿掉 (需要尋找兩個區域)
    const allCards = document.querySelectorAll('.character-card');
    allCards.forEach(card => card.classList.remove('selected'));

    clickedCard.classList.add('selected');
    selectedHeroId = heroId;
    startBtn.disabled = false; 
}

// ==========================================
// 4. 戰鬥系統核心邏輯
// ==========================================

const zhuyinMap = {
    '1': 'ㄅ', '2': 'ㄉ', '3': 'ˇ', '4': 'ˋ', '5': 'ㄓ', '6': 'ˊ', '7': '˙', '8': 'ㄚ', '9': 'ㄞ', '0': 'ㄢ', '-': 'ㄦ',
    'q': 'ㄆ', 'w': 'ㄊ', 'e': 'ㄍ', 'r': 'ㄐ', 't': 'ㄔ', 'y': 'ㄗ', 'u': 'ㄧ', 'i': 'ㄛ', 'o': 'ㄟ', 'p': 'ㄣ',
    'a': 'ㄇ', 's': 'ㄋ', 'd': 'ㄎ', 'f': 'ㄑ', 'g': 'ㄕ', 'h': 'ㄘ', 'j': 'ㄨ', 'k': 'ㄜ', 'l': 'ㄠ', ';': 'ㄤ',
    'z': 'ㄈ', 'x': 'ㄌ', 'c': 'ㄏ', 'v': 'ㄒ', 'b': 'ㄖ', 'n': 'ㄙ', 'm': 'ㄩ', ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ'
};

const zhuyinArray = Object.values(zhuyinMap);
let currentQuestion = ""; 
let combo = 0; 
let potionCount = 0; 
let monsterHp = 100; 

function generateQuestion() {
    const randomIndex = Math.floor(Math.random() * zhuyinArray.length);
    currentQuestion = zhuyinArray[randomIndex];
    questionBubble.textContent = currentQuestion;
}

function heroAttack() {
    heroSpriteInBattle.style.transform = 'translateX(50px)';
    setTimeout(() => { heroSpriteInBattle.style.transform = 'translateX(0)'; }, 150);

    monsterHp -= 10;
    
    if (monsterHp <= 0) {
        monsterHp = 0;
        monsterHpBar.style.width = monsterHp + '%';
        
        setTimeout(() => {
            alert(`太棒了！成功擊敗第 ${currentGameStage} 關的怪物！`); 
            currentGameStage++; 
            stageDisplay.textContent = `第 ${currentGameStage} 關`; // 更新戰鬥介面關卡
            monsterHp = 100; 
            monsterHpBar.style.width = monsterHp + '%';
            combo = 0; // 過關後重置 Combo，讓下一關重新計算藥水
            comboCountDisplay.textContent = combo;
            generateQuestion();
            
            // 重要：過關後也需要重新渲染選單，以便孩子隨時退出去看新解鎖角色
            renderCharacterSelect(); 
        }, 300);
    } else {
        monsterHpBar.style.width = monsterHp + '%';
        generateQuestion(); 
    }
}

document.addEventListener('keydown', function(event) {
    if (!battleScreen.classList.contains('active')) return;

    const key = event.key.toLowerCase(); 

    if (zhuyinMap.hasOwnProperty(key)) {
        const inputZhuyin = zhuyinMap[key];

        if (inputZhuyin === currentQuestion) {
            combo++;
            comboCountDisplay.textContent = combo;
            feedbackMessage.textContent = "Perfect!";
            feedbackMessage.style.color = "#2ecc71"; 
            
            // ✨ 🌟 關鍵修正：每連續答對 5 題，100% 掉落藥水 🌟 ✨
            if (combo > 0 && combo % 5 === 0) {
                // 機率移除，改成百分之百獲得
                potionCount++;
                potionCountDisplay.textContent = potionCount;
                feedbackMessage.textContent = "獲得藥水了！🧪"; // 在訊息加入小圖示提示
                feedbackMessage.style.color = "#e67e22"; // 顯示橘黃色
            }
            heroAttack();

        } else {
            combo = 0; 
            comboCountDisplay.textContent = combo;
            feedbackMessage.textContent = "Oops!";
            feedbackMessage.style.color = "#e74c3c"; 
        }

        setTimeout(() => {
            feedbackMessage.textContent = "";
        }, 800);
    }
});

// ==========================================
// 5. 點擊「準備出發」，進入戰鬥畫面
// ==========================================
startBtn.addEventListener('click', function() {
    if (selectedHeroId !== null) {
        charSelectScreen.classList.remove('active');
        charSelectScreen.classList.add('hidden');
        battleScreen.classList.remove('hidden');
        battleScreen.classList.add('active');

        const imgNum = selectedHeroId < 10 ? '0' + selectedHeroId : selectedHeroId;
        const spriteUrl = `char${imgNum}.png`;
        
        heroSpriteInBattle.style.backgroundImage = `url('${spriteUrl}')`;
        heroSpriteInBattle.style.backgroundColor = 'transparent'; 
        heroSpriteInBattle.style.transition = 'transform 0.15s ease'; 

        // 🌟 重置戰鬥相關狀態
        monsterHp = 100;
        monsterHpBar.style.width = '100%';
        combo = 0;
        comboCountDisplay.textContent = combo;
        feedbackMessage.textContent = "";

        generateQuestion();
    }
});

// ==========================================
// 🌟 遊戲一開始：執行初始化
// ==========================================
renderCharacterSelect();
