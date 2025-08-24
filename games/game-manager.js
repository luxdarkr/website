// Game manager for switching between different chess variants
class GameManager {
    constructor() {
        this.currentGame = null;
        this.currentGameType = 'chess';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.switchGameType('chess');
    }

    setupEventListeners() {
        // Обработчики для кнопок выбора игры
        document.querySelectorAll('.game-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchGameType(e.target.dataset.type);
            });
        });

        // Обработчики для общих кнопок управления
        document.getElementById('new-game-btn').addEventListener('click', () => {
            if (this.currentGame) this.currentGame.resetGame();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            if (this.currentGame) this.currentGame.undoMove();
        });

        document.getElementById('flip-board-btn').addEventListener('click', () => {
            if (this.currentGame) this.currentGame.flipBoard();
        });

        document.getElementById('drop-mode-btn').addEventListener('click', () => {
            if (this.currentGame && this.currentGame.toggleDropMode) {
                this.currentGame.toggleDropMode();
            }
        });
    }

    switchGameType(gameType) {
        // Сохраняем текущее состояние если нужно
        if (this.currentGame) {
            // Можно сохранить состояние игры перед переключением
        }

        // Обновляем активную кнопку
        document.querySelectorAll('.game-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === gameType);
        });

        // Создаём новую игру
        switch(gameType) {
            case 'xiangqi':
                this.currentGame = new XiangqiGame();
                this.updateRulesContent('Сянци (Китайские шахматы). Цель - поставить мат генералу противника. Особенности: река разделяет доску, фигуры двигаются по точкам, есть пушки и ограниченные зоны движения для генералов и советников.');
                this.hideDropMode();
                break;

            case 'shogi':
                this.currentGame = new ShogiGame();
                this.updateRulesContent('Сёги (Японские шахматы). Особенности: фигуры могут возвращаться на доску, есть зона превращения, все фигуры одного цвета но ориентированы в сторону противника. Используйте кнопку "Режим сброса" для размещения захваченных фигур.');
                this.showDropMode();
                break;

            case 'chess':
            default:
                this.currentGame = new ChessGame();
                this.updateRulesContent('Классические шахматы. Цель - поставить мат королю противника. Особенности: рокировка, взятие на проходе, превращение пешек в ферзя.');
                this.hideDropMode();
                break;
        }

        this.currentGameType = gameType;
    }

    updateRulesContent(text) {
        document.getElementById('rules-content').textContent = text;
    }

    showDropMode() {
        document.getElementById('drop-mode-btn').style.display = 'inline-block';
        document.getElementById('in-hand-pieces').style.display = 'block';
    }

    hideDropMode() {
        document.getElementById('drop-mode-btn').style.display = 'none';
        document.getElementById('in-hand-pieces').style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.gameManager = new GameManager();
});