<template>
  <div class="app-container">
    <!-- 外卖员个人资料卡片 -->
    <div class="driver-card">
      <div class="wave-effect wave-top-right"></div>
      <div class="wave-effect wave-bottom-left"></div>

      <div class="card-content">
        <div class="avatar-section">
          <div class="avatar">张</div>
          <h2 class="driver-name">
            张盔盔 <span class="badge">王者骑手</span>
          </h2>
          <div class="driver-id"><i class="fas fa-id-card"></i> ID: BJ8866</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-title">
              <i class="fas fa-check-circle"></i> 今日送达
            </div>
            <div class="stat-value">{{ deliveredOrders }} 单</div>
          </div>
          <div class="stat-box">
            <div class="stat-title"><i class="fas fa-bolt"></i> 进行中</div>
            <div class="stat-value">{{ inProgress }} 单</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">
              <i class="fas fa-money-bill-wave"></i> 今日收入
            </div>
            <div class="stat-value income">¥{{ income }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title"><i class="fas fa-medal"></i> 骑手评分</div>
            <div class="stat-value">
              4.99 <i class="fas fa-star" style="color: #f1c40f"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 语音对讲功能块 -->
    <div class="voice-talk">
      <div class="voice-header">
        <h2 class="voice-title">
          <i class="fas fa-walkie-talkie"></i> 派送小组语音对讲
        </h2>
      </div>

      <div v-if="!joined">
        <div class="input-container">
          <input
            v-model="roomId"
            placeholder="输入4位数字房间号"
            class="room-input"
          />
          <button class="join-btn" @click="joinRoom">加入房间</button>
        </div>
      </div>

      <div v-else>
        <div class="status-container">
          <p class="status-item">
            <i class="fas fa-door-open"></i> 房间号：{{ roomId }}
          </p>
          <p class="status-item">
            <i class="fas fa-user"></i> 我的ID：{{ userId }}
          </p>
        </div>

        <p class="status-item">
          <i class="fas fa-users"></i> 在线成员 ({{ users.length + 1 }})
        </p>
        <div class="user-list">
          <div class="user-item self">
            <span class="status-indicator"></span> {{ userId }} (我)
          </div>
          <div class="user-item" v-for="u in users" :key="u">
            <span class="status-indicator"></span> {{ u }}
          </div>
        </div>

        <div class="button-container">
          <button
            class="mic-btn"
            :class="{ talking: isTalking }"
            @mousedown="startTalk"
            @mouseup="stopTalk"
            @touchstart.prevent="startTalk"
            @touchend.prevent="stopTalk"
          >
            <i
              class="fas"
              :class="isTalking ? 'fa-microphone-alt' : 'fa-microphone'"
            ></i>
            {{ isTalking ? "正在通话中 - 松开结束" : "按住开启对讲" }}
          </button>
          <div class="button-xia">
            <button class="order-btn" @click="handleOrderTransfer">
              订单接力
            </button>
            <button class="leave-btn" @click="leaveRoom">
              <i class="fas fa-sign-out-alt"></i> 退出语音房间
            </button>
          </div>
        </div>

        <!-- 音频播放控件 -->
        <audio id="remoteAudio" autoplay></audio>
      </div>

      <div v-if="notification.show" class="notification">
        <i :class="notification.icon"></i>
        <span>{{ notification.text }}</span>
      </div>
    </div>
  </div>
<!-- 订单接力弹窗 -->
  <div class="transfer-modal" v-if="showTransfer">
    <div class="modal-content">
      <h3>选择要转移的订单（{{ selectedOrders.length }}/3）</h3>
 
      <!-- 订单列表 -->
      <div class="order-list">
        <div
          v-for="order in currentOrders"
          :key="order.id"
          class="order-item"
          :class="{ selected: isSelected(order.id) }"
          @click="toggleOrder(order.id)"
        >
          <div class="order-info">
            <span class="address">{{ shortenAddress(order.address) }}</span>
            <span class="time-limit">{{ countdown(order.deadline) }}</span>
          </div>
          <div class="price">¥{{ order.price.toFixed(1) }}</div>
        </div>
      </div>
 
      <!-- 推荐接收人 -->
      <div class="recommend-riders">
        <h4>推荐接收人</h4>
        <div
          v-for="rider in suitableRiders"
          :key="rider.id"
          class="rider-option"
          @click="confirmTransfer(rider.id)"
        >
          <img :src="rider.avatar" class="avatar" />
          <div class="rider-details">
            <span class="name">{{ rider.name }}</span>
            <div class="metrics">
              <span class="metric-item">
                <i class="icon-distance"></i>
                {{ rider.distance }}km
              </span>
              <span class="metric-item">
                <i class="icon-capacity"></i>
                可接{{ rider.capacity }}单
              </span>
            </div>
          </div>
          <button class="nav-btn" @click.stop="showNavigation(rider.position)">
            <i class="icon-location"></i>
          </button>
        </div>
      </div>
 
      <div class="modal-actions">
        <button class="cancel-btn" @click="showTransfer = false">取消</button>
        <button
          class="confirm-btn"
          :disabled="selectedOrders.length === 0"
          :class="{ disabled: selectedOrders.length === 0 }"
          @click="showConfirmDialog = true"
        >
          确认转移 ({{ selectedOrders.length }}单)
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      roomId: "",
      userId: "骑手_" + Math.floor(1000 + Math.random() * 9000),
      joined: false,
      users: [],
      isTalking: false,
      notification: { show: false, text: "", icon: "" },
      deliveredOrders: 5,
      inProgress: 1,
      income: 48.5,
      volumeAnimation: true,

      socket: null,
      localStream: null,
      peerConnections: {},
      polite: Math.random() > 0.5,
      makingOffer: {},
      ignoreOffer: {},

      // 订单接力数据
      showTransfer: false,
      currentOrders: [
        {
          id: 1001,
          address: "北京市朝阳区光华路8号世贸天阶B1层美食广场12号档口",
          deadline: Date.now() + 25 * 60 * 1000,
          price: 8.5,
        },
        {
          id: 1002,
          address: "上海市浦东新区陆家嘴环路1000号",
          deadline: Date.now() + 45 * 60 * 1000,
          price: 10.0,
        },
        {
          id: 1003,
          address: "广州市天河区天河路208号",
          deadline: Date.now() + 15 * 60 * 1000,
          price: 12.5,
        },
      ],
      selectedOrders: [],
      suitableRiders: [
        {
          id: 1,
          name: "张三",
          distance: 1.2,
          capacity: 2,
          avatar: "https://i.pravatar.cc/40?img=1",
          position: { lat: 39.91, lng: 116.4 },
        },
        {
          id: 2,
          name: "李四",
          distance: 0.8,
          capacity: 1,
          avatar: "https://i.pravatar.cc/40?img=2",
          position: { lat: 39.92, lng: 116.41 },
        },
      ],
    };
  },
  mounted() {
    setInterval(() => {
      this.volumeAnimation = !this.volumeAnimation;
    }, 600);
  },
  methods: {
    showNotification(text, icon) {
      this.notification.text = text;
      this.notification.icon = icon;
      this.notification.show = true;
      setTimeout(() => {
        this.notification.show = false;
      }, 2500);
    },

    joinRoom() {
      if (!this.roomId || !/^\d{4}$/.test(this.roomId)) {
        this.showNotification(
          "请输入4位数字房间号",
          "fas fa-exclamation-triangle"
        );
        return;
      }
      this.connectSocket();
    },

    connectSocket() {
      this.socket = new WebSocket("ws://192.168.80.20:3000");
      this.socket.onopen = () => {
        this.sendMessage({
          type: "join",
          roomId: this.roomId,
          userId: this.userId,
        });
        this.joined = true;
        this.showNotification("已加入房间", "fas fa-check-circle");
      };

      this.socket.onmessage = async (event) => {
        const raw =
          event.data instanceof Blob ? await event.data.text() : event.data;
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          return console.error("JSON 解析失败", raw);
        }

        if (data.type === "users") {
          this.users = data.users.filter((u) => u !== this.userId);
          for (const u of this.users)
            if (!this.peerConnections[u]) this.createPeerConnection(u, true);
          for (const id in this.peerConnections)
            if (!this.users.includes(id)) this.closePeerConnection(id);
        }

        if (data.to !== this.userId || !data.from) return;

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

    async startTalk() {
      this.isTalking = true;
      if (!this.localStream)
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      for (const pc of Object.values(this.peerConnections)) {
        this.localStream.getTracks().forEach((track) => {
          if (!pc.getSenders().find((s) => s.track === track))
            pc.addTrack(track, this.localStream);
        });
      }

      for (const [peerId, pc] of Object.entries(this.peerConnections)) {
        this.makingOffer[peerId] = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendMessage({ type: "offer", offer, to: peerId });
        this.makingOffer[peerId] = false;
      }
    },

    stopTalk() {
      this.isTalking = false;
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }
    },

    leaveRoom() {
      this.sendMessage({ type: "leave", userId: this.userId });
      this.stopTalk();
      for (const id in this.peerConnections) this.closePeerConnection(id);
      if (this.socket) this.socket.close();
      this.socket = null;
      this.joined = false;
      this.users = [];
      this.roomId = "";
      this.showNotification("已退出房间", "fas fa-door-open");
    },

    sendMessage(msg) {
      if (this.socket?.readyState === WebSocket.OPEN)
        this.socket.send(
          JSON.stringify({ ...msg, roomId: this.roomId, from: this.userId })
        );
    },

    createPeerConnection(peerId, isOfferer = false) {
      const pc = new RTCPeerConnection();
      pc.onicecandidate = (e) => {
        if (e.candidate)
          this.sendMessage({
            type: "candidate",
            candidate: e.candidate,
            to: peerId,
          });
      };
      pc.ontrack = (e) => {
        const audio = document.getElementById("remoteAudio");
        audio.srcObject = e.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed"].includes(pc.connectionState))
          this.closePeerConnection(peerId);
      };

      if (this.localStream)
        this.localStream
          .getTracks()
          .forEach((t) => pc.addTrack(t, this.localStream));

      this.peerConnections[peerId] = pc;

      if (isOfferer) {
        this.makingOffer[peerId] = true;
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() =>
            this.sendMessage({
              type: "offer",
              offer: pc.localDescription,
              to: peerId,
            })
          )
          .catch(console.error)
          .finally(() => (this.makingOffer[peerId] = false));
      }
    },

    async handleOffer({ from, offer }) {
      let pc = this.peerConnections[from];
      if (!pc) {
        this.createPeerConnection(from, false);
        pc = this.peerConnections[from];
      }
      const collision =
        this.makingOffer[from] || pc.signalingState !== "stable";
      this.ignoreOffer[from] = !this.polite && collision;
      if (this.ignoreOffer[from]) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendMessage({
          type: "answer",
          answer: pc.localDescription,
          to: from,
        });
      } catch (err) {
        console.error("处理 offer 错误", err);
      }
    },

    async handleAnswer({ from, answer }) {
      const pc = this.peerConnections[from];
      if (pc?.signalingState === "have-local-offer")
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    },

    async handleCandidate({ from, candidate }) {
      const pc = this.peerConnections[from];
      if (pc)
        await pc
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(console.warn);
    },

    closePeerConnection(peerId) {
      if (this.peerConnections[peerId]) {
        this.peerConnections[peerId].close();
        delete this.peerConnections[peerId];
      }
    },
    handleOrderTransfer() {
      this.loadSuitableRiders();
      this.showTransfer = true;
    },
    async loadSuitableRiders() {
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    toggleOrder(orderId) {
      const index = this.selectedOrders.indexOf(orderId);
      if (index > -1) {
        this.selectedOrders.splice(index, 1);
      } else if (this.selectedOrders.length < 3) {
        this.selectedOrders.push(orderId);
      }
    },
    confirmTransfer(riderId) {
      setTimeout(() => {
        const rider = this.suitableRiders.find((r) => r.id === riderId);
        alert("订单已成功转移给：" + rider.name);
        this.showTransfer = false;
        this.selectedOrders = [];
      }, 500);
    },
    shortenAddress(address) {
      return address.length > 16 ? address.slice(0, 16) + "…" : address;
    },
    countdown(deadline) {
      const diff = Math.max(0, deadline - Date.now());
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      return `${min}分${sec}秒`;
    },
    isSelected(orderId) {
      return this.selectedOrders.includes(orderId);
    },
    showNavigation(position) {
      alert(`模拟导航至：(${position.lat}, ${position.lng})`);
    },
  },
};
</script>

