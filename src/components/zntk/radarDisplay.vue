<template>
  <div class="radar-display">
    <!-- 顶栏 -->
    <div class="header">
      <div class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="header-left">
        <div class="radar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#2563EB" stroke-width="1.8"/><circle cx="12" cy="12" r="5" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="2" fill="#2563EB"/><line x1="12" y1="3" x2="12" y2="12" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="title">雷达感知</div>
        <div class="conn-status">
          <span class="status-dot" :class="{ active: isOnline }"></span>
          <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
        </div>
      </div>
      <div class="header-stats">
        <div class="hstat-item">
          <span class="hstat-val">{{ fps }}</span>
          <span class="hstat-label">Hz</span>
        </div>
        <div class="hstat-divider"></div>
        <div class="hstat-item">
          <span class="hstat-val">{{ numPoints }}</span>
          <span class="hstat-label">点云</span>
        </div>
        <div class="hstat-divider"></div>
        <div class="hstat-item">
          <span class="hstat-val">{{ numTracks }}</span>
          <span class="hstat-label">目标</span>
        </div>
        <div class="hstat-divider"></div>
        <div class="hstat-item">
          <span class="hstat-val">{{ frameNumber }}</span>
          <span class="hstat-label">帧号</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Three.js 3D 视图 -->
      <div class="canvas-wrap">
        <canvas ref="threeCanvas"></canvas>

        <!-- 摄像头展开全屏（已移至地图页面） -->

        <!-- 预警浮层（左下角，不遮挡画面） -->
        <div class="canvas-warn-overlay">
          <!-- 有触发：显示各条预警pills -->
          <template v-if="activeWarnCount > 0">
            <template v-for="(mod, key) in warnModules" :key="key">
              <div
                v-if="mod && mod.level !== 'safe'"
                class="cwarn-pill"
                :class="mod.level"
              >
                <svg v-if="key==='fcw'" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 4l8 14H4L12 4z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>
                <svg v-else-if="key==='rcw'" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 20l8-14H4L12 20z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>
                <svg v-else-if="key==='bsd'" width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5"/></svg>
                <svg v-else-if="key==='lcw'" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M12 4v16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                <svg v-else-if="key==='lca'" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 12l6-6 6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else-if="key==='pcw'" width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="3" stroke="currentColor" stroke-width="2.5"/><path d="M5 20c0-4 3.1-7 7-7s7 3 7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>
                <span class="cwarn-name">{{ warnNameMap[key] }}</span>
                <span class="cwarn-data" v-if="mod.dist && mod.dist !== '--'">{{ mod.dist }}m</span>
                <span class="cwarn-data" v-else-if="mod.ttc && mod.ttc !== '--'">TTC {{ mod.ttc }}s</span>
                <span class="cwarn-data" v-else-if="mod.speed && mod.speed !== '--'">{{ mod.speed }}m/s</span>
                <span class="cwarn-data" v-else-if="mod.side">{{ mod.side }}侧</span>
              </div>
            </template>
          </template>
          <!-- 全安全：只显示一个绿点 -->
          <div class="cwarn-safe-dot" v-else>
            <span class="safe-pulse"></span>
            <span>安全</span>
          </div>
        </div>
        <div class="hint">拖拽旋转 &nbsp;·&nbsp; 滚轮缩放 &nbsp;·&nbsp; 右键平移</div>
        <div class="frame-stats">
          <span>帧 #{{ frameNumber }}</span>
          <span>点云 {{ numPoints }}</span>
          <span>目标 {{ numTracks }}</span>
          <span>{{ lastUpdate }}</span>
        </div>

        <!-- 场景一 HUD 浮层 -->
        <transition name="sc1-fade">
          <div class="sc1-hud" v-if="sc1Active">
            <div class="sc1-phase-badge" :class="sc1Warning">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/></svg>
              {{ sc1PhaseLabel || '场景一运行中' }}
            </div>
            <div class="sc1-metrics">
              <span class="sc1-metric"><em>骑手速度</em>{{ sc1RiderSpeed.toFixed(1) }} m/s</span>
              <span class="sc1-divider">|</span>
              <span class="sc1-metric"><em>侧距</em>{{ sc1CarDist.toFixed(1) }} m</span>
            </div>
            <div class="sc1-warn-msg" v-if="sc1WarnMsg" :class="sc1Warning">{{ sc1WarnMsg }}</div>
          </div>
        </transition>

        <!-- 场景二 HUD 浮层 -->
        <transition name="sc1-fade">
          <div class="sc1-hud" v-if="sc2Active">
            <div class="sc1-phase-badge" :class="sc2Warning">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/></svg>
              {{ sc2PhaseLabel || '场景二运行中' }}
            </div>
            <div class="sc1-metrics">
              <span class="sc1-metric"><em>速度</em>{{ sc2RiderSpeed.toFixed(1) }} m/s</span>
              <span class="sc1-divider">|</span>
              <span class="sc1-metric"><em>TTC</em>{{ sc2TTC > 0 && sc2TTC < 99 ? sc2TTC.toFixed(1) + 's' : '--' }}</span>
            </div>
            <div class="sc1-warn-msg" v-if="sc2WarnMsg" :class="sc2Warning">{{ sc2WarnMsg }}</div>
          </div>
        </transition>
      </div>

      <!-- 右侧信息面板（摄像头 / 预警格 / 目标列表 / 底部详情浮层） -->
      <div class="info-panel">

        <!-- ① 摄像头（面板内嵌，双击展开覆盖3D画布） -->
        <div class="panel-section cam-panel">
          <div class="cam-pip" :class="{ active: camActive }" @dblclick="expandCamToMap">
            <video ref="camVideo" autoplay playsinline muted></video>
            <canvas ref="camCanvas"></canvas>
            <div v-if="!camActive" class="cam-pip-placeholder" @click="startCamera">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="#94a3b8" stroke-width="1.8"/><circle cx="12" cy="13" r="3.5" stroke="#94a3b8" stroke-width="1.8"/><path d="M8 6l1.5-2h5L16 6" stroke="#94a3b8" stroke-width="1.5"/></svg>
              <span>点击开启摄像头</span>
            </div>
            <div v-if="modelLoading" class="cam-pip-loading"><span>加载中…</span></div>
            <div class="cam-pip-tags" v-if="camDetections.length">
              <span v-for="d in camDetections" :key="d.class" class="pip-tag">{{ labelCN(d.class) }} {{ (d.score*100).toFixed(0) }}%</span>
            </div>
            <div class="cam-pip-badge" :class="{ active: camActive }">
              <span class="pip-dot"></span>{{ camActive ? '识别中' : '未开启' }}
            </div>
            <!-- 双击提示 -->
            <div class="cam-pip-hint" v-if="camActive">双击覆盖地图</div>
          </div>
        </div>

        <!-- ② 目标列表 -->
        <div class="panel-section panel-track-section">
          <div class="section-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#2563EB" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#2563EB"/></svg>
            周边目标
            <span class="track-count" v-if="tracks.length > 0">{{ tracks.length }}</span>
          </div>
          <div class="alert-banner danger-banner" v-if="tracks.some(t => t.dist < 3)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2" fill="rgba(239,68,68,0.15)" stroke-linejoin="round"/></svg>
            危险！目标 &lt; 3m
          </div>
          <div class="alert-banner warn-banner" v-else-if="tracks.some(t => t.dist < 8)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>
            注意！&lt; 8m
          </div>
          <div class="track-list">
            <div
              v-for="t in tracksSorted"
              :key="t.tid"
              class="track-item"
              :class="[distClass(t.dist), { selected: selectedTid === t.tid }]"
              @click="selectTrack(t.tid)"
            >
              <div class="threat-bar" :class="distClass(t.dist)"></div>
              <div class="track-body">
                <div class="track-top-row">
                  <div class="track-id-badge" :class="distClass(t.dist)">T{{ t.tid }}</div>
                  <div class="track-dist" :class="distClass(t.dist)">{{ t.dist.toFixed(1) }}<span>m</span></div>
                  <div class="track-azimuth-wrap">
                    <svg class="azimuth-arrow" width="12" height="12" viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="6" stroke="#e2e8f0" stroke-width="1" fill="none"/>
                      <line :transform="`rotate(${t.azimuth}, 7, 7)`" x1="7" y1="7" x2="7" y2="2" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span class="azimuth-text">{{ azimuthLabel(t.azimuth) }}</span>
                  </div>
                </div>
                <div class="track-bottom-row">
                  <span class="track-speed-row">{{ t.speed.toFixed(1) }}m/s</span>
                  <div class="track-state-badge" :class="stateColor(t.state)">{{ stateLabel(t.state) }}</div>
                </div>
              </div>
            </div>
            <div v-if="tracks.length === 0" class="no-data">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="3 3"/></svg>
              <span>暂无目标</span>
            </div>
          </div>
        </div>

        <!-- ③ 选中目标详情（浮层，覆盖在面板底部） -->
        <div class="detail-overlay" v-if="selectedTrack" @click.self="selectedTid = null">
          <div class="detail-card">
            <div class="detail-card-head">
              <span class="tid-chip">T{{ selectedTrack.tid }}</span>
              <span class="detail-dist" :class="distClass(selectedTrack.dist)">{{ selectedTrack.dist.toFixed(2) }}m</span>
              <span class="detail-speed">{{ selectedTrack.speed.toFixed(2) }} m/s</span>
              <button class="detail-close" @click="selectedTid = null">✕</button>
            </div>
            <div class="detail-grid">
              <div class="dg-item"><span class="dg-l">X</span><span class="dg-v">{{ selectedTrack.x.toFixed(2) }}</span></div>
              <div class="dg-item"><span class="dg-l">Y</span><span class="dg-v">{{ selectedTrack.y.toFixed(2) }}</span></div>
              <div class="dg-item"><span class="dg-l">方位</span><span class="dg-v blue">{{ selectedTrack.azimuth.toFixed(1) }}°</span></div>
              <div class="dg-item"><span class="dg-l">Vx</span><span class="dg-v">{{ selectedTrack.vx.toFixed(2) }}</span></div>
              <div class="dg-item"><span class="dg-l">Vy</span><span class="dg-v">{{ selectedTrack.vy.toFixed(2) }}</span></div>
              <div class="dg-item">
                <span class="dg-l">状态</span>
                <span class="dg-v" :class="stateColor(selectedTrack.state)">{{ stateLabel(selectedTrack.state) }}</span>
              </div>
              <div class="dg-item dg-wide">
                <span class="dg-l">置信度</span>
                <div class="confidence-bar"><div class="confidence-fill" :style="{ width: (selectedTrack.confidence * 100) + '%' }"></div></div>
                <span class="dg-v">{{ (selectedTrack.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 底栏告警 -->
    <div class="bottom-bar">
      <div class="time-display">{{ currentTime }}</div>
      <div class="alert-pill" :class="alertClass">
        <span class="alert-dot"></span>
        {{ alertMessage }}
      </div>
      <!-- 场景模拟按钮 -->
      <button class="sc1-btn" :class="{ active: sc1Active }" @click="startScenario1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
        {{ sc1Active ? '停止场景一' : '场景一: 并行变道' }}
      </button>
      <button class="sc1-btn" :class="{ active: sc2Active }" @click="startScenario2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
        {{ sc2Active ? '停止场景二' : '场景二: 路口预警' }}
      </button>
      <div class="brand">IWR6843 · mmWave</div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { io } from 'socket.io-client'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils'
import eventBus from '@/eventBus.js'

export default {
  name: 'RadarDisplay',
  data() {
    return {
      socket: null,
      isOnline: false,
      frameNumber: 0,
      fps: 0,
      numPoints: 0,
      numTracks: 0,
      lastUpdate: '',
      currentTime: '',
      tracks: [],
      selectedTid: null,
      // 摄像头识别
      camActive: false,
      modelLoading: false,
      camDetections: [],
      _cocoModel: null,
      _camDetecting: false,
      camExpanded: false,
      // ── 场景一：并行变道预警 ──────────────────────────────────
      sc1Active: false,          // 是否正在运行
      sc1Phase: 0,               // 当前阶段 0~4
      sc1PhaseLabel: '',         // 阶段文字
      sc1RiderSpeed: 0,          // 主角当前速度
      sc1Warning: 'safe',        // 'safe' | 'caution' | 'danger'
      sc1WarnMsg: '',            // 预警提示文字
      sc1CarDist: 0,             // 与并行车横向距离
      // ── 场景二：路口相汇预警 ──────────────────────────────────
      sc2Active: false,
      sc2Phase: 0,
      sc2PhaseLabel: '',
      sc2RiderSpeed: 0,
      sc2Warning: 'safe',
      sc2WarnMsg: '',
      sc2TTC: 0,
    }
  },
  created() {
    this._r = null
    this._s = null
    this._c = null
    this._raf = null
    this._pm = null
    this._tm = {}
    this._mouse = { down: false, right: false, lastX: 0, lastY: 0 }
    this._sph = { theta: 0.4, phi: 1.0, radius: 15 }
    this._pan = { x: 0, y: 0 }
    this._inferring = false
    this._lastDetections = null
    this._lastVW = 0
    this._lastVH = 0
    this._gltfLoader = new GLTFLoader()
    this._renTemplate = null   // rig_people.glb 缓存，克隆复用
    this._renClips = []        // 动画 clips 缓存
    this._mixers = {}          // tid → AnimationMixer
    this._prevT = 0            // renderLoop 上一帧时间戳
  },
  watch: {
    camExpanded(_val) {
      // 已不使用本页展开，保留占位防止 Vue 警告
    }
  },

  computed: {
    tracksSorted() {
      return [...this.tracks].sort((a, b) => a.dist - b.dist)
    },
    selectedTrack() {
      return this.tracks.find(t => t.tid === this.selectedTid) || null
    },
    alertClass() {
      const danger = this.tracks.some(t => t.dist < 3)
      const warn = this.tracks.some(t => t.dist < 8)
      return danger ? 'danger' : warn ? 'warning' : 'safe'
    },
    alertMessage() {
      const danger = this.tracks.filter(t => t.dist < 3)
      const warn = this.tracks.filter(t => t.dist >= 3 && t.dist < 8)
      if (danger.length > 0) return `危险！${danger.length} 个目标 < 3m`
      if (warn.length > 0) return `注意！${warn.length} 个目标 < 8m`
      return '周边安全'
    },

    // ── 各预警模块状态（根据实时轨迹数据计算）──
    warnModules() {
      const t = this.tracks
      const camPerson = this.camActive && this._lastDetections && this._lastDetections.some(d => d.class === 'person')

      // 前方目标：azimuth 在 315°~360° 或 0°~45° 内（正前方）
      const frontTargets = t.filter(tr => {
        const a = tr.azimuth
        return (a < 45 || a > 315)
      })
      // 后方目标：azimuth 在 135°~225° 内
      const rearTargets = t.filter(tr => tr.azimuth > 135 && tr.azimuth < 225)
      // 侧方目标：45°~135° 或 225°~315°
      const sideTargets = t.filter(tr => (tr.azimuth >= 45 && tr.azimuth <= 135) || (tr.azimuth >= 225 && tr.azimuth <= 315))
      // 左侧：225°~315°，右侧：45°~135°
      const leftTargets = t.filter(tr => tr.azimuth >= 225 && tr.azimuth <= 315)
      const rightTargets = t.filter(tr => tr.azimuth >= 45 && tr.azimuth <= 135)

      // TTC = dist / |接近速度|（vy < 0 表示靠近）
      const calcTTC = (tr) => {
        const vClose = -tr.vy  // 靠近为正
        if (vClose <= 0.3) return 99
        return Math.min((tr.dist / vClose).toFixed(1) * 1, 99)
      }

      // 1. 前向碰撞预警 FCW（前方目标 dist<15，TTC<3s）
      const fcwTargets = frontTargets.filter(tr => tr.dist < 15)
      const fcwCrit = fcwTargets.find(tr => calcTTC(tr) < 3)
      const fcwWarn = fcwTargets.find(tr => calcTTC(tr) < 6)
      const fcwLevel = fcwCrit ? 'danger' : fcwWarn ? 'warning' : 'safe'
      const fcwActive = !!(fcwCrit || fcwWarn)

      // 2. 后方来车碰撞预警 RCW（后方目标快速接近）
      const rcwCrit = rearTargets.find(tr => tr.speed > 5 && tr.dist < 10)
      const rcwWarn = rearTargets.find(tr => tr.speed > 2 && tr.dist < 20)
      const rcwLevel = rcwCrit ? 'danger' : rcwWarn ? 'warning' : 'safe'
      const rcwActive = !!(rcwCrit || rcwWarn)

      // 3. 盲区监测 BSD（侧后方高速目标）
      const bsdLeft = leftTargets.find(tr => tr.speed > 1.5 && tr.dist < 20)
      const bsdRight = rightTargets.find(tr => tr.speed > 1.5 && tr.dist < 20)
      const bsdActive = !!(bsdLeft || bsdRight)
      const bsdLevel = bsdActive ? 'warning' : 'safe'
      const bsdSide = bsdLeft && bsdRight ? '双' : bsdLeft ? '左' : bsdRight ? '右' : ''

      // 4. 路口横向来车 LCW（侧方近距离高速目标）
      const lcwCrit = sideTargets.find(tr => tr.dist < 6 && tr.speed > 2)
      const lcwWarn = sideTargets.find(tr => tr.dist < 12 && tr.speed > 1)
      const lcwLevel = lcwCrit ? 'danger' : lcwWarn ? 'warning' : 'safe'

      // 5. 变道预警 LCA（后方 TTC<2.5s）
      const lcaTargets = rearTargets.filter(tr => tr.dist < 30)
      const lcaCrit = lcaTargets.find(tr => calcTTC(tr) < 2.5)
      const lcaWarn = lcaTargets.find(tr => calcTTC(tr) < 4)
      const lcaLevel = lcaCrit ? 'danger' : lcaWarn ? 'warning' : 'safe'

      // 6. 行人碰撞预警 PCW（摄像头识别到人 + 雷达近距离）
      const pcwActive = camPerson && frontTargets.some(tr => tr.dist < 8)
      const pcwLevel = (camPerson && frontTargets.some(tr => tr.dist < 3)) ? 'danger'
        : pcwActive ? 'warning' : 'safe'

      // 7. 跟车过近 TTC_CLOSE（前方 dist<5m）
      const ttcClose = frontTargets.find(tr => tr.dist < 5)
      const ttcDanger = frontTargets.find(tr => tr.dist < 2)
      const ttcLevel = ttcDanger ? 'danger' : ttcClose ? 'warning' : 'safe'

      // 8. 倒车接近 RCTA（后方 0.5~5m，低速）
      const rctaTarget = rearTargets.find(tr => tr.dist < 5 && tr.dist > 0.4)
      const rctaLevel = rctaTarget && rctaTarget.dist < 2 ? 'danger' : rctaTarget ? 'warning' : 'safe'

      // 9. 超车回正 OVT（后方 dist<15m，速度很快接近）
      const ovtTarget = rearTargets.find(tr => tr.speed > 6 && tr.dist < 15)
      const ovtLevel = ovtTarget ? 'danger' : rearTargets.find(tr => tr.speed > 3 && tr.dist < 20) ? 'warning' : 'safe'

      // 10. 前车起步 FVD（前方近目标 speed 由静止变动）
      const fvdTarget = frontTargets.find(tr => tr.dist < 6 && tr.speed > 0.3 && tr.speed < 2)
      const fvdLevel = fvdTarget ? 'warning' : 'safe'

      const levelLabel = (l) => l === 'danger' ? '危险' : l === 'warning' ? '预警' : '正常'
      const nearestFront = frontTargets.reduce((a, b) => (!a || b.dist < a.dist) ? b : a, null)

      return {
        fcw: { level: fcwLevel, active: fcwActive, label: levelLabel(fcwLevel),
          ttc: fcwCrit ? calcTTC(fcwCrit) : fcwWarn ? calcTTC(fcwWarn) : '--',
          dist: nearestFront ? nearestFront.dist.toFixed(1) : '--' },
        rcw: { level: rcwLevel, active: rcwActive, label: levelLabel(rcwLevel),
          speed: rcwCrit ? rcwCrit.speed.toFixed(1) : rcwWarn ? rcwWarn.speed.toFixed(1) : '--' },
        bsd: { level: bsdLevel, active: bsdActive, label: levelLabel(bsdLevel), side: bsdSide },
        lcw: { level: lcwLevel, active: !!(lcwCrit||lcwWarn), label: levelLabel(lcwLevel),
          dist: lcwCrit ? lcwCrit.dist.toFixed(1) : lcwWarn ? lcwWarn.dist.toFixed(1) : '--' },
        lca: { level: lcaLevel, active: !!(lcaCrit||lcaWarn), label: levelLabel(lcaLevel),
          ttc: lcaCrit ? calcTTC(lcaCrit) : lcaWarn ? calcTTC(lcaWarn) : '--' },
        pcw: { level: pcwLevel, active: pcwActive, label: levelLabel(pcwLevel) },
        ttc: { level: ttcLevel, active: !!(ttcClose||ttcDanger), label: levelLabel(ttcLevel),
          dist: ttcDanger ? ttcDanger.dist.toFixed(1) : ttcClose ? ttcClose.dist.toFixed(1) : '--' },
        rcta: { level: rctaLevel, active: !!rctaTarget, label: levelLabel(rctaLevel),
          dist: rctaTarget ? rctaTarget.dist.toFixed(1) : '--' },
        ovt: { level: ovtLevel, active: !!ovtTarget, label: levelLabel(ovtLevel) },
        fvd: { level: fvdLevel, active: !!fvdTarget, label: levelLabel(fvdLevel) }
      }
    },

    activeWarnCount() {
      if (!this.warnModules) return 0
      return Object.values(this.warnModules).filter(m => m.level !== 'safe').length
    },

    warnNameMap() {
      return {
        fcw: '前向碰撞', rcw: '后方来车', bsd: '盲区监测', lcw: '路口横向',
        lca: '变道预警', pcw: '行人预警', ttc: '跟车过近',
        rcta: '倒车接近', ovt: '超车回正', fvd: '前车起步'
      }
    }
  },
  mounted() {
    this.initThree()
    this.initSocket()
    this.updateTime()
    setInterval(this.updateTime, 1000)
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect()
    if (this._raf) cancelAnimationFrame(this._raf)
    if (this._r) this._r.dispose()
    window.removeEventListener('resize', this.onResize)
    this._camDetecting = false
    if (this._detectRaf) cancelAnimationFrame(this._detectRaf)
    if (this._worker) { this._worker.terminate(); this._worker = null }
    const video = this.$refs.camVideo
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop())
    }
  },
  methods: {
    goBack() { this.$emit('reHome') },

    // 双击摄像头 → 覆盖地图页面
    expandCamToMap() {
      const video = this.$refs.camVideo
      const stream = video && video.srcObject
      eventBus.emit('cam-expand-to-map', stream || null)
    },

    // ─── 摄像头 + YOLOv8 Worker 识别 ──────────────────────────────────
    async startCamera() {
      this.modelLoading = true
      try {
        // 启动推理 Worker（模型加载在 worker 线程，不阻塞主线程）
        if (!this._worker) {
          this._worker = new Worker('/detect-worker.js')
          this._worker.onmessage = (e) => {
            const { type, detections } = e.data
            if (type === 'ready') {
              // 模型加载完成，开摄像头
              this._openCamera()
            } else if (type === 'result') {
              const targets = ['person']
              this._lastDetections = detections.filter(d => targets.includes(d.class))
              this._workerBusy = false
            }
          }
          this._worker.postMessage({ type: 'init' })
        } else {
          this._openCamera()
        }
      } catch (e) {
        console.error('摄像头/模型初始化失败', e)
        this.modelLoading = false
      }
    },

    async _openCamera() {
      try {
        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'environment' }
          })
        } catch {
          // 电脑没有后置摄像头时降级为任意摄像头
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
        const video = this.$refs.camVideo
        video.srcObject = stream
        video.onloadedmetadata = () => {
          const c = this.$refs.camCanvas
          c.width = video.videoWidth
          c.height = video.videoHeight
          if (!this._offscreenCanvas) {
            this._offscreenCanvas = document.createElement('canvas')
            this._offscreenCanvas.width = 640
            this._offscreenCanvas.height = 640
            this._offscreenCtx = this._offscreenCanvas.getContext('2d', { willReadFrequently: true })
          }
          this.camActive = true
          this.modelLoading = false
          this._camDetecting = true
          this._lastVW = video.videoWidth
          this._lastVH = video.videoHeight
          this._workerBusy = false
          this._startInferLoop()
          this._detectLoop()
        }
      } catch (e) {
        console.error('摄像头打开失败', e)
        this.modelLoading = false
      }
    },

    // 推理循环：抓帧发给 worker，worker 返回结果后立刻发下一帧
    _startInferLoop() {
      if (!this._camDetecting) return
      const video = this.$refs.camVideo
      if (!video || video.readyState < 2 || this._workerBusy) {
        setTimeout(() => this._startInferLoop(), 16)
        return
      }
      // 在主线程抓像素（必须在主线程，worker 没有 DOM）
      this._offscreenCtx.drawImage(video, 0, 0, 640, 640)
      const imageData = this._offscreenCtx.getImageData(0, 0, 640, 640)
      this._workerBusy = true
      // 用 Transferable 传递，零拷贝
      this._worker.postMessage(
        { type: 'detect', imageData, videoW: video.videoWidth, videoH: video.videoHeight },
        [imageData.data.buffer]
      )
      // worker 结果回来后（onmessage 里 _workerBusy=false），继续发下一帧
      const waitResult = () => {
        if (!this._camDetecting) return
        if (!this._workerBusy) { this._startInferLoop(); return }
        setTimeout(waitResult, 8)
      }
      waitResult()
    },

    // 渲染循环：每帧用最新推理结果画框 + 更新 3D（60fps，不被推理阻塞）
    _detectLoop() {
      if (!this._camDetecting) return
      const video = this.$refs.camVideo
      const canvas = this.$refs.camCanvas
      if (this._lastDetections && this._lastVW && canvas && video) {
        const ctx = canvas.getContext('2d', { willReadFrequently: false })
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this._lastDetections.forEach(d => {
          const [x, y, w, h] = d.bbox
          const color = '#22c55e'
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, w, h)
          ctx.fillStyle = color
          ctx.font = 'bold 11px sans-serif'
          const label = this.labelCN(d.class) + ' ' + (d.score * 100).toFixed(0) + '%'
          ctx.fillRect(x, y - 16, ctx.measureText(label).width + 8, 16)
          ctx.fillStyle = '#fff'
          ctx.fillText(label, x + 4, y - 3)
        })
        this._syncDetectionsToScene(this._lastDetections, this._lastVW, this._lastVH)
        // 同步识别结果到地图覆盖层
        eventBus.emit('cam-detections', {
          detections: this._lastDetections,
          vw: this._lastVW,
          vh: this._lastVH
        })
      }
      this._detectRaf = requestAnimationFrame(() => this._detectLoop())
    },

    labelCN(cls) {
      const map = {
        'dining table': '桌子', 'chair': '椅子', 'couch': '沙发',
        'bed': '床', 'tv': '电视', 'laptop': '笔记本', 'person': '人'
      }
      return map[cls] || cls
    },

    // 根据检测结果在 Three.js 中增删并更新 3D 物体位置
    _syncDetectionsToScene(detections, videoW, videoH) {
      if (!this._s) return
      // 摄像头结果更新后，立即重新刷新雷达轨迹的可见性和位置修正
      // updateTrackMeshes 会读取 this._lastDetections 做融合判断
      if (this.tracks && this.tracks.length > 0) {
        this.updateTrackMeshes(this.tracks)
      } else if (this._detectedPersonGroup) {
        // 无雷达轨迹时，清除残留的摄像头独立人模型
        this._s.remove(this._detectedPersonGroup)
        this._detectedPersonGroup = null
      }
    },

    azimuthLabel(deg) {
      // 将方位角转为 8 方向简称
      const dirs = ['前', '右前', '右', '右后', '后', '左后', '左', '左前']
      return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8]
    },

    distClass(dist) {
      if (dist < 3) return 'danger'
      if (dist < 8) return 'warning'
      return 'safe'
    },

    // ─── Three.js ────────────────────────────────────────────────
    initThree() {
      const canvas = this.$refs.threeCanvas
      const wrap = canvas.parentElement
      const W = wrap.clientWidth
      const H = wrap.clientHeight

      this._r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
      this._r.setSize(W, H)
      this._r.setPixelRatio(window.devicePixelRatio)
      this._r.shadowMap.enabled = true
      this._r.shadowMap.type = THREE.PCFSoftShadowMap
      this._r.setClearColor(0xeef2f7, 1)

      this._s = new THREE.Scene()
      // 天空渐变色背景（模拟参考图的天空）
      this._s.background = new THREE.Color(0xdce8f5)
      this._s.fog = new THREE.Fog(0xdce8f5, 18, 45)

      this._c = new THREE.PerspectiveCamera(50, W / H, 0.1, 200)
      // 俯视角：覆盖完整K型场景（主马路居左，两条支路向右展开）
      this._sph = { theta: 0.3, phi: 0.65, radius: 22 }
      this._pan = { x: 1, y: 0 }
      this.updateCameraPos()

      // ── 灯光 ──
      const ambLight = new THREE.AmbientLight(0xffffff, 1.4)
      this._ambLight = ambLight
      this._s.add(ambLight)
      const sun = new THREE.DirectionalLight(0xfff4e0, 1.2)
      sun.position.set(8, 16, 6)
      sun.castShadow = true
      sun.shadow.mapSize.width = 2048
      sun.shadow.mapSize.height = 2048
      sun.shadow.camera.near = 0.5
      sun.shadow.camera.far = 60
      sun.shadow.camera.left = -20
      sun.shadow.camera.right = 20
      sun.shadow.camera.top = 20
      sun.shadow.camera.bottom = -20
      sun.shadow.bias = -0.001
      this._s.add(sun)
      const fillLight = new THREE.DirectionalLight(0xc8deff, 0.5)
      fillLight.position.set(-5, 5, -8)
      this._s.add(fillLight)


      // ── 移动虚线轨迹（代替道路，模拟骑手前进方向）──
      // 主轨迹：沿 +z 中心线，白色虚线段向前滚动
      // 左/右轨迹：骑手两侧各一条，灰色辅助线
      this._laneLines = []
      const trackDefs = [
        { x: 0,    color: 0x2563eb, opacity: 0.85, width: 0.06, segLen: 1.8, gap: 2.4 }, // 主方向（蓝色）
        { x: -1.8, color: 0x94a3b8, opacity: 0.45, width: 0.04, segLen: 1.2, gap: 2.4 }, // 左辅助
        { x:  1.8, color: 0x94a3b8, opacity: 0.45, width: 0.04, segLen: 1.2, gap: 2.4 }, // 右辅助
      ]
      trackDefs.forEach(def => {
        const segs = []
        for (let z = -60; z < 60; z += (def.segLen + def.gap)) {
          const seg = new THREE.Mesh(
            new THREE.PlaneGeometry(def.width, def.segLen),
            new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: def.opacity, depthWrite: false })
          )
          seg.rotation.x = -Math.PI / 2
          seg.position.set(def.x, 0.005, z)
          this._s.add(seg)
          segs.push(seg)
        }
        this._laneLines.push({ segs, x: def.x, spacing: def.segLen + def.gap })
      })

      // ── 方向箭头（每隔 8m 一个，提示前进方向）──
      this._arrowSegs = []
      for (let z = -56; z < 60; z += 8) {
        // 用两段折线组成 ">" 形箭头
        ;[[-0.22, 0.18], [0.22, 0.18]].forEach(([xOff, zOff]) => {
          const seg = new THREE.Mesh(
            new THREE.PlaneGeometry(0.04, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.3, depthWrite: false })
          )
          seg.rotation.x = -Math.PI / 2
          seg.rotation.z = xOff > 0 ? -0.6 : 0.6
          seg.position.set(xOff * 0.5, 0.006, z + zOff)
          this._s.add(seg)
          this._arrowSegs.push(seg)
        })
      }

      // ── 路口（场景二使用，平时隐藏）─────────────────────────────
      // 路口 Group 在世界空间里 z 轴方向滚动，模拟骑手前进
      this._intersectionGroup = new THREE.Group()
      this._intersectionGroup.visible = false
      this._s.add(this._intersectionGroup)
      const ig = this._intersectionGroup

      // ── 路口场景：主角沿 +z 前进，横穿车沿 +x 方向水平穿越（90° 交叉）──
      // 地面道路由全局地面 + 动态虚线轨迹表示，路口不另建道路平面

      // ── 左侧遮挡围栏：沿主角行进方向（z轴）延伸，挡住横穿车来向视线 ──
      // 围栏在停止线后方（z=-3~-9），主角左侧（x=-2.2），横穿车从围栏左端（x=-10）绕出
      const fenceMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 9), fenceMat)
      fence.position.set(-2.2, 1.1, -5.5)  // z中心=-5.5，占 z=-1~-10，停止线后方不压横穿道
      fence.castShadow = true; fence.receiveShadow = true
      ig.add(fence)
      // 围栏竖杆
      for (let i = 0; i < 9; i++) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 2.4, 0.12),
          new THREE.MeshLambertMaterial({ color: 0x64748b })
        )
        post.position.set(-2.2, 1.2, -1.5 - i * 1.0)
        ig.add(post)
      }

      // ── 骑手模型：加载 scooter.glb ──
      this._gltfLoader.load('/3dmodel/scooter.glb', (gltf) => {
        this._riderGroup = gltf.scene
        this._riderGroup.scale.setScalar(1.0)
        this._riderGroup.position.set(0, 0, 0)
        this._riderGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        this._s.add(this._riderGroup)
        this._buildScanRings(this._riderGroup)
      })

      // ── 预加载 rig_people.glb 模板 ──
      this._gltfLoader.load('/3dmodel/rig_people.glb', (gltf) => {
        this._renTemplate = gltf.scene
        this._renClips = gltf.animations || []
        this._renTemplate.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        console.log('rig_people.glb 加载成功，动画 clips:', this._renClips.map(c => c.name))
        // 替换所有已创建 group 里的占位符
        Object.entries(this._tm).forEach(([tid, { group }]) => {
          const ph = group.children.find(c => c.userData && c.userData.isPlaceholder)
          if (ph) {
            group.remove(ph)
            ph.geometry && ph.geometry.dispose()
            const model = skeletonClone(this._renTemplate)
            model.scale.setScalar(1.5)
            group.add(model)
            group._modelRoot = model
            this._startWalkAnim(Number(tid), model)
          }
        })
      }, undefined, (err) => {
        console.error('rig_people.glb 加载失败', err)
      })

      canvas.addEventListener('mousedown', this.onMouseDown)
      canvas.addEventListener('mousemove', this.onMouseMove)
      canvas.addEventListener('mouseup', this.onMouseUp)
      canvas.addEventListener('wheel', this.onWheel, { passive: true })
      canvas.addEventListener('contextmenu', e => e.preventDefault())
      window.addEventListener('resize', this.onResize)

      this.renderLoop()
    },

    _buildScanRings(parent) {
      // 锥形扩散波：从骑手中心朝前方(+z)发出扇形脉冲
      const NUM_WAVES  = 5
      const MAX_R      = 14
      const HALF_ANGLE = Math.PI / 4   // 半角 45°，共 90°

      this._scanWaves = []
      for (let i = 0; i < NUM_WAVES; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x3b82f6,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
        // 扇形顶点在原点，圆弧朝 -y（rotation.x=-90° 后变成 +z 前方）
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        const SEG = 32
        for (let s = 0; s <= SEG; s++) {
          const a = -HALF_ANGLE + (HALF_ANGLE * 2 * s / SEG)
          shape.lineTo(Math.sin(a), -Math.cos(a))   // -cos → 朝前
        }
        shape.closePath()
        const geo = new THREE.ShapeGeometry(shape)
        const mesh = new THREE.Mesh(geo, mat)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.y = 0.02
        mesh.userData.phase = i / NUM_WAVES
        mesh.userData.maxR  = MAX_R
        parent.add(mesh)
        this._scanWaves.push(mesh)
      }

      // 距离刻度弧线（前方扇区）
      for (const [r, op] of [[3, 0.13], [6, 0.09], [10, 0.05]]) {
        const SEG = 32
        const pts = []
        for (let s = 0; s <= SEG; s++) {
          const a = -HALF_ANGLE + (HALF_ANGLE * 2 * s / SEG)
          pts.push(new THREE.Vector3(Math.sin(a) * r, -Math.cos(a) * r, 0))
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(pts)
        const arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: op }))
        arc.rotation.x = -Math.PI / 2
        arc.position.y = 0.015
        parent.add(arc)
      }
    },

    // 根据当前轨迹更新红色扇形标记
    _updateSectors(_tracks) { /* 已移除扇形标注 */ },
    renderLoop() {
      this._raf = requestAnimationFrame(this.renderLoop)
      const t = performance.now() * 0.001
      const delta = this._prevT ? t - this._prevT : 0.016
      this._prevT = t

      // ── 虚线轨迹 + 箭头滚动（模拟骑手前进感）─────────────────────
      if (this._laneLines) {
        const riderSpeed = this.sc1Active && this._sc1 ? this._sc1.riderSpeed : 4.0
        this._laneLines.forEach(({ segs, spacing }) => {
          segs.forEach(seg => {
            seg.position.z -= riderSpeed * delta
            if (seg.position.z < -60) seg.position.z += 120
          })
        })
        if (this._arrowSegs) {
          this._arrowSegs.forEach(seg => {
            seg.position.z -= riderSpeed * delta
            if (seg.position.z < -60) seg.position.z += 120
          })
        }
      }

      // ── 动态扩散波纹 ──────────────────────────────────────────────
      if (this._scanWaves) {
        const PERIOD = 2.8   // 每圈从出发到消失的总时长（秒）
        this._scanWaves.forEach(wave => {
          const maxR = wave.userData.maxR
          // progress 0→1：加相位错开，modulo 循环
          const progress = ((t / PERIOD + wave.userData.phase) % 1)
          const r = progress * maxR

          // 用 scale 驱动扇形大小（shape 是单位扇形 radius=1）
          wave.scale.set(r, r, 1)

          // 透明度曲线：淡入→保持→淡出
          let alpha
          if (progress < 0.12) {
            alpha = progress / 0.12
          } else if (progress < 0.6) {
            alpha = 1
          } else {
            alpha = 1 - (progress - 0.6) / 0.4
          }
          wave.material.opacity = alpha * (0.45 - progress * 0.28)

          // 颜色：危险时红，默认蓝
          const hasDanger = this.tracks && this.tracks.some(tr => tr.dist < 4)
          const warnColor = this.sc1Warning === 'danger' ? 0xef4444
            : this.sc1Warning === 'caution' ? 0xf97316
            : (hasDanger ? 0xf87171 : 0x3b82f6)
          wave.material.color.setHex(warnColor)
        })
      }

      // 骑手光圈脉冲动画
      if (this._riderGroup) {
        const glow = this._riderGroup.children.find(c => c.userData.isGlow)
        if (glow) { glow.material.opacity = 0.15 + Math.sin(t * 2) * 0.1 }
      }

      // 驱动所有人物行走动画
      for (const mixer of Object.values(this._mixers)) {
        mixer.update(delta)
      }

      // ── 场景一逐帧驱动 ────────────────────────────────────────────
      if (this.sc1Active) this._tickScenario1(delta, t)

      // ── 场景二逐帧驱动 ────────────────────────────────────────────
      if (this.sc2Active) this._tickScenario2(delta)

      this._r.render(this._s, this._c)
    },
    updateCameraPos() {
      const { theta, phi, radius } = this._sph
      this._c.position.set(
        radius * Math.sin(phi) * Math.sin(theta) + this._pan.x,
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      )
      this._c.lookAt(this._pan.x, 0, 0)
    },
    onResize() {
      const wrap = this.$refs.threeCanvas?.parentElement
      if (!wrap) return
      const W = wrap.clientWidth, H = wrap.clientHeight
      this._r.setSize(W, H)
      this._c.aspect = W / H
      this._c.updateProjectionMatrix()
    },
    onMouseDown(e) {
      this._mouse.down = true
      this._mouse.right = e.button === 2
      this._mouse.lastX = e.clientX
      this._mouse.lastY = e.clientY
    },
    onMouseMove(e) {
      if (!this._mouse.down) return
      const dx = e.clientX - this._mouse.lastX
      const dy = e.clientY - this._mouse.lastY
      this._mouse.lastX = e.clientX
      this._mouse.lastY = e.clientY
      if (this._mouse.right) {
        this._pan.x -= dx * 0.02
      } else {
        this._sph.theta -= dx * 0.01
        this._sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this._sph.phi + dy * 0.01))
      }
      this.updateCameraPos()
    },
    onMouseUp() { this._mouse.down = false },
    onWheel(e) {
      this._sph.radius = Math.max(2, Math.min(80, this._sph.radius + e.deltaY * 0.02))
      this.updateCameraPos()
    },

    updatePointCloud(points) {
      if (this._pm) {
        this._s.remove(this._pm)
        this._pm.geometry.dispose()
        this._pm.material.dispose()
        this._pm = null
      }
      if (!points.length) return

      const positions = new Float32Array(points.length * 3)
      const colors = new Float32Array(points.length * 3)
      points.forEach((p, i) => {
        positions[i * 3]     = p.x
        positions[i * 3 + 1] = p.z
        positions[i * 3 + 2] = p.y    // 雷达 y=前方 → Three.js +z
        // 点云颜色：低速=蓝，高速=橙
        const v = Math.min(Math.abs(p.vel) / 5, 1)
        colors[i * 3]     = 0.1 + v * 0.9    // R
        colors[i * 3 + 1] = 0.4 - v * 0.2    // G
        colors[i * 3 + 2] = 0.9 - v * 0.7    // B
      })

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const mat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.75 })
      this._pm = new THREE.Points(geo, mat)
      this._s.add(this._pm)
    },

    updateTrackMeshes(tracks) {
      // 必须摄像头先识别到人，才考虑渲染雷达轨迹
      const camHasPerson = this.camActive
        && this._lastDetections
        && this._lastDetections.some(d => d.class === 'person')

      // 摄像头没有人 → 清除所有轨迹模型，直接返回
      if (!camHasPerson) {
        for (const tid of Object.keys(this._tm)) {
          this._s.remove(this._tm[tid].group)
          if (this._mixers[tid]) { this._mixers[tid].stopAllAction(); delete this._mixers[tid] }
          delete this._tm[tid]
        }
        this._updateSectors([])
        return
      }

      const personDet = this._lastDetections.find(d => d.class === 'person')

      // 删除已消失的轨迹模型
      const newTids = new Set(tracks.map(t => t.tid))
      for (const tid of Object.keys(this._tm)) {
        if (!newTids.has(Number(tid))) {
          this._s.remove(this._tm[tid].group)
          if (this._mixers[tid]) { this._mixers[tid].stopAllAction(); delete this._mixers[tid] }
          delete this._tm[tid]
        }
      }

      tracks.forEach(t => {
        // 人在前方(+z)：雷达 y 正方向 = 电动车前方 = Three.js +z
        // 视觉放大系数：实际1m在场景中显示3m，便于观察
        const VISUAL_SCALE = 3.0
        let px = t.x * VISUAL_SCALE
        let pz = t.y * VISUAL_SCALE

        // 摄像头开启且识别到人时：用摄像头横向角度修正X（更准）
        if (personDet && this._lastVW) {
          const [bx, , bw] = personDet.bbox
          const cx = (bx + bw / 2) / this._lastVW
          const angle = (cx - 0.5) * (Math.PI / 3)
          const dist = Math.sqrt(t.x * t.x + t.y * t.y) * VISUAL_SCALE
          px = dist * Math.sin(angle)
          pz = dist * Math.cos(angle)
        }

        if (this._tm[t.tid]) {
          this._tm[t.tid].group.position.set(px, 0, pz)
          this._tm[t.tid].group.visible = true
        } else {
          const group = this._buildPersonFigure(t)
          group.position.set(px, 0, pz)
          group.visible = true
          this._s.add(group)
          this._tm[t.tid] = { group }
        }

        // 朝向：靠近(vy<0)→面朝电动车(+z方向)，远离(vy>=0)→背对(-z方向)
        const entry = this._tm[t.tid]
        const facingAngle = t.vy < 0 ? Math.PI : 0
        if (entry.group._modelRoot) {
          entry.group._modelRoot.rotation.y = facingAngle
        }

        const color = this.trackColor3d(t)
        if (entry.group._ringMesh) {
          entry.group._ringMesh.material.color.setHex(color)
        }
      })
      this._updateSectors(tracks)
    },

    _buildPersonFigure(t) {
      const group = new THREE.Group()
      const color = this.trackColor3d(t)

      if (this._renTemplate) {
        const model = skeletonClone(this._renTemplate)
        model.scale.setScalar(1.5)
        group.add(model)
        group._modelRoot = model
        this._startWalkAnim(t.tid, model)
      } else {
        // ren.glb 尚未加载，先放占位圆柱；加载完后 initThree 回调统一替换
        const ph = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 1.7, 8),
          new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.7 })
        )
        ph.position.y = 0.85
        ph.userData.isPlaceholder = true
        group.add(ph)
      }

      // 地面圆圈
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.5, 48),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
      )
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.02
      group.add(ring)
      group._ringMesh = ring
      group._colorMeshes = []

      return group
    },

    _startWalkAnim(tid, modelRoot) {
      if (!this._renClips.length) return
      const mixer = new THREE.AnimationMixer(modelRoot)
      // 优先找名含 walk/run 的 clip，否则取第一条
      const clip = this._renClips.find(c => /walk|run/i.test(c.name)) || this._renClips[0]
      const action = mixer.clipAction(clip)
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.play()
      this._mixers[tid] = mixer
    },

    trackColor3d(t) {
      if (t.dist < 3) return 0xef4444   // 红
      if (t.dist < 8) return 0xf97316   // 橙
      return 0x2563eb                    // 蓝
    },

    // ─── Socket.IO ────────────────────────────────────────────────
    initSocket() {
      const URL = 'http://10.194.90.44:5010'
      this.socket = io(URL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        transports: ['websocket', 'polling']
      })
      this.socket.on('connect', () => { this.isOnline = true })
      this.socket.on('disconnect', () => { this.isOnline = false })
      this.socket.on('radar_update', (data) => this.handleFrame(data))
    },

    handleFrame(data) {
      this.frameNumber = data.frameNum || data.frame_number || 0
      this.fps = Math.round(data.fps || 0)
      this.lastUpdate = data.timestamp
        ? new Date(data.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
        : ''
      this.numPoints = data.numDetectedPoints || 0
      this.numTracks = data.numDetectedTracks || 0

      const points = this.parsePointCloud(data.pointCloud || '[]')
      const tracks = this.parseTracks(data.trackData || '[]')
      // 打印原始坐标，确认雷达轴向（看浏览器控制台）
      if (points.length > 0) console.log('[点云首点] x:', points[0].x.toFixed(2), 'y:', points[0].y.toFixed(2), 'z:', points[0].z.toFixed(2))
      if (tracks.length > 0) console.log('[轨迹首条] x:', tracks[0].x.toFixed(2), 'y:', tracks[0].y.toFixed(2), 'dist:', tracks[0].dist.toFixed(2))
      this.tracks = tracks
      this.updatePointCloud(points)
      this.updateTrackMeshes(tracks)

      if (this.selectedTid !== null && !tracks.find(t => t.tid === this.selectedTid)) {
        this.selectedTid = null
      }
    },

    parsePointCloud(str) {
      if (!str || str.trim() === '[]') return []
      try {
        const cleaned = str
          .replace(/\[\s*\[/g, '[[').replace(/\]\s*\]/g, ']]')
          .replace(/\n/g, ' ').replace(/ +/g, ' ')
          .replace(/(-?\d+\.?\d*(?:e[+-]?\d+)?)\s+(-?\d)/g, '$1,$2')
          .replace(/\]\s*\[/g, '],[')
        return JSON.parse(cleaned).map(row => ({
          x: row[0] || 0, y: row[1] || 0, z: row[2] || 0, vel: row[3] || 0, snr: row[4] || 0
        }))
      } catch (e) { console.warn('点云解析失败', e); return [] }
    },

    parseTracks(str) {
      if (!str || str.trim() === '[]') return []
      try {
        const cleaned = str
          .replace(/\[\s*\[/g, '[[').replace(/\]\s*\]/g, ']]')
          .replace(/\n/g, ' ').replace(/ +/g, ' ')
          .replace(/(-?\d+\.?\d*(?:e[+-]?\d+)?)\s+(-?\d)/g, '$1,$2')
          .replace(/\]\s*\[/g, '],[')
        return JSON.parse(cleaned).map(row => {
          const tid = Math.round(row[0] || 0)
          const x = row[1]||0, y = row[2]||0, z = row[3]||0
          const vx = row[4]||0, vy = row[5]||0, vz = row[6]||0
          const ax = row[7]||0, ay = row[8]||0, az = row[9]||0
          const state = Math.round(row[10]||0)
          const confidence = row[11]||0
          const speed = Math.sqrt(vx*vx + vy*vy + vz*vz)
          const dist = Math.sqrt(x*x + y*y + z*z)
          const azimuth = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360
          return { tid, x, y, z, vx, vy, vz, ax, ay, az, state, confidence, speed, dist, azimuth }
        })
      } catch (e) { console.warn('轨迹解析失败', e); return [] }
    },

    selectTrack(tid) { this.selectedTid = this.selectedTid === tid ? null : tid },

    stateLabel(state) {
      return { 0:'点', 1:'新目标', 2:'跟踪中', 3:'消失', 4:'静止', 5:'运动', 6:'存在' }[state] ?? `S${state}`
    },
    stateColor(state) {
      if (state === 2 || state === 5) return 'state-move'
      if (state === 3) return 'state-lost'
      if (state === 1) return 'state-new'
      return 'state-idle'
    },

    // ══════════════════════════════════════════════════════════════
    //  场景一：并行变道预警
    //  时间轴（16s 循环）：
    //  Phase0 [0~5s]   并行追上：并行车从后方(z=-8)追至与主角齐平
    //  Phase1 [5~8s]   并行同行：双车并排，速度相同
    //  Phase2 [8~10s]  紧急变道：并行车横切至主角车道（x:2→-1.5）
    //  Phase3 [10~13s] 主角制动：减速→停止，警告全屏
    //  Phase4 [13~16s] 复位：并行车驶离，主角恢复，场景归零
    // ══════════════════════════════════════════════════════════════

    startScenario1() {
      if (this.sc1Active) { this.stopScenario1(); return }
      this._initScenario1()
      this.sc1Active = true
    },

    stopScenario1() {
      this._destroyScenario1()
      this.sc1Active = false
      this.sc1Phase = 0
      this.sc1Warning = 'safe'
      this.sc1WarnMsg = ''
      this.sc1RiderSpeed = 0
      this.sc1CarDist = 0
      this.sc1PhaseLabel = ''
    },

    _initScenario1() {
      if (!this._s) return
      this._sc1 = {
        clock: 0,

        // 主角状态（不移动骑手模型，而是移动道路/车道线制造运动感）
        riderZ: 0,
        riderSpeed: 0,

        // 并行车 Group
        carGroup: null,
        carZ: -10,
        carX: 2.0,
      }

      // ── 并行车实体 ──
      const carGroup = new THREE.Group()
      carGroup.position.set(2.0, 0, -10)
      carGroup.rotation.y = 0   // 朝 +z 方向行驶

      // 占位方块（scooter.glb 加载完替换）
      const ph = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.9, 1.2),
        new THREE.MeshPhongMaterial({ color: 0xef4444, emissive: 0x550000 })
      )
      ph.position.y = 0.45; ph.castShadow = true; ph.userData.isPlaceholder = true
      carGroup.add(ph)

      // 车底红色光晕
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 48),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
      )
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01
      carGroup.add(glow)
      this._sc1.glowMesh = glow

      this._s.add(carGroup)
      this._sc1.carGroup = carGroup

      // 加载 scooter.glb（电动车）
      this._gltfLoader.load('/3dmodel/scooter.glb', (gltf) => {
        if (!this._sc1 || !this._sc1.carGroup) return
        const m = gltf.scene; m.scale.setScalar(1.0)
        m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        const placeholder = this._sc1.carGroup.children.find(c => c.userData.isPlaceholder)
        if (placeholder) { placeholder.geometry.dispose(); this._sc1.carGroup.remove(placeholder) }
        this._sc1.carGroup.add(m)
      }, undefined, () => {})

      // ── 实时距离标注 Sprite（距离 < 5m 时显示）──
      const dc = document.createElement('canvas'); dc.width = 256; dc.height = 64
      this._sc1._distCanvas = dc
      this._sc1._distCtx = dc.getContext('2d')
      const distTex = new THREE.CanvasTexture(dc)
      const distSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: distTex, transparent: true, opacity: 0, depthTest: false }))
      distSprite.scale.set(3, 0.75, 1)
      this._s.add(distSprite)
      this._sc1.distSprite = distSprite
      this._sc1._distTex = distTex
    },

    _destroyScenario1() {
      if (!this._sc1) return
      if (this._sc1.carGroup)      { this._s.remove(this._sc1.carGroup) }
      if (this._sc1.distSprite)    { this._s.remove(this._sc1.distSprite) }
      // 恢复车道线位置
      if (this._laneLines) {
        this._laneLines.forEach(({ segs, x }) => {
          segs.forEach((seg, i) => { seg.position.z = -60 + i * 4 })
        })
      }
      this._sc1 = null
    },

    _tickScenario1(delta, t) {
      if (!this._sc1 || !this.sc1Active) return
      const sc = this._sc1
      sc.clock += delta

      const T = sc.clock
      const CRUISE = 5.0   // 巡航速度 m/s
      const DECEL  = 8.0   // 制动减速度

      // ── 时间轴（8s 一轮）────────────────────────────────────────
      // [0~2s]  Phase0: 并行车从后方快速追上（z:-8→1.5）
      // [2~4s]  Phase2: 紧急变道超车（x:2→-1.5），主角开始刹车
      // [4~6.5s] Phase3: 完全制动，并行车回正高速驶离
      // [6.5~8s] Phase4: 危险解除，主角恢复
      // [8s+]   循环重置

      if (T < 2.0) {
        // Phase0: 追上
        this.sc1Phase = 0
        this.sc1PhaseLabel = '并行追上'
        this.sc1Warning = 'safe'
        this.sc1WarnMsg = '周边安全'

        const p = T / 2.0
        sc.riderSpeed = CRUISE * Math.min(p * 1.5, 1.0)
        const carZ = -8 + 9.5 * p           // -8 → 1.5
        sc.carGroup.position.set(2.0, 0, carZ)
        sc.carGroup.rotation.y = 0
        sc.glowMesh.material.opacity = 0.2 + 0.15 * p

      } else if (T < 4.0) {
        // Phase2: 紧急变道超车
        this.sc1Phase = 2
        this.sc1PhaseLabel = '紧急变道！'
        this.sc1Warning = 'danger'
        this.sc1WarnMsg = '⚠ 右侧车辆紧急切入！'

        const p = (T - 2.0) / 2.0
        const sm = p * p * (3 - 2 * p)      // smoothstep 0→1
        const carX = 2.0 - 3.5 * sm         // 2.0 → -1.5
        // 变道车身侧倾：前半倾入，后半回正
        const lean = sm < 0.5 ? -sm * 2 * 0.5 : -(1 - (sm - 0.5) * 2) * 0.5
        sc.carGroup.position.set(carX, 0, 1.5 + p * 3)
        sc.carGroup.rotation.y = lean

        sc.riderSpeed = Math.max(0, CRUISE * (1 - sm * 0.7))
        sc.glowMesh.material.color.setHex(0xff2200)
        sc.glowMesh.material.opacity = 0.5 + 0.25 * Math.sin(t * 10)

      } else if (T < 6.5) {
        // Phase3: 完全制动 + 并行车回正高速驶离
        this.sc1Phase = 3
        this.sc1PhaseLabel = '紧急制动'
        this.sc1Warning = 'danger'
        this.sc1WarnMsg = '⚠ 紧急制动！'

        sc.riderSpeed = Math.max(0, sc.riderSpeed - DECEL * delta)

        // 0.3s 内车身回正，然后笔直前驶
        const straightenT = Math.min((T - 4.0) / 0.3, 1.0)
        sc.carGroup.rotation.y = sc.carGroup.rotation.y * (1 - straightenT)
        sc.carGroup.position.z += CRUISE * 2.0 * delta


      } else if (T < 8.0) {
        // Phase4: 危险解除，恢复行驶
        this.sc1Phase = 4
        this.sc1PhaseLabel = '恢复行驶'
        this.sc1Warning = 'safe'
        this.sc1WarnMsg = '危险解除，恢复行驶'

        const p4 = (T - 6.5) / 1.5
        sc.riderSpeed = CRUISE * p4 * 0.8
        sc.carGroup.rotation.y = 0
        sc.carGroup.position.z += CRUISE * 2.0 * delta

        sc.glowMesh.material.color.setHex(0xef4444)
        sc.glowMesh.material.opacity = 0.2

      } else {
        // 循环重置
        sc.clock = 0
        sc.riderSpeed = 0
        sc.carGroup.position.set(2.0, 0, -8)
        sc.carGroup.rotation.y = 0
        sc.glowMesh.material.color.setHex(0xef4444)
        sc.glowMesh.material.opacity = 0.2
      }

      // ── 驱动道路流动（替代主角移动）──
      if (this._laneLines) {
        this._laneLines.forEach(({ segs }) => {
          segs.forEach(seg => {
            seg.position.z -= sc.riderSpeed * delta
            if (seg.position.z < -60) seg.position.z += 120
          })
        })
      }
      // 路过车辆速度也随主角速度同步（场景激活时接管）
      if (this._roamCars) {
        this._roamCars.forEach(({ group, lane }) => {
          const dir = lane.zEnd > lane.zStart ? 1 : -1
          group.position.z += dir * Math.abs(lane.speed) * delta
          const reached = dir > 0 ? group.position.z > lane.zEnd : group.position.z < lane.zEnd
          if (reached) group.position.z = lane.zStart
        })
      }

      // 更新 HUD 数据
      this.sc1RiderSpeed = sc.riderSpeed
      const dx = sc.carGroup.position.x - 0
      const dz = sc.carGroup.position.z - 0
      const realDist = Math.sqrt(dx * dx + dz * dz)
      this.sc1CarDist = realDist

      // ── 实时距离标注（< 5m 才显示，跟随并行车位置）──
      if (sc.distSprite) {
        if (realDist < 5.0) {
          // 更新 canvas 文字
          const dc = sc._distCanvas
          const ctx = sc._distCtx
          ctx.clearRect(0, 0, dc.width, dc.height)
          const danger = realDist < 2.5
          ctx.fillStyle = danger ? 'rgba(239,68,68,0.92)' : 'rgba(249,115,22,0.88)'
          ctx.beginPath()
          ctx.roundRect(4, 4, dc.width - 8, dc.height - 8, 10)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 26px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`距离  ${realDist.toFixed(1)} m`, dc.width / 2, dc.height / 2)
          sc._distTex.needsUpdate = true
          // 跟随并行车，悬浮在车辆上方
          sc.distSprite.position.set(
            sc.carGroup.position.x,
            2.2,
            sc.carGroup.position.z
          )
          sc.distSprite.material.opacity = Math.min(1, (5.0 - realDist) / 1.5)
        } else {
          sc.distSprite.material.opacity = 0
        }
      }

      // 扩散波颜色根据预警等级变化
      if (this._scanWaves) {
        const waveColor = this.sc1Warning === 'danger' ? 0xef4444
          : this.sc1Warning === 'caution' ? 0xf97316
          : 0x3b82f6
        this._scanWaves.forEach(w => w.material.color.setHex(waveColor))
      }
    },

    // ══════════════════════════════════════════════════════════════
    //  场景二：路口相汇预警（18s 循环）
    // ══════════════════════════════════════════════════════════════

    startScenario2() {
      if (this.sc2Active) { this.stopScenario2(); return }
      // 场景互斥：先停场景一
      if (this.sc1Active) this.stopScenario1()
      this._initScenario2()
      this.sc2Active = true
    },

    stopScenario2() {
      this._destroyScenario2()
      this.sc2Active = false
      this.sc2Phase = 0
      this.sc2Warning = 'safe'
      this.sc2WarnMsg = ''
      this.sc2TTC = 0
      this.sc2RiderSpeed = 0
    },

    _initScenario2() {
      if (!this._s) return
      // 降低场景可视度（雾气收紧 + 环境光减弱）
      if (this._s.fog) { this._s.fog.near = 12; this._s.fog.far = 32 }
      if (this._ambLight) this._ambLight.intensity = 1.0
      // 路口初始位置：骑手前方 35m，随骑手前进向近处滚来
      if (this._intersectionGroup) {
        this._intersectionGroup.visible = true
        this._intersectionGroup.position.set(0, 0, 17)
      }

      this._sc2 = {
        clock: 0,
        riderSpeed: 0,
        crossGroup: null,
        crossDist: 0,
        crossVel: 0,    // 横穿车当前速度（有加减速）
        crossPauseT: 0,
      }

      // ── 横穿车：从左侧围栏后（x=-16）沿 +x 方向穿过路口 ──
      // scooter.glb 默认朝 +z，转 +90° 朝 +x
      const CROSS_DIR_X = 1
      const CROSS_DIR_Z = 0
      const CROSS_START_X = -22
      const CROSS_START_Z = 0
      const crossGroup = new THREE.Group()
      crossGroup.position.set(CROSS_START_X, 0, CROSS_START_Z)
      crossGroup.rotation.y = Math.PI / 2   // scooter 默认朝+z，转+90°朝+x
      this._sc2.crossGroup = crossGroup
      this._sc2._dirX = CROSS_DIR_X
      this._sc2._dirZ = CROSS_DIR_Z
      this._sc2._startX = CROSS_START_X
      this._sc2._startZ = CROSS_START_Z
      this._intersectionGroup.add(crossGroup)

      // 占位方块
      const ph = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.9, 1.2),
        new THREE.MeshPhongMaterial({ color: 0xf97316, emissive: 0x552200 })
      )
      ph.position.y = 0.45; ph.castShadow = true; ph.userData.isPlaceholder = true
      crossGroup.add(ph)

      // 车底光晕
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 48),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
      )
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01
      crossGroup.add(glow)
      this._sc2.glowMesh = glow

      // 加载 scooter.glb
      this._gltfLoader.load('/3dmodel/scooter.glb', (gltf) => {
        if (!this._sc2 || !this._sc2.crossGroup) return
        const m = gltf.scene; m.scale.setScalar(1.0)
        m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        const ph2 = this._sc2.crossGroup.children.find(c => c.userData.isPlaceholder)
        if (ph2) { ph2.geometry.dispose(); this._sc2.crossGroup.remove(ph2) }
        this._sc2.crossGroup.add(m)
      }, undefined, () => {})

      // ── TTC / 距离标注 Sprite ──
      const dc = document.createElement('canvas'); dc.width = 300; dc.height = 72
      this._sc2._distCanvas = dc
      this._sc2._distCtx = dc.getContext('2d')
      const distTex = new THREE.CanvasTexture(dc)
      const distSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: distTex, transparent: true, opacity: 0, depthTest: false }))
      distSprite.scale.set(3.5, 0.84, 1)
      this._s.add(distSprite)
      this._sc2.distSprite = distSprite
      this._sc2._distTex = distTex
    },

    _destroyScenario2() {
      if (!this._sc2) return
      // crossGroup 是 _intersectionGroup 的子节点，随 Group 隐藏即可，不需要从 _s 移除
      if (this._sc2.crossGroup && this._intersectionGroup) {
        this._intersectionGroup.remove(this._sc2.crossGroup)
      }
      if (this._sc2.distSprite)  this._s.remove(this._sc2.distSprite)
      if (this._intersectionGroup) {
        this._intersectionGroup.visible = false
        this._intersectionGroup.position.z = 0
      }
      // 恢复正常可视度
      if (this._s.fog) { this._s.fog.near = 18; this._s.fog.far = 45 }
      if (this._ambLight) this._ambLight.intensity = 1.4
      this._sc2 = null
    },

    _tickScenario2(delta) {
      if (!this._sc2 || !this.sc2Active) return
      const sc = this._sc2
      sc.clock += delta
      const T = sc.clock

      const CRUISE    = 4.5   // 主角巡航速度 m/s
      const DECEL     = 9.0   // 制动减速度
      const CROSS_SPD = 8.0   // 横穿车速度 m/s（加快使两车更近时相遇）
      const ig = this._intersectionGroup

      // 横穿车位置更新
      const updateCrossPos = (dist) => {
        sc.crossGroup.position.x = sc._startX + sc._dirX * dist
        sc.crossGroup.position.z = sc._startZ + sc._dirZ * dist
      }

      const CROSS_ACCEL = 4.0   // 加速度 m/s²
      const CROSS_DECEL = 12.0  // 减速度 m/s²
      const STOP_AT  = Math.abs(sc._startX)   // 目标停车点 = 22（路口中心 x=0）
      // 提前开始减速：v²/(2a) = 64/24 ≈ 2.67m，留 0.3m 余量
      const DECEL_AT = STOP_AT - (CROSS_SPD * CROSS_SPD) / (2 * CROSS_DECEL) - 0.3  // ≈ 19.0
      const PAUSE_DUR = 1.5  // 路口中心停留秒数

      // crossPhase: 0=加速行驶  1=减速停车  2=停车暂停  3=暂停后恢复
      if (sc.crossPhase === undefined) sc.crossPhase = 0

      const advanceCross = (shouldMove = true) => {
        if (!shouldMove) {
          sc.crossVel = Math.max(0, sc.crossVel - CROSS_DECEL * delta)
        } else {
          // 状态机推进
          if (sc.crossPhase === 0) {
            // 正常加速行驶
            sc.crossVel = Math.min(CROSS_SPD, sc.crossVel + CROSS_ACCEL * delta)
            if (sc.crossDist >= DECEL_AT) sc.crossPhase = 1
          } else if (sc.crossPhase === 1) {
            // 减速至停车
            sc.crossVel = Math.max(0, sc.crossVel - CROSS_DECEL * delta)
            if (sc.crossVel <= 0) { sc.crossVel = 0; sc.crossPhase = 2 }
          } else if (sc.crossPhase === 2) {
            // 停车暂停计时
            sc.crossVel = 0
            sc.crossPauseT += delta
            if (sc.crossPauseT >= PAUSE_DUR) sc.crossPhase = 3
          } else {
            // 暂停结束，恢复加速离开
            sc.crossVel = Math.min(CROSS_SPD, sc.crossVel + CROSS_ACCEL * delta)
          }
        }
        sc.crossDist += sc.crossVel * delta
        updateCrossPos(sc.crossDist)
      }

      // 主角到路口交点的距离（路口Group.z 即交点世界z，主角在 z=0）
      const juncZ = ig.position.z
      const distToStop = Math.max(0, juncZ - 1.0)    // 停在围栏末端（围栏本地z=-1.0）

      // 横穿车到交叉点的剩余距离（起点距交叉点 ≈ sqrt(13²+5²) ≈ 13.9m）
      const CROSS_TO_JUNC = Math.sqrt(sc._startX ** 2 + sc._startZ ** 2)  // ≈ 13.9
      const crossDistToJunc = Math.max(0, CROSS_TO_JUNC - sc.crossDist)

      // ── 阶段时间轴 ──────────────────────────────────────────────
      // [0~1s]   Phase0: 主角加速，横穿车静止
      // [1~10s]  Phase1: 横穿车启动，TTC 预警
      // [10~13s] Phase2: 主角刹停，横穿车通过
      // [13~17s] Phase3: 主角恢复前进
      // [17~20s] Phase4: 复位
      // [20s+]   循环

      if (T < 8.0) {
        this.sc2Phase = 0; this.sc2PhaseLabel = '正常行驶'
        this.sc2Warning = 'safe'; this.sc2WarnMsg = '前方路口注意'
        sc.riderSpeed = CRUISE * Math.min(T / 1.0, 1.0)
        if (T >= 0) advanceCross()
        else updateCrossPos(0)
        this.sc2TTC = 0
          const ttcRider = sc.riderSpeed > 0.1 ? distToStop / sc.riderSpeed : 99
        const ttcCross = crossDistToJunc / CROSS_SPD
        const ttc = Math.min(ttcRider > 0 ? ttcRider : 99, ttcCross > 0 ? ttcCross : 99)
        this.sc2TTC = Math.max(0, ttc)

        if (ttc < 1.0) {
          this.sc2Phase = 1; this.sc2PhaseLabel = '紧急制动！'
          this.sc2Warning = 'danger'; this.sc2WarnMsg = `⚠ TTC ${ttc.toFixed(1)}s 紧急制动！`
          sc.riderSpeed = Math.max(0, sc.riderSpeed - DECEL * delta)
        } else if (ttc < 3.5) {
          this.sc2Phase = 1; this.sc2PhaseLabel = 'TTC 预警'
          this.sc2Warning = 'caution'; this.sc2WarnMsg = `⚠ 路口预警 TTC ${ttc.toFixed(1)}s`
          sc.riderSpeed = Math.max(0, sc.riderSpeed - DECEL * 0.4 * delta)
        } else {
          this.sc2Phase = 0; this.sc2PhaseLabel = '接近路口'
          this.sc2Warning = 'safe'; this.sc2WarnMsg = '前方路口请减速'
        }
      } else if (T < 7.0) {
        advanceCross(false)   // 横穿车减速停下（等待主角通过）
        this.sc2Phase = 2; this.sc2PhaseLabel = '等待通行'
        this.sc2Warning = 'danger'; this.sc2WarnMsg = '停止线前等待'
        sc.riderSpeed = Math.max(0, sc.riderSpeed - DECEL * delta)
        this.sc2TTC = 0

      } else if (T < 13.0) {
        advanceCross()        // 横穿车恢复行驶
        this.sc2Phase = 3; this.sc2PhaseLabel = '恢复通行'
        this.sc2Warning = 'safe'; this.sc2WarnMsg = '路口已清空，通行'
        sc.riderSpeed = Math.max(0, CRUISE * Math.min((T - 9.0) / 2.5, 1.0))
        this.sc2TTC = 0

      } else if (T < 20.0) {
        this.sc2Phase = 4; this.sc2PhaseLabel = '复位中'
        this.sc2Warning = 'safe'; this.sc2WarnMsg = ''
        sc.riderSpeed = 0

      } else {
        // 循环重置
        sc.clock = 0; sc.riderSpeed = 0; sc.crossDist = 0; sc.crossVel = 0; sc.crossPauseT = 0; sc.crossPhase = 0
        ig.position.z = 17
        updateCrossPos(0)
        sc.glowMesh.material.opacity = 0.3
      }

      // ── 路口 Group + 道路虚线 + 箭头 同步向骑手滚动 ──
      if (sc.riderSpeed > 0) {
        const dz = sc.riderSpeed * delta
        // 路口滚动（从前方 15m 处飞来，接近后不再滚动以防穿过骑手）
        if (ig.position.z > 3.0) ig.position.z -= dz

        this._laneLines && this._laneLines.forEach(({ segs }) => {
          segs.forEach(seg => { seg.position.z -= dz; if (seg.position.z < -60) seg.position.z += 120 })
        })
        this._arrowSegs && this._arrowSegs.forEach(seg => {
          seg.position.z -= dz; if (seg.position.z < -60) seg.position.z += 120
        })
      }

      this.sc2RiderSpeed = sc.riderSpeed

      // ── TTC / 距离 Sprite 更新 ──
      if (sc.distSprite && sc.crossGroup) {
        // 横穿车世界坐标 = 路口Group世界位置 + 本地位置（Group无x/z偏移外的部分）
        const ig2 = this._intersectionGroup
        const wx = sc.crossGroup.position.x   // Group.x 偏移为0，直接是世界x
        const wz = ig2.position.z + sc.crossGroup.position.z  // 路口z + 本地z
        const dist2D = Math.sqrt(wx * wx + wz * wz)
        if (dist2D < 10.0) {
          const dc = sc._distCanvas; const ctx = sc._distCtx
          ctx.clearRect(0, 0, dc.width, dc.height)
          const danger = this.sc2Warning === 'danger'
          ctx.fillStyle = danger ? 'rgba(239,68,68,0.92)' : 'rgba(249,115,22,0.88)'
          ctx.beginPath(); ctx.roundRect(4, 4, dc.width - 8, dc.height - 8, 10); ctx.fill()
          ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          const ttcStr = this.sc2TTC > 0 && this.sc2TTC < 99 ? `  TTC ${this.sc2TTC.toFixed(1)}s` : ''
          ctx.fillText(`距离 ${dist2D.toFixed(1)}m${ttcStr}`, dc.width / 2, dc.height / 2)
          sc._distTex.needsUpdate = true
          sc.distSprite.position.set(wx, 2.5, wz)
          sc.distSprite.material.opacity = Math.min(1, (10.0 - dist2D) / 4.0)
        } else {
          sc.distSprite.material.opacity = 0
        }
      }

      // 扩散波颜色跟场景二预警等级
      if (this._scanWaves) {
        const wc = this.sc2Warning === 'danger' ? 0xef4444
          : this.sc2Warning === 'caution' ? 0xf97316 : 0x3b82f6
        this._scanWaves.forEach(w => w.material.color.setHex(wc))
      }
    },

    updateTime() {
      this.currentTime = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    }
  }
}
</script>

