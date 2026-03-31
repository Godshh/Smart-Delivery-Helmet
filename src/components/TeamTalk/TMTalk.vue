<template>
  <div class="voice-talk">
    <h2>组队语音对讲</h2>

    <div v-if="!joined">
      <input v-model="roomId" placeholder="请输入房间号" />
      <button @click="joinRoom">加入房间</button>
    </div>

    <div v-else>
      <p>✅ 已加入房间：{{ roomId }}</p>
      <p>🧑 当前用户：{{ userId }}</p>
      <p>👥 房间用户列表：</p>
      <ul>
        <li v-for="u in users" :key="u">{{ u }}</li>
      </ul>

      <button
        @mousedown="startTalk"
        @mouseup="stopTalk"
        @touchstart.prevent="startTalk"
        @touchend.prevent="stopTalk"
      >
        🎙️ 按住说话
      </button>

      <button @click="leaveRoom" style="margin-top: 10px; background-color: #ff4d4f;">
        🚪 退出房间
      </button>

      <audio id="remoteAudio" autoplay></audio>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      socket: null,
      localStream: null,
      roomId: "",
      userId: "user_" + Math.random().toString(36).slice(2, 8),
      joined: false,
      users: [],
      peerConnections: {}, // 多个 peerConnection: { userId: RTCPeerConnection }
      polite: Math.random() > 0.5,
      makingOffer: {}, // { userId: boolean } 标记针对每个连接是否正在发offer
      ignoreOffer: {}, // { userId: boolean } 标记针对每个连接的冲突忽略
    };
  },
  methods: {
    joinRoom() {
      if (!this.roomId) {
        alert("请输入房间号");
        return;
      }
      this.connectSocket();
    },

    connectSocket() {
      this.socket = new WebSocket("ws://localhost:3000");

      this.socket.onopen = () => {
        this.sendMessage({ type: "join", roomId: this.roomId, userId: this.userId });
        this.joined = true;
      };

      this.socket.onmessage = async (event) => {
        const rawText = event.data instanceof Blob ? await event.data.text() : event.data;
        let data;
        try {
          data = JSON.parse(rawText);
        } catch {
          console.error("JSON 解析失败", rawText);
          return;
        }

        if (data.type === "users") {
          // 更新用户列表
          this.users = data.users.filter((u) => u !== this.userId);

          // 新用户加入，建立 PeerConnection
          for (const otherUserId of this.users) {
            if (!this.peerConnections[otherUserId]) {
              this.createPeerConnection(otherUserId, true);
            }
          }

          // 关闭与离开的用户的连接
          for (const peerId in this.peerConnections) {
            if (!this.users.includes(peerId)) {
              this.closePeerConnection(peerId);
            }
          }
          return;
        }

        if (!data.from) {
          console.warn("信令消息缺少 from 字段");
          return;
        }

        // 如果不是给我的消息忽略
        if (data.to !== this.userId) return;

        switch (data.type) {
          case "offer":
            await this.handleOffer(data);
            break;
          case "answer":
            await this.handleAnswer(data);
            break;
          case "candidate":
            await this.handleCandidate(data);
            break;
        }
      };
    },

    sendMessage(message) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ ...message, roomId: this.roomId, from: this.userId }));
      }
    },

    async startTalk() {
      if (!this.joined) return;

      try {
        if (!this.localStream) {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        // 给每个连接添加本地音频轨道
        Object.values(this.peerConnections).forEach((pc) => {
          this.localStream.getTracks().forEach((track) => {
            // 避免重复添加 track
            if (!pc.getSenders().find((s) => s.track === track)) {
              pc.addTrack(track, this.localStream);
            }
          });
        });

        // 针对所有 PeerConnection 创建 offer 重新协商
        for (const [peerId, pc] of Object.entries(this.peerConnections)) {
          this.makingOffer[peerId] = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.sendMessage({ type: "offer", offer, to: peerId });
          this.makingOffer[peerId] = false;
        }
      } catch (err) {
        console.error("获取麦克风失败", err);
      }
    },

    stopTalk() {
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }
    },

    leaveRoom() {
      this.sendMessage({ type: "leave", userId: this.userId });

      this.stopTalk();

      for (const peerId in this.peerConnections) {
        this.closePeerConnection(peerId);
      }

      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      this.joined = false;
      this.users = [];
      this.roomId = "";
    },

    createPeerConnection(peerId, isOfferer = false) {
      const pc = new RTCPeerConnection();

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendMessage({
            type: "candidate",
            candidate: event.candidate,
            to: peerId,
          });
        }
      };

      pc.ontrack = (event) => {
        // 播放对端音频流
        const remoteAudio = document.getElementById("remoteAudio");
        // 多人时，remoteAudio只能播放一个流，如果需要多音轨播放需复杂处理
        remoteAudio.srcObject = event.streams[0];
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          this.closePeerConnection(peerId);
        }
      };

      // 如果本地已有流，添加轨道
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream));
      }

      this.peerConnections[peerId] = pc;

      if (isOfferer) {
        // 作为发起者创建 offer
        this.makingOffer[peerId] = true;
        pc
          .createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            this.sendMessage({ type: "offer", offer: pc.localDescription, to: peerId });
            this.makingOffer[peerId] = false;
          })
          .catch((err) => {
            console.error("创建 offer 出错", err);
            this.makingOffer[peerId] = false;
          });
      }
    },

    async handleOffer(data) {
      const { from, offer } = data;
      let pc = this.peerConnections[from];
      if (!pc) {
        this.createPeerConnection(from, false);
        pc = this.peerConnections[from];
      }

      const offerCollision = this.makingOffer[from] || pc.signalingState !== "stable";
      this.ignoreOffer[from] = !this.polite && offerCollision;
      if (this.ignoreOffer[from]) {
        console.warn("忽略 offer：冲突", from);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendMessage({ type: "answer", answer: pc.localDescription, to: from });
      } catch (err) {
        console.error("处理 offer 错误", err);
      }
    },

    async handleAnswer(data) {
      const { from, answer } = data;
      const pc = this.peerConnections[from];
      if (!pc) return;

      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    },

    async handleCandidate(data) {
      const { from, candidate } = data;
      const pc = this.peerConnections[from];
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("添加 ICE 候选失败", err);
      }
    },

    closePeerConnection(peerId) {
      if (this.peerConnections[peerId]) {
        this.peerConnections[peerId].close();
        delete this.peerConnections[peerId];
      }
    },
  },
};
</script>

<style scoped>
.voice-talk {
  text-align: center;
  margin-top: 30px;
}
input {
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
button {
  margin-top: 10px;
  font-size: 18px;
  padding: 8px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
ul {
  list-style: none;
  padding: 0;
}
</style>