<style scoped>
.transfer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.3s ease;
}
 
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
 
.modal-content {
  background: white;
  width: 90%;
  max-width: 800px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}
 
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
 
h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
 
h4 {
  color: #666;
  font-size: 15px;
  font-weight: 500;
  margin: 16px 0 12px;
}
 
.order-list {
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}
 
.order-item {
  padding: 15px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background 0.2s ease;
}
 
.order-item:last-child {
  border-bottom: none;
}
 
.order-item:hover {
  background: rgba(25, 118, 210, 0.05);
}
 
.order-item.selected {
  background: rgba(46, 182, 112, 0.08);
  border-left: 3px solid #2EB670;
}
 
.order-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
 
.address {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}
 
.time-limit {
  font-size: 13px;
  color: #EB5F5F;
  background: rgba(235, 95, 95, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}
 
.price {
  font-size: 16px;
  color: #2EB670;
  font-weight: 600;
}
 
.recommend-riders {
  margin-top: 20px;
}
 
.rider-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 10px 0;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  cursor: pointer;
}
 
.rider-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: rgba(25, 118, 210, 0.15);
  background: rgba(25, 118, 210, 0.02);
}
 
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  margin-right: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
 
.rider-details {
  flex: 1;
}
 
.name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}
 
.metrics {
  display: flex;
  gap: 12px;
}
 
