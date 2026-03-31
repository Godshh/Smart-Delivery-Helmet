<template>
  <div class="radar-display">
    <!-- 顶栏 -->
    <div class="header">
      <div class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="header-center">
        <div class="helmet-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3C7 3 3 7.5 3 12v3a2 2 0 002 2h14a2 2 0 002-2v-3c0-4.5-4-9-9-9z" stroke="#2563EB" stroke-width="1.8" fill="rgba(37,99,235,0.1)"/><path d="M5 15h14" stroke="#2563EB" stroke-width="1.5"/></svg>
        </div>
        <div class="title">头盔雷达 · 环境感知</div>
      </div>
      <div class="status">
        <span class="status-dot" :class="{ active: isOnline }"></span>
        <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
        <span class="fps-badge">{{ fps }} Hz</span>
      </div>
    </div>

    <div class="main-content">
      <!-- Three.js 3D 视图 -->
      <div class="canvas-wrap">
        <canvas ref="threeCanvas"></canvas>
        <div class="hint">拖拽旋转 &nbsp;·&nbsp; 滚轮缩放 &nbsp;·&nbsp; 右键平移</div>
        <div class="frame-stats">
          <span>帧 #{{ frameNumber }}</span>
          <span>点云 {{ numPoints }}</span>
          <span>目标 {{ numTracks }}</span>
          <span>{{ lastUpdate }}</span>
        </div>
      </div>

      <!-- 右侧信息面板 -->
      <div class="info-panel">

        <!-- 摄像头 + 实时识别 -->
        <div class="panel-section cam-section">
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#2563EB" stroke-width="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/></svg>
            摄像头识别
            <span class="cam-status" :class="{ active: camActive }">{{ camActive ? '识别中' : '未开启' }}</span>
          </div>
          <div class="cam-wrap">
            <video ref="camVideo" autoplay playsinline muted></video>
            <canvas ref="camCanvas"></canvas>
            <div v-if="!camActive" class="cam-placeholder" @click="startCamera">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="#94a3b8" stroke-width="1.8"/><circle cx="12" cy="13" r="3.5" stroke="#94a3b8" stroke-width="1.8"/><path d="M8 6l1.5-2h5L16 6" stroke="#94a3b8" stroke-width="1.5"/></svg>
              <span>点击开启摄像头</span>
            </div>
            <div v-if="modelLoading" class="cam-loading">
              <span>加载模型中…</span>
            </div>
          </div>
          <div class="detection-tags" v-if="camDetections.length">
            <span v-for="d in camDetections" :key="d.class" class="det-tag">{{ labelCN(d.class) }} {{ (d.score*100).toFixed(0) }}%</span>
          </div>
          <div v-if="camActive && camDetections.length === 0" class="cam-hint">未检测到桌椅</div>
        </div>

        <!-- 目标列表 -->
        <div class="panel-section">
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#2563EB" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#2563EB"/></svg>
            周边目标
          </div>
          <div class="track-list">
            <div
              v-for="t in tracks"
              :key="t.tid"
              class="track-item"
              :class="[distClass(t.dist), { selected: selectedTid === t.tid }]"
              @click="selectTrack(t.tid)"
            >
              <div class="track-left">
                <div class="track-badge" :class="distClass(t.dist)">{{ t.tid }}</div>
                <div class="track-coords">
                  <span>{{ t.dist.toFixed(1) }}m</span>
                  <span>{{ t.azimuth.toFixed(0) }}°</span>
                </div>
              </div>
              <div class="track-right">
                <div class="track-speed">{{ t.speed.toFixed(1) }}<span>m/s</span></div>
                <div class="track-state" :class="stateColor(t.state)">{{ stateLabel(t.state) }}</div>
              </div>
            </div>
            <div v-if="tracks.length === 0" class="no-data">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="3 3"/></svg>
              <span>暂无探测目标</span>
            </div>
          </div>
        </div>

        <!-- 选中目标详情 -->
        <div class="panel-section detail-section" v-if="selectedTrack">
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#2563EB" stroke-width="2"/><path d="M8 12h8M12 8v8" stroke="#2563EB" stroke-width="2"/></svg>
            目标详情 &nbsp;<span class="tid-chip">ID {{ selectedTrack.tid }}</span>
          </div>

          <div class="detail-cols">
            <div class="detail-col">
              <div class="detail-group-label">位置 (m)</div>
              <div class="detail-row"><span>X</span><span class="val">{{ selectedTrack.x.toFixed(3) }}</span></div>
              <div class="detail-row"><span>Y</span><span class="val">{{ selectedTrack.y.toFixed(3) }}</span></div>
              <div class="detail-row"><span>Z</span><span class="val">{{ selectedTrack.z.toFixed(3) }}</span></div>
              <div class="detail-row accent"><span>距离</span><span class="val blue">{{ selectedTrack.dist.toFixed(2) }}m</span></div>
              <div class="detail-row accent"><span>方位</span><span class="val blue">{{ selectedTrack.azimuth.toFixed(1) }}°</span></div>
            </div>
            <div class="detail-col">
              <div class="detail-group-label">速度 (m/s)</div>
              <div class="detail-row"><span>Vx</span><span class="val">{{ selectedTrack.vx.toFixed(3) }}</span></div>
              <div class="detail-row"><span>Vy</span><span class="val">{{ selectedTrack.vy.toFixed(3) }}</span></div>
              <div class="detail-row"><span>Vz</span><span class="val">{{ selectedTrack.vz.toFixed(3) }}</span></div>
              <div class="detail-row accent"><span>|V|</span><span class="val blue">{{ selectedTrack.speed.toFixed(3) }}</span></div>
              <div class="detail-group-label" style="margin-top:8px">加速度 (m/s²)</div>
              <div class="detail-row"><span>Ax</span><span class="val">{{ selectedTrack.ax.toFixed(3) }}</span></div>
              <div class="detail-row"><span>Ay</span><span class="val">{{ selectedTrack.ay.toFixed(3) }}</span></div>
              <div class="detail-row"><span>Az</span><span class="val">{{ selectedTrack.az.toFixed(3) }}</span></div>
            </div>
          </div>

          <div class="detail-footer">
            <div class="footer-item">
              <span class="footer-label">运动状态</span>
              <span class="footer-val" :class="stateColor(selectedTrack.state)">{{ stateLabel(selectedTrack.state) }}</span>
            </div>
            <div class="footer-item">
              <span class="footer-label">置信度</span>
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: (selectedTrack.confidence * 100) + '%' }"></div>
              </div>
              <span class="footer-val">{{ (selectedTrack.confidence * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="panel-section">
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" stroke="#2563EB" stroke-width="2"/><path d="M8 10h8M8 14h5" stroke="#2563EB" stroke-width="1.5"/></svg>
            系统状态
          </div>
          <div class="sys-grid">
            <div class="sys-item">
              <div class="sys-val">{{ fps }}</div>
              <div class="sys-label">Hz</div>
            </div>
            <div class="sys-item">
              <div class="sys-val">{{ numPoints }}</div>
              <div class="sys-label">点云</div>
            </div>
            <div class="sys-item">
              <div class="sys-val">{{ numTracks }}</div>
              <div class="sys-label">目标</div>
            </div>
            <div class="sys-item">
              <div class="sys-val">{{ frameNumber }}</div>
              <div class="sys-label">帧号</div>
            </div>
          </div>
          <div class="update-time">更新于 {{ lastUpdate }}</div>
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
      <div class="brand">IWR6843 · mmWave</div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { io } from 'socket.io-client'

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
      _camDetecting: false
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
  },
  computed: {
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
              const targets = ['dining table', 'laptop', 'person']
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'environment' }
        })
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
          const color = d.class === 'dining table' ? '#f97316' : d.class === 'person' ? '#22c55e' : '#0ea5e9'
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

      // 将 bbox 中心 + 面积 转换为雷达坐标
      // x: 画面左右 → Three.js X（左负右正）
      // z: 目标面积越大越近（正前方为 -z）
      const bboxToXZ = (bbox, defaultDist) => {
        const [bx, by, bw, bh] = bbox
        const cx = (bx + bw / 2) / videoW   // 0~1，0.5为正中
        const area = (bw * bh) / (videoW * videoH)  // 面积占比 0~1
        // 左右：以电瓶车为原点，最大偏移±10m
        const x = (cx - 0.5) * 20
        // 距离：面积越大越近，面积0.5以上视为1m，面积0.01以下视为12m
        const dist = Math.max(1, Math.min(12, defaultDist / Math.sqrt(Math.max(area, 0.005) / 0.01)))
        const z = -dist  // -z 为前方
        return { x, z }
      }

      const LERP = 0.35  // 平滑插值系数，越大响应越快

      // ── 桌子 ──
      const tableDet = detections.find(d => d.class === 'dining table')
      if (tableDet) {
        if (!this._tableGroup) {
          this._tableGroup = this._buildTable()
          const pos = bboxToXZ(tableDet.bbox, 5)
          this._tableGroup.position.set(pos.x, 0, pos.z)
          this._s.add(this._tableGroup)
        } else {
          const pos = bboxToXZ(tableDet.bbox, 5)
          this._tableGroup.position.x += (pos.x - this._tableGroup.position.x) * LERP
          this._tableGroup.position.z += (pos.z - this._tableGroup.position.z) * LERP
        }
      } else if (this._tableGroup) {
        this._s.remove(this._tableGroup)
        this._tableGroup = null
      }

      // ── 笔记本 ──
      const laptopDet = detections.find(d => d.class === 'laptop')
      if (laptopDet) {
        if (!this._laptopGroup) {
          this._laptopGroup = this._buildLaptop()
          const pos = bboxToXZ(laptopDet.bbox, 4)
          this._laptopGroup.position.set(pos.x, 0, pos.z)
          this._s.add(this._laptopGroup)
        } else {
          const pos = bboxToXZ(laptopDet.bbox, 4)
          this._laptopGroup.position.x += (pos.x - this._laptopGroup.position.x) * LERP
          this._laptopGroup.position.z += (pos.z - this._laptopGroup.position.z) * LERP
        }
      } else if (this._laptopGroup) {
        this._s.remove(this._laptopGroup)
        this._laptopGroup = null
      }

      // ── 摄像头识别到的人 ──
      const personDet = detections.find(d => d.class === 'person')
      if (personDet) {
        if (!this._detectedPersonGroup) {
          this._detectedPersonGroup = this._buildDetectedPerson()
          const pos = bboxToXZ(personDet.bbox, 6)
          this._detectedPersonGroup.position.set(pos.x, 0, pos.z)
          this._s.add(this._detectedPersonGroup)
        } else {
          const pos = bboxToXZ(personDet.bbox, 6)
          this._detectedPersonGroup.position.x += (pos.x - this._detectedPersonGroup.position.x) * LERP
          this._detectedPersonGroup.position.z += (pos.z - this._detectedPersonGroup.position.z) * LERP
        }
      } else if (this._detectedPersonGroup) {
        this._s.remove(this._detectedPersonGroup)
        this._detectedPersonGroup = null
      }
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
      this._s.add(new THREE.AmbientLight(0xffffff, 1.4))
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

      // ── 地面（大范围白色平面） ──
      const groundGeo = new THREE.PlaneGeometry(120, 120)
      const groundMat = new THREE.MeshLambertMaterial({ color: 0xe8edf3 })
      const ground = new THREE.Mesh(groundGeo, groundMat)
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.01
      ground.receiveShadow = true
      this._s.add(ground)

      // ── 骑手模型：场景中心 ──
      this._riderGroup = this._buildRider()
      this._riderGroup.position.set(0, 0, 0)
      this._s.add(this._riderGroup)

      // ── 雷达扫描光环挂载到骑手身上 ──
      this._buildScanRings(this._riderGroup)

      canvas.addEventListener('mousedown', this.onMouseDown)
      canvas.addEventListener('mousemove', this.onMouseMove)
      canvas.addEventListener('mouseup', this.onMouseUp)
      canvas.addEventListener('wheel', this.onWheel, { passive: true })
      canvas.addEventListener('contextmenu', e => e.preventDefault())
      window.addEventListener('resize', this.onResize)

      this.renderLoop()
    },

    // 3D 桌子模型（识别到桌子时动态加入场景）
    _buildTable() {
      const group = new THREE.Group()
      const woodMat = new THREE.MeshPhongMaterial({ color: 0xb45309, shininess: 30 })
      const legMat  = new THREE.MeshPhongMaterial({ color: 0x92400e, shininess: 20 })

      // 桌面
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), woodMat)
      top.position.y = 0.8
      top.castShadow = true
      top.receiveShadow = true
      group.add(top)

      // 四条桌腿
      for (const [lx, lz] of [[-0.7, -0.38], [0.7, -0.38], [-0.7, 0.38], [0.7, 0.38]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.76, 0.07), legMat)
        leg.position.set(lx, 0.38, lz)
        leg.castShadow = true
        group.add(leg)
      }

      // 桌底横撑
      const crossMat = new THREE.MeshPhongMaterial({ color: 0x78350f })
      const brace1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), crossMat)
      brace1.position.set(0, 0.18, -0.38)
      group.add(brace1)
      const brace2 = brace1.clone()
      brace2.position.z = 0.38
      group.add(brace2)

      // 橙色发光圆圈（表示视觉识别）
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.95, 1.1, 48),
        new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      )
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.01
      group.add(ring)

      return group
    },

    _buildLaptop() {
      const group = new THREE.Group()
      const bodyMat   = new THREE.MeshPhongMaterial({ color: 0x94a3b8, shininess: 80 })
      const screenMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, shininess: 40 })
      const glowMat   = new THREE.MeshPhongMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.6 })

      // 底座（键盘部分）
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.48), bodyMat)
      base.position.y = 0.02
      base.castShadow = true
      group.add(base)

      // 屏幕（稍微向后倾斜约110°）
      const screenPanel = new THREE.Group()
      screenPanel.position.set(0, 0.02, -0.24)
      screenPanel.rotation.x = -Math.PI * 0.72
      const screenBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.43, 0.03), bodyMat)
      screenBack.position.z = 0.015
      screenPanel.add(screenBack)
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.37, 0.01), screenMat)
      screen.position.set(0, 0, 0.035)
      screenPanel.add(screen)
      // 屏幕发光效果（蓝色横条）
      for (let i = 0; i < 3; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.005), glowMat)
        bar.position.set(0, -0.1 + i * 0.1, 0.041)
        screenPanel.add(bar)
      }
      group.add(screenPanel)

      // 蓝色发光圆圈（识别标识）
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.58, 48),
        new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      )
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.01
      group.add(ring)

      return group
    },

    _buildDetectedPerson() {
      const group = new THREE.Group()
      const skinMat   = new THREE.MeshPhongMaterial({ color: 0xfcd5b0, shininess: 10 })
      const clothMat  = new THREE.MeshPhongMaterial({ color: 0x16a34a, shininess: 20 })  // 绿色衣服区分雷达人形
      const pantsMat  = new THREE.MeshPhongMaterial({ color: 0x1e3a5f, shininess: 10 })

      // 头
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skinMat)
      head.position.y = 1.72
      head.castShadow = true
      group.add(head)

      // 颈
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8), skinMat)
      neck.position.y = 1.58
      group.add(neck)

      // 躯干
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.16), clothMat)
      torso.position.y = 1.28
      torso.castShadow = true
      group.add(torso)

      // 胯部
      const hip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.14), pantsMat)
      hip.position.y = 1.0
      group.add(hip)

      // 手臂
      for (const sx of [-0.22, 0.22]) {
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.038, 0.3, 8), clothMat)
        upper.position.set(sx, 1.18, 0)
        upper.rotation.z = sx < 0 ? -0.25 : 0.25
        group.add(upper)
        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.26, 8), skinMat)
        fore.position.set(sx * 1.12, 0.9, 0.04)
        fore.rotation.z = sx < 0 ? -0.12 : 0.12
        fore.rotation.x = 0.25
        group.add(fore)
      }

      // 腿
      for (const [sx, rz] of [[-0.08, 0.05], [0.08, -0.05]]) {
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8), pantsMat)
        thigh.position.set(sx, 0.74, 0)
        thigh.rotation.z = rz
        thigh.castShadow = true
        group.add(thigh)
        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.38, 8), pantsMat)
        shin.position.set(sx, 0.34, 0.04)
        group.add(shin)
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), new THREE.MeshPhongMaterial({ color: 0x1c1c1c }))
        foot.position.set(sx, 0.12, 0.06)
        group.add(foot)
      }

      // 绿色发光圆圈（识别标识）
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 48),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      )
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.01
      group.add(ring)

      return group
    },

    _buildRider() {
      const group = new THREE.Group()

      const bodyMat  = new THREE.MeshPhongMaterial({ color: 0x334155 })        // 深灰车身
      const helmetMat = new THREE.MeshPhongMaterial({ color: 0x2563eb, shininess: 80 })  // 蓝头盔
      const wheelMat  = new THREE.MeshPhongMaterial({ color: 0x1e293b })
      const suitMat   = new THREE.MeshPhongMaterial({ color: 0x475569 })

      // 车轮（前后）
      const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 18)
      const frontWheel = new THREE.Mesh(wheelGeo, wheelMat)
      frontWheel.rotation.z = Math.PI / 2
      frontWheel.position.set(0, 0.22, -0.42)
      group.add(frontWheel)

      const rearWheel = frontWheel.clone()
      rearWheel.position.set(0, 0.22, 0.42)
      group.add(rearWheel)

      // 车身主框架
      const frameGeo = new THREE.BoxGeometry(0.12, 0.12, 0.7)
      const frame = new THREE.Mesh(frameGeo, bodyMat)
      frame.position.set(0, 0.45, 0)
      group.add(frame)

      // 车头弯管
      const forkGeo = new THREE.BoxGeometry(0.08, 0.32, 0.08)
      const fork = new THREE.Mesh(forkGeo, bodyMat)
      fork.position.set(0, 0.36, -0.35)
      fork.rotation.x = 0.25
      group.add(fork)

      // 把手
      const barGeo = new THREE.BoxGeometry(0.45, 0.06, 0.06)
      const bar = new THREE.Mesh(barGeo, bodyMat)
      bar.position.set(0, 0.62, -0.3)
      group.add(bar)

      // 电池/车身覆板
      const bodyGeo = new THREE.BoxGeometry(0.22, 0.18, 0.4)
      const bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({ color: 0x3b82f6, shininess: 40 }))
      bodyMesh.position.set(0, 0.38, 0.08)
      group.add(bodyMesh)

      // 骑手：躯干
      const torsoGeo = new THREE.BoxGeometry(0.26, 0.38, 0.18)
      const torso = new THREE.Mesh(torsoGeo, suitMat)
      torso.position.set(0, 0.94, 0.05)
      torso.rotation.x = -0.2   // 略微前倾
      group.add(torso)

      // 骑手：头部
      const headGeo = new THREE.SphereGeometry(0.13, 12, 10)
      const head = new THREE.Mesh(headGeo, new THREE.MeshPhongMaterial({ color: 0xfcd5b0 })) // 肤色
      head.position.set(0, 1.3, -0.08)
      group.add(head)

      // 头盔（覆盖在头部上方）
      const helmetGeo = new THREE.SphereGeometry(0.155, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62)
      const helmet = new THREE.Mesh(helmetGeo, helmetMat)
      helmet.position.set(0, 1.3, -0.08)
      group.add(helmet)

      // 头盔遮阳板
      const visorGeo = new THREE.BoxGeometry(0.28, 0.08, 0.12)
      const visor = new THREE.Mesh(visorGeo, new THREE.MeshPhongMaterial({ color: 0x1d4ed8, opacity: 0.8, transparent: true }))
      visor.position.set(0, 1.22, -0.17)
      group.add(visor)

      // 腿部
      for (const sx of [-0.08, 0.08]) {
        const legGeo = new THREE.BoxGeometry(0.09, 0.32, 0.1)
        const leg = new THREE.Mesh(legGeo, suitMat)
        leg.position.set(sx, 0.64, 0.22)
        leg.rotation.x = 0.4
        group.add(leg)
      }

      // 投影圆（地面蓝光圈）
      const glowGeo = new THREE.RingGeometry(0.3, 0.7, 48)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.25 })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.rotation.x = -Math.PI / 2
      glow.position.y = 0.02
      glow.userData.isGlow = true
      group.add(glow)

      group.castShadow = true
      return group
    },

    _buildScanRings(parent) {
      // 三个同心扫描圆挂载到 parent（骑手 group），随骑手一起移动
      const ringMat = (opacity) => new THREE.MeshBasicMaterial({
        color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity
      })
      for (const [r, op] of [[3, 0.10], [6, 0.07], [10, 0.04]]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.04, r + 0.04, 64), ringMat(op + 0.08))
        ring.rotation.x = -Math.PI / 2
        ring.position.y = 0.015
        parent.add(ring)

        const fill = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshBasicMaterial({
          color: 0x3b82f6, transparent: true, opacity: op, side: THREE.DoubleSide
        }))
        fill.rotation.x = -Math.PI / 2
        fill.position.y = 0.01
        parent.add(fill)
      }

      this._sectorGroup = new THREE.Group()
      this._sectorGroup.rotation.x = -Math.PI / 2
      this._sectorGroup.position.y = 0.02
      this._s.add(this._sectorGroup)
    },

    // 根据当前轨迹更新红色扇形标记
    _updateSectors(tracks) {
      // 清空旧扇形
      while (this._sectorGroup.children.length > 0) {
        const c = this._sectorGroup.children[0]
        c.geometry.dispose()
        c.material.dispose()
        this._sectorGroup.remove(c)
      }
      if (!tracks.length) return

      const sectorMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      })

      tracks.forEach(t => {
        // 雷达坐标：x 右，y 前，对应 Three.js xz 平面
        // azimuth = atan2(x, y) 即从前方顺时针角度，转换为 Three.js 角度
        const angleRad = Math.atan2(t.x, t.y)  // 方位角（弧度）
        const halfSpan = Math.PI / 18            // 扇形半角 10°
        const r = Math.min(t.dist + 0.5, 10.5)  // 扇形延伸到目标距离

        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        const segments = 16
        for (let i = 0; i <= segments; i++) {
          const a = angleRad - halfSpan + (halfSpan * 2 * i / segments)
          shape.lineTo(Math.sin(a) * r, Math.cos(a) * r)
        }
        shape.closePath()

        const geo = new THREE.ShapeGeometry(shape)
        const mesh = new THREE.Mesh(geo, sectorMat.clone())
        // 危险距离加深扇形
        if (t.dist < 3) mesh.material.opacity = 0.55
        else if (t.dist < 8) mesh.material.opacity = 0.40
        this._sectorGroup.add(mesh)
      })
    },
    renderLoop() {
      this._raf = requestAnimationFrame(this.renderLoop)
      const t = performance.now() * 0.001

      // 骑手光圈脉冲动画
      if (this._riderGroup) {
        const glow = this._riderGroup.children.find(c => c.userData.isGlow)
        if (glow) { glow.material.opacity = 0.15 + Math.sin(t * 2) * 0.1 }
      }

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
        positions[i * 3 + 2] = p.y
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
      const newTids = new Set(tracks.map(t => t.tid))
      for (const tid of Object.keys(this._tm)) {
        if (!newTids.has(Number(tid))) {
          const m = this._tm[tid]
          this._s.remove(m.group)
          delete this._tm[tid]
        }
      }
      tracks.forEach(t => {
        const px = t.x, py = 0, pz = t.y   // 人站在地面
        if (this._tm[t.tid]) {
          this._tm[t.tid].group.position.set(px, py, pz)
        } else {
          const group = this._buildPersonFigure(t)
          group.position.set(px, py, pz)
          this._s.add(group)
          this._tm[t.tid] = { group }
        }
        // 实时更新材质颜色（距离变化）
        const color = this.trackColor3d(t)
        const entry = this._tm[t.tid]
        if (entry && entry.group._colorMeshes) {
          entry.group._colorMeshes.forEach(m => m.material.color.setHex(color))
        }
        if (entry && entry.group._ringMesh) {
          entry.group._ringMesh.material.color.setHex(color)
        }
      })
      this._updateSectors(tracks)
    },

    // 低多边形人形模型（Low-poly person）
    _buildPersonFigure(t) {
      const group = new THREE.Group()
      const color = this.trackColor3d(t)

      // 主体材质（低光感）
      const mat = () => new THREE.MeshPhongMaterial({ color, shininess: 20 })
      const skinMat = new THREE.MeshPhongMaterial({ color: 0xfcd5b0, shininess: 10 })
      const colorMeshes = []

      // 头部
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 7), skinMat)
      head.position.y = 1.62
      head.castShadow = true
      group.add(head)

      // 颈部
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), skinMat)
      neck.position.y = 1.5
      group.add(neck)

      // 躯干（上身）
      const torsoM = mat()
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.14), torsoM)
      torso.position.y = 1.21
      torso.castShadow = true
      group.add(torso)
      colorMeshes.push(torso)

      // 胯部（连接腿的过渡）
      const hipM = mat()
      const hip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.12), hipM)
      hip.position.y = 1.0
      group.add(hip)
      colorMeshes.push(hip)

      // 左右手臂
      for (const [sx] of [[-0.19], [0.19]]) {
        const armM = mat()
        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.25, 7), armM)
        upperArm.position.set(sx, 1.15, 0)
        upperArm.rotation.z = sx < 0 ? -0.3 : 0.3
        group.add(upperArm)
        colorMeshes.push(upperArm)

        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.22, 7), skinMat)
        forearm.position.set(sx * 1.1, 0.92, 0.04)
        forearm.rotation.z = sx < 0 ? -0.15 : 0.15
        forearm.rotation.x = 0.3
        group.add(forearm)
      }

      // 左右腿
      for (const [sx, rz] of [[-0.07, 0.06], [0.07, -0.06]]) {
        const legM = mat()
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.36, 8), legM)
        thigh.position.set(sx, 0.76, 0)
        thigh.rotation.z = rz
        thigh.castShadow = true
        group.add(thigh)
        colorMeshes.push(thigh)

        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.34, 8), legM)
        shin.position.set(sx * 1.05, 0.4, 0.02)
        shin.rotation.x = 0.05
        group.add(shin)
        colorMeshes.push(shin)

        // 脚
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), new THREE.MeshPhongMaterial({ color: 0x1e293b }))
        foot.position.set(sx * 1.05, 0.22, 0.04)
        group.add(foot)
      }

      // 地面圆圈（颜色与危险等级对应）
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.3, 32), ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.02
      group.add(ring)
      group._ringMesh = ring
      group._colorMeshes = colorMeshes

      // 目标 ID 标签（用一个极小方块占位，实际通过 CSS overlay 显示）
      return group
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
  justify-content: space-between;
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
    &:hover { border-color: @blue; background: rgba(37,99,235,0.05); }
  }

  .header-center {
    display: flex; align-items: center; gap: 8px;
    .title {
      font-size: 16px; font-weight: 700;
      color: @text; letter-spacing: 1px;
    }
  }

  .status {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: @text-2;

    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: @text-3;
      &.active {
        background: @green;
        box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
        animation: blink 2s infinite;
      }
    }
    .status-text { font-weight: 500; }
    .fps-badge {
      padding: 2px 8px;
      background: rgba(37,99,235,0.08);
      color: @blue;
      border-radius: 100px;
      font-weight: 600; font-size: 11px;
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
}

