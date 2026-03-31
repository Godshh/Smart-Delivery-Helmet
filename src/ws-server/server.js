const express = require('express'); // 用于 HTTP 服务
const { createServer } = require('http');// 创建 HTTP Server
const WebSocket = require('ws'); // WebSocket 实现信令传输
const { createWorker } = require('mediasoup');// mediasoup 创建 worker（SFU 核心）
const { mediaCodecs, webRtcTransportOptions } = require('./mediasoup-config.js');// 自定义的配置文件

const app = express();//创建一个叫app的Express 实例（服务器应用对象）
const httpServer = createServer(app);//createServer()创建一个真正的 HTTP 服务器对象
const wss = new WebSocket.Server({ server: httpServer });//websocket 服务器，使用 HTTP 服务器作为底层传输

//基于 mediasoup 的语音 SFU 实现
// 维护以下映射关系
const peers = new Map(); // peerId -> ws 保存每个用户的 WebSocket 连接
const transports = new Map(); // direction+peerId -> transport 保存每个用户的传输连接 用 transport 构建通道
const producers = new Map(); // peerId -> producer 保存每个用户的生产者 用 producer 发内容
const consumers = new Map(); // peerId -> consumer 保存每个用户的消费者 别人要听，就要用 consumer 来订阅这个流
// 这些映射关系用于管理用户连接、传输和媒体流


let worker;//媒体处理的线程核心
let router;//路由器，用于处理媒体流的路由和转发
//把 worker + router 想成是一个“大会议室  
//mediasoup 初始化
async function initMediasoup() {
  worker = await createWorker();
  console.log('✅ mediasoup worker 已创建');

  router = await worker.createRouter({ mediaCodecs });
  console.log('✅ mediasoup router 已创建');
}

async function startServer() {
  await initMediasoup();//等待mediasoup服务创建完成

  httpServer.listen(3000, () => {
    console.log('🚀 mediasoup SFU 服务启动于 http://localhost:3000');
  });
}