.metric-item {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
}
 
.icon-distance, .icon-capacity, .icon-location {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 4px;
  background-size: contain;
  background-repeat: no-repeat;
}
 
.icon-distance {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z'/%3E%3C/svg%3E");
}
 
.icon-capacity {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 11V5h4v6h5l-8 8-8-8h5z'/%3E%3C/svg%3E");
}
 
.nav-btn {
  background: none;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
 
.nav-btn:hover {
  background: rgba(25, 118, 210, 0.1);
}
 
.icon-location {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23409EFF'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E");
  width: 20px;
  height: 20px;
}
 
.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  gap: 16px;
}
 
.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease, transform 0.05s ease;
}
 
.cancel-btn {
  background: #fff;
  color: #666;
  border: 1px solid #eee;
}
 
.cancel-btn:hover {
  background: #f7f7f7;
  color: #333;
  border-color: #ddd;
}
 
.confirm-btn {
  background: linear-gradient(135deg, #2EB670, #1E9A57);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(46, 182, 112, 0.3);
}
 
.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 182, 112, 0.4);
}
 
.confirm-btn:active {
  transform: translateY(0);
}
 
.confirm-btn.disabled {
  background: #E0E0E0;
  color: #9E9E9E;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/*  */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

body {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
}

.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 900px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 30px 70px rgba(0, 40, 100, 0.18);
  overflow: hidden;
}

