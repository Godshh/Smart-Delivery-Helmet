<template>
  <div class="card trip-stats">
    <!-- 评分环状图 -->
    <div class="score-ring">
      <svg width="120" height="120">
        <circle 
          class="ring-background" 
          cx="60" 
          cy="60" 
          r="50"
        />
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
      <div class="detail-item" v-for="(item, index) in statsData" :key="index">
        <div class="metric">
          <i class="icon" :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </div>
        <div class="value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    score: { type: Number, default: 87 },        // 驾驶评分 (0-100)
    suddenAcceleration: { type: Number, default: 2 }, // 急加速次数
    hardBraking: { type: Number, default: 1 },   // 急刹车次数
    fuelConsumption: { type: Number, default: 7.2 }, // 油耗(L/100km)
    distance: { type: Number, default: 38.5 },    // 本次里程(km)
    duration: { type: Number, default: 72 }       // 行程时间(分钟)
  },
  computed: {
    drivingScore() {
      return Math.min(Math.max(this.score, 0), 100)
    },
    progressStyle() {
      return {
        strokeDasharray: `${(this.drivingScore / 100) * 314}, 314`,
        stroke: this.getScoreColor(this.drivingScore)
      }
    },
    statsData() {
      return [
        { 
          label: '急加速', 
          value: `${this.suddenAcceleration}次`,
          icon: 'fas fa-rocket',
          color: '#e74c3c' 
        },
        { 
          label: '急刹车', 
          value: `${this.hardBraking}次`,
          icon: 'fas fa-car-crash',
          color: '#f1c40f' 
        },
        { 
          label: '平均油耗', 
          value: `${this.fuelConsumption}L/100km`,
          icon: 'fas fa-gas-pump',
          color: '#2ecc71' 
        },
        { 
          label: '行驶里程', 
          value: `${this.distance}km`,
          icon: 'fas fa-road',
          color: '#3498db' 
        }
      ]
    }
  },
  methods: {
    getScoreColor(score) {
      if (score >= 90) return '#2ecc71'
      if (score >= 70) return '#f1c40f'
      return '#e74c3c'
    }
  }
}
</script>

<style scoped>
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
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
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

.fa-rocket { background: #e74c3c; }
.fa-car-crash { background: #f1c40f; }
.fa-gas-pump { background: #2ecc71; }
.fa-road { background: #3498db; }

.value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

/* 环状图动画 */
@keyframes ring-rotate {
  from { transform: rotate(-90deg) scale(0.9); }
  to { transform: rotate(-90deg) scale(1); }
}

.ring-progress {
  animation: ring-rotate 0.8s ease-out;
}
</style>