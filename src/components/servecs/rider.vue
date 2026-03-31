<template>
  <div class="rider-container">
    <!-- 天气模块 -->
    <div class="card weather-card">
      <div class="weather-header">
        <i class="fas fa-sun"></i>
        <div class="weather-info">
          <h3>27°C</h3>
          <p>晴 / 湿度 45%</p>
        </div>
      </div>
      <div class="road-tips">
        <div class="tip-item">
          <i class="fas fa-car"></i>
          <span>路面干燥</span>
        </div>
        <div class="tip-item">
          <i class="fas fa-leaf"></i>
          <span>空气优良</span>
        </div>
      </div>
    </div>
    <!-- 模块 -->
    <div class="card traffic-card">
      <h2 class="card-title">实时拥堵情况</h2>
      <div class="traffic-progress">
        <div class="status-bar" :style="{ width: trafficPercent + '%' }">
          <i class="fas fa-car-side"></i>
        </div>
        <div class="status-labels">
          <span>畅通</span>
          <span>缓行</span>
          <span>拥堵</span>
        </div>
      </div>
      <p class="traffic-desc">
        <i class="fas fa-info-circle"></i>
        当前平均时速 {{ trafficSpeed }} km/h
      </p>
    </div>
    
    <div class="card trip-stats">
      <!-- 评分环状图 -->
      <div class="score-ring">
        <svg width="120" height="120">
          <circle class="ring-background" cx="60" cy="60" r="50" />
          <circle
            class="ring-progress"
            :style="progressStyle"
            cx="60"
            cy="60"
            r="50"
          />
        </svg>
        <div class="score-content">
          <div class="main-score">{{ drivingScore }}</div>
          <div class="score-label">驾驶评分</div>
        </div>
      </div>

      <!-- 行程详细数据 -->
      <div class="trip-details">
        <div
          class="detail-item"
          v-for="(item, index) in statsData"
          :key="index"
        >
          <div class="metric">
            <i class="icon" :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </div>
          <div class="value">{{ item.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script>
export default {
  props: {
    score: { type: Number, default: 87 }, // 驾驶评分 (0-100)
    suddenAcceleration: { type: Number, default: 2 }, // 急加速次数
    hardBraking: { type: Number, default: 1 }, // 急刹车次数
    fuelConsumption: { type: Number, default: 7.2 }, // 油耗(L/100km)
    distance: { type: Number, default: 38.5 }, // 本次里程(km)
    duration: { type: Number, default: 72 }, // 行程时间(分钟)
  },
  data() {
    return {
      isSpeaking: false,
      emergencyStatus: false,
      showTransfer: false,
      currentOrders: [
        {
          id: 1001,
          address: "北京市朝阳区光华路8号世贸天阶B1层美食广场12号档口",
          deadline: Date.now() + 25 * 60 * 1000, // 25分钟后超时
          price: 8.5,
        },
        // 其他订单数据...
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
  computed: {
    drivingScore() {
      return Math.min(Math.max(this.score, 0), 100);
    },
    progressStyle() {
      return {
        strokeDasharray: `${(this.drivingScore / 100) * 314}, 314`,
        stroke: this.getScoreColor(this.drivingScore),
      };
    },
    statsData() {
      return [
        {
          label: "急加速",
          value: `${this.suddenAcceleration}次`,
          icon: "fas fa-rocket",
          color: "#e74c3c",
        },
        {
          label: "急刹车",
          value: `${this.hardBraking}次`,
          icon: "fas fa-car-crash",
          color: "#f1c40f",
        },
        {
          label: "平均油耗",
          value: `${this.fuelConsumption}L/100km`,
          icon: "fas fa-gas-pump",
          color: "#2ecc71",
        },
        {
          label: "行驶里程",
          value: `${this.distance}km`,
          icon: "fas fa-road",
          color: "#3498db",
        },
      ];
    },
  },
  methods: {
    getScoreColor(score) {
      if (score >= 90) return "#2ecc71";
      if (score >= 70) return "#f1c40f";
      return "#e74c3c";
    },
    startVoice() {
      this.isSpeaking = true;
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        // 开启语音传输
      });
    },
    stopVoice() {
      this.isSpeaking = false;
      // 停止录音并发送
    },
    handleOrderTransfer() {
      this.loadSuitableRiders();
      this.showTransfer = true;
    },
    showDispatchPanel() {
      // 显示智能调度面板
      this.$emit("dispatch-request", {
        type: "REINFORCE",
        position: this.currentPosition,
      });
    },
    triggerEmergency() {
      this.emergencyStatus = true;
      // 自动发送定位信息
      navigator.geolocation.getCurrentPosition((pos) => {
        this.$emit("emergency", {
          code: 911,
          coordinates: pos.coords,
        });
        // 启动30秒倒计时
        setTimeout(() => {
          this.emergencyStatus = false;
        }, 30000);
      });
    },
    // 打开接力弹窗
    openTransfer() {
      this.loadSuitableRiders();
      this.showTransfer = true;
    },

    // 加载可用骑手
    async loadSuitableRiders() {
      // 模拟加载延迟
      return new Promise((resolve) => {
        setTimeout(() => {
          // 数据已经写死在 data 中，无需再获取
          resolve();
        }, 500);
      });
    },
    // 订单选择逻辑
    toggleOrder(orderId) {
      const index = this.selectedOrders.indexOf(orderId);
      if (index > -1) {
        this.selectedOrders.splice(index, 1);
      } else if (this.selectedOrders.length < 3) {
        this.selectedOrders.push(orderId);
      }
    },
    // 确认转移
    async confirmTransfer(riderId) {
      // 模拟转移延迟
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
.rider-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 15px;
  background-color: #f8f9fa;
  margin-top: 14px;
  align-items: center;
}
/* 天气模块 */
/* 统一卡片样式 */
.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  width: 90%;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.card:active {
  transform: scale(0.98);
}
.weather-card {
  background: linear-gradient(135deg, #6b8dd6, #8eaafb);
  color: white;
}

.weather-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.weather-header i {
  font-size: 40px;
  margin-right: 15px;
}

.weather-info h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.weather-info p {
  margin: 4px 0 0;
  opacity: 0.9;
}

.road-tips {
  display: flex;
  gap: 15px;
}

.tip-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
}

.tip-item i {
  margin-right: 6px;
  font-size: 14px;
}

/* 路况模块 */
.traffic-card {
  background: #ffffff;
}

.card-title {
  margin: 0 0 15px;
  color: #2f343d;
  font-size: 18px;
}

.traffic-progress {
  height: 36px;
  background: #f0f2f5;
  border-radius: 20px;
  position: relative;
  margin-bottom: 12px;
}

.status-bar {
  height: 100%;
  background: linear-gradient(90deg, #00c853, #64dd17);
  border-radius: 20px;
  position: relative;
  transition: width 0.5s ease;
}

.status-bar i {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  padding: 6px;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.status-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #87909c;
  font-size: 12px;
}

.traffic-desc {
  margin: 30px 0 0;
  color: #52575c;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.traffic-desc i {
  margin-right: 8px;
  color: #2196f3;
}

/* /// */
.trip-stats {
  padding: 20px;
  background: #f8f9fa;
  display: flex;
  gap: 24px;
}

.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.ring-background {
  fill: none;
  stroke: #eceff1;
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: all 1s ease-out;
}

.score-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.main-score {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: #95a5a6;
  margin-top: 4px;
}

.trip-details {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.metric {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.fa-rocket {
  background: #e74c3c;
}
.fa-car-crash {
  background: #f1c40f;
}
.fa-gas-pump {
  background: #2ecc71;
}
.fa-road {
  background: #3498db;
}

.value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

/* 环状图动画 */
@keyframes ring-rotate {
  from {
    transform: rotate(-90deg) scale(0.9);
  }
  to {
    transform: rotate(-90deg) scale(1);
  }
}

.ring-progress {
  animation: ring-rotate 0.8s ease-out;
}
/* /// */
.transfer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
.modal-content {
  background: white;
  margin: 1rem;
  border-radius: 12px;
  padding: 1rem;
  max-height: 80vh;
  overflow-y: auto;
}
.order-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-item.selected {
  background: #f0f9eb;
  border-left: 4px solid #67c23a;
}
.recommend-riders {
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}
.rider-option {
  display: flex;
  align-items: center;
  padding: 8px;
  margin: 8px 0;
  border-radius: 8px;
  background: #f8f9fa;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}
.nav-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #409eff;
}
/* ?/ */
.action-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
  width: 90%;
  background: #f8f9fa;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-item {
  text-align: center;
}

.action-btn {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  margin: 0 auto 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.voice {
  background: #00a876;
  box-shadow: 0 4px 12px rgba(0, 168, 118, 0.3);
}
.action-btn.voice.speaking {
  animation: pulse 1.5s infinite;
}

.action-btn.transfer {
  background: #2196f3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.action-btn.dispatch {
  background: #ff9800;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.action-btn.emergency {
  background: #ff5252;
  box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
}

.action-btn.emergency.active {
  animation: emergency-pulse 1s infinite;
}

.icon {
  width: 24px;
  height: 24px;
  fill: white;
}

.action-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes emergency-pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 375px) {
  .action-btn {
    width: 48px;
    height: 48px;
  }
  .icon {
    width: 20px;
    height: 20px;
  }
}
</style>
  