/* 顶部状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  background: white;
  padding: 15px 30px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #edf2f7;
}

.status-left,
.status-right {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 个人中心卡片样式 */
.driver-card {
  background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
  padding: 25px 30px;
  border-bottom: 1px solid rgba(224, 229, 244, 0.8);
  position: relative;
}

.card-content {
  display: flex;
  width: 100%;
  gap: 30px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 46px;
  font-weight: bold;
  margin-bottom: 50px;
}

.driver-name {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.driver-id {
  font-size: 16px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  flex: 1;
  margin-left: 10px;
}

.stat-box {
  background: white;
  border-radius: 18px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 6px 25px rgba(0, 20, 80, 0.05);
  border: 1px solid rgba(241, 243, 248, 1);
  transition: all 0.3s ease;
}

.stat-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 30, 120, 0.08);
}

.stat-title {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 12px;
  font-weight: 500;
}

.stat-value {
  font-size: 38px;
  font-weight: 700;
  color: #3498db;
}

.stat-value.income {
  color: #27ae60;
}

.badge {
  background: linear-gradient(to right, #ff9d3f, #ff6b6b);
  color: white;
  padding: 4px 15px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  margin-left: 10px;
  display: inline-block;
}

/* 语音对讲组件样式 */
.voice-talk {
  padding: 30px;
  display: flex;
  flex-direction: column;
  background: #f9fbfe;
  height: 100%;
  overflow-y: auto;
}

.voice-header {
  text-align: center;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.voice-title {
  font-size: 22px;
  font-weight: 700;

  display: flex;
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.status-container {
  display: flex;

  justify-content: space-between;
  padding: 25px;
  background: #f0f5ff;
  border-radius: 18px;
  margin: 5px 0 10px;
  font-size: 17px;
}

.status-item {
  display: flex;
  align-items: center;
}

.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 15px 0 30px;
}

.user-item {
  background: white;
  border: 1px solid #e6effa;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 16px;
  box-shadow: 0 5px 15px rgba(0, 30, 100, 0.05);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
  position: relative;
}

.user-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: #3498db;
  border-radius: 12px 0 0 12px;
}

.user-item.self {
  border: 2px solid #3498db;
  background-color: #f0f7ff;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

/* 麦克风按钮 */
.mic-btn {
  padding: 20px;
  font-size: 24px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-weight: 600;
  box-shadow: 0 8px 22px rgba(52, 152, 219, 0.35);
}

.mic-btn:active {
  transform: scale(0.98);
}

.mic-btn.talking {
  background: linear-gradient(to right, #ff6b6b, #ff9d3f);
  animation: pulse 1.5s infinite;
  box-shadow: 0 8px 22px rgba(255, 107, 107, 0.45);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4),
      0 8px 22px rgba(255, 107, 107, 0.45);
  }
  70% {
    transform: scale(1.01);
    box-shadow: 0 0 0 15px rgba(255, 107, 107, 0),
      0 8px 22px rgba(255, 107, 107, 0.45);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0),
      0 8px 22px rgba(255, 107, 107, 0.45);
  }
}
.button-xia {
  display: flex;
  justify-content: space-between;
}
.order-btn {
  background: linear-gradient(to right, #4f7efe, #d12fab);
  padding: 22px;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
  box-shadow: 0 6px 18px rgba(231, 76, 60, 0.25);
}
.leave-btn {
  background: linear-gradient(to right, #e74c3c, #e67e22);
  padding: 22px;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
  box-shadow: 0 6px 18px rgba(231, 76, 60, 0.25);
}

.leave-btn:hover {
  opacity: 0.9;
}

/* 表单样式 */
.input-container {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.room-input {
  flex: 1;
  padding: 18px 25px;
  border: 1px solid #e0e6f0;
  border-radius: 18px;
  font-size: 18px;
  outline: none;
  transition: all 0.3s;
  box-shadow: 0 5px 15px rgba(0, 20, 60, 0.05);
}

.room-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.25);
}

.join-btn {
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  border: none;
  border-radius: 18px;
  padding: 0 35px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 18px rgba(52, 152, 219, 0.35);
}

.join-btn:hover {
  opacity: 0.95;
  transform: translateY(-3px);
}

.wave-effect {
  position: absolute;
  width: 350px;
  height: 350px;
  background: radial-gradient(
    circle,
    rgba(52, 152, 219, 0.08) 0%,
    transparent 70%
  );
  border-radius: 50%;
  z-index: 0;
  opacity: 0.8;
}

.wave-top-right {
  top: -80px;
  right: -90px;
}

.wave-bottom-left {
  bottom: -80px;
  left: -90px;
}

.no-users {
  color: #7f8c8d;
  text-align: center;
  padding: 30px;
  font-size: 17px;
  border: 2px dashed #e0e6f0;
  border-radius: 18px;
  margin: 20px 0;
}

.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #27ae60;
  margin-right: 10px;
}

.footer {
  padding: 18px;
  text-align: center;
  color: #7f8c8d;
  font-size: 15px;
  border-top: 1px solid #edf2f7;
  background: #f9fbfe;
}

.notification {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 15px 35px;
  border-radius: 50px;
  font-size: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: fadeInOut 2.5s forwards;
  opacity: 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -25px);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, 10px);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, 10px);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -25px);
  }
}

.volume-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 40px;
  gap: 3px;
  margin-top: 8px;
}

.volume-bar {
  width: 4px;
  background: #3498db;
  border-radius: 2px;
  transition: height 0.3s ease;
}

.volume-animation .volume-bar:nth-child(1),
.volume-animation .volume-bar:nth-child(2) {
  height: 25%;
}

.volume-animation .volume-bar:nth-child(3),
.volume-animation .volume-bar:nth-child(4) {
  height: 50%;
}

.volume-animation .volume-bar:nth-child(5),
.volume-animation .volume-bar:nth-child(6) {
  height: 75%;
}

.volume-animation .volume-bar:nth-child(7),
.volume-animation .volume-bar:nth-child(8) {
  height: 100%;
}
</style>