<style scoped lang="less">
// ── 色彩变量 ──────────────────────────
@bg:       #f8fafc;
@bg-panel: #ffffff;
@bg-sec:   #f1f5f9;
@border:   #e2e8f0;
@text:     #1e293b;
@text-2:   #64748b;
@text-3:   #94a3b8;
@blue:     #2563eb;
@orange:   #f97316;
@red:      #ef4444;
@green:    #22c55e;

.radar-display {
  width: 100%; height: 100%;
  background: @bg;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  color: @text;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
}

/* ── 顶栏 ────────────────────────── */
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: @bg-panel;
  border-bottom: 1px solid @border;
  flex-shrink: 0;

  .back-btn {
    width: 34px; height: 34px;
    border-radius: 8px;
    border: 1px solid @border;
    background: @bg;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
    &:hover { border-color: @blue; background: rgba(37,99,235,0.05); }
  }

  .header-left {
    display: flex; align-items: center; gap: 8px;
    flex-shrink: 0;
    .radar-icon {
      width: 30px; height: 30px; border-radius: 8px;
      background: rgba(37,99,235,0.08);
      display: flex; align-items: center; justify-content: center;
    }
    .title {
      font-size: 16px; font-weight: 700;
      color: @text; letter-spacing: 0.5px;
    }
    .conn-status {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: @text-3;
    }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: @text-3;
      &.active {
        background: @green;
        box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
        animation: blink 2s infinite;
      }
    }
    .status-text { font-weight: 500; }
  }

  .header-stats {
    margin-left: auto;
    display: flex; align-items: center;
    background: @bg-sec;
    border: 1px solid @border;
    border-radius: 10px;
    padding: 4px 6px;
    gap: 4px;

    .hstat-item {
      display: flex; flex-direction: column; align-items: center;
      padding: 2px 10px;
      .hstat-val {
        font-size: 15px; font-weight: 700; color: @blue; line-height: 1.2;
      }
      .hstat-label { font-size: 10px; color: @text-3; margin-top: 1px; }
    }

    .hstat-divider {
      width: 1px; height: 28px; background: @border;
    }
  }
}

