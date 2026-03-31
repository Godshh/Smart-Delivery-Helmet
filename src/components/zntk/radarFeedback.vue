<template>
  <div class="radar-screen">
    <div class="weather-overlay" :class="currentWeather">
      <div v-if="currentWeather === 'sunny'" class="sun-rays">
        <div class="ray" v-for="i in 8" :key="i" :style="{ transform: `rotate(${i * 45}deg)` }"></div>
      </div>
      <div v-if="currentWeather === 'cloudy'" class="clouds">
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
      </div>
      <div v-if="currentWeather === 'rainy'" class="rain-container">
        <div v-for="i in 30" :key="i" class="raindrop" :style="getRainStyle(i)"></div>
      </div>
      <div v-if="currentWeather === 'foggy'" class="fog-layer"></div>
      <div v-if="currentWeather === 'snowy'" class="snow-container">
        <div v-for="i in 40" :key="i" class="snowflake" :style="getSnowStyle(i)"></div>
      </div>
    </div>

    <div class="hud-top">
      <div class="hud-title">
        <span class="title-glow"></span>
        <span class="title-text">毫米波成像雷达监测系统</span>
      </div>
      <div class="radar-status">
        <span class="status-dot" :class="radarOnline ? 'active' : ''"></span>
        <span class="status-text">{{ radarOnline ? '雷达在线' : '雷达离线' }}</span>
      </div>
      <div class="back-btn" @click="goBack">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#165DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <div class="hud-main">
      <div class="left-panel">
        <div class="panel-header">后方来车统计</div>
        <div class="data-card">
          <div class="data-value">{{ detectedCars }}</div>
          <div class="data-label">辆</div>
        </div>
        <div class="data-sub">
          <div class="sub-item">
            <span class="sub-label">近距离</span>
            <span class="sub-value" style="color: #F53F3F">{{ closeRangeCars }}</span>
          </div>
          <div class="sub-item">
            <span class="sub-label">中距离</span>
            <span class="sub-value" style="color: #FF7D00">{{ midRangeCars }}</span>
          </div>
          <div class="sub-item">
            <span class="sub-label">远距离</span>
            <span class="sub-value" style="color: #00B42A">{{ farRangeCars }}</span>
          </div>
        </div>

        <div class="panel-header" style="margin-top: 20px; border-top: 1px solid rgba(22, 93, 255, 0.1); padding-top: 15px;">行人监测统计</div>
        <div class="data-card">
          <div class="data-value">{{ detectedPedestrians }}</div>
          <div class="data-label">人</div>
        </div>
      </div>

      <div class="center-radar">
        <div class="radar-box">
          <div class="radar-border"></div>
          <div class="radar-scan">
            <div class="scan-line"></div>
            <!-- Move origin point inside radar-scan so it's centered with it -->
            <div class="origin-point"></div>
          </div>
          <div class="radar-grid">
            <div class="grid-line horizontal" style="bottom: 25%"></div> <!-- 0m (Car) -->
            <div class="grid-line horizontal" style="bottom: 50%"></div> <!-- 50m -->
            <div class="grid-line horizontal" style="bottom: 75%"></div> <!-- 100m -->
            <div class="grid-line vertical" style="left: 25%"></div>
            <div class="grid-line vertical" style="left: 50%"></div>
            <div class="grid-line vertical" style="left: 75%"></div>
            
            <!-- Lane Lines (Approx 3.5m width each lane) -->
            <!-- Radar width 40m, center is 0. 3.5m is approx 3.5/20 * 50% = 8.75% from center -->
            <div class="lane-line left-1" style="left: 41.25%"></div> <!-- -3.5m -->
            <div class="lane-line right-1" style="left: 58.75%"></div> <!-- +3.5m -->
            <div class="lane-line left-2" style="left: 32.5%"></div> <!-- -7.0m -->
            <div class="lane-line right-2" style="left: 67.5%"></div> <!-- +7.0m -->

            <div class="axis x-axis"></div>
            <div class="axis y-axis"></div>
          </div>
          <div class="own-car">
            <div class="own-speed">{{ currentSpeed }}km/h</div>
          </div>
          <div class="detected-vehicles">
            <div v-for="(car, index) in vehicles" :key="index"
                 class="vehicle"
                 :class="{ 
                   'changing-lane': car.changingLane,
                   'too-close': car.tooClose
                 }"
                 :style="getCarPosition(car)">
              <div class="car-body">
                <div class="car-top"></div>
                <div class="car-bottom"></div>
              </div>
              <div v-if="car.changingLane" class="lane-warning">⚠</div>
              <div v-if="car.tooClose" class="distance-warning">危险</div>
              <div class="car-distance">{{ car.distance }}m</div>
            </div>

            <div v-for="(p, index) in pedestrians" :key="'p'+index"
                 class="pedestrian"
                 :class="{ 'warning': p.warning, 'emergency': p.emergency }"
                 :style="getPedestrianPosition(p)">
              <div class="pedestrian-body">
                <div class="pedestrian-head"></div>
                <div class="pedestrian-torso"></div>
              </div>
              <div v-if="p.emergency" class="distance-warning" style="color: #F53F3F; font-weight: bold;">危险!</div>
              <div v-else-if="p.warning" class="distance-warning" style="color: #FF7D00;">注意</div>
              <div class="car-distance">{{ p.distance }}m</div>
            </div>
          </div>
          <div class="distance-markers">
            <span class="marker" style="top: 10%">150m</span>
            <span class="marker" style="top: 35%">100m</span>
            <span class="marker" style="top: 60%">50m</span>
            <span class="marker" style="top: 85%">-20m</span>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="panel-header">预警信息</div>
        <div class="warning-list">
          <div v-if="hasPedestrianEmergency" class="warning-item warning-red">
             <div class="warning-icon">🛑</div>
             <div class="warning-content">
               <div class="warning-title">行人紧急制动</div>
               <div class="warning-desc">距离过近(&lt;2m)，请立即停车!</div>
             </div>
           </div>
          <div v-else-if="hasPedestrianWarning" class="warning-item warning-yellow">
            <div class="warning-icon">🚶</div>
            <div class="warning-content">
              <div class="warning-title">行人监测预警</div>
              <div class="warning-desc">检测到行人(&lt;7m)，请减速避让</div>
            </div>
          </div>
          <div v-if="hasLaneChangeWarning" class="warning-item warning-yellow">
            <div class="warning-icon">↔</div>
            <div class="warning-content">
              <div class="warning-title">变道趋势提醒</div>
              <div class="warning-desc">检测到后方车辆有变道意图</div>
            </div>
          </div>
          <div v-if="hasCloseWarning" class="warning-item warning-red">
            <div class="warning-icon">!</div>
            <div class="warning-content">
              <div class="warning-title">跟车过近预警</div>
              <div class="warning-desc">后方车辆距离过近，请保持车距</div>
            </div>
          </div>
          <div v-if="!hasLaneChangeWarning && !hasCloseWarning && !hasPedestrianWarning && !hasPedestrianEmergency" class="warning-item warning-safe">
            <div class="warning-icon">✓</div>
            <div class="warning-content">
              <div class="warning-title">安全状态</div>
              <div class="warning-desc">后方路况正常，可安全行驶</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="weather-nav">
      <div class="nav-item" 
           v-for="weather in weathers" 
           :key="weather.id"
           :class="{ active: currentWeather === weather.id }"
           @click="changeWeather(weather.id)">
        <span class="weather-icon">{{ weather.icon }}</span>
        <span class="weather-name">{{ weather.name }}</span>
      </div>
    </div>

    <div class="hud-bottom">
      <div class="bottom-info">
        <span class="info-label">当前场景</span>
        <span class="info-value">{{ getWeatherName(currentWeather) }}</span>
      </div>
      <div class="bottom-info">
        <span class="info-label">本车速度</span>
        <span class="info-value">{{ currentSpeed }} km/h</span>
      </div>
      <div class="bottom-center">
        <div class="scan-indicator">
          <span class="scan-dot"></span>
          <span>扫描监测中</span>
        </div>
      </div>
      <div class="bottom-info">
        <span class="info-label">刷新率</span>
        <span class="info-value">60Hz</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RadarFeedback",
  data() {
    return {
      currentWeather: 'sunny',
      radarOnline: true,
      currentSpeed: 60, // Default speed
      vehicles: [
        // x: lateral distance (meters), y: longitudinal distance (meters)
        // x > 0 right, x < 0 left
        // y > 0 front (but for rear radar, y increases as distance increases backwards)
        // Assuming radar at (0,0) at the back of the car
        { id: 1, x: 0, y: 120, distance: 120, size: 0.8, changingLane: false, tooClose: false },
        { id: 2, x: -5, y: 60, distance: 60, size: 1.2, changingLane: true, tooClose: false },
        { id: 3, x: 5, y: 25, distance: 25, size: 1.6, changingLane: false, tooClose: true }
      ],
      pedestrians: [], // No pedestrians by default
      radarRange: 150, // Max detection range in meters (Front/Back)
      rearRange: 50, // Range behind the car (Negative Y)
      radarWidth: 40, // Total width coverage in meters (-20 to +20)
      weathers: [
        { id: 'sunny', name: '晴天', icon: '☀️' },
        { id: 'cloudy', name: '阴天', icon: '☁️' },
        { id: 'rainy', name: '雨天', icon: '🌧️' },
        { id: 'foggy', name: '雾霾', icon: '🌫️' },
        { id: 'snowy', name: '雪天', icon: '❄️' }
      ]
    };
  },
  computed: {
    detectedCars() {
      return this.vehicles.length;
    },
    closeRangeCars() {
      return this.vehicles.filter(v => v.distance < 50).length;
    },
    midRangeCars() {
      return this.vehicles.filter(v => v.distance >= 50 && v.distance < 100).length;
    },
    farRangeCars() {
      return this.vehicles.filter(v => v.distance >= 100).length;
    },
    hasLaneChangeWarning() {
      return this.vehicles.some(v => v.changingLane);
    },
    hasCloseWarning() {
      return this.vehicles.some(v => v.tooClose);
    },
    detectedPedestrians() {
      return this.pedestrians.length;
    },
    hasPedestrianWarning() {
      return this.pedestrians.some(p => p.warning || p.emergency);
    },
    hasPedestrianEmergency() {
      return this.pedestrians.some(p => p.emergency);
    }
  },
  mounted() {
    setInterval(this.simulateTraffic, 2000);
  },
  methods: {
    goBack() {
      this.$emit('reHome');
    },
    changeWeather(weather) {
      this.currentWeather = weather;
    },
    getWeatherName(id) {
      const w = this.weathers.find(w => w.id === id);
      return w ? w.name : '';
    },
    getCarPosition(car) {
      // Map x,y meters to percentage
      // y: -50 to +150 (radarRange)
      // Car is at y=0, which should be around 25% from bottom (if range is -50 to 150, total 200m)
      
      const totalRange = this.radarRange + this.rearRange; // 150 + 50 = 200m
      const bottomY = -this.rearRange; // -50m
      
      // Calculate percentage from top (100% is bottom of screen, 0% is top)
      // We want y=150 to be at top (0%)
      // y=-50 to be at bottom (100%)
      
      // Normalized Y (0 to 1) where 0 is bottom (-50) and 1 is top (150)
      const normalizedY = (car.y - bottomY) / totalRange;
      
      const topPct = 100 - (normalizedY * 100);
      
      // x: -20 to +20 meters -> 0% to 100% left
      // 0 is 50%
      const leftPct = 50 + (car.x / (this.radarWidth / 2) * 50);

      const scale = 0.6 + (normalizedY) * 0.8;
      
      return {
        left: leftPct + '%',
        top: topPct + '%',
        transform: `translate(-50%, -50%) scale(${scale})`
      };
    },
    getPedestrianPosition(p) {
      const totalRange = this.radarRange + this.rearRange;
      const bottomY = -this.rearRange;
      const normalizedY = (p.y - bottomY) / totalRange;
      
      const topPct = 100 - (normalizedY * 100);
      const leftPct = 50 + (p.x / (this.radarWidth / 2) * 50);
      const scale = 0.8 + (normalizedY) * 0.5;
      
      return {
        left: leftPct + '%',
        top: topPct + '%',
        transform: `translate(-50%, -50%) scale(${scale})`
      };
    },
    getRainStyle(i) {
      return {
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 2 + 's',
        animationDuration: (0.5 + Math.random() * 0.5) + 's'
      };
    },
    getSnowStyle(i) {
      return {
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 5 + 's',
        animationDuration: (3 + Math.random() * 4) + 's'
      };
    },
    simulateTraffic() {
      this.vehicles = this.vehicles.map(car => {
        // Move vehicles closer (decrease y)
        let newY = car.y - (0.5 + Math.random() * 2); 
        // If it goes too far back (negative), reset to far front
        if (newY < -40) newY = 140 + Math.random() * 10; 

        // Slight lateral movement
        let newX = car.x + (Math.random() - 0.5) * 0.5;
        // Constrain X
        newX = Math.max(-15, Math.min(15, newX));

        let newDistance = Math.round(newY); // Distance is Y coordinate
        let newTooClose = newDistance < 30 && newDistance > -10; // Danger zone near 0
        let newChangingLane = Math.abs(newX) > 4 && Math.random() > 0.8;

        return {
          ...car,
          x: newX,
          y: newY,
          distance: newDistance,
          changingLane: newChangingLane,
          tooClose: newTooClose
        };
      });

      // Update pedestrians
      this.pedestrians = this.pedestrians.map(p => {
        // Pedestrians move
        let newY = p.y + (Math.random() - 0.5) * 1;
        let newX = p.x + (Math.random() - 0.5) * 0.8;
        
        // Keep within bounds including negative Y
        newY = Math.max(-45, Math.min(140, newY));
        newX = Math.max(-18, Math.min(18, newX));
        
        // Avoid center lanes if possible (keep outside +/- 7m roughly)
        // Or at least outside +/- 3.5m (one lane)
        // Let's say they stay mostly on shoulders
        // if (Math.abs(newX) < 4) {
        //   newX = newX > 0 ? 4 : -4;
        // }
        
        let newDistance = Math.round(newY * 10) / 10; 
        let absDist = Math.abs(newDistance);
        
        let warning = absDist < 7 && absDist >= 2;
        let emergency = absDist < 2;
        
        return {
          ...p,
          x: newX,
          y: newY,
          distance: newDistance,
          warning: warning,
          emergency: emergency
        };
      });

      // Update own speed slightly
      this.currentSpeed = Math.round(60 + (Math.random() - 0.5) * 5);

      // Occasionally add/remove pedestrians
      if (Math.random() > 0.9 && this.pedestrians.length < 3) {
        // Spawn outside lanes (e.g., x > 8 or x < -8)
        const spawnRight = Math.random() > 0.5;
        const spawnX = spawnRight ? (8 + Math.random() * 10) : (-8 - Math.random() * 10);
        
        this.pedestrians.push({
          id: Date.now(),
          x: spawnX,
          y: 140,
          distance: 140,
          warning: false,
          emergency: false
        });
      } else if (Math.random() > 0.9 && this.pedestrians.length > 0) {
        // Only remove if far away or out of side bounds
        const farOnes = this.pedestrians.filter(p => p.distance > 130 || p.distance < -40 || Math.abs(p.x) > 19);
        if (farOnes.length > 0) {
           const index = this.pedestrians.indexOf(farOnes[0]);
           if (index > -1) this.pedestrians.splice(index, 1);
        }
      }
    }
  }
};
</script>

