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
      <div class="traffic-header">
        <h2 class="card-title">实时路况</h2>
        <span class="update-time">{{ updateTime }} 更新</span>
      </div>

      <!-- 总体拥堵指数 -->
      <div class="congestion-index">
        <div class="index-ring" :class="congestionLevel.cls">
          <svg viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#eee" stroke-width="8"/>
            <circle cx="40" cy="40" r="32" fill="none"
              :stroke="congestionLevel.color"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="ringDash"
              stroke-dashoffset="50"
              style="transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dasharray .6s ease"/>
          </svg>
          <div class="index-center">
            <span class="index-num">{{ trafficPercent }}</span>
            <span class="index-unit">指数</span>
          </div>
        </div>
        <div class="index-info">
          <div class="level-badge" :style="{ background: congestionLevel.color }">
            {{ congestionLevel.label }}
          </div>
          <p class="speed-text"><i class="fas fa-tachometer-alt"></i> 均速 <b>{{ trafficSpeed }} km/h</b></p>
          <p class="delay-text"><i class="fas fa-clock"></i> 较畅通多 <b>{{ delayMin }} 分钟</b></p>
        </div>
      </div>

      <!-- 渐变进度条 -->
      <div class="gradient-bar-wrap">
        <div class="gradient-bar">
          <div class="bar-marker" :style="{ left: trafficPercent + '%' }">
            <i class="fas fa-car-side"></i>
          </div>
        </div>
        <div class="bar-ticks">
          <span>畅通</span>
          <span>缓行</span>
          <span>拥堵</span>
          <span>严重</span>
        </div>
      </div>

      <!-- 主要路段列表 -->
      <div class="road-list">
        <div
          v-for="road in roads"
          :key="road.name"
          class="road-item"
        >
          <div class="road-left">
            <span class="road-dot" :style="{ background: road.color }"></span>
            <span class="road-name">{{ road.name }}</span>
          </div>
          <div class="road-right">
            <div class="road-mini-bar">
              <div class="road-mini-fill" :style="{ width: road.pct + '%', background: road.color }"></div>
            </div>
            <span class="road-status" :style="{ color: road.color }">{{ road.status }}</span>
          </div>
        </div>
      </div>
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
      trafficSpeed: 38,
      updateTime: '',
      roads: [
        { name: '北京路', pct: 20, status: '畅通', color: '#4CAF50' },
        { name: '中山大道', pct: 55, status: '缓行', color: '#FF9800' },
        { name: '解放路', pct: 80, status: '拥堵', color: '#F44336' },
        { name: '环城西路', pct: 38, status: '较畅通', color: '#8BC34A' },
        { name: '滨江大道', pct: 95, status: '严重拥堵', color: '#B71C1C' },
      ],
      trafficTimer: null
    }
  },
  computed: {
    congestionLevel() {
      const p = this.trafficPercent
      if (p < 30) return { label: '畅通', color: '#4CAF50', cls: 'level-smooth' }
      if (p < 50) return { label: '较畅通', color: '#8BC34A', cls: 'level-fair' }
      if (p < 70) return { label: '缓行', color: '#FF9800', cls: 'level-slow' }
      if (p < 85) return { label: '拥堵', color: '#F44336', cls: 'level-jam' }
      return { label: '严重拥堵', color: '#B71C1C', cls: 'level-heavy' }
    },
    ringDash() {
      const circumference = 2 * Math.PI * 32
      const filled = (this.trafficPercent / 100) * circumference
      return `${filled} ${circumference - filled}`
    },
    delayMin() {
      return Math.round(this.trafficPercent * 0.3)
    }
  },
  mounted() {
    this.refreshTime()
    this.trafficTimer = setInterval(() => {
      // 模拟数据小幅波动
      this.trafficPercent = Math.min(100, Math.max(5, this.trafficPercent + (Math.random() - 0.5) * 6))
      this.trafficPercent = Math.round(this.trafficPercent)
      this.trafficSpeed = Math.max(5, Math.round(80 - this.trafficPercent * 0.65))
      this.roads.forEach(r => {
        r.pct = Math.min(100, Math.max(5, r.pct + (Math.random() - 0.5) * 8))
        r.pct = Math.round(r.pct)
        if (r.pct < 30) { r.status = '畅通'; r.color = '#4CAF50' }
        else if (r.pct < 50) { r.status = '较畅通'; r.color = '#8BC34A' }
        else if (r.pct < 70) { r.status = '缓行'; r.color = '#FF9800' }
        else if (r.pct < 85) { r.status = '拥堵'; r.color = '#F44336' }
        else { r.status = '严重拥堵'; r.color = '#B71C1C' }
      })
      this.refreshTime()
    }, 5000)
  },
  beforeUnmount() {
    clearInterval(this.trafficTimer)
  },
  methods: {
    refreshTime() {
      const now = new Date()
      this.updateTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    },
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

.traffic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.card-title {
  margin: 0;
  color: #2F343D;
  font-size: 18px;
}

.update-time {
  font-size: 11px;
  color: #aaa;
}

/* 拥堵指数环 */
.congestion-index {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.index-ring {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.index-ring svg {
  width: 100%;
  height: 100%;
}

.index-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.index-num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: #2F343D;
}

.index-unit {
  font-size: 10px;
  color: #999;
}

.index-info {
  flex: 1;
}

.level-badge {
  display: inline-block;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.speed-text,
.delay-text {
  margin: 4px 0;
  font-size: 13px;
  color: #555;
}

.speed-text i,
.delay-text i {
  margin-right: 5px;
  color: #2196F3;
}

/* 渐变进度条 */
.gradient-bar-wrap {
  margin-bottom: 14px;
}

.gradient-bar {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 25%, #FF9800 55%, #F44336 80%, #B71C1C 100%);
  position: relative;
}

.bar-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  transition: left 0.6s ease;
  font-size: 11px;
  color: #444;
}

.bar-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #999;
}

/* 路段列表 */
.road-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.road-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.road-left {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 80px;
  flex-shrink: 0;
}

.road-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.4s;
}

.road-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}

.road-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.road-mini-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.road-mini-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease, background 0.4s;
}

.road-status {
  font-size: 12px;
  font-weight: 600;
  width: 52px;
  text-align: right;
  white-space: nowrap;
  transition: color 0.4s;
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














  