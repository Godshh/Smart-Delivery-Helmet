const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
console.log("✅ 信令服务器启动：ws://localhost:3000");

const rooms = new Map(); // Map<roomId, Map<ws, userId>>

wss.on("connection", (ws) => {
  let currentRoom = null;
  let currentUserId = null;

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.warn("收到非法消息");
      return;
    }

    const { type, roomId, userId, to } = data;

    if (type === "join") {
      currentRoom = roomId;
      currentUserId = userId;

      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      rooms.get(roomId).set(ws, userId);

      broadcastUsers(roomId);
      return;
    }

    if (type === "leave") {
      if (currentRoom && rooms.has(currentRoom)) {
        const clients = rooms.get(currentRoom);
        clients.delete(ws);
        if (clients.size === 0) {
          rooms.delete(currentRoom);
        } else {
          broadcastUsers(currentRoom);
        }
      }
      return;
    }

    // 信令消息转发给特定用户
    if (type === "offer" || type === "answer" || type === "candidate") {
      if (!currentRoom) return;
      const clients = rooms.get(currentRoom);
      if (!clients) return;

      for (let [client, uid] of clients.entries()) {
        if (uid === to && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
          break;
        }
      }
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const clients = rooms.get(currentRoom);
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(currentRoom);
      } else {
        broadcastUsers(currentRoom);
      }
    }
  });

  function broadcastUsers(roomId) {
    const clients = rooms.get(roomId);
    const users = Array.from(clients.values());
    for (let client of clients.keys()) {
      client.send(JSON.stringify({ type: "users", users }));
    }
  }
});



