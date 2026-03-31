<template>
  <div class="servecs-container">
    <div class="card1 music-card">
      <div class="music-header">
        <div class="vinyl-container" :class="{ playing: isPlaying }">
          <div class="vinyl">
            <div class="vinyl-inner">
              <img
                :src="currentTrack.cover"
                alt="专辑封面"
                class="album-cover"
              />
            </div>
          </div>
          <div class="vinyl-center"></div>
        </div>
      </div>

      <!-- 歌曲信息 -->
      <div class="song-info">
        <h3 class="title">{{ currentTrack.title }}</h3>
        <p class="artist">{{ currentTrack.artist }}</p>
      </div>

      <!-- 进度条 -->
      <div class="progress-bar" @click="seekAudio">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- 时间显示 -->
      <div class="time-display">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>

      <!-- 控制按钮 -->
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
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      progress: 0,
      currentTrackIndex: 0,
      audioElement: null,
      playlist: [
        {
          title: "未知音乐1",
          artist: "未知艺术家",
          cover: "https://picsum.photos/200?random=1",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        },
        {
          title: "未知音乐2",
          artist: "未知艺术家",
          cover: "https://picsum.photos/200?random=2",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        },
      ],
    };
  },
  props: {
    trafficPercent: { type: Number, default: 65 }, // 0-100 拥堵指数
    trafficSpeed: { type: Number, default: 38 }, // 实时时速
    distance: { type: Number, default: 15 }, // 路段距离(km)
  },
  computed: {
    trafficStatus() {
      if (this.trafficPercent < 40) return "畅通";
      if (this.trafficPercent < 75) return "缓行";
      return "拥堵";
    },
    statusStyle() {
      const colors = {
        畅通: "#4CAF50",
        缓行: "#FFC107",
        拥堵: "#F44336",
      };
      return {
        backgroundColor: colors[this.trafficStatus],
        boxShadow: `0 2px 8px ${colors[this.trafficStatus]}80`,
      };
    },
    animationDuration() {
      // 根据拥堵程度调整动画速度
      return 2 + this.trafficPercent / 20 + "s";
    },
    travelTime() {
      return Math.round((this.distance / this.trafficSpeed) * 60) || "--";
    },
    // 当前播放的歌曲信息
    currentTrack() {
      return this.playlist[this.currentTrackIndex];
    },
  },
  mounted() {
    this.initAudio();
  },
  beforeDestroy() {
    this.audioElement.pause();
    this.audioElement.removeEventListener("timeupdate", this.updateProgress);
    this.audioElement.removeEventListener(
      "loadedmetadata",
      this.updateDuration
    );
    this.audioElement.removeEventListener("ended", this.nextTrack);
  },
  methods: {
    // 初始化音频对象
    initAudio() {
      this.audioElement = new Audio(this.currentTrack.url);
      this.audioElement.preload = "metadata";

      this.audioElement.addEventListener("loadedmetadata", () => {
        this.duration = this.audioElement.duration;
      });

      this.audioElement.addEventListener("timeupdate", () => {
        this.currentTime = this.audioElement.currentTime;
        this.progress = (this.currentTime / this.duration) * 100;
      });

      this.audioElement.addEventListener("ended", this.nextTrack);
    },
    // 切换播放状态
    togglePlay() {
      if (this.isPlaying) {
        this.audioElement.pause();
      } else {
        this.audioElement.play();
      }
      this.isPlaying = !this.isPlaying;
    },
    // 切换到下一首
    updateDuration() {
      this.duration = this.audioElement.duration;
    },

    updateProgress() {
      this.currentTime = this.audioElement.currentTime;
    },
    // 格式化时间显示
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    },

    seekAudio(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const seekPosition = (event.clientX - rect.left) / rect.width;
      this.audioElement.currentTime = seekPosition * this.duration;
    },

    nextTrack() {
      this.currentTrackIndex =
        (this.currentTrackIndex + 1) % this.playlist.length;
      this.switchTrack();
    },

    prevTrack() {
      this.currentTrackIndex =
        (this.currentTrackIndex - 1 + this.playlist.length) %
        this.playlist.length;
      this.switchTrack();
    },

    switchTrack() {
      this.audioElement.pause();
      this.isPlaying = false;
      this.progress = 0;
      this.currentTime = 0;
      this.audioElement.src = this.currentTrack.url;
      this.audioElement.load();
    },
  },
};
</script>

<style scoped>
.servecs-container{
  background-color: #fff;
  display: flex;
  object-fit: cover;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

/* 音乐播放器 */
.music-card {
  width: 95%;
  height: 100%;
  background: linear-gradient(135deg, #ff745c, #7a3dff);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.music-header {
  position: relative;
  margin: 0 auto 24px;
  margin-top: 20px;
  width: 350px;
  height: 350px;
}

.vinyl-container {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.vinyl-container.playing .vinyl {
  animation-play-state: running;
}

.vinyl {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #fff 0%, #f0f0f0 100%),
    repeating-radial-gradient(
      circle at 50% 50%,
      #ddd 0%,
      #ddd 2%,
      transparent 2%,
      transparent 5%
    );
  border-radius: 50%;
  position: relative;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: rotate 8s linear infinite;
  animation-play-state: paused;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.vinyl-inner {
  position: absolute;
  width: 40%;
  height: 40%;
  background: #fff;
  border-radius: 50%;
  top: 30%;
  left: 30%;
  overflow: hidden;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1);
}

.album-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vinyl-center {
  position: absolute;
  width: 12%;
  height: 12%;
  background: #555;
  border-radius: 50%;
  top: 44%;
  left: 44%;
  z-index: 1;
}

.song-info {
  text-align: center;
  margin-bottom: 120px;
  color: white;
}

.title {
  font-size: 18px;
  margin: 0 0 4px;
}

.artist {
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 16px 0;
  cursor: pointer;
}

.progress {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.time-display {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-bottom: 16px;
}

.music-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.control-btn {
  width: 48px;
  height: 48px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-size: 18px;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  cursor: pointer;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.play-btn {
  width: 64px;
  height: 64px;
  border: none;
  background: white;
  border-radius: 50%;
  color: #7a3dff;
  font-size: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.play-btn:hover {
  transform: scale(1.1);
}

.play-btn:active {
  transform: scale(0.95);
}
</style>
