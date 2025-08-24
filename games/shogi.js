// Shogi (Japanese Chess) game logic
class ShogiGame {
    constructor() {
        this.board = [];
        this.selectedPiece = null;
        this.currentPlayer = 'black';
        this.validMoves = [];
        this.gameActive = true;
        this.capturedPieces = { black: [], white: [] };
        this.moveHistory = [];
        this.isFlipped = false;
        this.dropMode = false;
        this.pieceInHand = null;
        this.moveHistoryElement = document.getElementById('moves-list');
        this.undoBtn = document.getElementById('undo-btn');
        this.dropModeBtn = document.getElementById('drop-mode-btn');

        this.pieceChars = {
            'black': {
                'king': '玉', 'rook': '飛', 'bishop': '角', 'gold': '金',
                'silver': '銀', 'knight': '桂', 'lance': '香', 'pawn': '歩'
            },
            'white': {
                'king': '王', 'rook': '飛', 'bishop': '角', 'gold': '金',
                'silver': '銀', 'knight': '桂', 'lance': '香', 'pawn': '歩'
            }
        };

        this.promotedChars = {
            'rook': '龍', 'bishop': '馬', 'silver': '全', 'knight': '圭',
            'lance': '杏', 'pawn': 'と'
        };

        this.promotionZone = {
            'black': [0, 1, 2], // Для чёрных: ряды 0-2
            'white': [6, 7, 8]  // Для белых: ряды 6-8
        };

        this.init();
    }

    init() {
        this.createBoard();
        this.setupPieces();
        this.renderBoard();
        this.setupEventListeners();
        this.showDropModeBtn();
    }

    createBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        boardElement.className = 'chess-board shogi-board';
        
