import * as wasm from './pkg';

let ss = [];  // ss = Selected Square(s)
let turn = 1;
let gameOver = false;

main();

function main () {
    renderBoard();
}

/**
 * Render the chess board
 */
function renderBoard() {
    let app = document.getElementById("chess-game");
    app.innerHTML = '';

    let data = getChessGame();
    data.forEach((row, y) => {
        row.forEach((cell, x) => {
            let cellColor = ((x+y)%2 == 0) ? "lightgrey" : "darkgrey";
            createChessElement(app, cell, x, row, y, cellColor);
        });
    });

    updateCaptured("black");
    updateCaptured("white");

    if (gameOver) {
        let gameOverDiv = document.createElement("div");
        gameOverDiv.innerText = "Game Over";
        document.getElementById("chess-move-history").append(gameOverDiv);
    }
}

/**
 * Update captured container with the captured piece
 * @param {string} color Piece color
 */
function updateCaptured(color) {
    let capturedContainer = document.getElementById(`chess-captured-${color}`);
    let cap = wasm.getCaptured(color).trim().split(" ");
    if (cap[0] !== "") {
        capturedContainer.innerHTML = "";
        cap.map(piece => capturedContainer.append(createChessPiece(piece)));
    }
}

/**
 * Update status container with 'White Turn', 'Black Turn', or 'Game Over'
 */
function updateStatus() {
    let statusContainer = document.getElementById("chess-status-container");
    if (gameOver) {
        statusContainer.innerText = "Game Over"
    } else {
        statusContainer.innerText = ((turn % 2) == 0) ? "Black Turn" : "White Turn";
    }
}

/**
 * Get chess board data from wasm function
 * @returns Chess board in array of array format
 */
function getChessGame() {
    let gameState = wasm.boardStr();
    let data = gameState
        .trim()
        .split("\n")
        .map((row) => row.trim().split(" "));
    return data;
}

/**
 * Create HTMLElement from chess icon
 * @param {string} cell chess icon
 * @returns HTMLElement
 */
function createChessPiece(cell) {
    let childElm = document.createElement("i");
    switch (cell) {
        case "♟":
            childElm.classList.add("fas", "fa-chess-pawn", "chess-piece-black");
            break;
        case "♜":
            childElm.classList.add("fas", "fa-chess-rook", "chess-piece-black");
            break;
        case "♞":
            childElm.classList.add("fas", "fa-chess-knight", "chess-piece-black");
            break;
        case "♝":
            childElm.classList.add("fas", "fa-chess-bishop", "chess-piece-black");
            break;
        case "♛":
            childElm.classList.add("fas", "fa-chess-queen", "chess-piece-black");
            break;
        case "♚":
            childElm.classList.add("fas", "fa-chess-king", "chess-piece-black");
            break;
        case "♙":
            childElm.classList.add("fas", "fa-chess-pawn", "chess-piece-white");
            break;
        case "♖":
            childElm.classList.add("fas", "fa-chess-rook", "chess-piece-white");
            break;
        case "♘":
            childElm.classList.add("fas", "fa-chess-knight", "chess-piece-white");
            break;
        case "♗":
            childElm.classList.add("fas", "fa-chess-bishop", "chess-piece-white");
            break;
        case "♕":
            childElm.classList.add("fas", "fa-chess-queen", "chess-piece-white");
            break;
        case "♔":
            childElm.classList.add("fas", "fa-chess-king", "chess-piece-white");
            break;
        default:
            break;
    };
    return childElm;
}

/**
 * Create chess square and it's event listener
 * @param {string} app Game container
 * @param {string} cell Location in chess notation, e.g. "a1"
 * @param {int} x index of row
 * @param {Array} row
 * @param {int} y index of column
 * @param {string} cellColor
 */
function createChessElement(app, cell, x, row, y, cellColor) {
    let elm = document.createElement("a");
    let pos = wasm.invert(7-y, x);
    elm.setAttribute("id", pos);
    elm.classList.add("square", "btn");
    elm.style.backgroundColor = cellColor;

    let childElm = createChessPiece(cell);

    elm.append(childElm);
    if (!gameOver) {
        elm.addEventListener("click", e => squareClickHandler(e, elm, childElm, pos));
    }
    app.append(elm);
}

/**
 * Clicked square event handler
 */