<style scoped lang="less">
.radar-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 50% 30%, rgba(22, 93, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
}

.weather-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  transition: all 0.8s ease;
}

.sun-rays {
  position: absolute;
  top: 10%;
  right: 10%;
  width: 100px;
  height: 100px;
}

.ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(255, 200, 50, 0.6), transparent);
  transform-origin: center top;
}

.clouds {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.cloud {
  position: absolute;
  background: rgba(200, 200, 200, 0.3);
  border-radius: 50px;
  filter: blur(10px);
}

.cloud-1 {
  width: 200px;
  height: 60px;
  top: 15%;
  left: 10%;
  animation: cloudMove1 20s linear infinite;
}

.cloud-2 {
  width: 150px;
  height: 45px;
  top: 25%;
  right: 15%;
  animation: cloudMove2 25s linear infinite;
}

@keyframes cloudMove1 {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(50px); }
}

@keyframes cloudMove2 {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-50px); }
}

.rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.raindrop {
  position: absolute;
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, rgba(150, 180, 255, 0.6));
  animation: rainFall linear infinite;
}

@keyframes rainFall {
  0% { transform: translateY(-50px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

.fog-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(180, 180, 180, 0.4) 100%);
  animation: fogPulse 4s ease-in-out infinite;
}

@keyframes fogPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.8; }
}