@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.5} }

/* ── 主区域 ─────────────────────── */
.main-content {
  flex: 1; display: flex; overflow: hidden; min-height: 0;
}

/* Three.js 画布 */
.canvas-wrap {
  flex: 1; position: relative; min-width: 0;
  background: @bg;
  canvas { width: 100% !important; height: 100% !important; display: block; }


  .hint {
    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    font-size: 11px; color: @text-3; pointer-events: none; white-space: nowrap;
    background: rgba(255,255,255,0.8);
    padding: 3px 10px; border-radius: 100px;
    border: 1px solid @border;
  }

  .frame-stats {
    position: absolute; top: 10px; left: 12px;
    display: flex; gap: 6px;
    font-size: 11px; color: @text-2;
    font-family: 'Courier New', monospace;
    pointer-events: none;
    span {
      background: rgba(255,255,255,0.85);
      border: 1px solid @border;
      padding: 2px 7px; border-radius: 5px;
    }
  }

  // ── 预警浮层（左下角，竖向排列pills） ──
  .canvas-warn-overlay {
    position: absolute;
    left: 12px; bottom: 40px;   // 避开 hint 文字
    display: flex; flex-direction: column; gap: 4px;
    pointer-events: none;        // 完全不遮挡鼠标拖拽
    z-index: 6;
    max-width: 200px;
  }

  .cwarn-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 9px 4px 6px;
    border-radius: 100px;
    font-size: 11px; font-weight: 600;
    backdrop-filter: blur(6px);
    white-space: nowrap;

    &.warning {
      background: rgba(249,115,22,0.82);
      color: #fff;
      box-shadow: 0 2px 8px rgba(249,115,22,0.35);
      animation: pillWarn 1.2s ease-in-out infinite;
    }
    &.danger {
      background: rgba(239,68,68,0.88);
      color: #fff;
      box-shadow: 0 2px 10px rgba(239,68,68,0.5);
      animation: pillDanger 0.7s ease-in-out infinite;
    }

    svg { flex-shrink: 0; opacity: 0.9; }
    .cwarn-name { flex: 1; }
    .cwarn-data {
      font-size: 10px; font-weight: 700; opacity: 0.9;
      font-family: 'Courier New', monospace;
    }
  }

  .cwarn-safe-dot {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 600;
    color: #22c55e;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(6px);
    padding: 3px 9px 3px 6px; border-radius: 100px;
    pointer-events: none;

    .safe-pulse {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 0 rgba(34,197,94,0.6);
      animation: safeGlow 2s ease-out infinite;
    }
  }
}

