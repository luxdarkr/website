class SudokuGame {
    constructor() {
        this.grid = document.getElementById('sudokuGrid');
        this.timerElement = document.getElementById('timer');
        this.messageElement = document.getElementById('gameMessage');
        this.movesElement = document.getElementById('movesCount');
        this.errorsElement = document.getElementById('errorsCount');
        
        this.solution = null;
        this.puzzle = null;
        this.selectedCell = null;
        this.startTime = null;
        this.timerInterval = null;
        this.moves = 0;
        this.errors = 0;
        this.difficulty = 'medium';
        this.boardSize = 9; // 4, 6, или 9
        this.blockWidth = 3;
        this.blockHeight = 3;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.newGame();
        this.startTimer();
    }

    setupEventListeners() {
        // Кнопки цифр
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = e.target.getAttribute('data-number');
                this.handleNumberInput(number);
            });
        });

        // Кнопки действий
        document.getElementById('checkBtn').addEventListener('click', () => this.checkSolution());
        document.getElementById('hintBtn').addEventListener('click', () => this.giveHint());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('solveBtn').addEventListener('click', () => this.solvePuzzle());
        
        // Кнопки сложности
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.textContent.trim().toLowerCase();
                this.setDifficulty(level);
            });
        });

        // Кнопки размера
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                this.setBoardSize(size);
            });
        });

        // Ввод с клавиатуры
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                this.handleNumberInput(e.key);
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.handleNumberInput('0');
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                       e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.handleArrowKeys(e.key);
            }
        });

        // Клик по ячейкам
        this.grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('sudoku-cell')) {
                this.selectCell(e.target);
            }
        });
    }

    setBoardSize(size) {
        this.boardSize = size;
        
        // Устанавливаем размеры блоков
        if (size === 4) {
            this.blockWidth = 2;
            this.blockHeight = 2;
        } else if (size === 6) {
            this.blockWidth = 2;
            this.blockHeight = 3;
        } else {
            this.blockWidth = 3;
            this.blockHeight = 3;
        }
        
        // Обновляем активную кнопку
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.size-btn[data-size="${size}"]`).classList.add('active');
        
        this.newGame();
    }

    setDifficulty(level) {
        const levels = {
            'легко': 'easy',
            'средне': 'medium', 
            'сложно': 'hard'
        };
        
        this.difficulty = levels[level] || 'medium';
        
        // Обновляем активную кнопку
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Находим кнопку по тексту
        const buttons = document.querySelectorAll('.difficulty-btn');
        for (const btn of buttons) {
            if (btn.textContent.trim().toLowerCase() === level) {
                btn.classList.add('active');
                break;
            }
        }
        
        this.newGame();
    }

    generateSudoku() {
        // Создаем решенное судоку
        this.solution = this.generateSolvedBoard();
        
        // Создаем головоломку на основе решения
        this.puzzle = this.createPuzzle(this.solution, this.difficulty);
        
        this.displayBoard();
    }

    generateSolvedBoard() {
        const board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.solveSudoku(board);
        return board;
    }

    solveSudoku(board) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board[row][col] === 0) {
                    const numbers = this.shuffleArray(Array.from({length: this.boardSize}, (_, i) => i + 1));
                    
                    for (const num of numbers) {
                        if (this.isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            
                            if (this.solveSudoku(board)) {
                                return true;
                            }
                            
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    createPuzzle(solution, difficulty) {
        const puzzle = solution.map(row => [...row]);
        const totalCells = this.boardSize * this.boardSize;
        
        const cellsToRemove = {
            easy: Math.floor(totalCells * 0.4),      // 40% клеток останется
            medium: Math.floor(totalCells * 0.5),    // 50% клеток останется  
            hard: Math.floor(totalCells * 0.6)       // 60% клеток останется
        };

        const cells = this.shuffleArray(Array.from({length: totalCells}, (_, i) => i));
        
        for (let i = 0; i < cellsToRemove[difficulty]; i++) {
            const index = cells[i];
            const row = Math.floor(index / this.boardSize);
            const col = index % this.boardSize;
            puzzle[row][col] = 0;
        }

        return puzzle;
    }

    displayBoard() {
        this.grid.innerHTML = '';
        this.grid.className = `sudoku-grid size-${this.boardSize}`;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.puzzle[row][col] !== 0) {
                    cell.textContent = this.puzzle[row][col];
                    cell.classList.add('fixed');
                }
                
                this.grid.appendChild(cell);
            }
        }
    }

    selectCell(cell) {
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
            this.clearHighlights();
        }
        
        if (!cell.classList.contains('fixed')) {
            cell.classList.add('selected');
            this.selectedCell = cell;
            this.highlightRelatedCells();
        }
    }

    highlightRelatedCells() {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        const value = this.selectedCell.textContent;

        // Подсвечиваем ячейки с тем же номером
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            if (cell.textContent === value && value !== '') {
                cell.classList.add('same-number');
            }
        });

        // Подсвечиваем связанные ячейки
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);
            
            if (cellRow === row || cellCol === col || 
                (Math.floor(cellRow / this.blockHeight) === Math.floor(row / this.blockHeight) && 
                 Math.floor(cellCol / this.blockWidth) === Math.floor(col / this.blockWidth))) {
                cell.classList.add('highlighted');
            }
        });
    }

    clearHighlights() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('highlighted', 'same-number');
        });
    }

    handleNumberInput(number) {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        if (number === '0') {
            this.selectedCell.textContent = '';
            this.selectedCell.classList.remove('error');
            this.clearHighlights();
            this.highlightRelatedCells();
            return;
        }

        const num = parseInt(number);
        if (num > this.boardSize) return; // Защита от чисел больше размера доски

        const isValid = this.isValidMove(num, row, col);
        
        this.selectedCell.textContent = number;
        this.selectedCell.classList.remove('error');
        
        if (!isValid) {
            this.selectedCell.classList.add('error');
            this.errors++;
            this.errorsElement.textContent = this.errors;
            this.showMessage('Неверный ход!', 'error');
        } else {
            this.moves++;
            this.movesElement.textContent = this.moves;
        }

        this.clearHighlights();
        this.highlightRelatedCells();

        if (this.isComplete()) {
            this.checkSolution();
        }
    }

    handleArrowKeys(key) {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        let newRow = row, newCol = col;

        switch (key) {
            case 'ArrowUp': newRow = Math.max(0, row - 1); break;
            case 'ArrowDown': newRow = Math.min(this.boardSize - 1, row + 1); break;
            case 'ArrowLeft': newCol = Math.max(0, col - 1); break;
            case 'ArrowRight': newCol = Math.min(this.boardSize - 1, col + 1); break;
        }

        const newCell = this.grid.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell) {
            this.selectCell(newCell);
        }
    }

    isValidMove(num, row, col) {
        // Проверяем ряд
        for (let i = 0; i < this.boardSize; i++) {
            const cell = this.grid.querySelector(`[data-row="${row}"][data-col="${i}"]`);
            if (cell && cell.textContent == num && i !== col) return false;
        }

        // Проверяем колонку
        for (let i = 0; i < this.boardSize; i++) {
            const cell = this.grid.querySelector(`[data-row="${i}"][data-col="${col}"]`);
            if (cell && cell.textContent == num && i !== row) return false;
        }

        // Проверяем блок
        const blockRow = Math.floor(row / this.blockHeight) * this.blockHeight;
        const blockCol = Math.floor(col / this.blockWidth) * this.blockWidth;
        
        for (let i = 0; i < this.blockHeight; i++) {
            for (let j = 0; j < this.blockWidth; j++) {
                const cell = this.grid.querySelector(`[data-row="${blockRow + i}"][data-col="${blockCol + j}"]`);
                if (cell && cell.textContent == num && 
                    (blockRow + i !== row || blockCol + j !== col)) {
                    return false;
                }
            }
        }

        return true;
    }

    isComplete() {
        const cells = this.grid.querySelectorAll('.sudoku-cell');
        return Array.from(cells).every(cell => cell.textContent !== '');
    }

    checkSolution() {
        const userSolution = this.getCurrentBoard();
        const isCorrect = this.boardsEqual(userSolution, this.solution);
        
        if (isCorrect) {
            this.stopTimer();
            this.showMessage('Поздравляем! Судоку решено правильно! 🎉', 'success');
        } else {
            this.showMessage('Решение содержит ошибки. Продолжайте пытаться!', 'error');
        }
        
        return isCorrect;
    }

    getCurrentBoard() {
        const board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        
        this.grid.querySelectorAll('.sudoku-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            board[row][col] = cell.textContent ? parseInt(cell.textContent) : 0;
        });
        
        return board;
    }

    boardsEqual(board1, board2) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board1[row][col] !== board2[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    giveHint() {
        const emptyCells = Array.from(this.grid.querySelectorAll('.sudoku-cell:not(.fixed)'))
            .filter(cell => !cell.textContent);
        
        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const row = parseInt(randomCell.dataset.row);
        const col = parseInt(randomCell.dataset.col);
        
        randomCell.textContent = this.solution[row][col];
        randomCell.classList.add('fixed');
        randomCell.classList.remove('error');
        
        this.moves++;
        this.movesElement.textContent = this.moves;
        this.showMessage('Подсказка добавлена!', 'info');
    }

    solvePuzzle() {
        if (confirm('Показать решение? Текущий прогресс будет потерян.')) {
            this.stopTimer();
            
            this.grid.querySelectorAll('.sudoku-cell').forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                cell.textContent = this.solution[row][col];
                cell.classList.add('fixed');
                cell.classList.remove('error', 'selected');
            });
            
            this.clearHighlights();
            this.showMessage('Решение показано', 'info');
        }
    }

    newGame() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.generateSudoku();
        this.selectedCell = null;
        this.moves = 0;
        this.errors = 0;
        this.startTime = Date.now();
        
        this.movesElement.textContent = '0';
        this.errorsElement.textContent = '0';
        this.timerElement.textContent = '00:00';
        
        this.startTimer();
        this.showMessage('Новая игра начата! Удачи!', 'info');
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `game-message ${type}`;
        
        setTimeout(() => {
            this.messageElement.textContent = '';
            this.messageElement.className = 'game-message';
        }, 3000);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    isValidPlacement(board, row, col, num) {
        // Проверка ряда
        for (let x = 0; x < this.boardSize; x++) {
            if (board[row][x] === num) return false;
        }

        // Проверка колонки
        for (let x = 0; x < this.boardSize; x++) {
            if (board[x][col] === num) return false;
        }

        // Проверка блока
        const startRow = row - row % this.blockHeight;
        const startCol = col - col % this.blockWidth;
        
        for (let i = 0; i < this.blockHeight; i++) {
            for (let j = 0; j < this.blockWidth; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }

        return true;
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.sudokuGame = new SudokuGame();
});