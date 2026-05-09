// ==========================================
// 1. 遊戲資料與 API 設定區
// ==========================================

// 🌟 你的專屬 Google Apps Script 伺服器網址
const API_URL = "https://script.google.com/macros/s/AKfycbwRTcfwm75bUnYtwXS5xIaHZQU6HT9-1yNbMgeSFVPgH81q6-exaKxz_5RZkp9znWo/exec";

const heroNames = [
    "冒險家", "男術士", "男武道家", "女武道家", "女刺客", "男刺客", 
    "男弓箭手", "女弓箭手", "女騎士", "男騎士", "女術士", "男魔法師", 
    "女魔法師", "見習勇者", "伊賀上忍", "巴爾德", "艾絲梅拉達", "亞米斯", 
    "狄奧尼索斯", "芙洛拉", "月之魔法使", "星焰", "天使莉爾", "T.B.D", 
    "小白帽布蘭琪"
];

// 玩家個人資料
let playerUUID = "";
let playerName = "";
let currentGameStage = 1; 
let potionCount = 0; 
let selectedHeroId = null; 

// ==========================================
// 2. 抓取 HTML 元素
// ==========================================
const loginScreen = document.getElementById('login-screen');
const charSelectScreen = document.getElementById('character-select-screen');
const battleScreen = document.getElementById('battle-screen');

const nameInput = document.getElementById('player-name-input');
const loginBtn = document.getElementById('login-btn');
const loadingMsg = document.getElementById('loading-msg');

const displayPlayerName = document.getElementById('display-player-name');
const saveStatus = document.getElementById('save-status');

const heroStarterArea = document.getElementById('hero-starter-area');
const heroCollectionArea = document.getElementById('hero-collection-area');
const startBtn = document.getElementById('start-btn');
const heroSpriteInBattle = document.getElementById('hero-sprite');
const stageDisplay = document.getElementById('current-stage-display');

const questionBubble = document.getElementById('question-bubble');
const monsterHpBar = document.getElementById('monster-hp');
const comboCountDisplay = document.getElementById('combo-count');
const potionCountDisplay = document.getElementById('potion-count');
const feedbackMessage = document.getElementById('feedback-message');

// ==========================================
// 3. 雲端存檔與登入系統
// ==========================================

// 產生唯一的 UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 點擊「進入遊戲」按鈕
loginBtn.addEventListener('click', async function() {
    const inputName = nameInput.value.trim();
    if (!inputName) {
        alert("請輸入座號或姓名喔！");
        return;
    }

    loginBtn.classList.add('hidden');
    loadingMsg.classList.remove('hidden');

    playerName = inputName;
    
    // 檢查瀏覽器有沒有記住這台電腦的 UUID
    let savedUUID = localStorage.getItem('typing_rpg_uuid');
    
    if (savedUUID) {
        // 如果有，就用這個 UUID 去雲端抓資料
        playerUUID = savedUUID;
        await loadProgressFromCloud();
    } else {
        // 如果是全新玩家，產生新 UUID，並建立初始存檔
        playerUUID = generateUUID();
        localStorage.setItem('typing_rpg_uuid', playerUUID);
        await saveProgressToCloud();
    }

    // 準備完成，切換到角色選單
    displayPlayerName.textContent = playerName;
    potionCountDisplay.textContent = potionCount; // 更新畫面上的藥水數量
    
    loginScreen.classList.remove('active');
    loginScreen.classList.add('hidden');
    charSelectScreen.classList.remove('hidden');
    charSelectScreen.classList.add('active');
    
    renderCharacterSelect();
});

// 向 Google 試算表要求讀取資料
async function loadProgressFromCloud() {
    saveStatus.textContent = "🔄 讀取中...";
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'load', uuid: playerUUID })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            currentGameStage = parseInt(result.stage) || 1;
            potionCount = parseInt(result.potions) || 0;
            playerName = result.name; // 確保名稱與雲端一致
            console.log("讀取成功！目前關卡:", currentGameStage);
        }
        saveStatus.textContent = "✔️ 已同步";
    } catch (error) {
        console.error("讀取失敗", error);
        saveStatus.textContent = "⚠️ 離線模式";
    }
}

