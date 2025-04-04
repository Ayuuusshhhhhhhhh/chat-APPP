const socket = io();

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

// Join chatroom
socket.emit("joinRoom", { username, room });

// Listen for messages from server
socket.on("message", (message) => {
    console.log("New message:", message);
    displayMessage(message);
});

// Update users in the room
socket.on("roomUsers", ({ room, users }) => {
    document.getElementById("room-name").innerText = room;
    document.getElementById("users").innerHTML = users.map(user => `<li>${user.username}</li>`).join("");
});

// Send message
document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    socket.emit("chatMessage", msg);
    e.target.elements.msg.value = "";
});

// Function to display message
function displayMessage(message) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
                     <p class="text">${message.text}</p>`;
    document.querySelector(".chat-messages").appendChild(div);
}
