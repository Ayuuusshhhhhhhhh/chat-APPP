const path = require("path");
const http = require("http");
const express = require("express");
const app = express();
const socketio = require("socket.io");

// ✅ Updated import paths to match file locations
const formatMessage = require("./messages"); 
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require("./users");

const server = http.createServer(app);
const io = socketio(server);
const botName = "FreeChat Bot";

// ✅ Added a default route to fix "Cannot GET /" issue
app.get("/", (req, res) => {
    res.send("Chat App is running!"); 
});

// ✅ Serve static files correctly
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    socket.emit("message", formatMessage(botName, "Welcome to FreeChat!"));

    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(botName, `${user.username} has joined the chat!`));

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
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat!`)
      );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Listening on port ${port}...`));