// 將資料存上 Google 試算表
async function saveProgressToCloud() {
    saveStatus.textContent = "⬆️ 存檔中...";
    saveStatus.style.color = "#e67e22";
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'save',
                uuid: playerUUID,
                name: playerName,
                stage: currentGameStage,
                potions: potionCount
            })
        });
        saveStatus.textContent = "✔️ 已同步";
        saveStatus.style.color = "#27ae60";
    } catch (error) {
        console.error("存檔失敗", error);
        saveStatus.textContent = "⚠️ 存檔失敗";
        saveStatus.style.color = "#c0392b";
    }
}

// ==========================================
// 4. 角色選單系統
// ==========================================

function renderCharacterSelect() {
    heroStarterArea.innerHTML = '';
    heroCollectionArea.innerHTML = '';

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

        let spriteHtml = isUnlocked 
            ? `<div class="sprite-preview" style="background-image: url('${spriteUrl}');"></div>` 
            : `<div class="sprite-preview locked-placeholder">？</div>`;

        charCard.innerHTML = `
            ${spriteHtml}
            <div class="character-info">
                <h3>${heroName}</h3>
                <p class="status">${statusText}</p>
            </div>
        `;

        if (isUnlocked) {
            charCard.addEventListener('click', function() {
                const allCards = document.querySelectorAll('.character-card');
                allCards.forEach(card => card.classList.remove('selected'));
                charCard.classList.add('selected');
                selectedHeroId = i;
                startBtn.disabled = false; 
            });
        }

        if (i === 1) {
            heroStarterArea.appendChild(charCard);
        } else {
            heroCollectionArea.appendChild(charCard);
        }
    }
}

// ==========================================
// 5. 戰鬥系統核心邏輯
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
            alert(`太棒了！成功擊敗第 ${currentGameStage} 關的怪物！\n遊戲進度已自動儲存 💾`); 
            currentGameStage++; 
            stageDisplay.textContent = `第 ${currentGameStage} 關`; 
            monsterHp = 100; 
            monsterHpBar.style.width = monsterHp + '%';
            combo = 0; 
            comboCountDisplay.textContent = combo;
            
            // 🌟 過關時，自動儲存進度到 Google 試算表 🌟
            saveProgressToCloud(); 
            
            generateQuestion();
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
            
            if (combo > 0 && combo % 5 === 0) {
                potionCount++;
                potionCountDisplay.textContent = potionCount;
                feedbackMessage.textContent = "獲得藥水了！🧪"; 
                feedbackMessage.style.color = "#e67e22"; 
                
                // 拿到藥水也自動存檔一下
                saveProgressToCloud();
            }
            heroAttack();

        } else {
            combo = 0; 
            comboCountDisplay.textContent = combo;
            feedbackMessage.textContent = "Oops!";
            feedbackMessage.style.color = "#e74c3c"; 
        }

        setTimeout(() => { feedbackMessage.textContent = ""; }, 800);
    }
});

// ==========================================
// 6. 點擊「準備出發」，進入戰鬥
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

        stageDisplay.textContent = `第 ${currentGameStage} 關`;
        monsterHp = 100;
        monsterHpBar.style.width = '100%';
        combo = 0;
        comboCountDisplay.textContent = combo;
        potionCountDisplay.textContent = potionCount;
        feedbackMessage.textContent = "";

        // 🌟 如果你有放 monster01.png 等怪物圖片，之後可以在這裡動態載入
        // 為了不讓畫面空著，先用 CSS 裡的設定或暫不顯示
        
        generateQuestion();
    }
});

// 注意：現在遊戲一開始不會直接呼叫 renderCharacterSelect() 了，
// 而是等玩家點擊「進入遊戲」按鈕後才執行。