        for (let row = 0; row < 9; row++) {
            this.board[row] = [];
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell shogi-cell';
                
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                boardElement.appendChild(cell);
                
                this.board[row][col] = null;
            }
        }
    }

    setupPieces() {
        this.board = Array(9).fill().map(() => Array(9).fill(null));
        this.capturedPieces = { black: [], white: [] };
        this.moveHistory = [];
        
        // Чёрные фигуры (нижняя сторона)
        const blackPieces = [
            [8, 0, 'lance'], [8, 1, 'knight'], [8, 2, 'silver'], [8, 3, 'gold'],
            [8, 4, 'king'], [8, 5, 'gold'], [8, 6, 'silver'], [8, 7, 'knight'], [8, 8, 'lance'],
            [7, 1, 'bishop'], [7, 7, 'rook'],
            [6, 0, 'pawn'], [6, 1, 'pawn'], [6, 2, 'pawn'], [6, 3, 'pawn'], [6, 4, 'pawn'],
            [6, 5, 'pawn'], [6, 6, 'pawn'], [6, 7, 'pawn'], [6, 8, 'pawn']
        ];
        
        // Белые фигуры (верхняя сторона)
        const whitePieces = [
            [0, 0, 'lance'], [0, 1, 'knight'], [0, 2, 'silver'], [0, 3, 'gold'],
            [0, 4, 'king'], [0, 5, 'gold'], [0, 6, 'silver'], [0, 7, 'knight'], [0, 8, 'lance'],
            [1, 1, 'rook'], [1, 7, 'bishop'],
            [2, 0, 'pawn'], [2, 1, 'pawn'], [2, 2, 'pawn'], [2, 3, 'pawn'], [2, 4, 'pawn'],
            [2, 5, 'pawn'], [2, 6, 'pawn'], [2, 7, 'pawn'], [2, 8, 'pawn']
        ];
        
        blackPieces.forEach(([row, col, type]) => {
            this.board[row][col] = { type, color: 'black', promoted: false };
        });
        
        whitePieces.forEach(([row, col, type]) => {
            this.board[row][col] = { type, color: 'white', promoted: false };
        });
        
        this.updateUndoButton();
        this.updateMoveHistory();
        this.updateHandPieces();
    }

    renderBoard() {
        const cells = document.querySelectorAll('#chess-board .cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const piece = this.board[row][col];
            
            cell.textContent = '';
            cell.classList.remove('selected', 'valid-move', 'valid-capture', 'check', 'promotion-zone');
            
            if (this.promotionZone[this.currentPlayer].includes(row)) {
                cell.classList.add('promotion-zone');
            }
            
            if (piece) {
                const char = piece.promoted ? this.promotedChars[piece.type] || this.pieceChars[piece.color][piece.type] : this.pieceChars[piece.color][piece.type];
                cell.textContent = char;
                cell.classList.add('shogi-piece');
                if (piece.promoted) cell.classList.add('shogi-promoted');
            }
        });
        
        document.getElementById('current-player').textContent = 
            this.currentPlayer === 'black' ? 'чёрных' : 'белых';
        
        this.updateCapturedPieces();
        this.checkGameState();
    }

    updateCapturedPieces() {
        const blackContainer = document.getElementById('captured-white-pieces');
        const whiteContainer = document.getElementById('captured-black-pieces');
        
        blackContainer.innerHTML = 'Съедено чёрных:';
        whiteContainer.innerHTML = 'Съедено белых:';
        
        this.capturedPieces.black.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.pieceChars[piece.color][piece.type];
            blackContainer.appendChild(span);
        });
        
        this.capturedPieces.white.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.pieceChars[piece.color][piece.type];
            whiteContainer.appendChild(span);
        });
    }

    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('flip-board-btn').addEventListener('click', () => this.flipBoard());
        this.undoBtn.addEventListener('click', () => this.undoMove());
        this.dropModeBtn.addEventListener('click', () => this.toggleDropMode());
        this.updateUndoButton();
    }

    handleCellClick(event) {
        if (!this.gameActive) return;
        
        const cell = event.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.dropMode && this.pieceInHand) {
            this.dropPiece(row, col);
            return;
        }
        
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
        const directions = this.getPieceDirections(piece);
        
        if (piece.promoted) {
            this.getPromotedMoves(row, col, moves, piece);
        } else {
            this.getNormalMoves(row, col, moves, piece, directions);
        }
        
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
    }

    getPieceDirections(piece) {
        const colorMod = piece.color === 'black' ? -1 : 1;
        
        switch(piece.type) {
            case 'king':
                return [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            case 'rook':
                return [[-1,0],[0,-1],[0,1],[1,0]];
            case 'bishop':
                return [[-1,-1],[-1,1],[1,-1],[1,1]];
            case 'gold':
                return [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,0]];
            case 'silver':
                return [[-1,-1],[-1,0],[-1,1],[1,-1],[1,1]];
            case 'knight':
                return [[-2*colorMod,-1],[-2*colorMod,1]];
            case 'lance':
                return [[-1*colorMod,0]];
            case 'pawn':
                return [[-1*colorMod,0]];
            default:
                return [];
        }
    }

    getNormalMoves(row, col, moves, piece, directions) {
        const colorMod = piece.color === 'black' ? -1 : 1;
        
        for (const [dRow, dCol] of directions) {
            if (piece.type === 'rook' || piece.type === 'bishop' || piece.type === 'lance') {
                // Дальнобойные фигуры
                for (let i = 1; i < 9; i++) {
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
            } else {
                // Короткобойные фигуры
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                if (this.isInBounds(newRow, newCol)) {
                    const target = this.board[newRow][newCol];
                    if (!target || target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }
    }

    getPromotedMoves(row, col, moves, piece) {
        let directions;
        
        switch(piece.type) {
            case 'rook':
                directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                break;
            case 'bishop':
                directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                break;
            case 'silver':
            case 'knight':
            case 'lance':
            case 'pawn':
                directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,0]];
                break;
            default:
                directions = [];
        }
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    isInBounds(row, col) {
        return row >= 0 && row < 9 && col >= 0 && col < 9;
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
        let promoted = piece.promoted;
        let shouldPromote = false;
        
        // Проверка на возможность превращения
        if (!piece.promoted && this.canPromote(piece, fromRow, toRow)) {
            shouldPromote = confirm('Превратить фигуру?');
            promoted = shouldPromote;
        }
        
        this.moveHistory.push({
            piece: { ...piece, promoted },
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            captured: capturedPiece ? { ...capturedPiece } : null,
            promoted: shouldPromote
        });
        
        this.board[toRow][toCol] = { ...piece, promoted };
        this.board[fromRow][fromCol] = null;
        
        if (capturedPiece) {
            // Сброс превращения у захваченной фигуры
            capturedPiece.promoted = false;
            this.capturedPieces[piece.color].push(capturedPiece);
        }
        
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
        this.updateHandPieces();
    }

    canPromote(piece, fromRow, toRow) {
        if (piece.promoted) return false;
        if (piece.type === 'king' || piece.type === 'gold') return false;
        
        const inPromotionZone = this.promotionZone[piece.color].includes(toRow) ||
                              this.promotionZone[piece.color].includes(fromRow);
        
        return inPromotionZone;
    }

    dropPiece(row, col) {
        if (!this.pieceInHand || this.board[row][col]) return;
        
        // Проверка ограничений на сброс
        if (this.pieceInHand.type === 'pawn') {
            // Нельзя ставить пешку на колонку, где уже есть своя пешка
            for (let r = 0; r < 9; r++) {
                if (this.board[r][col]?.type === 'pawn' && this.board[r][col]?.color === this.currentPlayer) {
                    alert('Нельзя ставить пешку на колонку, где уже есть ваша пешка!');
                    return;
                }
            }
            
            // Нельзя ставить пешку для немедленного мата
            if (this.wouldBeCheckmateWithPawnDrop(row, col)) {
                alert('Нельзя ставить пешку для немедленного мата!');
                return;
            }
        }
        
        this.moveHistory.push({
            piece: { ...this.pieceInHand },
            from: null,
            to: { row, col },
            captured: null,
            drop: true
        });
        
        this.board[row][col] = { ...this.pieceInHand };
        
        // Убираем фигуру из руки
        const handArray = this.capturedPieces[this.currentPlayer];
        const index = handArray.findIndex(p => p.type === this.pieceInHand.type);
        if (index > -1) handArray.splice(index, 1);
        
        this.pieceInHand = null;
        this.dropMode = false;
        this.dropModeBtn.classList.remove('drop-mode');
        
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
        this.updateHandPieces();
    }

    wouldBeCheckmateWithPawnDrop(row, col) {
        // Упрощённая проверка - в реальной реализации нужна полная проверка мата
        return false;
    }

    toggleDropMode() {
        this.dropMode = !this.dropMode;
        this.pieceInHand = null;
        this.clearSelection();
        
        if (this.dropMode) {
            this.dropModeBtn.classList.add('drop-mode');
        } else {
            this.dropModeBtn.classList.remove('drop-mode');
        }
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        if (lastMove.drop) {
            // Отмена сброса фигуры
            this.board[lastMove.to.row][lastMove.to.col] = null;
            this.capturedPieces[this.currentPlayer].push(lastMove.piece);
        } else {
            // Отмена обычного хода
            this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured || null;
            
            if (lastMove.captured) {
                const capturedArray = this.capturedPieces[lastMove.piece.color];
                const index = capturedArray.findIndex(p => p.type === lastMove.captured.type);
                if (index > -1) capturedArray.splice(index, 1);
            }
        }
        
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
        this.updateHandPieces();
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
            const blackMove = this.moveHistory[pairIndex * 2];
            const whiteMove = this.moveHistory[pairIndex * 2 + 1];
            
            let moveHtml = `<span class="move-number">${moveNumber}.</span>`;
            moveHtml += `<span class="move-white">${blackMove ? this.getMoveNotation(blackMove) : ''}</span>`;
            moveHtml += `<span class="move-black">${whiteMove ? this.getMoveNotation(whiteMove) : ''}</span>`;
            
            moveDiv.innerHTML = moveHtml;
            this.moveHistoryElement.appendChild(moveDiv);
        }
        
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
    }

    getMoveNotation(move) {
        const files = '９８７６５４３２１';
        const ranks = '一二三四五六七八九';
        const pieceNames = {
            'king': 'K', 'rook': 'R', 'bishop': 'B', 'gold': 'G',
            'silver': 'S', 'knight': 'N', 'lance': 'L', 'pawn': 'P'
        };
        
        if (move.drop) {
            return `${pieceNames[move.piece.type]}*${files[move.to.col]}${ranks[move.to.row]}`;
        }
        
        let notation = `${pieceNames[move.piece.type]}${files[move.from.col]}${ranks[move.from.row]}->${files[move.to.col]}${ranks[move.to.row]}`;
        if (move.promoted) notation += '+';
        
        return notation;
    }

    updateHandPieces() {
        const blackHand = document.getElementById('black-hand');
        const whiteHand = document.getElementById('white-hand');
        
        blackHand.innerHTML = '';
        whiteHand.innerHTML = '';
        
        // Группируем фигуры по типам
        const blackPieces = {};
        const whitePieces = {};
        
        this.capturedPieces.black.forEach(piece => {
            blackPieces[piece.type] = (blackPieces[piece.type] || 0) + 1;
        });
        
        this.capturedPieces.white.forEach(piece => {
            whitePieces[piece.type] = (whitePieces[piece.type] || 0) + 1;
        });
        
        // Создаём элементы для чёрных фигур в руке
        for (const [type, count] of Object.entries(blackPieces)) {
            for (let i = 0; i < count; i++) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'hand-piece';
                pieceDiv.textContent = this.pieceChars['black'][type];
                pieceDiv.addEventListener('click', () => {
                    if (this.dropMode) {
                        this.pieceInHand = { type, color: 'black', promoted: false };
                        document.querySelectorAll('.hand-piece').forEach(p => p.classList.remove('selected'));
                        pieceDiv.classList.add('selected');
                    }
                });
                blackHand.appendChild(pieceDiv);
            }
        }
        
        // Создаём элементы для белых фигур в руке
        for (const [type, count] of Object.entries(whitePieces)) {
            for (let i = 0; i < count; i++) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'hand-piece';
                pieceDiv.textContent = this.pieceChars['white'][type];
                pieceDiv.addEventListener('click', () => {
                    if (this.dropMode) {
                        this.pieceInHand = { type, color: 'white', promoted: false };
                        document.querySelectorAll('.hand-piece').forEach(p => p.classList.remove('selected'));
                        pieceDiv.classList.add('selected');
                    }
                });
                whiteHand.appendChild(pieceDiv);
            }
        }
        
        // Показываем/скрываем блок с фигурами в руке
        const inHandContainer = document.getElementById('in-hand-pieces');
        if (this.capturedPieces.black.length > 0 || this.capturedPieces.white.length > 0) {
            inHandContainer.style.display = 'block';
        } else {
            inHandContainer.style.display = 'none';
        }
    }

    isKingInCheck(color) {
        // Упрощённая проверка шаха
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
        this.currentPlayer = 'black';
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        this.dropMode = false;
        this.pieceInHand = null;
        
        document.getElementById('game-status').textContent = '';
        document.getElementById('captured-white-pieces').innerHTML = 'Съедено чёрных:';
        document.getElementById('captured-black-pieces').innerHTML = 'Съедено белых:';
        
        this.setupPieces();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
        this.updateHandPieces();
        this.hideDropMode();
    }

    flipBoard() {
        const board = document.getElementById('chess-board');
        this.isFlipped = !this.isFlipped;
        board.classList.toggle('flipped');
    }

    showDropModeBtn() {
        this.dropModeBtn.style.display = 'inline-block';
    }

    hideDropMode() {
        this.dropMode = false;
        this.pieceInHand = null;
        this.dropModeBtn.classList.remove('drop-mode');
    }
}