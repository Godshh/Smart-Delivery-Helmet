<template>
  <div class="rider-container">

    <!-- 顶部状态栏：天气 + 骑行状态合并 -->
    <div class="card status-card">
      <div class="status-left">
        <i class="fas fa-sun weather-icon"></i>
        <div>
          <div class="temp">27°C <span class="weather-desc">晴</span></div>
          <div class="weather-sub">湿度 45% · 路面干燥 · 空气优良</div>
        </div>
      </div>
      <div class="status-right">
        <div class="score-mini">
          <svg width="52" height="52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="5"/>
            <circle cx="26" cy="26" r="20" fill="none"
              :stroke="getScoreColor(drivingScore)"
              stroke-width="5"
              stroke-linecap="round"
              :stroke-dasharray="`${(drivingScore/100)*125.6} 125.6`"
              style="transform:rotate(-90deg);transform-origin:50% 50%"/>
          </svg>
          <div class="score-mini-text">
            <span class="score-num">{{ drivingScore }}</span>
            <span class="score-lbl">评分</span>
          </div>
        </div>
        <div class="stat-pills">
          <div class="stat-pill" v-for="item in statsData" :key="item.label">
            <i :class="item.icon" :style="{ color: item.pillColor }"></i>
            <span>{{ item.shortValue }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 路况分析卡 -->
    <div class="card traffic-card">
      <div class="traffic-header">
        <div class="title-row">
          <i class="fas fa-route title-icon"></i>
          <span class="card-title">AI 导航路况分析</span>
          <span class="update-time">{{ updateTime }}</span>
        </div>
        <button v-if="hasRoutes" class="clear-btn" @click="clearRoutes">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 无路线占位 -->
      <div v-if="!hasRoutes" class="no-route-tip">
        <div class="no-route-icon"><i class="fas fa-map-marked-alt"></i></div>
        <span class="no-route-text">在地图中规划路线后<br>即可查看路况分析</span>
      </div>

      <template v-else>
        <!-- 路线 tab -->
        <div class="route-tabs" v-if="routeOptions.length > 1">
          <div
            v-for="(r, i) in routeOptions"
            :key="i"
            class="route-tab"
            :class="{ active: selectedRoute === i, best: r.isBest }"
            @click="selectedRoute = i"
          >
            <div class="tab-badges">
              <span class="tab-best" v-if="r.isBest"><i class="fas fa-star"></i> 最优</span>
              <span class="tab-save" v-if="r.saveMin > 0">省{{ r.saveMin }}分钟</span>
            </div>
            <span class="tab-time">{{ r.timeText }}</span>
            <div class="tab-bottom">
              <span class="tab-dist">{{ r.distanceText }}</span>
              <span class="tab-cong" :style="{ color: r.congestion.color }">{{ r.congestion.label }}</span>
            </div>
          </div>
        </div>

        <!-- 推荐理由横幅（仅最优路线显示） -->
        <div class="recommend-banner" v-if="currentRoute && currentRoute.isBest">
          <i class="fas fa-lightbulb"></i>
          <span>{{ currentRoute.recommendReason }}</span>
        </div>

        <!-- 总览数据行 -->
        <div class="overview-row" v-if="currentRoute">
          <div class="ov-chip" v-for="ov in overviewChips" :key="ov.label">
            <i :class="ov.icon" :style="{ color: ov.color }"></i>
            <div class="ov-info">
              <span class="ov-val">{{ ov.value }}</span>
              <span class="ov-lbl">{{ ov.label }}</span>
            </div>
          </div>
        </div>

        <!-- 整体拥堵条 -->
        <div class="gradient-bar-wrap" v-if="currentRoute">
          <div class="bar-label-row">
            <span class="bar-label-text">整体路况</span>
            <span class="bar-label-status" :style="{ color: currentRoute.congestion.color }">
              {{ currentRoute.congestion.label }}
              <span class="bar-pct">{{ Math.round(currentRoute.congestion.pct) }}%</span>
            </span>
          </div>
          <div class="gradient-bar">
            <div class="bar-marker" :style="{ left: clampedPct + '%' }">
              <i class="fas fa-bicycle"></i>
            </div>
          </div>
          <div class="bar-ticks">
            <span>畅通</span><span>缓行</span><span>拥堵</span><span>严重</span>
          </div>
        </div>

        <!-- 路段列表 -->
        <div class="road-list-header">
          <span>路段详情</span>
          <span class="seg-count">共 {{ currentRoute.segments.length }} 段</span>
        </div>
        <div class="road-list">
          <div v-for="(seg, i) in currentRoute.segments" :key="i" class="road-item">
            <div class="seg-left">
              <span class="seg-idx" :style="{ background: seg.color + '20', color: seg.color }">{{ i + 1 }}</span>
              <div class="seg-line" :style="{ background: i < currentRoute.segments.length - 1 ? seg.color + '40' : 'transparent' }"></div>
            </div>
            <div class="seg-body">
              <div class="seg-top-row">
                <div class="seg-name-row">
                  <i :class="seg.icon" class="seg-dir-icon"></i>
                  <span class="road-name">{{ seg.name }}</span>
                </div>
                <span class="road-status-badge" :style="{ background: seg.color + '18', color: seg.color, borderColor: seg.color + '60' }">{{ seg.status }}</span>
              </div>
              <div class="seg-bottom-row">
                <div class="road-mini-bar">
                  <div class="road-mini-fill" :style="{ width: seg.pct + '%', background: seg.color }"></div>
                </div>
                <span class="road-dist">{{ seg.distText }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script>
import eventBus from "@/eventBus.js";
export default {
  props: {
    score:             { type: Number, default: 87 },
    suddenAcceleration:{ type: Number, default: 2  },
    hardBraking:       { type: Number, default: 1  },
    fuelConsumption:   { type: Number, default: 7.2},
    distance:          { type: Number, default: 38.5},
    duration:          { type: Number, default: 72 },
  },
  data() {
    return {
      updateTime: '',
      rawRoutes: [],
      selectedRoute: 0,
    }
  },
  computed: {
    hasRoutes() {
      return this.rawRoutes.length > 0
    },
    routeOptions() {
      if (!this.rawRoutes.length) return []
      const minTime = Math.min(...this.rawRoutes.map(r => r.time))
      const maxTime = Math.max(...this.rawRoutes.map(r => r.time))
      const now = new Date()
      return this.rawRoutes.map((route, i) => {
        const avgSpeed = route.distance / route.time * 3.6
        const pct = this.speedToPct(avgSpeed)
        const congestion = this.pctToLevel(pct)
        const isBest = route.time === minTime
        const saveMin = Math.round((maxTime - route.time) / 60)
        // 预计到达时间
        const arriveDate = new Date(now.getTime() + route.time * 1000)
        const arriveTime = `${arriveDate.getHours().toString().padStart(2,'0')}:${arriveDate.getMinutes().toString().padStart(2,'0')}`
        // 拥堵路段统计
        const segsAll = (route.rides || [])
        const jamSegs = segsAll.filter(r => {
          const d = r.distance || 0; const spd = d / Math.max(r.time || 1, 1) * 3.6
          return this.speedToPct(spd) >= 65
        }).length
        const smoothSegs = segsAll.filter(r => {
          const d = r.distance || 0; const spd = d / Math.max(r.time || 1, 1) * 3.6
          return this.speedToPct(spd) < 30
        }).length
        // 推荐理由
        let recommendReason = ''
        if (isBest) {
          if (jamSegs === 0 && pct < 40) recommendReason = '全程路况畅通，是当前最优骑行路线'
          else if (jamSegs === 0) recommendReason = `无拥堵路段，比其他路线快 ${saveMin > 0 ? saveMin+'分钟' : '最多时间'}`
          else if (jamSegs <= 1) recommendReason = `仅 ${jamSegs} 个拥堵路段，综合耗时最短`
          else recommendReason = `多路线对比后耗时最短，共 ${jamSegs} 段拥堵`
        }
        const segments = segsAll.slice(0, 6).map((ride) => {
          const d = ride.distance || 0
          const spd = d / Math.max(ride.time || 1, 1) * 3.6
          const sp = this.speedToPct(spd)
          const lv = this.pctToLevel(sp)
          const icon = this.getSegIcon(ride.instruction || '')
          return {
            name: this.shortenRoadName(ride.road || ride.instruction || '未知路段'),
            pct: sp,
            status: lv.label,
            color: lv.color,
            icon,
            distText: d >= 1000 ? (d/1000).toFixed(1)+'km' : Math.round(d)+'m',
          }
        })
        return {
          isBest,
          saveMin,
          arriveTime,
          jamSegs,
          smoothSegs,
          distanceText: (route.distance/1000).toFixed(1)+' km',
          timeText: Math.round(route.time/60)+' 分钟',
          avgSpeed: avgSpeed.toFixed(0),
          congestion: { ...congestion, pct },
          recommendReason,
          segments,
        }
      })
    },
    currentRoute() {
      return this.routeOptions[this.selectedRoute] || null
    },
    clampedPct() {
      if (!this.currentRoute) return 0
      return Math.min(93, Math.max(4, this.currentRoute.congestion.pct))
    },
    overviewChips() {
      if (!this.currentRoute) return []
      return [
        { icon: 'fas fa-road',           color: '#4a7fe5', value: this.currentRoute.distanceText,          label: '全程距离' },
        { icon: 'fas fa-clock',          color: '#f39c12', value: this.currentRoute.timeText,              label: '预计用时' },
        { icon: 'fas fa-flag-checkered', color: '#2ecc71', value: this.currentRoute.arriveTime,            label: '到达时间' },
        { icon: 'fas fa-tachometer-alt', color: '#9b59b6', value: this.currentRoute.avgSpeed+' km/h',      label: '平均速度' },
      ]
    },
    drivingScore() {
      return Math.min(Math.max(this.score, 0), 100)
    },
    statsData() {
      return [
        { label:'急加速', shortValue:`${this.suddenAcceleration}次`, icon:'fas fa-rocket',    pillColor:'#e74c3c' },
        { label:'急刹车', shortValue:`${this.hardBraking}次`,        icon:'fas fa-car-crash', pillColor:'#f39c12' },
        { label:'油耗',   shortValue:`${this.fuelConsumption}L`,     icon:'fas fa-gas-pump',  pillColor:'#2ecc71' },
        { label:'里程',   shortValue:`${this.distance}km`,           icon:'fas fa-road',      pillColor:'#3498db' },
      ]
    },
  },
  mounted() {
    this.refreshTime()
    eventBus.on('routes-updated', this.onRoutesUpdated)
  },
  beforeUnmount() {
    eventBus.off('routes-updated', this.onRoutesUpdated)
  },
  methods: {
    onRoutesUpdated(routes) {
      this.rawRoutes = routes
      let bestIdx = 0, minTime = Infinity
      routes.forEach((r, i) => { if (r.time < minTime) { minTime = r.time; bestIdx = i } })
      this.selectedRoute = bestIdx
      this.refreshTime()
    },
    clearRoutes() {
      this.rawRoutes = []
      this.selectedRoute = 0
    },
    speedToPct(kmh) {
      const pct = Math.round((1 - Math.min(kmh, 22) / 22) * 100)
      return Math.max(0, Math.min(100, pct))
    },
    pctToLevel(p) {
      if (p < 30) return { label:'畅通',   color:'#4CAF50' }
      if (p < 50) return { label:'较畅通', color:'#8BC34A' }
      if (p < 65) return { label:'缓行',   color:'#FF9800' }
      if (p < 80) return { label:'拥堵',   color:'#F44336' }
      return               { label:'严重拥堵',color:'#B71C1C' }
    },
    shortenRoadName(name) {
      const clean = name.replace(/请|沿|行驶.*|转入|进入|到达.*/g, '').trim()
      return clean.length > 7 ? clean.slice(0, 7) : clean || '未知路段'
    },
    getSegIcon(instruction) {
      if (/右转|右/.test(instruction)) return 'fas fa-turn-right'
      if (/左转|左/.test(instruction)) return 'fas fa-turn-left'
      if (/直行|沿/.test(instruction)) return 'fas fa-arrow-up'
      if (/到达|目的地/.test(instruction)) return 'fas fa-map-marker-alt'
      if (/掉头/.test(instruction)) return 'fas fa-undo'
      return 'fas fa-arrow-up'
    },
    refreshTime() {
      const now = new Date()
      this.updateTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    },
    getScoreColor(s) {
      if (s >= 90) return '#2ecc71'
      if (s >= 70) return '#f39c12'
      return '#e74c3c'
    },
  },
}
</script>

<style scoped>
/* ── 容器 ── */
.rider-container {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0 24px;
  background: #f0f2f6;
  border-radius: 15px;
  box-sizing: border-box;
}

/* ── 通用卡片 ── */
.card {
  width: 92%;
  background: #fff;
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 14px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
}

/* ── 状态卡（天气 + 评分）── */
.status-card {
  background: linear-gradient(135deg, #4a7fe5, #7aa3f5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}
.weather-icon {
  font-size: 38px;
  opacity: 0.95;
}
.temp {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.weather-desc {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.85;
}
.weather-sub {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 3px;
}

.status-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.score-mini {
  position: relative;
  width: 52px;
  height: 52px;
}
.score-mini-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-num {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}
.score-lbl {
  font-size: 9px;
  opacity: 0.75;
}

.stat-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
  max-width: 130px;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.18);
  border-radius: 20px;
  padding: 3px 8px;
  font-size: 11px;
  white-space: nowrap;
}
.stat-pill i {
  font-size: 10px;
}

/* ── 路况卡 ── */
.traffic-card {
  background: #fff;
  padding: 16px 18px 18px;
}

.traffic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.title-icon {
  font-size: 14px;
  color: #4a7fe5;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1f2e;
}
.update-time {
  font-size: 10px;
  color: #bbb;
  background: #f5f6fa;
  padding: 2px 6px;
  border-radius: 8px;
}
.clear-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: #fff0f0;
  color: #f44336;
  border-radius: 50%;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.clear-btn:active { background: #ffd6d6; }

/* 占位 */
.no-route-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 0 18px;
}
.no-route-icon {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: #f0f4ff;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  color: #4a7fe5;
}
.no-route-text {
  color: #b0b8c8;
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
}

/* 路线 tab */
.route-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.route-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px 8px;
  border-radius: 14px;
  border: 1.5px solid #ebedf5;
  cursor: pointer;
  background: #fafbfd;
  transition: all 0.18s;
  gap: 3px;
}
.route-tab.active {
  border-color: #4a7fe5;
  background: linear-gradient(135deg, #eef3fd, #f5f8ff);
  box-shadow: 0 2px 10px rgba(74,127,229,0.15);
}
.route-tab.active.best {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #edfbf0, #f5fff7);
  box-shadow: 0 2px 10px rgba(76,175,80,0.15);
}
.tab-badges {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 18px;
}
.tab-best {
  font-size: 10px;
  background: linear-gradient(135deg, #4CAF50, #66bb6a);
  color: #fff;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}
.tab-best i { font-size: 8px; margin-right: 2px; }
.tab-save {
  font-size: 10px;
  background: #fff3e0;
  color: #f57c00;
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 600;
}
.tab-time {
  font-size: 16px;
  font-weight: 700;
  color: #1a1f2e;
  line-height: 1.1;
}
.tab-bottom {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tab-dist { font-size: 10px; color: #999; }
.tab-cong { font-size: 10px; font-weight: 600; }

/* 推荐理由横幅 */
.recommend-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(90deg, #f0f8ff, #e8f5e9);
  border-left: 3px solid #4CAF50;
  border-radius: 0 10px 10px 0;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #2e7d32;
}
.recommend-banner i {
  color: #f9a825;
  font-size: 13px;
  flex-shrink: 0;
}

/* 总览数据行 */
.overview-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}
.ov-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f9fc;
  border-radius: 12px;
  padding: 8px 4px 6px;
  gap: 4px;
}
.ov-chip i { font-size: 13px; }
.ov-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.ov-val {
  font-size: 12px;
  font-weight: 700;
  color: #1a1f2e;
  line-height: 1;
}
.ov-lbl {
  font-size: 9px;
  color: #aaa;
  line-height: 1;
}

/* 渐变条 */
.gradient-bar-wrap { margin-bottom: 14px; }
.bar-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.bar-label-text { font-size: 12px; color: #888; }
.bar-label-status { font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
.bar-pct { font-size: 10px; opacity: 0.7; font-weight: 400; }
.gradient-bar {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg,#4CAF50 0%,#8BC34A 25%,#FF9800 55%,#F44336 80%,#B71C1C 100%);
  position: relative;
}
.bar-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.22);
  transition: left 0.6s ease;
  font-size: 9px;
  color: #333;
}
.bar-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 9px;
  color: #ccc;
}

/* 路段列表 */
.road-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.road-list-header span { font-size: 12px; font-weight: 600; color: #888; }
.seg-count { font-size: 11px; color: #bbb; background: #f5f6fa; padding: 1px 7px; border-radius: 8px; }

.road-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.road-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}
.seg-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 22px;
}
.seg-idx {
  width: 22px; height: 22px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.seg-line {
  width: 2px;
  flex: 1;
  min-height: 8px;
  border-radius: 1px;
  margin-top: 3px;
}
.seg-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: 4px;
}
.seg-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.seg-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
}
.seg-dir-icon {
  font-size: 10px;
  color: #4a7fe5;
  flex-shrink: 0;
  width: 12px;
  text-align: center;
}
.road-name {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.road-status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}
.seg-bottom-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.road-mini-bar {
  flex: 1;
  height: 5px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}
.road-mini-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.road-dist {
  font-size: 10px;
  color: #bbb;
  white-space: nowrap;
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}
</style>
