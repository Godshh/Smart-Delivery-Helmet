import { Device } from 'mediasoup-client';

export async function connectToSFU(onStreamReceived, onlyRecv = false) {
 //第一步：建立 WebSocket 连接 + 加入房间
    const socket = new WebSocket("ws://localhost:3000");
  const peerId = Math.random().toString(36).substring(2, 9);
  await new Promise((resolve) => (socket.onopen = resolve));
//等待连接建立后，发送 join 请求
  socket.send(JSON.stringify({
    type: "join",
    payload: { peerId }
  }));
  //第二步：获取 SFU 的 rtpCapabilities
  //向服务器请求当前 router 的 RTP 能力（音视频支持的格式、编码等）
  socket.send(JSON.stringify({ type: "getRtpCapabilities" }));

  const rtpCapabilities = await new Promise((resolve) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "rtpCapabilities") {
        socket.removeEventListener("message", handler);
        resolve(msg.payload);
      }
    };
    socket.addEventListener("message", handler);
  });

  //创建 Mediasoup 的 Device 实例
  const device = new Device();
  await device.load({ routerRtpCapabilities: rtpCapabilities });

  // ✅ 创建 recv transport
  socket.send(JSON.stringify({ type: "createTransport", payload: { direction: "recv" } }));
  const recvTransportParams = await waitForMsg(socket, "transportCreated", "recv");
  const recvTransport = device.createRecvTransport(recvTransportParams);
  recvTransport.on("connect", ({ dtlsParameters }, callback) => {
    socket.send(JSON.stringify({
      type: "connectTransport",
      payload: { transportId: recvTransport.id, dtlsParameters }
    }));
    callback();
  });

  // ✅ 创建 send transport（提前准备）
  let sendTransport = null;
  if (!onlyRecv) {
    socket.send(JSON.stringify({ type: "createTransport", payload: { direction: "send" } }));
    const sendTransportParams = await waitForMsg(socket, "transportCreated", "send");
    sendTransport = device.createSendTransport(sendTransportParams);
    sendTransport.on("connect", ({ dtlsParameters }, callback) => {
      socket.send(JSON.stringify({
        type: "connectTransport",
        payload: { transportId: sendTransport.id, dtlsParameters }
      }));
      callback();
    });
  }

  socket.addEventListener("message", async (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "newProducer") {
      const { producerId, peerId, kind } = msg.payload;
      socket.send(JSON.stringify({
        type: "consume",
        payload: {
          producerId,
          rtpCapabilities: device.rtpCapabilities,
          kind
        }
      }));
    }

    if (msg.type === "consumerCreated") {
      const { id, producerId, kind, rtpParameters, peerId } = msg.payload;
      const consumer = await recvTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters
      });
      const remoteStream = new MediaStream();
      remoteStream.addTrack(consumer.track);
      onStreamReceived(peerId, remoteStream);
    }
  });

  return { device, recvTransport, sendTransport, socket, peerId };
}

// 辅助函数：等待某种消息
function waitForMsg(socket, type, direction) {
  return new Promise((resolve) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === type && msg.payload.direction === direction) {
        socket.removeEventListener("message", handler);
        resolve(msg.payload);
      }
    };
    socket.addEventListener("message", handler);
  });
}