.snow-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.snowflake {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  animation: snowFall linear infinite;
}

@keyframes snowFall {
  0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(22, 93, 255, 0.15);
  position: relative;
  z-index: 2;
}

.hud-title {
  position: relative;
  display: flex;
  align-items: center;
}

.title-text {
  font-size: 22px;
  font-weight: 700;
  color: #165DFF;
  letter-spacing: 3px;
}

.title-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(22, 93, 255, 0.15) 0%, transparent 70%);
  filter: blur(10px);
  animation: titlePulse 3s ease-in-out infinite;
}

@keyframes titlePulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.radar-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  background: #cbd5e1;
  border-radius: 50%;
  transition: all 0.3s ease;

  &.active {
    background: #00B42A;
    box-shadow: 0 0 10px rgba(0, 180, 42, 0.4);
    animation: statusPulse 1.5s infinite;
  }
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.status-text {
  font-size: 14px;
  color: #475569;
  letter-spacing: 1px;
}

.back-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(22, 93, 255, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(22, 93, 255, 0.05);

  &:hover {
    background: rgba(22, 93, 255, 0.15);
    border-color: #165DFF;
    box-shadow: 0 0 15px rgba(22, 93, 255, 0.2);
  }
}

.hud-main {
  display: grid;
  grid-template-columns: 180px 1fr 200px;
  gap: 20px;
  flex: 1;
  padding: 20px 0;
  position: relative;
  z-index: 2;
}

