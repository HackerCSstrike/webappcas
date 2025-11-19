// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получаем user_id из URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || tg.initDataUnsafe?.user?.id;

// Глобальные переменные
let currentBalance = 0;
let isPlaying = false;

// Коэффициенты для баскетбола
const COEFFICIENTS = {
    win: 1.8,  // Гол
    lose: 0    // Мимо
};

// Загрузка баланса пользователя
async function loadBalance() {
    try {
        // Получаем данные пользователя из Telegram Web App
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            // В реальном приложении здесь был бы запрос к API бота
            // Для получения актуального баланса из базы данных
            // Пока используем значение из localStorage или 0
            const savedBalance = localStorage.getItem(`balance_${userId}`);
            currentBalance = savedBalance ? parseFloat(savedBalance) : 0;
            
            // TODO: Запрос к API бота для получения реального баланса
            // const response = await fetch(`/api/balance?user_id=${userId}`);
            // const data = await response.json();
            // currentBalance = data.balance || 0;
        } else {
            currentBalance = 0;
        }
        updateBalanceDisplay();
    } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
        currentBalance = 0;
        updateBalanceDisplay();
    }
}

// Обновление отображения баланса
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.textContent = currentBalance.toFixed(2);
    }
}

// Быстрая ставка
document.querySelectorAll('.quick-bet').forEach(button => {
    button.addEventListener('click', () => {
        const amount = parseFloat(button.dataset.amount);
        document.getElementById('betAmount').value = amount;
    });
});

// Основная функция игры
document.getElementById('playButton').addEventListener('click', async () => {
    if (isPlaying) return;
    
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    
    // Валидация
    if (!betAmount || betAmount <= 0) {
        alert('Введите корректную ставку!');
        return;
    }
    
    if (betAmount > currentBalance) {
        alert('Недостаточно средств на балансе!');
        return;
    }
    
    isPlaying = true;
    document.getElementById('playButton').disabled = true;
    
    // Показываем ожидание
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'result waiting';
    resultDiv.textContent = '⏳ Игра запущена...';
    
    // Запускаем игру через Telegram эмодзи-игру
    const gameResult = await playBasketballGame();
    
    // Обрабатываем результат
    await processGameResult(betAmount, gameResult);
    
    isPlaying = false;
    document.getElementById('playButton').disabled = false;
});

// Игра в баскетбол через Telegram эмодзи-игру
async function playBasketballGame() {
    return new Promise((resolve) => {
        // Создаем кнопку для запуска эмодзи-игры
        const gameContainer = document.getElementById('basketballGame');
        gameContainer.innerHTML = `
            <div style="text-align: center;">
                <p style="margin-bottom: 15px; font-size: 16px;">Нажмите на кнопку ниже, чтобы запустить игру</p>
                <button id="startGameBtn" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                ">🏀 Играть в баскетбол</button>
            </div>
        `;
        
        document.getElementById('startGameBtn').addEventListener('click', () => {
            // Используем Telegram Mini App API для запуска эмодзи-игры
            // Для эмодзи-игр используется специальный метод через tg.openTelegramLink
            // или можно использовать встроенную игру через tg.openGame
            
            // Вариант 1: Использование встроенной эмодзи-игры (если доступна)
            if (tg && tg.openGame) {
                // Открываем игру баскетбол
                // game_short_name должен быть настроен в @BotFather
                tg.openGame('basketball', {
                    score: 0
                });
                
                // Ожидаем результат через событие
                tg.onEvent('game_score', (data) => {
                    // Результат игры приходит в data
                    const won = data && data.score > 0; // Если есть очки, значит выиграл
                    showGameAnimation(won);
                    setTimeout(() => {
                        resolve(won ? 'win' : 'lose');
                    }, 2000);
                });
            } 
            // Вариант 2: Использование эмодзи-игры через отправку сообщения
            // В реальном приложении бот должен отправить сообщение с эмодзи-игрой
            // и обработать результат через callback
            else if (tg && tg.sendData) {
                // Запрашиваем запуск игры у бота
                tg.sendData(JSON.stringify({
                    action: 'request_game',
                    game_type: 'basketball'
                }));
                
                // Ожидаем результат от бота (в реальности придет через WebApp)
                // Пока используем симуляцию
                setTimeout(() => {
                    const random = Math.random();
                    const won = random > 0.5; // 50% шанс выиграть
                    
                    showGameAnimation(won);
                    
                    setTimeout(() => {
                        resolve(won ? 'win' : 'lose');
                    }, 2000);
                }, 1000);
            } 
            // Вариант 3: Симуляция для тестирования
            else {
                // Показываем анимацию броска
                gameContainer.innerHTML = '<div class="basketball-emoji">🏀</div><p style="margin-top: 15px;">Бросок...</p>';
                
                setTimeout(() => {
                    // Случайный результат (в реальности придет от Telegram)
                    const random = Math.random();
                    const won = random > 0.5; // 50% шанс выиграть
                    
                    showGameAnimation(won);
                    
                    setTimeout(() => {
                        resolve(won ? 'win' : 'lose');
                    }, 2000);
                }, 1500);
            }
        });
    });
}

