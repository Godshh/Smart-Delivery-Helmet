<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 指纹登录界面 -->
      <div
        v-show="showFingerprint && !showSuccessPanel"
        class="fingerprint-auth"
      >
        <div class="biometric-device">
          <div
            class="sensor-area"
            :class="{ scanning: isScanning, success: isSuccess }"
            @click="startDetection"
          >
            <div class="sensor-surface">
              <div v-if="isScanning" class="scan-animation"></div>
              <transition name="fade">
                <div v-if="isSuccess" class="success-indicator">
                  <svg class="check-icon" viewBox="0 0 24 24">
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    />
                  </svg>
                </div>
              </transition>
            </div>
            <div class="keyboard-hint">
              <span>启动生物识别验证</span>
            </div>
          </div>
        </div>
        <p class="status-message">{{ statusText }}</p>
        <div class="alternative-auth">
          <a href="#" @click.prevent="toggleAuthMethod">切换账号登录</a>
        </div>
      </div>
      <!-- 账号密码登录界面 -->
      <div v-show="!showFingerprint && !showSuccessPanel" class="password-auth">
        <h2 class="auth-title">用户登录</h2>
        <div class="input-group">
          <input type="email" id="email" v-model="email" required />
          <label for="email" :class="{ focused: email }">电子邮箱</label>
        </div>
        <div class="input-group">
          <input type="password" id="password" v-model="password" required />
          <label for="password" :class="{ focused: password }">密码</label>
        </div>
        <button class="login-btn" :disabled="isLoading" @click="handleLogin">
          <span v-if="!isLoading">立即登录</span>
          <div v-else class="spinner"></div>
        </button>
        <div class="auth-switch">
          <a href="#" @click.prevent="toggleAuthMethod">使用指纹登录</a>
        </div>
      </div>
    </div>
    <!-- 新增成功状态 -->
    <transition name="fade">
      <div v-if="showSuccessPanel" class="success-panel">
        <div class="user-avatar">
          <img :src="user.avatar" alt="用户头像" />
        </div>
        <h3 class="user-name">{{ user.name }}</h3>
        <p class="welcome-text">欢迎回来！正在进入系统...</p>
      </div>
    </transition>
  </div>
</template>
  
  <script>