.left-panel,
.right-panel {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(22, 93, 255, 0.15);
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.panel-header {
  font-size: 13px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(22, 93, 255, 0.1);
}

.data-card {
  background: linear-gradient(135deg, rgba(22, 93, 255, 0.08) 0%, rgba(22, 93, 255, 0.02) 100%);
  border-radius: 12px;
  padding: 25px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(22, 93, 255, 0.15);
}

.data-value {
  font-size: 48px;
  font-weight: 800;
  color: #165DFF;
  font-family: 'Courier New', monospace;
  line-height: 1;
}

.data-label {
  font-size: 16px;
  color: #64748b;
  letter-spacing: 2px;
}

.data-sub {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.sub-label {
  font-size: 13px;
  color: #64748b;
}

.sub-value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.center-radar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-box {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(22, 93, 255, 0.03) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(22, 93, 255, 0.2);
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.08),
    inset 0 0 50px rgba(22, 93, 255, 0.02);
}

.radar-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 14px;
  border: 1px solid rgba(22, 93, 255, 0.1);
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(90deg, #165DFF, transparent, #165DFF);
    border-radius: 16px;
    z-index: -1;
    animation: borderGlow 3s linear infinite;
    opacity: 0.5;
  }
}

@keyframes borderGlow {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}

.radar-scan {
  position: absolute;
  bottom: 25%; /* Center at car position (25% from bottom) */
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translateX(-50%) translateY(50%); /* Center the circle at pivot point */
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
}

