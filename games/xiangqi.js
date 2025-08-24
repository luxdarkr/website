// Xiangqi (Chinese Chess) game logic
class XiangqiGame {
    constructor() {
        this.board = [];
        this.selectedPiece = null;
        this.currentPlayer = 'red';
        this.validMoves = [];
        this.gameActive = true;
        this.capturedPieces = { red: [], black: [] };
        this.moveHistory = [];
        this.isFlipped = false;
        this.moveHistoryElement = document.getElementById('moves-list');
        this.undoBtn = document.getElementById('undo-btn');

        this.pieceChars = {
            'red': {
                'general': '帥', 'advisor': '仕', 'elephant': '相',
                'horse': '傌', 'chariot': '俥', 'cannon': '炮', 'soldier': '兵'
            },
            'black': {
                'general': '將', 'advisor': '士', 'elephant': '象',
                'horse': '馬', 'chariot': '車', 'cannon': '砲', 'soldier': '卒'
            }
        };

        this.init();
    }

    init() {
        this.createBoard();
        this.setupPieces();
        this.renderBoard();
        this.setupEventListeners();
        this.hideDropMode();
    }

    createBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        boardElement.className = 'chess-board xiangqi-board';
        
        for (let row = 0; row < 10; row++) {
            this.board[row] = [];
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell xiangqi-cell';
                
                if (row >= 4 && row <= 5) cell.classList.add('river');
                if ((row <= 2 && col >= 3 && col <= 5) || (row >= 7 && col >= 3 && col <= 5)) {
                    cell.classList.add('palace');
                }
                
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                boardElement.appendChild(cell);
                
                this.board[row][col] = null;
            }
        }
    }

    setupPieces() {
        this.board = Array(10).fill().map(() => Array(9).fill(null));
        this.capturedPieces = { red: [], black: [] };
        this.moveHistory = [];
        
        // Красные фигуры (нижняя сторона)
        const redPieces = [
            [9, 0, 'chariot'], [9, 1, 'horse'], [9, 2, 'elephant'], [9, 3, 'advisor'],
            [9, 4, 'general'], [9, 5, 'advisor'], [9, 6, 'elephant'], [9, 7, 'horse'], [9, 8, 'chariot'],
            [7, 1, 'cannon'], [7, 7, 'cannon'],
            [6, 0, 'soldier'], [6, 2, 'soldier'], [6, 4, 'soldier'], [6, 6, 'soldier'], [6, 8, 'soldier']
        ];
        
        // Чёрные фигуры (верхняя сторона)
        const blackPieces = [
            [0, 0, 'chariot'], [0, 1, 'horse'], [0, 2, 'elephant'], [0, 3, 'advisor'],
            [0, 4, 'general'], [0, 5, 'advisor'], [0, 6, 'elephant'], [0, 7, 'horse'], [0, 8, 'chariot'],
            [2, 1, 'cannon'], [2, 7, 'cannon'],
            [3, 0, 'soldier'], [3, 2, 'soldier'], [3, 4, 'soldier'], [3, 6, 'soldier'], [3, 8, 'soldier']
        ];
        
        redPieces.forEach(([row, col, type]) => {
            this.board[row][col] = { type, color: 'red', moved: false };
        });
        
        blackPieces.forEach(([row, col, type]) => {
            this.board[row][col] = { type, color: 'black', moved: false };
        });
        
        this.updateUndoButton();
        this.updateMoveHistory();
    }

    renderBoard() {
        const cells = document.querySelectorAll('#chess-board .cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const piece = this.board[row][col];
            
            cell.textContent = '';
            cell.classList.remove('selected', 'valid-move', 'valid-capture', 'check');
            
            if (piece) {
                cell.textContent = this.pieceChars[piece.color][piece.type];
                cell.classList.add(piece.color === 'red' ? 'xiangqi-red' : 'xiangqi-black');
            }
        });
        
        document.getElementById('current-player').textContent = 
            this.currentPlayer === 'red' ? 'красных' : 'чёрных';
        
        this.updateCapturedPieces();
        this.checkGameState();
    }

    updateCapturedPieces() {
        const redContainer = document.getElementById('captured-white-pieces');
        const blackContainer = document.getElementById('captured-black-pieces');
        
        redContainer.innerHTML = 'Съедено красных:';
        blackContainer.innerHTML = 'Съедено чёрных:';
        
        this.capturedPieces.red.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece xiangqi-red';
            span.textContent = this.pieceChars[piece.color][piece.type];
            redContainer.appendChild(span);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece xiangqi-black';
            span.textContent = this.pieceChars[piece.color][piece.type];
            blackContainer.appendChild(span);
        });
    }

    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('flip-board-btn').addEventListener('click', () => this.flipBoard());
        this.undoBtn.addEventListener('click', () => this.undoMove());
        this.updateUndoButton();
    }

    handleCellClick(event) {
        if (!this.gameActive) return;
        
        const cell = event.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.selectedPiece && this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
            this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
            return;
        }
        
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
            this.selectPiece(row, col);
        } else {
            this.clearSelection();
        }
    }

    selectPiece(row, col) {
        this.clearSelection();
        this.selectedPiece = { row, col, piece: this.board[row][col] };
        
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        
        this.validMoves = this.getValidMoves(row, col);
        this.highlightValidMoves();
    }

    clearSelection() {
        const cells = document.querySelectorAll('#chess-board .cell');
        cells.forEach(cell => cell.classList.remove('selected', 'valid-move', 'valid-capture'));
        this.selectedPiece = null;
        this.validMoves = [];
    }

    highlightValidMoves() {
        this.validMoves.forEach(move => {
            const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
            if (cell) {
                const hasPiece = this.board[move.row][move.col] !== null;
                cell.classList.add(hasPiece ? 'valid-capture' : 'valid-move');
            }
        });
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.type) {
            case 'general': this.getGeneralMoves(row, col, moves); break;
            case 'advisor': this.getAdvisorMoves(row, col, moves); break;
            case 'elephant': this.getElephantMoves(row, col, moves); break;
            case 'horse': this.getHorseMoves(row, col, moves); break;
            case 'chariot': this.getChariotMoves(row, col, moves); break;
            case 'cannon': this.getCannonMoves(row, col, moves); break;
            case 'soldier': this.getSoldierMoves(row, col, moves); break;
        }
        
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
    }

    getGeneralMoves(row, col, moves) {
        const piece = this.board[row][col];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const inPalace = row >= 7 && row <= 9 && col >= 3 && col <= 5;
        
        if (piece.color === 'black') {
            const inPalace = row >= 0 && row <= 2 && col >= 3 && col <= 5;
        }
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol) && this.isInPalace(newRow, newCol, piece.color)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getAdvisorMoves(row, col, moves) {
        const piece = this.board[row][col];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol) && this.isInPalace(newRow, newCol, piece.color)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getElephantMoves(row, col, moves) {
        const piece = this.board[row][col];
        const directions = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
        const riverRow = piece.color === 'red' ? 5 : 4;
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            const blockRow = row + dRow/2;
            const blockCol = col + dCol/2;
            
            if (this.isInBounds(newRow, newCol) && 
                (piece.color === 'red' ? newRow >= 5 : newRow <= 4) &&
                !this.board[blockRow][blockCol]) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getHorseMoves(row, col, moves) {
        const piece = this.board[row][col];
        const horseMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        const blockPositions = [
            [1, 0], [1, 0], [-1, 0], [-1, 0],
            [0, 1], [0, -1], [0, 1], [0, -1]
        ];
        
        for (let i = 0; i < horseMoves.length; i++) {
            const [dRow, dCol] = horseMoves[i];
            const [bRow, bCol] = blockPositions[i];
            const newRow = row + dRow;
            const newCol = col + dCol;
            const blockRow = row + bRow;
            const blockCol = col + bCol;
            
            if (this.isInBounds(newRow, newCol) && !this.board[blockRow][blockCol]) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getChariotMoves(row, col, moves) {
        const piece = this.board[row][col];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 10; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }
    }

    getCannonMoves(row, col, moves) {
        const piece = this.board[row][col];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dRow, dCol] of directions) {
            let foundScreen = false;
            
            for (let i = 1; i < 10; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                if (!target) {
                    if (!foundScreen) {
                        moves.push({ row: newRow, col: newCol });
                    }
                } else {
                    if (!foundScreen) {
                        foundScreen = true;
                    } else {
                        if (target.color !== piece.color) {
                            moves.push({ row: newRow, col: newCol });
                        }
                        break;
                    }
                }
            }
        }
    }

    getSoldierMoves(row, col, moves) {
        const piece = this.board[row][col];
        const directions = [[0, 1], [1, 0], [0, -1]];
        
        if (piece.color === 'black') {
            directions.push([-1, 0]);
        } else {
            directions.push([-1, 0]);
        }
        
        const crossedRiver = (piece.color === 'red' && row <= 4) || (piece.color === 'black' && row >= 5);
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol)) {
                // Солдаты могут двигаться только вперёд до перехода реки
                if (piece.color === 'red' && dRow === -1 && row > 4) continue;
                if (piece.color === 'black' && dRow === 1 && row < 5) continue;
                
                // После перехода реки могут двигаться вбок
                if (crossedRiver && dCol !== 0) {
                    // Можно двигаться вбок
                } else if (!crossedRiver && dCol !== 0) {
                    continue; // Нельзя двигаться вбок до перехода реки
                }
                
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    isInBounds(row, col) {
        return row >= 0 && row < 10 && col >= 0 && col < 9;
    }

    isInPalace(row, col, color) {
        if (color === 'red') {
            return row >= 7 && row <= 9 && col >= 3 && col <= 5;
        } else {
            return row >= 0 && row <= 2 && col >= 3 && col <= 5;
        }
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;
        
        const inCheck = this.isKingInCheck(movingPiece.color);
        
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        return inCheck;
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        this.moveHistory.push({
            piece: { ...piece },
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            captured: capturedPiece ? { ...capturedPiece } : null
        });
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.moved = true;
        
        if (capturedPiece) {
            this.capturedPieces[piece.color].push(capturedPiece);
        }
        
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = null;
        
        if (lastMove.captured) {
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
            const capturedArray = this.capturedPieces[lastMove.piece.color];
            const index = capturedArray.findIndex(p => p.type === lastMove.captured.type && p.color === lastMove.captured.color);
            if (index > -1) capturedArray.splice(index, 1);
        }
        
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    updateUndoButton() {
        this.undoBtn.disabled = this.moveHistory.length === 0;
    }

    updateMoveHistory() {
        this.moveHistoryElement.innerHTML = '';
        
        const totalPairs = Math.ceil(this.moveHistory.length / 2);
        
        for (let pairIndex = 0; pairIndex < totalPairs; pairIndex++) {
            const moveDiv = document.createElement('div');
            moveDiv.className = 'move-item';
            
            const moveNumber = pairIndex + 1;
            const redMove = this.moveHistory[pairIndex * 2];
            const blackMove = this.moveHistory[pairIndex * 2 + 1];
            
            let moveHtml = `<span class="move-number">${moveNumber}.</span>`;
            moveHtml += `<span class="move-white">${redMove ? this.getMoveNotation(redMove) : ''}</span>`;
            moveHtml += `<span class="move-black">${blackMove ? this.getMoveNotation(blackMove) : ''}</span>`;
            
            moveDiv.innerHTML = moveHtml;
            this.moveHistoryElement.appendChild(moveDiv);
        }
        
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
    }

    getMoveNotation(move) {
        const files = '９８７６５４３２１';
        const ranks = '一二三四五六七八九十';
        const pieceNames = {
            'general': 'K', 'advisor': 'A', 'elephant': 'E',
            'horse': 'H', 'chariot': 'R', 'cannon': 'C', 'soldier': 'P'
        };
        
        return `${pieceNames[move.piece.type]}${files[move.to.col]}${ranks[move.to.row]}`;
    }

    isKingInCheck(color) {
        // Упрощённая проверка шаха
        // В реальной реализации нужно проверять угрозы от всех фигур
        return false;
    }

    checkGameState() {
        // Упрощённая проверка состояния игры
        const inCheck = this.isKingInCheck(this.currentPlayer);
        
        if (inCheck) {
            document.getElementById('game-status').textContent = 'Шах!';
        } else {
            document.getElementById('game-status').textContent = '';
        }
    }

    resetGame() {
        this.selectedPiece = null;
        this.currentPlayer = 'red';
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        
        document.getElementById('game-status').textContent = '';
        document.getElementById('captured-white-pieces').innerHTML = 'Съедено красных:';
        document.getElementById('captured-black-pieces').innerHTML = 'Съедено чёрных:';
        
        this.setupPieces();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    flipBoard() {
        const board = document.getElementById('chess-board');
        this.isFlipped = !this.isFlipped;
        board.classList.toggle('flipped');
    }

    showDropMode() {
        // Не используется в сянци
    }

    hideDropMode() {
        // Не используется в сянци
    }
}