import axios from "axios";
export default {
  name: "LoginPage",
  data() {
    return {
      showFingerprint: true,
      isScanning: false,
      isSuccess: false,
      isLoading: false,
      email: "",
      audioUnlocked: false,
      password: "",
      AK: "6AUG6BWiQIbiYq5OjxmFfsWZ", // ✅ 替换为你从百度API控制台申请的Access Token
      SK: "HK3jC1cDP3hPYc6pHD4StUqaq00DcWrC", // ✅ 替换为你自己的唯一ID（MAC/IMEI/随机UUID等）
      statusText: "请将手指放置于传感器区域",
      // 新增用户数据和成功面板状态
      user: {
        name: "张盔盔",
        avatar: "./imgs/zq.jpg", // 使用占位头像
      },
      showSuccessPanel: false,
    };
  },
  mounted() {
    this.initAudio();
    window.addEventListener("keydown", this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  },
  methods: {
    initAudio() {
    if (this.audioUnlocked) return;

    // 尝试播放一个无声的音频来解锁音频权限
    const audio = new Audio();
    audio.play().catch(() => {});
    
    this.audioUnlocked = true;
    console.log("✅ 用户点击过页面，已解锁音频播放");
  },
    async playAudio(text) {
      try {
        const res = await axios.get("/baidu/oauth/2.0/token", {
          params: {
            grant_type: "client_credentials",
            client_id: this.AK,
            client_secret: this.SK,
          },
        });
        const token = res.data.access_token;

        if (typeof window.btts !== "function") {
          console.error("btts 未加载");
          return;
        }

        window.btts(
          {
            tex: text,
            tok: token,
            spd: 5,
            pit: 5,
            vol: 15,
            per: 4143,
            ctp: 1,
            lan: "zh",
          },
          {
            volume: 0.8,
            autoDestory: true,
            hidden: true,
            onSuccess: function (audio) {
              console.log("播放成功", audio);
              audio
                .play()
                .then(() => {
                  console.log("音频正在播放");
                })
                .catch((err) => {
                  console.error("音频播放失败:", err);
                }); 
            },
            onError: function (err) {
              console.error("播放失败", err);
            },
            onTimeout: function () {
              console.error("播放超时");
            },
          }
        );
      } catch (error) {
        console.error("获取或播放语音失败：", error);
      }
    },

    toggleAuthMethod() {
      this.showFingerprint = !this.showFingerprint;
      this.resetState();
    },
    handleLogin() {
      if (!this.email || !this.password) {
        alert("请填写完整信息");
        return;
      }
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        this.showSuccessPanel = true; // 显示成功面板
        setTimeout(() => {
          this.$emit("showdenlu", true);
        }, 2500);
      }, 1000);
    },
    startDetection() {
      if (this.isScanning || this.isSuccess) return;
      this.statusText = "正在初始化传感器...";
      setTimeout(() => {
        this.beginScan();
      }, 500);
    },
    // 修改验证成功方法
    beginScan() {
      this.isScanning = true;
      this.statusText = "正在验证身份...";
      setTimeout(async () => {
        this.isScanning = false;
        this.isSuccess = true;
        this.showSuccessPanel = true; // 显示成功面板

        // ✅ 在验证成功后播放语音（用户已交互，允许播放）
        try {
          await this.playAudio?.("欢迎回来，用户张盔盔！");
        } catch (e) {
          console.warn("语音播放失败", e);
        }

        setTimeout(() => {
          this.$emit("showdenlu", true);
        }, 2500); // 延长显示时间
      }, 2000);
    },

    resetState() {
      this.isScanning = false;
      this.isSuccess = false;
      this.showSuccessPanel = false;
      this.statusText = "请将手指放置于传感器区域";
    },
    handleKeyPress(event) {
      if (this.showFingerprint && event.code === "Space") {
        event.preventDefault();
        this.startDetection();
      }
    },
  },
};
</script>
    
  <style scoped>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* 避免出现滚动条 */
}
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 新增成功面板样式 */
.success-panel {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    #0769f3,
    #0408e5,
    #36f6f9,
    #e40aa6,
    #a30fe8
  );
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  z-index: 10;
}
.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e12b2b;
  display: flex;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-name {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.5em;
}
.welcome-text {
  color: #666;
  font-size: 0.9em;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
/* 新增键盘提示样式 */
.keyboard-hint {
  position: absolute;
  bottom: -30px;
  width: 100%;
  text-align: center;
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
kbd {
  background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  font-family: monospace;
}
/* 增加点击反馈 */
.sensor-area:active {
  transform: scale(0.98);
}
.biometric-device {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
  perspective: 1000px;
}
.sensor-area {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 20px auto;
  border-radius: 18px;
  background: linear-gradient(145deg, #e6e6e6 0%, #ffffff 100%);
  box-shadow: 8px 8px 16px #d9d9d9, -8px -8px 16px #ffffff;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
}
.sensor-surface {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
}
.scan-animation {
  position: absolute;
  width: 100%;
  height: 4px;
  background: linear-gradient(
    90deg,
    rgba(77, 171, 247, 0) 0%,
    rgba(77, 171, 247, 0.6) 50%,
    rgba(77, 171, 247, 0) 100%
  );
  animation: scan 2s infinite linear;
}
@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(200%);
  }
}
.sensor-area.scanning {
  box-shadow: 0 0 12px rgba(77, 171, 247, 0.3),
    inset 0 0 12px rgba(77, 171, 247, 0.1);
}
.sensor-area.success {
  background: linear-gradient(145deg, #e6f5ee 0%, #ffffff 100%);
  box-shadow: 0 0 16px rgba(76, 175, 80, 0.3),
    inset 0 0 12px rgba(76, 175, 80, 0.1);
}
.success-indicator {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 175, 80, 0.1);
}
.check-icon {
  width: 48px;
  height: 48px;
  fill: #4caf50;
  filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3));
}
.fade-enter-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from {
  opacity: 0;
}
.status-message {
  text-align: center;
  color: #666;
  font-size: 14px;
  height: 20px;
  margin: 20px 0;
  transition: color 0.3s ease;
}
.sensor-area:hover:not(.scanning):not(.success) {
  transform: scale(1.02);
  box-shadow: 12px 12px 24px #d1d1d1, -12px -12px 24px #ffffff;
}
.sensor-area.scanning .status-message {
  color: #2196f3;
}
.sensor-area.success .status-message {
  color: #4caf50;
}
/* 新增外设专属样式 */
.biometric-device {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05), inset 0 0 12px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
}
.sensor-area {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.9) 0%,
    #f1f3f5 100%
  );
  border: 3px solid #dee2e6;
  position: relative;
  transition: all 0.3s ease;
}
.sensor-area.active {
  border-color: #4dabf7;
  box-shadow: 0 0 16px rgba(77, 171, 247, 0.2);
}
.sensor-icon {
  width: 60%;
  height: 60%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.sensor-ring {
  fill: none;
  stroke: #ced4da;
  stroke-width: 2;
}
.sensor-arrow {
  fill: none;
  stroke: #adb5bd;
  stroke-width: 2;
  stroke-linecap: round;
}
.scanning-indicator {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 3px solid rgba(77, 171, 247, 0.3);
  animation: scanning 2s infinite linear;
}
@keyframes scanning {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.controls {
  margin-top: 20px;
  text-align: center;
}
.scan-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(77, 171, 247, 0.3);
}
.scan-btn:hover {
  transform: translateY(-2px);
  background: #3b8ec6;
}
.auth-tip {
  color: #495057;
  margin: 20px 0;
  font-size: 14px;
  letter-spacing: 0.05em;
}
/* ??? */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: absolute;
  width: 100vw;
  left: 0;
  overflow: hidden; /* 避免出现滚动条 */
  top: 0;
  background: linear-gradient(
    135deg,
    #0769f3,
    #0408e5,
    #36f6f9,
    #e40aa6,
    #a30fe8
  );
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 400px;
  transition: all 0.3s ease;
}

