const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");
const dotenv = require("dotenv");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess game" });
});

io.on("connection", (uniqueSocket) => {
    console.log("Player connected");

    // Assign players to roles
    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
    } else {
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("disconnect", () => {
        if (uniqueSocket.id === players.white) {
            delete players.white;
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            // Validate turn
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) {
                uniqueSocket.emit("invalidMove", "It's not your turn!");
                return;
            }
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) {
                uniqueSocket.emit("invalidMove", "It's not your turn!");
                return;
            }

            // Attempt to make the move
            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
            } else {
                uniqueSocket.emit("invalidMove", "Invalid move format or illegal move!");
            }
        } catch (err) {
            console.error("Error processing move:", err);
            uniqueSocket.emit("errorMessage", "Something went wrong. Please try again.");
        }
    });

    // Send initial board state to the client
    uniqueSocket.emit("boardState", chess.fen());
});

server.listen(PORT, function () {
    console.log(`Server is running on http://localhost:${PORT}`);
});
