// Chess game logic
class ChessGame {
    constructor() {
        this.board = [];
        this.selectedPiece = null;
        this.currentPlayer = 'white';
        this.validMoves = [];
        this.gameActive = true;
        this.kingPositions = { white: null, black: null };
        this.capturedPieces = { white: [], black: [] };
        this.moveHistory = [];
        this.isFlipped = false;
        this.enPassantTarget = null;
        this.moveHistoryElement = document.getElementById('moves-list');
        this.undoBtn = document.getElementById('undo-btn');
        this.dropMode = false;

        this.pieceChars = {
            'white': { 'pawn': '♙', 'rook': '♖', 'knight': '♘', 'bishop': '♗', 'queen': '♕', 'king': '♔' },
            'black': { 'pawn': '♟', 'rook': '♜', 'knight': '♞', 'bishop': '♝', 'queen': '♛', 'king': '♚' }
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
        boardElement.className = 'chess-board';
        
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                const isLight = (row + col) % 2 === 0;
                
                cell.className = `cell ${isLight ? 'light' : 'dark'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.coord = `${files[col]}${ranks[row]}`;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                boardElement.appendChild(cell);
                
                this.board[row][col] = null;
            }
        }
    }

    setupPieces() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.capturedPieces = { white: [], black: [] };
        this.enPassantTarget = null;
        this.moveHistory = [];
        
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: 'pawn', color: 'black', moved: false };
            this.board[6][col] = { type: 'pawn', color: 'white', moved: false };
        }
        
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        
        for (let col = 0; col < 8; col++) {
            this.board[0][col] = { type: backRank[col], color: 'black', moved: false };
            this.board[7][col] = { type: backRank[col], color: 'white', moved: false };
            
            if (backRank[col] === 'king') {
                this.kingPositions.black = { row: 0, col };
                this.kingPositions.white = { row: 7, col };
            }
        }
        
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
            cell.classList.remove('selected', 'valid-move', 'valid-capture', 'check', 'castle');
            
            if (piece) {
                cell.textContent = this.pieceChars[piece.color][piece.type];
            }
        });
        
        document.getElementById('current-player').textContent = 
            this.currentPlayer === 'white' ? 'белых' : 'чёрных';
        
        this.updateCapturedPieces();
        this.checkGameState();
    }

    updateCapturedPieces() {
        const whiteContainer = document.getElementById('captured-white-pieces');
        const blackContainer = document.getElementById('captured-black-pieces');
        
        whiteContainer.innerHTML = '';
        blackContainer.innerHTML = '';
        
        this.capturedPieces.white.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.pieceChars[piece.color][piece.type];
            whiteContainer.appendChild(span);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
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
        
        if (this.selectedPiece && this.selectedPiece.piece.type === 'king' && 
            Math.abs(col - this.selectedPiece.col) === 2) {
            this.performCastle(this.selectedPiece.row, this.selectedPiece.col, col);
            return;
        }
        
        if (this.selectedPiece && this.selectedPiece.piece.type === 'pawn' &&
            this.enPassantTarget && this.enPassantTarget.row === row && this.enPassantTarget.col === col) {
            this.performEnPassant(this.selectedPiece.row, this.selectedPiece.col, row, col);
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
        cells.forEach(cell => cell.classList.remove('selected', 'valid-move', 'valid-capture', 'castle'));
        this.selectedPiece = null;
        this.validMoves = [];
    }

    highlightValidMoves() {
        this.validMoves.forEach(move => {
            const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
            if (cell) {
                if (move.special === 'castle') {
                    cell.classList.add('castle');
                } else {
                    const hasPiece = this.board[move.row][move.col] !== null;
                    cell.classList.add(hasPiece ? 'valid-capture' : 'valid-move');
                }
            }
        });
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.type) {
            case 'pawn': this.getPawnMoves(row, col, moves); break;
            case 'rook': this.getRookMoves(row, col, moves); break;
            case 'knight': this.getKnightMoves(row, col, moves); break;
            case 'bishop': this.getBishopMoves(row, col, moves); break;
            case 'queen': this.getQueenMoves(row, col, moves); break;
            case 'king': this.getKingMoves(row, col, moves); break;
        }
        
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
    }

    getPawnMoves(row, col, moves) {
        const piece = this.board[row][col];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        for (let offset of [-1, 1]) {
            if (this.isInBounds(row + direction, col + offset)) {
                const target = this.board[row + direction][col + offset];
                if (target && target.color !== piece.color) {
                    moves.push({ row: row + direction, col: col + offset });
                }
            }
        }
        
        if (this.enPassantTarget) {
            for (let offset of [-1, 1]) {
                if (this.isInBounds(row + direction, col + offset) &&
                    row === this.enPassantTarget.row - direction &&
                    col + offset === this.enPassantTarget.col) {
                    moves.push({ row: row + direction, col: col + offset, special: 'enPassant' });
                }
            }
        }
    }

    getRookMoves(row, col, moves) {
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        this.getLinearMoves(row, col, moves, directions);
    }

    getBishopMoves(row, col, moves) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.getLinearMoves(row, col, moves, directions);
    }

    getQueenMoves(row, col, moves) {
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.getLinearMoves(row, col, moves, directions);
    }

    getLinearMoves(row, col, moves, directions) {
        const piece = this.board[row][col];
        
        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
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

    getKnightMoves(row, col, moves) {
        const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        const piece = this.board[row][col];
        
        for (const [dRow, dCol] of knightMoves) {
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

    getKingMoves(row, col, moves) {
        const kingMoves = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        const piece = this.board[row][col];
        
        for (const [dRow, dCol] of kingMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        this.getCastlingMoves(row, col, moves);
    }

    getCastlingMoves(row, col, moves) {
        const piece = this.board[row][col];
        if (piece.moved) return;
        
        if (this.canCastle(row, col, 7)) moves.push({ row, col: col + 2, special: 'castle' });
        if (this.canCastle(row, col, 0)) moves.push({ row, col: col - 2, special: 'castle' });
    }

    canCastle(kingRow, kingCol, rookCol) {
        const piece = this.board[kingRow][kingCol];
        const rook = this.board[kingRow][rookCol];
        
        if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.moved) return false;
        if (this.isKingInCheck(piece.color)) return false;
        
        const direction = rookCol > kingCol ? 1 : -1;
        const startCol = direction === 1 ? kingCol + 1 : rookCol + 1;
        const endCol = direction === 1 ? rookCol - 1 : kingCol - 1;
        
        for (let col = startCol; col <= endCol; col++) {
            if (this.isSquareAttacked(kingRow, col, piece.color === 'white' ? 'black' : 'white')) return false;
            if (this.board[kingRow][col] !== null) return false;
        }
        
        return true;
    }

    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isSquareAttacked(row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === byColor) {
                    const attacks = this.getRawMoves(r, c);
                    if (attacks.some(move => move.row === row && move.col === col)) return true;
                }
            }
        }
        return false;
    }

    getRawMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.type) {
            case 'pawn': this.getPawnMoves(row, col, moves); break;
            case 'rook': this.getRookMoves(row, col, moves); break;
            case 'knight': this.getKnightMoves(row, col, moves); break;
            case 'bishop': this.getBishopMoves(row, col, moves); break;
            case 'queen': this.getQueenMoves(row, col, moves); break;
            case 'king': this.getKingMoves(row, col, moves); break;
        }
        
        return moves;
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        return this.validMoves.some(move => move.row === toRow && move.col === toCol);
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;
        
        let originalKingPos = null;
        if (movingPiece.type === 'king') {
            originalKingPos = { ...this.kingPositions[movingPiece.color] };
            this.kingPositions[movingPiece.color] = { row: toRow, col: toCol };
        }
        
        const inCheck = this.isKingInCheck(movingPiece.color);
        
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        if (movingPiece.type === 'king' && originalKingPos) {
            this.kingPositions[movingPiece.color] = originalKingPos;
        }
        
        return inCheck;
    }

    performCastle(kingRow, kingCol, targetCol) {
        const isKingside = targetCol > kingCol;
        const rookCol = isKingside ? 7 : 0;
        const newRookCol = isKingside ? targetCol - 1 : targetCol + 1;
        
        this.board[kingRow][targetCol] = this.board[kingRow][kingCol];
        this.board[kingRow][kingCol] = null;
        this.board[kingRow][targetCol].moved = true;
        
        this.board[kingRow][newRookCol] = this.board[kingRow][rookCol];
        this.board[kingRow][rookCol] = null;
        this.board[kingRow][newRookCol].moved = true;
        
        this.kingPositions[this.currentPlayer] = { row: kingRow, col: targetCol };
        
        this.moveHistory.push({
            piece: { type: 'king', color: this.currentPlayer },
            from: { row: kingRow, col: kingCol },
            to: { row: kingRow, col: targetCol },
            special: isKingside ? 'kingsideCastle' : 'queensideCastle'
        });
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.enPassantTarget = null;
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    performEnPassant(pawnRow, pawnCol, targetRow, targetCol) {
        const piece = this.board[pawnRow][pawnCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const capturedPawn = this.board[pawnRow][targetCol];
        
        this.board[targetRow][targetCol] = piece;
        this.board[pawnRow][pawnCol] = null;
        this.board[pawnRow][targetCol] = null;
        this.capturedPieces[piece.color].push(capturedPawn);
        
        this.moveHistory.push({
            piece: { ...piece },
            from: { row: pawnRow, col: pawnCol },
            to: { row: targetRow, col: targetCol },
            captured: { ...capturedPawn },
            special: 'enPassant'
        });
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.enPassantTarget = null;
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        const fromCell = document.querySelector(`.cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toCell = document.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);
        
        if (fromCell && toCell) {
            fromCell.classList.add('moving');
            setTimeout(() => fromCell.classList.remove('moving'), 300);
        }
        
        if (capturedPiece && toCell) {
            toCell.classList.add('captured');
            setTimeout(() => toCell.classList.remove('captured'), 400);
        }
        
        this.enPassantTarget = null;
        if (piece.type === 'pawn' && Math.abs(fromRow - toRow) === 2) {
            this.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
        }
        
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
        
        if (piece.type === 'king') {
            this.kingPositions[piece.color] = { row: toRow, col: toCol };
        }
        
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.promotePawn(toRow, toCol);
        }
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    promotePawn(row, col) {
        this.board[row][col] = { type: 'queen', color: this.board[row][col].color, moved: true };
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
        
        if (lastMove.special === 'kingsideCastle' || lastMove.special === 'queensideCastle') {
            this.undoCastle(lastMove);
        }
        
        if (lastMove.special === 'enPassant') {
            this.undoEnPassant(lastMove);
        }
        
        if (lastMove.piece.type === 'king') {
            this.kingPositions[lastMove.piece.color] = lastMove.from;
        }
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        this.clearSelection();
        this.renderBoard();
        this.updateMoveHistory();
        this.updateUndoButton();
    }