/* ── 右侧面板 ────────────────────── */
.info-panel {
  width: 270px;
  display: flex; flex-direction: column; gap: 8px;
  overflow-y: auto;
  background: @bg;
  border-left: 1px solid @border;
  padding: 10px;
  flex-shrink: 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: @border; border-radius: 2px; }
}

.panel-section {
  background: @bg-panel;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid @border;

  .section-title {
    font-size: 12px; font-weight: 600; color: @text;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid @bg-sec;
    display: flex; align-items: center; gap: 6px;
    .tid-chip {
      font-size: 11px; font-weight: 600;
      background: rgba(37,99,235,0.1);
      color: @blue; padding: 1px 7px; border-radius: 100px;
    }
  }
}

/* 目标列表 */
.track-list {
  display: flex; flex-direction: column; gap: 5px;
  .no-data {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 16px 0; color: @text-3; font-size: 12px;
  }
}

.track-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid @border;
  background: @bg;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #93c5fd; background: rgba(37,99,235,0.03); }
  &.selected { border-color: @blue; background: rgba(37,99,235,0.06); }

  &.danger { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.04); }
  &.warning { border-color: rgba(249,115,22,0.4); background: rgba(249,115,22,0.04); }

  .track-left {
    display: flex; align-items: center; gap: 8px;
    .track-badge {
      width: 26px; height: 26px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
      &.safe { background: rgba(37,99,235,0.12); color: @blue; }
      &.warning { background: rgba(249,115,22,0.15); color: @orange; }
      &.danger { background: rgba(239,68,68,0.15); color: @red; }
    }
    .track-coords {
      display: flex; flex-direction: column; gap: 1px;
      font-size: 11px; color: @text-2; font-family: 'Courier New', monospace;
      span { display: block; }
    }
  }
  .track-right {
    text-align: right;
    .track-speed {
      font-size: 15px; font-weight: 700; color: @text;
      span { font-size: 10px; font-weight: 400; color: @text-3; margin-left: 2px; }
    }
    .track-state { font-size: 10px; margin-top: 1px; }
  }
}