@keyframes pillWarn   { 0%,100%{opacity:1} 50%{opacity:0.75} }
@keyframes pillDanger { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.85; transform:scale(1.02)} }
@keyframes safeGlow   { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.6)} 70%{box-shadow:0 0 0 6px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

/* ── 右侧面板 ────────────────────── */
.info-panel {
  width: 290px;
  display: flex; flex-direction: column; gap: 6px;
  overflow: hidden;          // 禁止滚动
  background: @bg;
  border-left: 1px solid @border;
  padding: 8px;
  flex-shrink: 0;
  position: relative;        // 供详情浮层定位
}

.panel-section {
  background: @bg-panel;
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid @border;
  overflow: hidden;
  flex-shrink: 0;

  .section-title {
    font-size: 11px; font-weight: 600; color: @text;
    margin-bottom: 7px;
    padding-bottom: 6px;
    border-bottom: 1px solid @bg-sec;
    display: flex; align-items: center; gap: 5px;
    flex-shrink: 0;
  }
}

// 预警格占满剩余上半部分
.warn-module-panel {
  flex: 1 1 0;
  display: flex; flex-direction: column;
  min-height: 0;
  .warn-grid { flex: 1; min-height: 0; }
}

// 下半行：摄像头 + 目标列表水平排列
.panel-track-section {
  flex: 0 0 auto;
  max-height: 45%;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* 目标列表 */
.track-count {
  margin-left: auto;
  font-size: 10px; font-weight: 600;
  background: rgba(37,99,235,0.1); color: @blue;
  padding: 1px 5px; border-radius: 100px;
}

.alert-banner {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600;
  padding: 3px 6px; border-radius: 6px; margin-bottom: 5px;
  flex-shrink: 0;
  &.danger-banner {
    background: rgba(239,68,68,0.1); color: @red;
    border: 1px solid rgba(239,68,68,0.25);
    animation: dangerBlink 0.8s ease-in-out infinite;
  }
  &.warn-banner {
    background: rgba(249,115,22,0.1); color: @orange;
    border: 1px solid rgba(249,115,22,0.25);
  }
}

.track-list {
  flex: 1; overflow: hidden;
  display: flex; flex-direction: column; gap: 4px;
  .no-data {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 12px 0; color: @text-3; font-size: 11px;
  }
}

.track-item {
  display: flex; align-items: stretch;
  border-radius: 7px;
  border: 1px solid @border;
  background: @bg;
  cursor: pointer;
  transition: all 0.15s;
  overflow: hidden;
  flex-shrink: 0;

  &:hover { border-color: #93c5fd; background: rgba(37,99,235,0.03); }
  &.selected { border-color: @blue; background: rgba(37,99,235,0.06); }
  &.danger { border-color: rgba(239,68,68,0.4); }
  &.warning { border-color: rgba(249,115,22,0.4); }

  .threat-bar {
    width: 3px; flex-shrink: 0;
    &.safe { background: @blue; }
    &.warning { background: @orange; }
    &.danger { background: @red; animation: dangerBlink 0.6s infinite; }
  }

  .track-body {
    flex: 1; padding: 5px 7px;
    display: flex; flex-direction: column; gap: 3px;
  }

  .track-top-row {
    display: flex; align-items: center; gap: 5px;
    .track-id-badge {
      font-size: 9px; font-weight: 700;
      padding: 1px 5px; border-radius: 4px;
      &.safe    { background: rgba(37,99,235,0.12);  color: @blue; }
      &.warning { background: rgba(249,115,22,0.15); color: @orange; }
      &.danger  { background: rgba(239,68,68,0.15);  color: @red; }
    }
    .track-dist {
      font-size: 14px; font-weight: 800;
      font-family: 'Courier New', monospace;
      &.safe    { color: @blue; }
      &.warning { color: @orange; }
      &.danger  { color: @red; }
      span { font-size: 9px; font-weight: 400; color: @text-3; }
    }
    .track-azimuth-wrap {
      margin-left: auto;
      display: flex; align-items: center; gap: 3px;
      .azimuth-text { font-size: 10px; font-weight: 600; color: @text-2; }
    }
  }

  .track-bottom-row {
    display: flex; align-items: center; gap: 5px;
    .track-speed-row { font-size: 10px; color: @text-2; font-family: 'Courier New', monospace; }
    .track-state-badge {
      font-size: 9px; font-weight: 600;
      padding: 1px 5px; border-radius: 100px; background: @bg-sec;
      &.state-move { color: @green; background: rgba(34,197,94,0.1); }
      &.state-lost { color: @red;   background: rgba(239,68,68,0.1); }
      &.state-new  { color: @blue;  background: rgba(37,99,235,0.1); }
      &.state-idle { color: @text-3; }
    }
  }
}

/* ── 详情浮层（点击目标后叠在面板上） ── */
.detail-overlay {
  position: absolute; inset: 0;
  background: rgba(248,250,252,0.96);
  backdrop-filter: blur(4px);
  border-radius: 10px;
  padding: 10px;
  display: flex; flex-direction: column;
  z-index: 20;
  border: 1px solid @border;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);

  .detail-card-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px; padding-bottom: 8px;
    border-bottom: 1px solid @border;
    .tid-chip {
      font-size: 12px; font-weight: 700;
      background: rgba(37,99,235,0.1); color: @blue;
      padding: 2px 8px; border-radius: 100px;
    }
    .detail-dist {
      font-size: 18px; font-weight: 800;
      font-family: 'Courier New', monospace;
      &.safe    { color: @blue; }
      &.warning { color: @orange; }
      &.danger  { color: @red; }
    }
    .detail-speed { font-size: 11px; color: @text-2; font-family: 'Courier New', monospace; }
    .detail-close {
      margin-left: auto; border: none; background: @bg-sec;
      color: @text-3; cursor: pointer; border-radius: 6px;
      width: 22px; height: 22px; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
      &:hover { background: rgba(239,68,68,0.1); color: @red; }
    }
  }

  .detail-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;

    .dg-item {
      background: @bg-sec; border-radius: 7px;
      padding: 6px 8px;
      display: flex; flex-direction: column; gap: 2px;
      &.dg-wide { grid-column: span 3; flex-direction: row; align-items: center; gap: 8px; }
    }
    .dg-l { font-size: 9px; color: @text-3; font-weight: 600; text-transform: uppercase; }
    .dg-v {
      font-size: 13px; font-weight: 700;
      font-family: 'Courier New', monospace; color: @text;
      &.blue { color: @blue; }
    }
    .dg-wide .dg-v { font-size: 11px; }

    .confidence-bar {
      flex: 1; height: 5px; background: @border; border-radius: 3px; overflow: hidden;
      .confidence-fill { height: 100%; background: @blue; border-radius: 3px; transition: width 0.3s; }
    }
  }
}

