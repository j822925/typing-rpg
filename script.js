// ==========================================
// 1. 遊戲資料設定區
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
// 2. 抓取 HTML 元素 (DOM 元素)
// ==========================================
const characterGrid = document.querySelector('.character-grid');
const startBtn = document.getElementById('start-btn');
const charSelectScreen = document.getElementById('character-select-screen');
const battleScreen = document.getElementById('battle-screen');
const heroSpriteInBattle = document.getElementById('hero-sprite');

// 新增：戰鬥相關的元素
const questionBubble = document.getElementById('question-bubble');
const monsterHpBar = document.getElementById('monster-hp');
const comboCountDisplay = document.getElementById('combo-count');
const potionCountDisplay = document.getElementById('potion-count');
const feedbackMessage = document.getElementById('feedback-message');

// ==========================================
// 3. 生成角色選擇畫面
// ==========================================
function renderCharacterSelect() {
    characterGrid.innerHTML = '';
    for (let i = 1; i <= heroNames.length; i++) {
        const heroName = heroNames[i - 1]; 
        const imgNum = i < 10 ? '0' + i : i; 
        const spriteUrl = `char${imgNum}.png`;

        let isUnlocked = false;
        let statusText = "";
        
        if (i === 1) {
            isUnlocked = true;
            statusText = "目前可用";
        } else {
            const unlockAtStage = Math.ceil((i - 1) / 2) + 1; 
            if (currentGameStage >= unlockAtStage) {
                isUnlocked = true;
                statusText = "目前可用";
            } else {
                statusText = `第 ${unlockAtStage} 關解鎖`;
            }
        }

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

        if (isUnlocked) {
            charCard.addEventListener('click', function() {
                handleCharacterSelect(i, charCard);
            });
        }
        characterGrid.appendChild(charCard);
    }
}

function handleCharacterSelect(heroId, clickedCard) {
    const allCards = document.querySelectorAll('.character-card');
    allCards.forEach(card => card.classList.remove('selected'));
    clickedCard.classList.add('selected');
    selectedHeroId = heroId;
    startBtn.disabled = false; 
}

// ==========================================
// 4. 戰鬥系統核心邏輯
// ==========================================

// 標準注音鍵盤對照表
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
let monsterHp = 100; // 怪物血量以 100% 計算

// 產生新的注音題目
function generateQuestion() {
    const randomIndex = Math.floor(Math.random() * zhuyinArray.length);
    currentQuestion = zhuyinArray[randomIndex];
    questionBubble.textContent = currentQuestion;
}

// 英雄攻擊與怪物扣血邏輯
function heroAttack() {
    // 簡單的 CSS 動畫：讓英雄往前衝撞一下再退回來
    heroSpriteInBattle.style.transform = 'translateX(50px)';
    setTimeout(() => { heroSpriteInBattle.style.transform = 'translateX(0)'; }, 150);

    // 怪物扣血 (每次打對扣 10%，打對 10 次就能打倒這隻怪物)
    monsterHp -= 10;
    
    if (monsterHp <= 0) {
        monsterHp = 0;
        monsterHpBar.style.width = monsterHp + '%';
        
        // 怪物死掉的短暫延遲
        setTimeout(() => {
            alert(`太棒了！成功擊敗第 ${currentGameStage} 關的怪物！`); // 之後我們會換成更帥氣的過關畫面
            currentGameStage++; // 進入下一關
            monsterHp = 100; // 重置下一隻怪物的血量
            monsterHpBar.style.width = monsterHp + '%';
            generateQuestion();
        }, 300);
    } else {
        monsterHpBar.style.width = monsterHp + '%';
        generateQuestion(); // 血還沒扣完，繼續出下一題
    }
}

// 鍵盤敲擊監聽器
document.addEventListener('keydown', function(event) {
    // 如果還沒進入戰鬥畫面，就不理會按鍵
    if (!battleScreen.classList.contains('active')) return;

    const key = event.key.toLowerCase(); 

    // 檢查按下的鍵是不是注音鍵盤上的一員
    if (zhuyinMap.hasOwnProperty(key)) {
        const inputZhuyin = zhuyinMap[key];

        if (inputZhuyin === currentQuestion) {
            // ✅ 答對了！
            combo++;
            comboCountDisplay.textContent = combo;
            feedbackMessage.textContent = "Perfect!";
            feedbackMessage.style.color = "#2ecc71"; // 顯示綠色
            
            // 每連續答對 5 題，就有 50% 機率掉落藥水
            if (combo > 0 && combo % 5 === 0) {
                if (Math.random() > 0.5) {
                    potionCount++;
                    potionCountDisplay.textContent = potionCount;
                    feedbackMessage.textContent = "打到藥水了！";
                    feedbackMessage.style.color = "#f39c12"; // 顯示橘黃色
                }
            }
            // 觸發攻擊！
            heroAttack();

        } else {
            // ❌ 答錯了！
            combo = 0; // 連擊中斷歸零
            comboCountDisplay.textContent = combo;
            feedbackMessage.textContent = "Oops!";
            feedbackMessage.style.color = "#e74c3c"; // 顯示紅色
        }

        // 讓 Perfect 或 Oops 的字樣閃一下就消失 (0.8秒)
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
        heroSpriteInBattle.style.transition = 'transform 0.15s ease'; // 加上攻擊衝撞的滑順動畫

        // ✨ 進入戰鬥時，產生第一題！
        generateQuestion();
    }
});

// ==========================================
// 🌟 遊戲一開始：執行初始化
// ==========================================
renderCharacterSelect();