    undoCastle(move) {
        const isKingside = move.special === 'kingsideCastle';
        const rookCol = isKingside ? 7 : 0;
        const newRookCol = isKingside ? move.to.col - 1 : move.to.col + 1;
        
        this.board[move.to.row][rookCol] = this.board[move.to.row][newRookCol];
        this.board[move.to.row][newRookCol] = null;
        this.board[move.to.row][rookCol].moved = false;
    }

    undoEnPassant(move) {
        const direction = move.piece.color === 'white' ? 1 : -1;
        this.board[move.to.row - direction][move.to.col] = move.captured;
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
            const whiteMove = this.moveHistory[pairIndex * 2];
            const blackMove = this.moveHistory[pairIndex * 2 + 1];
            
            let moveHtml = `<span class="move-number">${moveNumber}.</span>`;
            moveHtml += `<span class="move-white">${whiteMove ? this.getMoveNotation(whiteMove) : ''}</span>`;
            moveHtml += `<span class="move-black">${blackMove ? this.getMoveNotation(blackMove) : ''}</span>`;
            
            moveDiv.innerHTML = moveHtml;
            this.moveHistoryElement.appendChild(moveDiv);
        }
        
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
    }

    getMoveNotation(move) {
        if (move.special === 'kingsideCastle') return '0-0';
        if (move.special === 'queensideCastle') return '0-0-0';
        if (move.special === 'enPassant') return 'e.p.';
        
        const pieceLetter = move.piece.type === 'pawn' ? '' : move.piece.type[0].toUpperCase();
        const capture = move.captured ? 'x' : '';
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        let notation = `${pieceLetter}${capture}${files[move.to.col]}${ranks[move.to.row]}`;
        
        if (this.isKingInCheck(move.piece.color === 'white' ? 'black' : 'white')) {
            notation += this.isCheckmate() ? '#' : '+';
        }
        
        return notation;
    }

    isKingInCheck(color) {
        const kingPos = this.kingPositions[color];
        if (!kingPos) return false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== color) {
                    const moves = this.getRawMoves(row, col);
                    if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) return true;
                }
            }
        }
        
        return false;
    }

    checkGameState() {
        const inCheck = this.isKingInCheck(this.currentPlayer);
        
        if (inCheck) {
            const kingCell = document.querySelector(`.cell[data-row="${this.kingPositions[this.currentPlayer].row}"][data-col="${this.kingPositions[this.currentPlayer].col}"]`);
            kingCell.classList.add('check');
            
            if (this.isCheckmate()) {
                this.gameActive = false;
                const winner = this.currentPlayer === 'white' ? 'Чёрные' : 'Белые';
                document.getElementById('game-status').textContent = `Шах и мат! Победили ${winner}`;
            } else {
                document.getElementById('game-status').textContent = 'Шах!';
            }
        } else if (this.isStalemate()) {
            this.gameActive = false;
            document.getElementById('game-status').textContent = 'Пат! Ничья';
        } else {
            document.getElementById('game-status').textContent = '';
        }
    }

    isCheckmate() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return false;
                }
            }
        }
        return true;
    }

    isStalemate() {
        return !this.isKingInCheck(this.currentPlayer) && this.isCheckmate();
    }

    resetGame() {
        this.selectedPiece = null;
        this.currentPlayer = 'white';
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        this.enPassantTarget = null;
        
        document.getElementById('game-status').textContent = '';
        document.getElementById('captured-white-pieces').innerHTML = '';
        document.getElementById('captured-black-pieces').innerHTML = '';
        
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
        this.dropMode = true;
        document.getElementById('drop-mode-btn').classList.add('drop-mode');
    }

    hideDropMode() {
        this.dropMode = false;
        document.getElementById('drop-mode-btn').classList.remove('drop-mode');
        document.getElementById('drop-mode-btn').style.display = 'none';
        document.getElementById('in-hand-pieces').style.display = 'none';
    }

    updateHandPieces() {
        // Для сёги, в классических шахматах не используется
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.chessGame = new ChessGame();
});