/* 状态颜色 */
.state-move { color: @green; }
.state-lost { color: @red; }
.state-new  { color: @blue; }
.state-idle { color: @text-3; }

/* ── 底栏 ─────────────────────────── */
.bottom-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px;
  background: @bg-panel;
  border-top: 1px solid @border;
  flex-shrink: 0;

  .time-display {
    font-size: 14px; font-family: 'Courier New', monospace;
    color: @text-2; font-weight: 600; letter-spacing: 1px;
    min-width: 80px;
  }

  .alert-pill {
    display: flex; align-items: center; gap: 7px;
    padding: 6px 18px; border-radius: 100px;
    font-size: 13px; font-weight: 600;
    transition: all 0.3s;

    .alert-dot {
      width: 7px; height: 7px; border-radius: 50%;
    }

    &.safe {
      background: rgba(34,197,94,0.1);
      color: darken(@green, 8%);
      border: 1px solid rgba(34,197,94,0.3);
      .alert-dot { background: @green; }
    }
    &.warning {
      background: rgba(249,115,22,0.1);
      color: @orange;
      border: 1px solid rgba(249,115,22,0.35);
      animation: warnBlink 1s ease-in-out infinite;
      .alert-dot { background: @orange; }
    }
    &.danger {
      background: rgba(239,68,68,0.1);
      color: @red;
      border: 1px solid rgba(239,68,68,0.4);
      animation: dangerBlink 0.5s ease-in-out infinite;
      .alert-dot { background: @red; }
    }
  }

  .brand { font-size: 11px; color: @text-3; font-family: 'Courier New', monospace; min-width: 100px; text-align: right; }
}