function squareClickHandler(event, elm, childElm, pos) {
    event.preventDefault();

    if (!childElm.className.match(/chess-piece/) && ss.length == 0) {
        return false;
    }

    if (childElm.className.match(/chess-piece-white/) && turn % 2 === 0 && ss.length === 0) {
        console.log("Can't move this piece, Black turn.");
        return false;
    }

    if (childElm.className.match(/chess-piece-black/) && turn % 2 === 1 && ss.length === 0) {
        console.log("Can't move this piece, White turn.");
        return false;
    }

    if (ss.includes(pos)) {
        if (promotable(pos)) {
            let targetLevel = event.target.hasChildNodes() ? event.target.id : event.target.parentElement.id;
            let promotionHistory = wasm.pawnPromote(pos, targetLevel);
            updateMoveHistoryInline(promotionHistory);
            if (promotionHistory.includes("Checkmate")) { gameOver = true };
            ss = [];
            turn += 1;
            updateStatus();
            renderBoard();
            return false;
        }
        ss.splice(ss.indexOf(pos), 1);
        elm.classList.remove("selected");
        wasm.getPossibleMoves(pos).split(" ")
            .map(pm => document.getElementById(pm).classList.remove("path"));

    } else if (ss.length == 0) {
        let vpm = wasm.getPossibleMoves(pos).split(" ");
        if (vpm[0] !== "") {
            ss.push(pos);
            elm.classList.add("selected");
            vpm.map(pm => document.getElementById(pm).classList.add("path"));
        }

    } else if (ss.length == 1) {
        let vpm = wasm.getPossibleMoves(ss[0]).split(" ");
        if (!vpm.includes(pos)) {
            let king = document.getElementById(ss[0]);
            if (king.firstChild.className.match(/fa-chess-king/) && childElm.className.match(/fa-chess-rook/)) {
                castling(pos);
            }
            return false;
        }
        moving(pos);
    }
}

/**
 * Moves selected piece
 * @param {string} pos target location
 * @returns void | Boolean
 */
function moving(pos) {
    let moveHistory = wasm.movePiece(ss[0], pos);
    console.log(moveHistory);

    if (moveHistory.includes("Illegal Moves")) {
        alert("Can't move this piece, illegal moves. Are your King in check?");
        ss = [];
        renderBoard();
        return false;
    }

    updateMoveHistory(`${turn}. ${moveHistory}`);
    if (moveHistory.includes("Checkmate")) { gameOver = true }
    renderBoard();

    if (promotable(pos)) {
        promoteLevelSelector(pos);
        ss = [pos];
    } else {
        ss = [];
        turn += 1;
        updateStatus();
    }
}

/**
 * Add new moveHistory to the moveHistoryContainer
 * @param {string} moveHistory
 */
function updateMoveHistory(moveHistory) {
    let historyContainer = document.getElementById("chess-move-history");
    let pieceMoves = document.createElement("div");
    pieceMoves.innerText = moveHistory;
    historyContainer.append(pieceMoves);
}

/**
 * Append string to the last moveHistory
 * @param {string} status string to append to the last moveHistory
 */
function updateMoveHistoryInline(status) {
    let historyContainer = document.getElementById("chess-move-history");
    let lastHistory = historyContainer.lastChild;
    lastHistory.innerText = lastHistory.innerText + ' ' + status;
}

/**
 * Check if the pos is promotable or not
 * @param {string} pos position in the chess board to check
 * @returns Boolean
 */
function promotable(pos) {
    let isPawn = document.getElementById(pos).firstChild.className.match(/fa-chess-pawn/);
    if (!isPawn) return false;
    if (!pos.includes("1") && !pos.includes("8")) return false;
    return true;
}

/**
 * Create level selector for pawn promotion
 * @param {string} pos position in the chess board
 */
function promoteLevelSelector(pos) {
    let pawn = document.getElementById(pos);
    let color = (pawn.firstChild.className.match(/chess-piece-white/)) ? "chess-piece-white" : "chess-piece-black";
    let options = ["queen", "bishop", "knight", "rook"];
    let optionContainer = document.createElement("div");
    optionContainer.setAttribute("class", "promotion-level-selector");
    options.map((opt) => {
        let child = document.createElement("a");
        child.setAttribute("id", opt);
        let grandChild = document.createElement("i");
        grandChild.setAttribute("class", `fas fa-chess-${opt} ${color}`);
        child.append(grandChild);
        optionContainer.append(child);
    });
    pawn.append(optionContainer);
}

/**
 * Do castling for king and rook
 * @param {string} pos rook position to do the castling with
 * @returns void | Boolean
 */
function castling(pos) {
    let moveHistory = wasm.movePiece(ss[0], pos);
    console.log(moveHistory);
    if (moveHistory.includes("Can't do castling") || moveHistory.includes("Illegal Moves")) {
        alert(moveHistory);
        ss = [];
        renderBoard();
        return false;
    }
    updateMoveHistory(`${turn}. ${moveHistory}`);
    ss = [];
    turn += 1;
    renderBoard();
}