// Показ анимации игры
function showGameAnimation(won) {
    const gameContainer = document.getElementById('basketballGame');
    gameContainer.innerHTML = `
        <div class="basketball-emoji">🏀</div>
        <p style="margin-top: 15px; font-size: 18px;">${won ? '🎉 ГОЛ!' : '❌ Мимо...'}</p>
    `;
}

// Обработка результата игры
async function processGameResult(betAmount, gameResult) {
    const coefficient = COEFFICIENTS[gameResult];
    const resultDiv = document.getElementById('result');
    
    // Списываем ставку
    currentBalance -= betAmount;
    
    if (gameResult === 'win') {
        // Начисляем выигрыш
        const winAmount = betAmount * coefficient;
        currentBalance += winAmount;
        
        resultDiv.className = 'result win';
        resultDiv.textContent = `🎉 Вы выиграли! +${winAmount.toFixed(2)} USDT`;
        
        // Сохраняем баланс
        localStorage.setItem(`balance_${userId}`, currentBalance.toString());
    } else {
        resultDiv.className = 'result lose';
        resultDiv.textContent = `😔 Вы проиграли ${betAmount.toFixed(2)} USDT`;
        
        // Сохраняем баланс
        localStorage.setItem(`balance_${userId}`, currentBalance.toString());
    }
    
    updateBalanceDisplay();
    
    // Отправляем данные в бот
    await sendResultToBot(betAmount, gameResult, coefficient);
}

// Отправка результата в бот
async function sendResultToBot(betAmount, gameResult, coefficient) {
    try {
        const data = {
            user_id: parseInt(userId),
            action: 'place_bet',
            bet_amount: betAmount,
            game_result: gameResult,
            coefficient: coefficient
        };
        
        // Отправляем данные через Telegram Web App API
        if (tg && tg.sendData) {
            tg.sendData(JSON.stringify(data));
        } else {
            console.log('Данные для отправки в бот:', data);
        }
    } catch (error) {
        console.error('Ошибка отправки данных в бот:', error);
    }
}

// Обработка сообщений от бота (для получения результатов игры)
if (tg && tg.onEvent) {
    tg.onEvent('message', (data) => {
        // Обработка результатов игры от бота
        if (data && data.game_result) {
            const won = data.game_result === 'win';
            showGameAnimation(won);
            // Результат будет обработан в основной функции
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    
    // Настройка темы Telegram
    if (tg) {
        tg.setHeaderColor('#667eea');
        tg.setBackgroundColor('#ffffff');
        
        // Включаем вибрацию при необходимости
        tg.enableClosingConfirmation();
    }
});