.scan-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 3px;
  background: linear-gradient(90deg, #165DFF, transparent);
  transform-origin: left center;
  animation: scanRotate 3s linear infinite;
  box-shadow: 0 0 20px rgba(22, 93, 255, 0.8);
}

@keyframes scanRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); } /* Full 360 scan */
}

.lane-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.4);
  border-left: 1px dashed rgba(255, 255, 255, 0.6);
  z-index: 1;
}

.axis.x-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 25%; /* X-axis at car position (y=0) */
  height: 2px;
  background: #165DFF;
  border: none;
  opacity: 0.8;
}

.axis.y-axis {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: #165DFF;
  transform: translateX(-50%);
  border: none;
  opacity: 0.8;
}

.origin-point {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: #F53F3F;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  box-shadow: 0 0 5px #F53F3F;
}

.own-car {
  position: absolute;
  bottom: 25%; /* Move car up to 25% */
  left: 50%;
  transform: translateX(-50%) translateY(50%); /* Center it on the axis */
  width: 24px; /* Reduced from 40px */
  height: 36px; /* Reduced from 60px */
  background: linear-gradient(180deg, #165DFF 0%, #0a3080 100%);
  border-radius: 4px 4px 2px 2px;
  box-shadow: 0 0 15px rgba(22, 93, 255, 0.6);
  z-index: 12; /* Between vehicles (10) and pedestrians (15) */

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 3px;
    right: 3px;
    height: 10px;
    background: rgba(100, 150, 255, 0.3);
    border-radius: 2px;
  }
  
  &::after {
    display: none;
  }
}