startServer();// 启动服务器
//有用户连接服务器会触发 'connection' 事件
//每个用户连接都会创建一个 WebSocket 连接
//每个连接会有一个唯一的 peerId 用于标识用户
//用户可以通过这个连接发送和接收媒体流
//用户可以创建传输（transport）来发送或接收媒体流
//用户可以发布（produce）媒体流或订阅（consume）其他用户的媒体流
wss.on('connection', async (ws) => {
  let peerId = null;
  //用户发送消息时会触发 'message' 事件
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;
      //绑定用户身份，注册 peerId
      if (type === 'join') {
        peerId = payload.peerId;
        peers.set(peerId, ws);
        console.log(`👤 用户已连接: ${peerId}`);
        //如果是 join，直接 return 了
        return;
      }

      if (!peerId) {
        console.warn("⛔️ 未绑定 peerId，丢弃消息");
        return;
      }

      switch (type) {
        //协商音频格式
        case 'getRtpCapabilities':
          ws.send(JSON.stringify({
            type: 'rtpCapabilities',
            payload: router.rtpCapabilities,
          }));
          console.log(`✅ router.rtpCapabilities ${router.rtpCapabilities} `);
          break;
          
        //但每个人上台发言时，都得给他：
        //一个专属的话筒（= producer）
        //一个监听设备（= consumer）
        //一条连接线（= transport）
        case 'createTransport': {
          // 创建WebRTC 传输通道
          const transport = await router.createWebRtcTransport(webRtcTransportOptions);
          console.log(`🔌 创建了 ${payload.direction} 传输: ${transport.id}server.js86`);
          // 创建这个对象后，服务端就拥有了 ICE、DTLS 所需的全部参数
          
          // 绑定 peerId 和方向，方便管理
          //把 transport 存入 transports 这个 Map 中
          transports.set(payload.direction + peerId, transport);
          //key 是 "send123" 或 "recv123"，根据方向和 peerId 组合出来的
          
          transport.on('dtlsstatechange', (state) => {
            if (state === 'closed') {
              console.log('🔌 传输已关闭');
              transport.close();
            }
          });
          //如果连接断了，就自动关闭 transport

          //关键：只有发送方向的 transport 才需监听 produce 事件**
          if (payload.direction === 'send') {
            transport.on('produce', async ({ kind, rtpParameters, appData }, callback) => {
              // 创建 producer
              const producer = await transport.produce({ kind, rtpParameters, appData });
              

              producers.set(peerId, producer);
              console.log(`🎤 用户 ${peerId} 发布了音频（Producer ID: ${producer.id}）`);

              // 回调返回 producer id 给客户端
              callback({ id: producer.id });

              // 通知其他所有用户有新 producer
              for (const [otherId, otherWs] of peers.entries()) {
                if (otherId === peerId) continue;
                otherWs.send(JSON.stringify({
                  type: 'newProducer',
                  payload: {
                    producerId: producer.id,
                    peerId,
                  },
                }));
              }
            });
          }
          //把创建好的 transport 参数发回客户端
          ws.send(JSON.stringify({
            type: 'transportCreated',
            payload: {
              id: transport.id,// ① Transport 的唯一 ID
              iceParameters: transport.iceParameters, // ② ICE 参数（用户名、密码等）
              iceCandidates: transport.iceCandidates,// ③ ICE 候选地址（IP+端口）
              dtlsParameters: transport.dtlsParameters,// ④ DTLS 参数（加密证书信息）
              direction: payload.direction,// ⑤ 方向（send / recv）
            },
          }));
          break;
        }

        case 'connectTransport': {
          const { transportId, dtlsParameters } = payload;
          const transport = [...transports.values()].find(t => t.id === transportId);
          if (!transport) {
            console.warn('⚠️ 未找到 transport');
            return;
          }
          await transport.connect({ dtlsParameters });
          break;
        }

        case 'produce': {
          const { transportId, kind, rtpParameters } = payload;
          const transport = [...transports.values()].find(t => t.id === transportId);

          if (!transport) {
            console.warn('找不到 transport 处理 produce');
            return;
          }

          try {
            const producer = await transport.produce({ kind, rtpParameters });

            // ✅ 关键：记录 producer 和打印日志
            producers.set(peerId, producer);
            console.log(`🎤 用户 ${peerId} 生产了 ${kind}`);

            // ✅ 给客户端回 producerId
            // 修复后：
            ws.send(JSON.stringify({
              type: 'produced',
              payload: { id: producer.id }
            }), () => {  // 在发送完成后通知其他人
              for (const [otherId, otherWs] of peers.entries()) {
                if (otherId !== peerId) {
                  otherWs.send(JSON.stringify({
                    type: 'newProducer',
                    payload: { producerId: producer.id, peerId, kind }
                  }));
                }
              }
            });
            console.log(`📤 produce 返回给客户端: ${producer.id}`);


          } catch (err) {
            console.error('produce 出错:', err);
          }

          break;
        }



        case 'consume': {
          const { producerId, rtpCapabilities, kind } = payload;

          const recvTransport = transports.get("recv" + peerId); // 获取已有的接收 transport
          if (!recvTransport) {
            console.error('❌ 没有找到接收 transport');
            return;
          }

          if (!router.canConsume({ producerId, rtpCapabilities })) {
            console.error('❌ 无法消费该 producer');
            return;
          }

          const consumer = await recvTransport.consume({
            producerId,
            rtpCapabilities,
            kind,
            paused: false,
          });
          await consumer.resume();
          
          console.log(`👂 用户 ${peerId} 消费了 ${kind}（Producer ID: ${producerId}）`);
          consumers.set(peerId, consumer);

          consumer.on('transportclose', () => {
            console.log('🚫 consumer transport 被关闭');
          });

          ws.send(JSON.stringify({
            type: 'consumerCreated',
            payload: {
              id: consumer.id,
              producerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
              peerId,
            },
          }));

          break;
        }

      }
    } catch (err) {
      console.error('⚠️ WebSocket message 处理异常:', err);
    }
  });

  ws.on('close', () => {
    peers.delete(peerId);
    console.log(`❌ 用户断开: ${peerId}`);

    const producer = producers.get(peerId);
    if (producer) {
      producer.close();
      producers.delete(peerId);
    }

    const consumer = consumers.get(peerId);
    if (consumer) {
      consumer.close();
      consumers.delete(peerId);
    }

    // 关闭 transport 并删除
    for (const [key, transport] of transports.entries()) {
      if (key.endsWith(peerId)) {
        transport.close();
        transports.delete(key);
      }
    }
  });
});