@keyframes warnBlink  { 0%,100%{opacity:1} 50%{opacity:0.75} }
@keyframes dangerBlink{ 0%,100%{opacity:1; box-shadow: 0 0 0 0 rgba(239,68,68,0.3)} 50%{opacity:0.85; box-shadow: 0 0 0 5px rgba(239,68,68,0)} }
@keyframes dangerFrame {
  0%,100% { border-color: @red; box-shadow: 0 0 0 4px rgba(239,68,68,0.25) inset, 0 0 24px 4px rgba(239,68,68,0.35); }
  50%     { border-color: rgba(239,68,68,0.5); box-shadow: 0 0 0 4px rgba(239,68,68,0.08) inset, 0 0 40px 8px rgba(239,68,68,0.15); }
}

/* ── 预警模块总览面板 ─────────────── */
.warn-module-panel {
  .active-count {
    margin-left: auto;
    font-size: 10px; font-weight: 600;
    background: rgba(239,68,68,0.12); color: @red;
    padding: 1px 7px; border-radius: 100px;
    animation: dangerBlink 1s infinite;
  }
}

.warn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  align-content: start;   // 有触发项时顶部对齐，不拉伸
}

// 全安全状态：撑满整个 grid 区域，居中显示
.warn-all-safe {
  grid-column: span 2;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; padding: 20px 0;
  color: @green;

  .safe-title { font-size: 15px; font-weight: 700; color: @green; }
  .safe-sub   { font-size: 11px; color: @text-3; }
  .safe-dots  { display: flex; gap: 5px; margin-top: 4px; }
  .safe-dot   {
    width: 8px; height: 8px; border-radius: 50%;
    background: @green; opacity: 0.5;
    animation: safePulse 1.5s ease-in-out infinite;
    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
    &:nth-child(4) { animation-delay: 0.45s; }
    &:nth-child(5) { animation-delay: 0.6s; }
    &:nth-child(6) { animation-delay: 0.75s; }
    &:nth-child(7) { animation-delay: 0.9s; }
    &:nth-child(8) { animation-delay: 1.05s; }
    &:nth-child(9) { animation-delay: 1.2s; }
    &:nth-child(10){ animation-delay: 1.35s; }
  }
}