.own-speed {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #165DFF;
  white-space: nowrap;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

.detected-vehicles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.vehicle {
  position: absolute;
  transition: all 0.5s ease;
  z-index: 10;
  transform-origin: center center;
}

.car-body {
  position: relative;
  width: 24px; /* Reduced from 30px */
  height: 36px; /* Reduced from 45px */
}

.car-top {
  position: absolute;
  top: 0;
  left: 2px;
  right: 2px;
  height: 14px; /* Reduced from 18px */
  background: #64748b;
  border-radius: 3px 3px 0 0;
}

.car-bottom {
  position: absolute;
  top: 12px; /* Adjusted */
  left: 0;
  right: 0;
  height: 24px; /* Reduced from 30px */
  background: #475569;
  border-radius: 2px 2px 3px 3px;
}

.vehicle.changing-lane {
  .car-body {
    .car-top,
    .car-bottom {
      background: #FF7D00;
      box-shadow: 0 0 15px rgba(255, 125, 0, 0.8);
    }
  }
}

.vehicle.too-close {
  .car-body {
    .car-top,
    .car-bottom {
      background: #F53F3F;
      box-shadow: 0 0 20px rgba(245, 63, 63, 0.9);
      animation: dangerPulse 0.5s ease-in-out infinite;
    }
  }
}

.pedestrian {
  position: absolute;
  transition: all 0.5s ease;
  z-index: 15; /* Higher than vehicle (10) */
}

.pedestrian-body {
  position: relative;
  width: 14px;
  height: 20px;
}

.pedestrian-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: #722ED1;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(114, 46, 209, 0.5);
}

.pedestrian-torso {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 10px;
  background: #722ED1;
  border-radius: 4px 4px 0 0;
}

.pedestrian.warning .pedestrian-head,
.pedestrian.warning .pedestrian-torso {
  background: #FF7D00;
  box-shadow: 0 0 10px rgba(255, 125, 0, 0.8);
  animation: dangerPulse 1s ease-in-out infinite;
}

.pedestrian.emergency .pedestrian-head,
.pedestrian.emergency .pedestrian-torso {
  background: #F53F3F;
  box-shadow: 0 0 15px rgba(245, 63, 63, 0.9);
  animation: dangerPulse 0.3s ease-in-out infinite;
}

@keyframes dangerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.lane-warning,
.distance-warning {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  animation: warningBounce 0.5s ease infinite;
}

@keyframes warningBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-3px); }
}

.car-distance {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.distance-markers {
  position: absolute;
  right: 15px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 0;
}

.marker {
  font-size: 11px;
  color: rgba(22, 93, 255, 0.7);
  font-family: 'Courier New', monospace;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.warning-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-left: 3px solid;
  border: 1px solid;
}

.warning-yellow {
  border-color: rgba(255, 125, 0, 0.3);
  border-left-color: #FF7D00;
  background: rgba(255, 125, 0, 0.05);
}

.warning-purple {
  border-color: rgba(114, 46, 209, 0.3);
  border-left-color: #722ED1;
  background: rgba(114, 46, 209, 0.05);
}

.warning-red {
  border-color: rgba(245, 63, 63, 0.3);
  border-left-color: #F53F3F;
  background: rgba(245, 63, 63, 0.05);
  animation: redPulse 1s ease-in-out infinite;
}

.warning-safe {
  border-color: rgba(0, 180, 42, 0.3);
  border-left-color: #00B42A;
  background: rgba(0, 180, 42, 0.05);
}

@keyframes redPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(245, 63, 63, 0); }
  50% { box-shadow: 0 0 15px rgba(245, 63, 63, 0.15); }
}

.warning-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.warning-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.weather-nav {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.nav-item {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(22, 93, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 2px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);

  &:hover {
    border-color: rgba(22, 93, 255, 0.5);
    background: rgba(22, 93, 255, 0.08);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #165DFF;
    background: rgba(22, 93, 255, 0.12);
    box-shadow: 0 4px 20px rgba(22, 93, 255, 0.2);
  }
}

.weather-icon {
  font-size: 20px;
}

.weather-name {
  font-size: 10px;
  color: #475569;
}

.hud-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid rgba(22, 93, 255, 0.15);
  position: relative;
  z-index: 2;
}

.bottom-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.info-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-value {
  font-size: 15px;
  font-weight: 700;
  color: #165DFF;
  font-family: 'Courier New', monospace;
}

.bottom-center {
  display: flex;
  align-items: center;
}

.scan-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
  letter-spacing: 1px;
}

.scan-dot {
  width: 10px;
  height: 10px;
  background: #00B42A;
  border-radius: 50%;
  animation: scanPulse 1s infinite;
}

@keyframes scanPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px #00B42A;
  }
  50% {
    opacity: 0.5;
    box-shadow: 0 0 20px #00B42A;
  }
}
</style>
