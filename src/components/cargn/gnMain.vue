<!-- src/components/cargn/gnMain.vue -->
<template>
  <div class="dashboard">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-indicator">
        <div class="led-container">
          <div
            class="led"
            :class="{
              'red-pulse': status === '危险' || !connectedCollision || !connectedFatigue || !connectedAngle,
              'green-glow': status === '安全' && connectedCollision && connectedFatigue && connectedAngle,
            }"
          ></div>
        </div>
        <div class="status-text">
          <div>设备连接状态</div>
          <div class="status-value">{{ connectionStatus }}</div>
        </div>
      </div>
    </div>

    <!-- 交通信号灯状态 -->
    <div class="traffic-light-box">
      <div class="traffic-light">
        <div
          class="light red"
          :class="{ active: trafficLight === 'red' }"
        ></div>
        <div
          class="light yellow"
          :class="{ active: trafficLight === 'yellow' }"
        ></div>
        <div
          class="light green"
          :class="{ active: trafficLight === 'green' }"
        ></div>
      </div>
      <div class="traffic-status">
        当前信号灯：{{ trafficLightMap[trafficLight] }}
      </div>
      <div class="light-img">
        <img :src="videoSrc" alt="Traffic Light Feed" @error="handleImageError" />
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="main-panel">
      <!-- 左侧预警面板 -->
      <div class="warning-card collision-warning">
        <div class="card-header">
          <h3>碰撞预警</h3>
        </div>
        <div class="card-content">
          <div class="distance-display">
            {{ distance === 0 ? "检测中..." : `后方车距：${distance}cm` }}
          </div>
          <div class="status-message" :class="statusClass">{{ status }}</div>
          <div class="status-message" v-if="!connectedCollision">碰撞传感器未连接</div>
        </div>
      </div>

      <!-- 右侧疲劳检测 -->
      <div class="warning-card fatigue-warning">
        <div class="card-header">
          <h3>疲劳检测</h3>
        </div>
        <div class="card-content">
          <div class="progress-box">
            <div
              class="progress-bar"
              :style="{ width: fatigueCount + '%' }"
            ></div>
            <span class="progress-text">疲劳指数 {{ fatigueCount }}%</span>
          </div>
          <div class="status-message" :class="yawn ? 'warning' : 'normal'">
            {{ yawnStatus }}
          </div>
          <div class="status-message" v-if="!connectedFatigue">疲劳传感器未连接</div>
        </div>
      </div>
    </div>

    <!-- 驾驶状态面板 -->
    <div class="driving-status">
      <div class="status-card" :class="{ emergency: isFalling }">
        <!-- 状态头部 -->
        <div class="status-header">
          <div class="statu-wz">电动车驾驶状态</div>
          <div class="sos-indicator" v-if="isFalling">
            <span class="sos-text">SOS!</span>
            <div class="pulse-ring"></div>
          </div>
        </div>
        <!-- 核心状态指标 -->
        <div class="core-status">
          <!-- 整合后的状态信息 -->
          <div class="status-details">
            <!-- 车辆倾斜监测 -->
            <div class="tilt-monitor">
              <div class="tilt-visual">
                <div
                  class="bike-icon"
                  :style="{ transform: `rotate(${tiltAngle}deg)` }"
                >
                  🛵
                </div>
                <div class="tilt-angle">
                  当前角度：{{ Math.abs(tiltAngle) }}°
                </div>
              </div>
              <div class="tilt-status">
                <span class="label">车身倾斜</span>
                <span class="value" :class="tiltStatusClass">
                  {{ tiltStatus }}
                </span>
              </div>
            </div>
          </div>
          <!-- 摔倒检测警报 -->
          <div class="fall-alert" v-if="isFalling">
            <div class="alert-content">
              <span class="icon">⚠️</span>
              <div class="alert-text">
                <h4>危险！车辆侧翻</h4>
                <p>最后触发：{{ lastFallTime }}</p>
              </div>
            </div>
            <button class="reset-btn" @click="resetVehicle">复位</button>
          </div>
          <!-- 正常状态信息 -->
          <template v-else>
            <div class="zo-details">
              <div class="speed">
                <div class="speed-wz">当前速度：</div>
                <div class="spped-zb">{{ Math.abs(speed) }}km/h</div>
              </div>
            </div>
          </template>
          <div class="status-message" v-if="!connectedAngle">角度传感器未连接</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import eventBus from "../../utils/eventBus";