.fingerprint-auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.fingerprint-icon {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fingerprint-icon.active {
  border-color: #4dabf7;
  background: #e7f5ff;
}

.fingerprint-icon:hover {
  transform: scale(1.05);
}

.fingerprint-svg {
  width: 60%;
  height: 60%;
}

.outer-ring {
  fill: none;
  stroke: #adb5bd;
  stroke-width: 2;
  stroke-linecap: round;
}

.fingerprint-icon.active .outer-ring {
  stroke: #4dabf7;
}

.scan-wave {
  position: absolute;
  width: 140%;
  height: 140%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(77, 171, 247, 0.2) 0%,
    transparent 70%
  );
  animation: wave 1.5s infinite;
}

@keyframes wave {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.auth-tip {
  color: #868e96;
  margin: 24px 0;
  font-size: 14px;
}

.alternative-auth a {
  color: #4dabf7;
  text-decoration: none;
  font-size: 14px;
}

.password-auth {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-title {
  color: #343a40;
  text-align: center;
  margin-bottom: 12px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-group input {
  width: 100%;
  padding: 14px 0px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.input-group input:focus {
  border-color: #4dabf7;
  outline: none;
}

.input-group label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  padding: 0 4px;
  color: #868e96;
  transition: all 0.3s ease;
  pointer-events: none;
}

.input-group label.focused {
  top: 0;
  font-size: 12px;
  color: #4dabf7;
}

.login-btn {
  background: linear-gradient(135deg, #4dabf7 0%, #228be6 100%);
  color: white;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:disabled {
  background: #ced4da;
  cursor: not-allowed;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

.auth-switch {
  text-align: center;
}

.auth-switch a {
  color: #4dabf7;
  text-decoration: none;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  margin: 0 auto;
  border: 3px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .auth-card {
    width: 90%;
    padding: 24px;
  }
}
</style>