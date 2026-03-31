<template>
  <div class="recording-interface">
    <!-- 导航头部 -->
    <div class="navigation-header">
      <button class="back-btn" @click="handleBack">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        返回
      </button>

      <div class="recording-status">
        <div class="recording-dot"></div>
        <span>持续录制中 - {{ recordingTime }}</span>
      </div>
    </div>

    <!-- HUD界面 -->
    <div class="hud-overlay">
      <!-- 加载指示器 -->
      <div v-if="isLoading" class="loading-message">加载视频流...</div>
      <!-- 错误提示 -->
      <div v-if="videoError" class="error-message">{{ videoError }}</div>
      <!-- 视频流（使用 <img> 标签以兼容 MJPEG） -->
      <img
        :src="videoFeedUrl"
        id="livePreview"
        class="video-feed"
        alt="Video Feed"
        @load="onVideoLoaded"
        @error="onVideoError"
      />

      <!-- 传感器数据 -->
      <div class="telemetry-panel">
        <div class="sensor-data">
          <span style="color: var(--industrial-blue)">📍</span>
          <span>定位：北纬31.2304° 东经121.4737°</span>
        </div>
        <div class="sensor-data">
          <span style="color: var(--safety-yellow)">🔋</span>
          <span>电量：62% (3.8h 剩余)</span>
        </div>
        <div class="sensor-data">
          <span style="color: #6c757d">🌡️</span>
          <span>温度：37℃ | 空气质量：良好</span>
        </div>
      </div>

      <!-- 紧急标记 -->
      <div class="emergency-tag" v-show="emergencyTagVisible">
        ⚠️ 碰撞事件记录 (15:23:45)
      </div>

      <!-- 录制进度 -->
      <div class="recording-progress">
        <div
          class="progress-bar"
          :style="{ width: progressBarWidth + '%' }"
        ></div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-pad">
      <button class="industrial-btn" @click="captureSnapshot">工作快照</button>
      <button
        class="industrial-btn"
        @click="showRecordingMenu"
        style="background: rgba(255, 1, 7, 0.8)"
      >
        添加操作标记
      </button>
    </div>

    <!-- 确认对话框 -->
    <div class="confirm-modal" v-show="showModal">
      <div class="modal-content">
        <h3 style="margin: 0 0 15px 0">录制仍在进行</h3>
        <p>视频将持续在后台录制，是否确认返回？</p>
        <div
          style="
            margin-top: 20px;
            display: flex;
            gap: 12px;
            justify-content: center;
          "
        >
          <button
            class="industrial-btn"
            style="background: #6c757d"
            @click="hideModal"
          >
            取消返回
          </button>
          <button class="industrial-btn" @click="confirmBack">确认返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      isRecording: true,
      emergencyTagVisible: false,
      progressBarWidth: 75,
      recordingTime: '01:23:45',
      showModal: false,
      baseUrl: 'http://192.168.179.188:5000',
      videoFeedUrl: '',
      videoError: '',
      isLoading: true,
      isTabActive: true,
    };
  },
  mounted() {
    this.videoFeedUrl = `${this.baseUrl}/video_feed`;
    this.checkServerHealth();
    this.startVideoFeed();
  },
  beforeDestroy() {
    this.stopVideoFeed();
  },
  methods: {
    handleBack() {
      if (this.isRecording) {
        this.showModal = true;
      } else {
        console.log(1);
        this.$emit('reHome');
      }
    },
    hideModal() {
      this.showModal = false;
    },
    confirmBack() {
      this.showModal = false;
      console.log(1);
      this.$emit('reHome');
    },
    captureSnapshot() {
      this.showToast('📸 已保存工作快照');
    },
    showRecordingMenu() {
      const timestamp = new Date().toLocaleTimeString();
      this.emergencyTagVisible = true;
      setTimeout(() => {
        this.emergencyTagVisible = false;
      }, 3000);
      this.showToast(`⏱️ 已在 ${timestamp} 添加操作标记`);
    },
    showToast(message) {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style = `
          position: fixed;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 20px;
          border-radius: 8px;
          animation: fadeInOut 2.5s;
        `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    },
    async checkServerHealth() {
      try {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
        console.log('Server health:', response.data);
        this.videoError = '';
      } catch (error) {
        console.error('Server health check failed:', error.message);
        this.videoError = `Cannot connect to server at ${this.baseUrl}. Please ensure the backend is running.`;
      }
    },
    startVideoFeed() {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    },
    stopVideoFeed() {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.isLoading = true;
      this.videoError = '';
    },
    onVideoLoaded() {
      this.isLoading = false;
      this.videoError = '';
    },
    onVideoError() {
      this.isLoading = false;
      this.videoError = 'Failed to load video feed. Please check the server.';
    },
    handleVisibilityChange() {
      this.isTabActive = !document.hidden;
    },
  },
};
</script>

<style scoped>
:root {
  --industrial-blue: #007bff;
  --safety-yellow: #ffc107;
  --alert-red: #dc3545;
  --tech-gray: #6c757d;
}

body {
  margin: 0;
  background: #f0f3f5;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  justify-content: center;
}

/* 主界面容器 */
.recording-interface {
  background: white;
  width: 100%;
  max-width: 1200px;
  border-radius: 16px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 导航头 */
.navigation-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  background: rgba(248, 249, 250, 0.9);
  backdrop-filter: blur(4px);
}

.back-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--tech-gray);
  transition: all 0.25s;
}

.back-btn:hover {
  background: rgba(0, 123, 255, 0.1);
  color: var(--industrial-blue);
  transform: translateX(-3px);
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

/* 录制状态 */
.recording-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9em;
  color: var(--tech-gray);
}

.recording-dot {
  width: 12px;
  height: 12px;
  background-color: red;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

/* HUD显示区 */
.hud-overlay {
  position: relative;
  height: 65vh;
  background: #e9ecef;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* 加载和错误提示 */
.loading-message,
.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
}

.loading-message {
  color: #333;
}

.error-message {
  color: red;
}

/* 传感器数据面板 */
.telemetry-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.08);
  min-width: 240px;
}

.sensor-data {
  color: #212529;
  margin: 10px 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 控制面板 */
.control-pad {
  padding: 10px 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  background: #f8f8f8;
  border-top: 1px solid #e9ecef;
}

.industrial-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
}

.industrial-btn:hover {
  background: #0056b3;
}

/* 紧急标记 */
.emergency-tag {
  position: absolute;
  right: 20px;
  top: 20px;
  background: var(--alert-red);
  color: white;
  padding: 8px 20px;
  border-radius: 25px;
  animation: alert-pulse 1s infinite;
  font-size: 14px;
}

/* 进度条 */
.recording-progress {
  height: 4px;
  background: rgba(0, 0, 0, 0.05);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--industrial-blue), #00a8ff);
  width: 75%;
  transition: width 0.3s ease;
}

/* 动效 */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@keyframes alert-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

/* 模态对话框 */
.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 20, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-content {
  background: #fff;
  color: #000;
  padding: 30px 40px;
  border-radius: 12px;
  text-align: center;
  width: 360px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
</style>