import axios from "axios";

export default {
  data() {
    return {
      videoSrc: "http://10.194.90.44:5000/video_feed",
      raspberryPiIP: "10.194.90.44",
      trafficLight: "yellow",
      trafficMessage: "未检测到红绿灯",
      trafficLightMap: {
        red: "红灯",
        yellow: "黄灯",
        green: "绿灯",
      },
      trafficInterval: null,
      trafficRetryCount: 0,
      maxRetries: 5,
      collisionSocket: null,
      fatigueSocket: null,
      angleSocket: null,
      status: "安全",
      distance: 0,
      collisionLevels: ["安全", "注意", "警告", "危险"],
      connectedCollision: false,
      yawn: false,
      fatigueCount: 0,
      connectedFatigue: false,
      speed: 0,
      batteryRange: 45,
      batteryTemp: 36,
      safeDays: 7,
      isFalling: false,
      tiltAngle: 0,
      lastFallTime: null,
      tiltThreshold: 30,
      connectedAngle: false,
      lastSpeakTime: 0,
      lastCollisionSpeakTime: 0,
      lastTiltSpeakTime: 0,
      lastTrafficSpeakTime: 0,
      lastFatigueSpeakTime: 0,
      collisionInterval: null,
      tiltInterval: null,
      fatigueInterval: null,
      lastAngleUpdate: 0,
    };
  },
  computed: {
    yawnStatus() {
      return this.yawn ? "检测到疲劳征兆" : "注意力集中";
    },
    statusClass() {
      return {
        safe: this.status === "安全",
        warning: this.status === "注意",
        danger: this.status === "危险",
      };
    },
    fatigueProgress() {
      return Math.min(this.fatigueCount, 100);
    },
    tiltStatus() {
      if (this.isFalling) return "你似乎好像摔倒了";
      return "当前行驶状态很安全";
    },
    tiltStatusClass() {
      return {
        danger: this.isFalling,
        safe: !this.isFalling,
      };
    },
    connectionStatus() {
      return this.connectedCollision && this.connectedFatigue && this.connectedAngle
        ? "系统正常"
        : "连接异常";
    },
  },
  watch: {
    yawn(newVal) {
      if (newVal) {
        this.fatigueCount = Math.min(this.fatigueCount + 1, 100);
      }
    },
    status(newVal, oldVal) {
      if (newVal === "危险" && newVal !== oldVal) {
        this.checkCollisionSpeech();
      }
    },
    tiltAngle(newVal, oldVal) {
      console.log(`tiltAngle 变化: ${oldVal} -> ${newVal}, isFalling: ${this.isFalling}`);
      if (Math.abs(newVal) > 45 && Math.abs(oldVal) <= 45) {
        console.log('检查倾角语音（watch触发）');
        this.checkTiltSpeech();
      }
    },
    trafficLight(newVal, oldVal) {
      console.log(`trafficLight 变化: ${oldVal} -> ${newVal}`);
      if (newVal !== oldVal && (newVal === 'red' || newVal === 'green')) {
        console.log('检查红绿灯语音（watch触发）');
        this.checkTrafficSpeech();
      }
    },
    fatigueCount(newVal, oldVal) {
      if (newVal !== 0 && oldVal === 0) {
        this.checkFatigueSpeech();
      }
    },
  },
  beforeMount() {
    console.log('gnMain.vue beforeMount:', Date.now());
    this.cleanup();
  },
  mounted() {
    console.log('gnMain.vue mounted:', Date.now());
    this.connectSocketIO();
    this.startTrafficPolling();
    this.startWarningIntervals();
    console.log('eventBus in gnMain:', eventBus);
  },
  beforeUnmount() {
    console.log('gnMain.vue beforeUnmount');
    this.cleanup();
  },
  methods: {
    cleanup() {
      if (this.trafficInterval) {
        console.log('清理红绿灯轮询:', this.trafficInterval);
        clearInterval(this.trafficInterval);
        this.trafficInterval = null;
      }
      if (this.collisionInterval) {
        console.log('清理碰撞预警计时器:', this.collisionInterval);
        clearInterval(this.collisionInterval);
        this.collisionInterval = null;
      }
      if (this.tiltInterval) {
        console.log('清理倾角预警计时器:', this.tiltInterval);
        clearInterval(this.tiltInterval);
        this.tiltInterval = null;
      }
      if (this.fatigueInterval) {
        console.log('清理疲劳预警计时器:', this.fatigueInterval);
        clearInterval(this.fatigueInterval);
        this.fatigueInterval = null;
      }
      const sockets = [
        { socket: this.collisionSocket, name: 'collision' },
        { socket: this.fatigueSocket, name: 'fatigue' },
        { socket: this.angleSocket, name: 'angle' },
      ];
      sockets.forEach(({ socket, name }) => {
        if (socket) {
          socket.disconnect();
          console.log(`Socket.IO 连接断开: ${name}`);
        }
      });
      this.collisionSocket = null;
      this.fatigueSocket = null;
      this.angleSocket = null;
      console.log('gnMain 清理完成');
    },
    connectSocketIO() {
      this.collisionSocket = io(`http://${this.raspberryPiIP}:5001`, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      this.collisionSocket.on("connect", () => {
        this.connectedCollision = true;
        console.log("Collision Socket.IO connection established");
      });
      this.collisionSocket.on("connect_error", (error) => {
        console.error("Collision Socket.IO connect error:", error.message);
        this.connectedCollision = false;
      });
      this.collisionSocket.on("update", (data) => {
        console.log("Collision update:", data);
        try {
          this.status = data.status || "未知";
          this.distance = data.distance || 0;
        } catch (error) {
          console.error("Error parsing collision update data:", error);
        }
      });
      this.collisionSocket.on("disconnect", () => {
        this.connectedCollision = false;
        console.log("Collision Socket.IO connection lost");
        this.status = "连接断开";
        this.distance = 0;
      });

      this.fatigueSocket = io(`http://10.194.90.44:5003`, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      this.fatigueSocket.on("connect", () => {
        this.connectedFatigue = true;
        console.log("Fatigue Socket.IO connection established");
      });
      this.fatigueSocket.on("connect_error", (error) => {
        console.error("Fatigue Socket.IO connect error:", error.message);
        this.connectedFatigue = false;
      });
      this.fatigueSocket.on("status_update", (data) => {
        console.log("Fatigue status_update:", data);
        try {
          this.yawn = data.yawn || false;
        } catch (error) {
          console.error("Error parsing fatigue status_update data:", error);
        }
      });
      this.fatigueSocket.on("disconnect", () => {
        this.connectedFatigue = false;
        console.log("Fatigue Socket.IO connection lost");
        this.yawn = false;
        this.fatigueCount = 0;
      });

      this.angleSocket = io(`http://${this.raspberryPiIP}:5002`, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      this.angleSocket.on("connect", () => {
        this.connectedAngle = true;
        console.log("Angle Socket.IO connection established");
      });
      this.angleSocket.on("connect_error", (error) => {
        console.error("Angle Socket.IO connect error:", error.message);
        this.connectedAngle = false;
      });
      this.angleSocket.on("status_update", (data) => {
        const now = Date.now();
        console.log(`Angle status_update [间隔: ${(now - this.lastAngleUpdate).toFixed(0)}ms]:`, JSON.stringify(data));
        this.lastAngleUpdate = now;
        try {
          this.tiltAngle = typeof data.angle === "number" ? data.angle : 0;
          this.isFalling = Math.abs(this.tiltAngle) > 45;
          console.log(`更新状态: tiltAngle=${this.tiltAngle}, isFalling=${this.isFalling}`);
          if (this.isFalling && !this.lastFallTime) {
            this.lastFallTime = new Date().toLocaleTimeString();
            this.speed = 0;
            console.log('触发摔倒警告，5秒后自动复位');
            setTimeout(() => this.resetVehicle(), 5000);
          }
          this.$forceUpdate();
        } catch (error) {
          console.error("Error parsing angle status_update data:", error.message);
          this.tiltAngle = 0;
          this.isFalling = false;
        }
      });
      this.angleSocket.on("disconnect", () => {
        this.connectedAngle = false;
        console.log("Angle Socket.IO connection lost");
        this.tiltAngle = 0;
        this.isFalling = false;
        this.lastFallTime = null;
      });
    },
    startTrafficPolling() {
      if (this.trafficInterval) {
        console.warn('红绿灯轮询已存在，清理并重新启动:', this.trafficInterval);
        clearInterval(this.trafficInterval);
      }
      const timerId = Date.now();
      console.log(`启动红绿灯轮询 [ID: ${timerId}]`);
      this.trafficInterval = setInterval(async () => {
        try {
          const response = await axios.get(`http://${this.raspberryPiIP}:5000/stop`, {
            timeout: 3000, // 3秒超时
          });
          console.log(`红绿灯 HTTP 响应:`, response.data);
          this.trafficRetryCount = 0; // 重置重试计数
          let trafficLight = 'yellow';
          let message = response.data;

          if (response.data === '前方红灯，注意刹车') {
            trafficLight = 'red';
            message = '前方红灯，注意刹车';
          } else if (response.data === '前方绿灯，注意减速通行') {
            trafficLight = 'green';
            message = '前方绿灯，注意减速通行';
          } else {
            trafficLight = 'yellow';
            message = '未检测到红绿灯';
          }

          if (trafficLight !== this.trafficLight || message !== this.trafficMessage) {
            this.trafficLight = trafficLight;
            this.trafficMessage = message;
            console.log(`更新红绿灯: trafficLight=${this.trafficLight}, message=${this.trafficMessage}`);
            this.$forceUpdate();
          }
        } catch (error) {
          this.trafficRetryCount++;
          console.error(`红绿灯 HTTP 请求失败 [尝试 ${this.trafficRetryCount}/${this.maxRetries}]:`, {
            message: error.message,
            code: error.code,
            response: error.response ? error.response.data : null,
            url: `http://${this.raspberryPiIP}:5000/stop`,
            timestamp: new Date().toISOString(),
          });
          this.trafficLight = 'yellow';
          this.trafficMessage = '未检测到红绿灯';
          if (this.trafficRetryCount >= this.maxRetries) {
            console.warn('达到最大重试次数，暂停轮询');
            clearInterval(this.trafficInterval);
            this.trafficInterval = null;
            setTimeout(() => {
              console.log('尝试重新启动红绿灯轮询');
              this.startTrafficPolling();
            }, 10000); // 10秒后重试
          }
        }
      }, 2000); // 2秒轮询
    },
    startWarningIntervals() {
      this.collisionInterval = setInterval(() => {
        this.checkCollisionSpeech();
      }, 10000);
      console.log('启动碰撞预警计时器:', this.collisionInterval);

      this.tiltInterval = setInterval(() => {
        console.log('倾角定时检查:', {
          tiltAngle: this.tiltAngle,
          status: this.status,
          lastSpeakTime: Date.now() - this.lastSpeakTime,
          lastTiltSpeakTime: Date.now() - this.lastTiltSpeakTime,
        });
        this.checkTiltSpeech();
      }, 5000);
      console.log('启动倾角预警计时器:', this.tiltInterval);

      this.fatigueInterval = setInterval(() => {
        this.checkFatigueSpeech();
      }, 10000);
      console.log('启动疲劳预警计时器:', this.fatigueInterval);
    },
    checkCollisionSpeech() {
      const now = Date.now();
      if (
        this.status === "危险" &&
        now - this.lastSpeakTime >= 500 &&
        now - this.lastCollisionSpeakTime >= 5000
      ) {
        console.log('触发碰撞预警语音: 后方碰撞预警，请注意安全');
        eventBus.emit('onSpeck', '后方碰撞预警，请注意安全');
        this.lastSpeakTime = now;
        this.lastCollisionSpeakTime = now;
      }
    },
    checkTiltSpeech() {
      const now = Date.now();
      console.log('检查倾角语音:', {
        tiltAngle: Math.abs(this.tiltAngle),
        status: this.status,
        speakInterval: now - this.lastSpeakTime,
        tiltInterval: now - this.lastTiltSpeakTime,
      });
      if (
        Math.abs(this.tiltAngle) > 45 &&
        this.status !== "危险" &&
        now - this.lastSpeakTime >= 500 &&
        now - this.lastTiltSpeakTime >= 5000
      ) {
        console.log('触发倾角预警语音: 检测到您有危险，已报警');
        eventBus.emit('onSpeck', '检测到您有危险，已报警');
        this.lastSpeakTime = now;
        this.lastTiltSpeakTime = now;
      } else {
        console.log('倾角语音未触发:', {
          tiltAngle: Math.abs(this.tiltAngle) <= 45,
          collision: this.status === "危险",
          speakInterval: now - this.lastSpeakTime < 500,
          tiltInterval: now - this.lastTiltSpeakTime < 5000,
        });
      }
    },
    checkTrafficSpeech() {
      const now = Date.now();
      console.log('检查红绿灯语音:', {
        trafficLight: this.trafficLight,
        status: this.status,
        tiltAngle: Math.abs(this.tiltAngle),
        speakInterval: now - this.lastSpeakTime,
        trafficInterval: now - this.lastTrafficSpeakTime,
      });
      if (
        (this.trafficLight === 'red' || this.trafficLight === 'green') &&
        this.status !== "危险" &&
        Math.abs(this.tiltAngle) <= 45 &&
        now - this.lastSpeakTime >= 500 &&
        now - this.lastTrafficSpeakTime >= 5000 &&
        this.trafficMessage
      ) {
        console.log(`触发红绿灯语音: ${this.trafficMessage}`);
        eventBus.emit('onSpeck', this.trafficMessage);
        this.lastSpeakTime = now;
        this.lastTrafficSpeakTime = now;
      } else {
        console.log('红绿灯语音未触发:', {
          invalidLight: !['red', 'green'].includes(this.trafficLight),
          collision: this.status === "危险",
          tilt: Math.abs(this.tiltAngle) > 45,
          speakInterval: now - this.lastSpeakTime < 500,
          trafficInterval: now - this.lastTrafficSpeakTime < 5000,
          noMessage: !this.trafficMessage,
        });
      }
    },
    checkFatigueSpeech() {
      const now = Date.now();
      if (
        this.fatigueCount !== 0 &&
        this.status !== "危险" &&
        Math.abs(this.tiltAngle) <= 45 &&
        now - this.lastSpeakTime >= 500 &&
        now - this.lastFatigueSpeakTime >= 5000
      ) {
        console.log('触发疲劳预警语音: 检测到您有疲劳，请及时休息');
        eventBus.emit('onSpeck', '检测到您有疲劳，请及时休息');
        this.lastSpeakTime = now;
        this.lastFatigueSpeakTime = now;
      }
    },
    resetVehicle() {
      this.isFalling = false;
      this.lastFallTime = null;
      console.log('车辆状态复位');
    },
    handleImageError() {
      console.error("Failed to load video feed");
      this.videoSrc = "";
    },
    testSpeech(type = 'collision') {
      console.log(`测试语音触发: ${type}`);
      switch (type) {
        case 'collision':
          eventBus.emit('onSpeck', '后方碰撞预警，请注意安全');
          break;
        case 'tilt':
          eventBus.emit('onSpeck', '检测到您有危险，已报警');
          break;
        case 'traffic':
          eventBus.emit('onSpeck', '前方绿灯，注意减速通行');
          break;
        case 'fatigue':
          eventBus.emit('onSpeck', '检测到您有疲劳，请及时休息');
          break;
        default:
          console.warn('未知测试语音类型:', type);
      }
    },
    setSafeStatus() {
      console.log('手动设置 status 为 安全');
      this.status = "安全";
    },
    forceTiltSpeech() {
      console.log('强制触发倾角语音');
      eventBus.emit('onSpeck', '检测到您有危险，已报警');
      this.lastSpeakTime = Date.now();
      this.lastTiltSpeakTime = Date.now();
    },
  },
};
</script>

<style scoped>
.dashboard {
  color: #333;
  font-family: "Arial", sans-serif;
}
.status-bar {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: 15px;
}
.led-container {
  position: relative;
  width: 50px;
  height: 50px;
}
.led {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.red-pulse {
  background: #ff4444;
  animation: pulse 1.5s infinite;
}
.green-glow {
  background: #00c851;
  box-shadow: 0 0 15px rgba(0, 200, 81, 0.5);
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(255, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
}
.main-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 10px;
}
.warning-card {
  background: #fff;
  border-left: 4px solid;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}
.collision-warning {
  border-left: 4px solid #ff4444;
}
.fatigue-warning {
  border-left: 4px solid #ffcc00;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.progress-box {
  background: #383838;
  height: 30px;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.5s;
}
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
}
.driving-status {
  background: #fff;
  border-radius: 12px;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.statu-wz {
  font-size: 18px;
  font-weight: bold;
}
.status-message {
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 15px;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}
.safe {
  color: #00c851;
  background: rgba(0, 200, 81, 0.1);
}
.warning {
  color: #ffa500;
  background: rgba(255, 204, 0, 0.1);
}
.danger {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}
@media (max-width: 768px) {
  .main-panel {
    grid-template-columns: 1fr;
  }
}
.traffic-light-box {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  padding: 15px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.traffic-light {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #2c3e50;
  border-radius: 24px;
}
.light-img {
  background-color: #2b2a2a;
  width: 100%;
  height: 170px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 10px;
}
.light-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
.light {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  opacity: 0.3;
  transition: all 0.3s;
}
.light.active {
  opacity: 1;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}
.red {
  background: #ff4444;
}
.yellow {
  background: #ffcc00;
}
.green {
  background: #00c851;
}
.traffic-status {
  font-size: 1.2em;
}
.status-card.emergency {
  background: #fff0f0;
  border-left: 6px solid #ff4444;
  animation: emergencyFlash 1s infinite;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(90deg, #f8f9fa, #fff);
  border-bottom: 1px solid #eee;
}
.sos-indicator {
  position: relative;
  padding: 8px 16px;
  background: #ff4444;
  color: white;
  border-radius: 24px;
}
.sos-text {
  font-weight: bold;
  position: relative;
  z-index: 1;
}
.pulse-ring {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 2px solid #ff4444;
  border-radius: 30px;
  animation: pulse 1.5s infinite;
}
.core-status {
  display: flex;
  padding: 15px;
}
.status-details {
  width: 50%;
  margin-right: 35px;
}
.tilt-monitor {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}
.bike-icon {
  font-size: 2.8em;
  transition: transform 0.5s;
  transform-origin: bottom;
}
.tilt-angle {
  position: relative;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  color: #666;
}
.tilt-status {
  flex: 1;
  white-space: nowrap;
}
.tilt-status .value {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: bold;
}
.tilt-status .value.safe {
  background: #e3f2fd;
  color: #2196f3;
}
.tilt-status .value.danger {
  background: #ffcdd2;
  color: #d32f2f;
}
.zo-details {
  display: flex;
  width: 50%;
  flex-direction: column;
}
.speed {
  border-radius: 8px;
  padding: 12px;
  position: relative;
  top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.spped-zb {
  background-color: #96a5e4;
  padding: 8px;
  font-size: 18px;
  font-weight: bolder;
  color: white;
  border-radius: 18px;
}
.fall-alert {
  background: #ffebee;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}
.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}
.alert-text h4 {
  color: #d32f2f;
  margin: 0;
}
.reset-btn {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.5); }
}
@keyframes emergencyFlash {
  0%, 100% { background: #fff0f0; }
  50% { background: #ffe0e0; }
}
</style>