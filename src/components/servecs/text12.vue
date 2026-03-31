<template>
  <div class="dashboard">
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

    <!-- 路况模块 -->
    <div class="card traffic-card">
      <h2 class="card-title">实时路况</h2>
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

    <!-- 音乐播放模块 -->
    <div class="card music-card">
      <div class="music-header">
        <div class="vinyl-container" :class="{ playing: isPlaying }">
          <div class="vinyl">
            <div class="vinyl-inner">
              <!-- <img :src="currentTrack.cover" class="album-cover"> -->
            </div>
          </div>
          <div class="vinyl-center"></div>
        </div>
      </div>
      <div class="music-controls">
        <button class="control-btn" @click="prevTrack">
          <i class="fas fa-step-backward"></i>
        </button>
        <button class="play-btn" @click="togglePlay">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        <button class="control-btn" @click="nextTrack">
          <i class="fas fa-step-forward"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 音乐播放器数据
      isPlaying: false,
      currentTrackIndex: 0,
      playlist: [
        {
          title: '示例音乐',
          artist: 'Artist',
          cover: 'https://picsum.photos/200?random=1'
        }
      ],
      // 路况模拟数据
      trafficPercent: 65,
      trafficSpeed: 38
    }
  },
  methods: {
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
    prevTrack() { /* 切歌逻辑 */ },
    nextTrack() { /* 切歌逻辑 */ }
  }
}
</script>

<style scoped>
/* 基础样式重置 */
body {
  margin: 0;
  padding: 12px;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 统一卡片样式 */
.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s ease;
}

.card:active {
  transform: scale(0.98);
}

/* 天气模块 */
.weather-card {
  background: linear-gradient(135deg, #6B8DD6, #8EAAFB);
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
  background: rgba(255,255,255,0.15);
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
  color: #2F343D;
  font-size: 18px;
}

.traffic-progress {
  height: 36px;
  background: #F0F2F5;
  border-radius: 20px;
  position: relative;
  margin-bottom: 12px;
}

.status-bar {
  height: 100%;
  background: linear-gradient(90deg, #00C853, #64DD17);
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
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.status-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #87909C;
  font-size: 12px;
}

.traffic-desc {
  margin: 12px 0 0;
  color: #52575C;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.traffic-desc i {
  margin-right: 8px;
  color: #2196F3;
}

/* 音乐播放模块 */
.music-card {
  background: #ffffff;
}

.music-header {
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
}

.vinyl {
  /* 原有唱片样式，调整尺寸 */
  animation: rotate 8s linear infinite paused;
}

.vinyl-container.playing .vinyl {
  animation-play-state: running;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.music-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 10px;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: #2F343D;
  color: white;
  border: none;
}

/* 响应式布局 */
@media (min-width: 480px) {
  .dashboard {
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>

<!-- 添加字体图标 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">














  