@keyframes safePulse { 0%,100%{opacity:0.3; transform:scale(0.8)} 50%{opacity:1; transform:scale(1)} }

.warn-card {
  border-radius: 7px;
  border: 1px solid @border;
  padding: 6px 8px;
  background: @bg;
  transition: all 0.2s;

  &.warning {
    border-color: rgba(249,115,22,0.5);
    background: rgba(249,115,22,0.04);
  }
  &.danger {
    border-color: rgba(239,68,68,0.6);
    background: rgba(239,68,68,0.06);
    animation: cardDangerBlink 0.7s ease-in-out infinite;
  }

  .warn-card-head {
    display: flex; align-items: center; gap: 4px; margin-bottom: 3px;
  }

  .warn-icon {
    display: flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 4px;
    background: @bg-sec; flex-shrink: 0; color: @text-3;
    .warning & { background: rgba(249,115,22,0.12); color: @orange; }
    .danger  & { background: rgba(239,68,68,0.12);  color: @red; }
  }

  .warn-name {
    font-size: 11px; font-weight: 600; color: @text;
    flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .warn-badge {
    font-size: 9px; font-weight: 700;
    padding: 1px 5px; border-radius: 100px; flex-shrink: 0;
    &.safe    { background: rgba(37,99,235,0.1);  color: @blue; }
    &.warning { background: rgba(249,115,22,0.15); color: @orange; }
    &.danger  { background: rgba(239,68,68,0.15);  color: @red; }
  }

  .warn-meta {
    font-size: 10px; color: @text-2;
    display: flex; gap: 5px; flex-wrap: wrap;
    font-family: 'Courier New', monospace;
    &.muted { color: @text-3; }
    .warning & { color: @orange; }
    .danger  & { color: @red; font-weight: 600; }
  }
}

@keyframes cardDangerBlink {
  0%,100% { border-color: rgba(239,68,68,0.6); background: rgba(239,68,68,0.06); }
  50%     { border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.02); }
}