/* 详情面板 */
.detail-cols {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.detail-col {
  .detail-group-label {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.8px; color: @text-3; margin-bottom: 5px;
  }
  .detail-row {
    display: flex; justify-content: space-between;
    padding: 3px 0;
    border-bottom: 1px solid @bg-sec;
    font-size: 11px;
    &:last-child { border-bottom: none; }
    &.accent { background: rgba(37,99,235,0.03); margin: 0 -4px; padding: 3px 4px; border-radius: 4px; border: none; }
    span:first-child { color: @text-3; }
    .val {
      font-family: 'Courier New', monospace; font-weight: 600; color: @text;
      &.blue { color: @blue; }
    }
  }
}
.detail-footer {
  margin-top: 10px; padding-top: 8px;
  border-top: 1px solid @bg-sec;
  display: flex; flex-direction: column; gap: 6px;
  .footer-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px;
    .footer-label { color: @text-3; min-width: 50px; }
    .footer-val { font-weight: 600; }
    .confidence-bar {
      flex: 1; height: 4px; background: @bg-sec; border-radius: 2px; overflow: hidden;
      .confidence-fill { height: 100%; background: @blue; border-radius: 2px; transition: width 0.3s; }
    }
  }
}

/* 状态颜色 */
.state-move { color: @green; }
.state-lost { color: @red; }
.state-new  { color: @blue; }
.state-idle { color: @text-3; }

