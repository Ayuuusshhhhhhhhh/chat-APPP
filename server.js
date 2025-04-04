const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const formatMessage = require("./messages");
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require("./users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "FreeChat Bot";

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    console.log("New connection...");

    // User joins a room
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome message
        socket.emit("message", formatMessage(botName, "Welcome to FreeChat!"));

        // Notify others
        socket.broadcast.to(user.room).emit(
            "message",
            formatMessage(botName, `${user.username} has joined the chat!`)
        );

        // Update room users
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    // Listen for messages
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            io.to(user.room).emit("message", formatMessage(user.username, msg));
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        const user = userLeaves(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                formatMessage(botName, `${user.username} has left the chat!`)
            );

            // Update users in room
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });
});

// Use port from environment or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
