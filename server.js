const path = require("path");
const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");

const formatMessage = require("./messages"); // No utils folder
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require("./users");

const server = http.createServer(app);
const io = socketio(server);
const botName = "FreeChat Bot";

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html when accessing '/'
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.io events
io.on("connection", (socket) => {
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        socket.emit("message", formatMessage(botName, "Welcome to FreeChat!"));

        socket.broadcast.to(user.room).emit(
            "message",
            formatMessage(botName, `${user.username} has joined the chat!`)
        );

        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    socket.on("disconnect", () => {
        const user = userLeaves(socket.id);
        if (user) {
            io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat!`));
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
