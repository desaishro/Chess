const chess = new Chess();
const socket = io();
const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Render Chess Board Function
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear the board

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareindex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.column = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerHTML = getPieceUnicode(square);

                // Enable dragging only for the current player's turn
                pieceElement.draggable = square.color === playerRole && chess.turn() === playerRole;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.addEventListener("dragover", (e) => e.preventDefault());
                squareElement.addEventListener("drop", (e) => {
                    e.preventDefault();
                    if (draggedPiece) {
                        const targetSquare = {
                            row: parseInt(squareElement.dataset.row),
                            col: parseInt(squareElement.dataset.column),
                        };
                        handleMove(sourceSquare, targetSquare);
                    }
                });

                squareElement.appendChild(pieceElement);
            }

            boardElement.appendChild(squareElement);
        });
    });

    // Flip board for black player
    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

// Handle Moves
const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q' // Always promote to a queen
    };
    // Emit the move to the server
    socket.emit("move", move);
};

// Get Piece Unicode
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟", r: "♜", n: "♞", b: "♝", k: "♚", q: "♛",
        P: "♙", R: "♖", N: "♘", B: "♗", K: "♔", Q: "♕"
    };
    return piece.color === 'w' ? unicodePieces[piece.type.toUpperCase()] : unicodePieces[piece.type];
};

// Listen for player role assignment
socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

// Handle spectator role
socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

// Listen for board state update from the server
socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

// Listen for move broadcast from the server
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

// Handle invalid moves
socket.on("invalidMove", (message) => {
    alert(message); // Notify the player of the invalid move
});

// Initial render
renderBoard();