/* 系统状态 */
.sys-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  .sys-item {
    text-align: center; padding: 8px 4px;
    background: @bg-sec; border-radius: 8px;
    .sys-val { font-size: 18px; font-weight: 700; color: @blue; line-height: 1.2; }
    .sys-label { font-size: 10px; color: @text-3; margin-top: 2px; }
  }
}
.update-time {
  font-size: 10px; color: @text-3; text-align: right;
  margin-top: 6px; font-family: 'Courier New', monospace;
}

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

/* ── 摄像头识别区域 ──────────────── */
.cam-section {
  .section-title {
    .cam-status {
      margin-left: auto;
      font-size: 10px; font-weight: 500;
      padding: 1px 7px; border-radius: 100px;
      background: @bg-sec; color: @text-3;
      &.active { background: rgba(34,197,94,0.12); color: #16a34a; }
    }
  }
}

.cam-wrap {
  position: relative;
  width: 100%; padding-top: 75%; /* 4:3 */
  background: @bg-sec; border-radius: 8px;
  overflow: hidden;

  video, canvas {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }
  canvas { pointer-events: none; }

  .cam-placeholder {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; cursor: pointer; color: @text-3; font-size: 11px;
    &:hover { background: rgba(37,99,235,0.04); color: @blue; svg path, svg rect, svg circle { stroke: @blue; } }
  }

  .cam-loading {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(241,245,249,0.85);
    font-size: 12px; color: @text-2;
  }
}

.detection-tags {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
  .det-tag {
    padding: 2px 8px; border-radius: 100px;
    font-size: 11px; font-weight: 600;
    background: rgba(249,115,22,0.12); color: @orange;
    border: 1px solid rgba(249,115,22,0.3);
  }
}
.cam-hint {
  font-size: 11px; color: @text-3; text-align: center; margin-top: 4px;
}
</style>