/* ── 摄像头画中画（叠在 Three.js 画布右下角） ── */
.cam-panel {
  flex-shrink: 0;
  padding: 0;          // 去掉 panel-section 内边距，让视频铺满
  overflow: hidden;
  border-radius: 10px;
}

.cam-pip {
  position: relative;  // 面板内普通流，不再 absolute
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #0a0f1a;
  border: none;
  box-shadow: none;

  &.active {
    box-shadow: 0 0 0 1.5px rgba(37,99,235,0.5) inset;
  }

  video {
    display: block; width: 100%; height: auto;
    object-fit: cover;
  }
  canvas {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
  }

  .cam-pip-placeholder {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 5px; height: 150px;
    cursor: pointer;
    color: rgba(255,255,255,0.4); font-size: 11px;
    &:hover { background: rgba(37,99,235,0.08); color: rgba(255,255,255,0.7); }
    svg { opacity: 0.5; }
  }

  .cam-pip-loading {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(10,15,26,0.8);
    font-size: 11px; color: rgba(255,255,255,0.6);
  }

  .cam-pip-badge {
    position: absolute; top: 6px; left: 7px;
    display: flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 600;
    background: rgba(0,0,0,0.55);
    color: rgba(255,255,255,0.6);
    padding: 2px 7px; border-radius: 100px;
    backdrop-filter: blur(4px);
    .pip-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(255,255,255,0.4);
    }
    &.active {
      color: #4ade80;
      .pip-dot { background: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.3); animation: blink 2s infinite; }
    }
  }

  .cam-pip-tags {
    position: absolute; bottom: 0; left: 0; right: 0;
    display: flex; flex-wrap: wrap; gap: 3px;
    padding: 4px 5px;
    background: linear-gradient(transparent, rgba(0,0,0,0.6));
    .pip-tag {
      font-size: 9px; font-weight: 700;
      background: rgba(249,115,22,0.85); color: #fff;
      padding: 1px 6px; border-radius: 100px;
    }
  }

  .cam-pip-hint {
    position: absolute; bottom: 6px; right: 8px;
    font-size: 9px; color: rgba(255,255,255,0.45);
    pointer-events: none;
  }
}

/* ── 摄像头全屏覆盖层（双击展开，覆盖3D画布） ── */
.cam-fullscreen {
  position: absolute; inset: 0;
  z-index: 20;
  background: #000;
  cursor: pointer;

  video {
    width: 100%; height: 100%;
    object-fit: contain;
    display: block;
  }

  .cam-fs-badge {
    position: absolute; top: 10px; left: 12px;
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    background: rgba(0,0,0,0.55);
    color: rgba(255,255,255,0.6);
    padding: 3px 10px; border-radius: 100px;
    backdrop-filter: blur(4px);
    .pip-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,0.4);
    }
    &.active {
      color: #4ade80;
      .pip-dot { background: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.3); animation: blink 2s infinite; }
    }
  }

  .cam-fs-tags {
    position: absolute; bottom: 0; left: 0; right: 0;
    display: flex; flex-wrap: wrap; gap: 5px;
    padding: 12px 14px;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    .pip-tag {
      font-size: 12px; font-weight: 700;
      background: rgba(249,115,22,0.9); color: #fff;
      padding: 3px 10px; border-radius: 100px;
    }
  }

  .cam-fs-close {
    position: absolute; top: 10px; right: 12px;
    width: 28px; height: 28px;
    border: none; border-radius: 50%;
    background: rgba(0,0,0,0.5);
    color: #fff; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
    transition: background 0.15s;
    &:hover { background: rgba(239,68,68,0.7); }
  }

  .cam-fs-hint {
    position: absolute; bottom: 10px; right: 14px;
    font-size: 10px; color: rgba(255,255,255,0.35);
    pointer-events: none;
  }
}

/* ── 旧摄像头样式（已不再使用，保留兼容） ── */
.cam-wrap { display: none; }
.detection-tags { display: none; }
.cam-hint { display: none; }

/* ── 场景一：按钮 + HUD ───────────────────────────────────────── */
.sc1-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #2563eb;
  background: rgba(37,99,235,0.08);
  color: #2563eb;
  font-size: 11px; font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
  &:hover { background: rgba(37,99,235,0.15); }
  &.active {
    background: rgba(239,68,68,0.12);
    border-color: #ef4444;
    color: #ef4444;
  }
}

.sc1-hud {
  position: absolute;
  top: 12px; left: 50%;
  transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  pointer-events: none;
  z-index: 20;

  .sc1-phase-badge {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(37,99,235,0.85);
    color: #fff;
    font-size: 11px; font-weight: 700;
    backdrop-filter: blur(6px);
    transition: background 0.3s;
    &.caution { background: rgba(249,115,22,0.85); }
    &.danger  { background: rgba(239,68,68,0.85); animation: sc1-flash 0.5s infinite alternate; }
  }

  .sc1-metrics {
    display: flex; align-items: center; gap: 8px;
    padding: 3px 10px;
    border-radius: 12px;
    background: rgba(0,0,0,0.45);
    color: rgba(255,255,255,0.85);
    font-size: 10px;
    backdrop-filter: blur(4px);

    em { font-style: normal; color: rgba(255,255,255,0.5); margin-right: 3px; }
  }
  .sc1-divider { color: rgba(255,255,255,0.3); }

  .sc1-warn-msg {
    padding: 3px 10px;
    border-radius: 12px;
    background: rgba(249,115,22,0.8);
    color: #fff;
    font-size: 10px; font-weight: 600;
    backdrop-filter: blur(4px);
    &.danger { background: rgba(239,68,68,0.9); }
  }
}

.sc1-fade-enter-active, .sc1-fade-leave-active { transition: opacity 0.3s; }
.sc1-fade-enter-from, .sc1-fade-leave-to { opacity: 0; }

@keyframes sc1-flash {
  from { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  to   { box-shadow: 0 0 0 6px rgba(239,68,68,0.35); }
}
</style>
