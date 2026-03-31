<template>
  <div class="personal-center">
    <!-- Modal -->
    <transition name="modal">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ modalTitle }}</h2>
            <div class="modal-buttons">
              <button @click="closeModal" class="cancel-button">取消</button>
              <button @click="closeModal" class="close-button">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Danger Records Table -->
          <div v-if="modalSection === 'danger'" class="modal-table">
            <table>
              <thead>
              <tr>
                <th>编号</th>
                <th>日期</th>
                <th>地点</th>
                <th>事件</th>
                <th>严重程度</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="record in dangerRecords" :key="record.id">
                <td>{{ record.id }}</td>
                <td>{{ record.date }}</td>
                <td>{{ record.location }}</td>
                <td>{{ record.incident }}</td>
                <td :class="{
                    'severity-medium': record.severity === '中',
                    'severity-low': record.severity === '低',
                  }">
                  {{ record.severity }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Fatigue Records Table -->
          <div v-if="modalSection === 'fatigue'" class="modal-table">
            <table>
              <thead>
              <tr>
                <th>编号</th>
                <th>日期</th>
                <th>工作时长（小时）</th>
                <th>休息时间（分钟）</th>
                <th>疲劳等级</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="record in fatigueRecords" :key="record.id">
                <td>{{ record.id }}</td>
                <td>{{ record.date }}</td>
                <td>{{ record.hoursWorked }}</td>
                <td>{{ record.breakTime }}</td>
                <td :class="{
                    'fatigue-high': record.fatigueLevel === '高',
                    'fatigue-medium': record.fatigueLevel === '中',
                  }">
                  {{ record.fatigueLevel }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Tracks Table -->
          <div v-if="modalSection === 'trajectory'" class="modal-table">
            <table>
              <thead>
              <tr>
                <th>编号</th>
                <th>订单号</th>
                <th>日期</th>
                <th>操作</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="track in tracks" :key="track.id">
                <td>{{ track.id }}</td>
                <td>{{ track.orderId }}</td>
                <td>{{ track.date }}</td>
                <td>
                  <button @click="showTrackDetails(track.id)" class="track-details-button">
                    查看轨迹
                  </button>
                </td>
              </tr>
              </tbody>
            </table>

            <!-- Track Details -->
            <div v-if="selectedTrack" class="track-details">
              <h3>订单 {{ selectedTrack.orderId }} 轨迹分析</h3>
              <div id="mapContainer" class="map-container"></div>
              <div class="video-container">
                <video ref="videoPlayer" :src="selectedTrack.videoSrc" controls></video>
              </div>
              <div class="trajectory-analysis">
                <h4>轨迹偏离分析</h4>
                <div class="analysis-grid">
                  <p><strong>偏离次数：</strong>{{ selectedTrack.deviationCount }}</p>
                  <p><strong>总偏离距离：</strong>{{ selectedTrack.deviationDistance }}</p>
                  <p><strong>最严重偏离：</strong>{{ selectedTrack.maxDeviation }}</p>
                  <p><strong>备注：</strong>{{ selectedTrack.remark }}</p>
                </div>
              </div>
              <div class="track-details-footer">
                <button @click="closeTrackDetails" class="close-track-button">
                  关闭
                </button>
              </div>
            </div>
          </div>

          <!-- History Records -->
          <div v-if="modalSection === 'history'" class="history-tables">
            <h3>历史记录</h3>
            <div class="table-container">
              <h4>1月历史记录</h4>
              <table>
                <thead>
                <tr>
                  <th></th>
                  <th>周1</th>
                  <th>周2</th>
                  <th>周3</th>
                  <th>周4</th>
                  <th>本月总收入</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td>本周订单</td>
                  <td>50</td>
                  <td>55</td>
                  <td>60</td>
                  <td>58</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>平均配送时间</td>
                  <td>30分钟</td>
                  <td>28分钟</td>
                  <td>27分钟</td>
                  <td>29分钟</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>本周收入</td>
                  <td>￥1200</td>
                  <td>￥1300</td>
                  <td>￥1400</td>
                  <td>￥1350</td>
                  <td>￥5250</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div class="table-container">
              <h4>2月历史记录</h4>
              <table>
                <thead>
                <tr>
                  <th></th>
                  <th>周1</th>
                  <th>周2</th>
                  <th>周3</th>
                  <th>周4</th>
                  <th>本月总收入</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td>本周订单</td>
                  <td>45</td>
                  <td>50</td>
                  <td>52</td>
                  <td>48</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>平均配送时间</td>
                  <td>32分钟</td>
                  <td>30分钟</td>
                  <td>29分钟</td>
                  <td>31分钟</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>本周收入</td>
                  <td>￥1100</td>
                  <td>￥1200</td>
                  <td>￥1250</td>
                  <td>￥1150</td>
                  <td>￥4700</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Header Component: 20% -->
    <div class="header-component">
      <div class="avatar-container">
        <img src="imgs/tk.png" alt="Avatar" class="avatar" />
      </div>
      <div class="title-container">
        <h1>外卖个人中心</h1>
        <p>欢迎回来张三！</p>
      </div>
    </div>

    <!-- Content Component: 40% -->
    <div class="content-component">
      <div class="personal-info">
        <h2>个人信息</h2>
        <p>姓名：张三，工号：DS12345</p>
        <p>累计订单：1280，平均评分：4.8/5.0</p>
      </div>
      <div class="stats-container">
        <div class="stat-box orders">
          <h3>本周订单</h3>
          <p>56</p>
        </div>
        <div class="stat-box delivery-time">
          <h3>平均配送时间</h3>
          <p>28分钟</p>
        </div>
        <div class="stat-box income">
          <h3>本周收入</h3>
          <p>￥1280</p>
        </div>
      </div>
    </div>

    <!-- Function Component: 20% -->
    <div class="function-component">
      <button class="function-button danger" @click="openModal('danger')">危险记录</button>
      <button class="function-button fatigue" @click="openModal('fatigue')">疲劳记录</button>
      <button class="function-button trajectory" @click="openModal('trajectory')">历史轨迹</button>
      <button class="function-button history" @click="openModal('history')">历史记录</button>
    </div>

    <!-- Expand Button: 10% -->

    <!-- Additional Features (if expanded) -->
    <transition name="fade">
      <div v-if="showFeatures" class="additional-features">
        <div v-for="feature in additionalFeatures" :key="feature.name" class="feature-box">
          <h3>{{ feature.name }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'PersonalCenter',
  data() {
    return {
      showModal: false,
      modalSection: null,
      modalTitle: '',
      selectedTrack: null,
      map: null,
      showFeatures: false,
      dangerRecords: [
        { id: 1, date: '2025-04-10', location: '主街123号', incident: '与车辆险些相撞', severity: '中' },
        { id: 2, date: '2025-04-08', location: '橡树大道456号', incident: '路面湿滑', severity: '低' },
      ],
      fatigueRecords: [
        { id: 1, date: '2025-04-10', hoursWorked: 8, breakTime: 30, fatigueLevel: '高' },
        { id: 2, date: '2025-04-09', hoursWorked: 7, breakTime: 45, fatigueLevel: '中' },
      ],
      tracks: [
        {
          id: 1,
          orderId: 'ORD001',
          date: '2025-04-10',
          normalTrajectory: [
            [120.208537, 30.289854],
            [120.209001, 30.289306],
            [120.21075, 30.28723],
            [120.211554, 30.286259],
          ],
          errorTrajectory: [
            [120.208537, 30.289854],
            [120.209001, 30.289306],
            [120.21075, 30.28723],
            [120.212554, 30.285259],
          ],
          deviationCount: '2次',
          deviationDistance: '1.2公里',
          maxDeviation: '2025-04-10 14:30，偏离0.8公里',
          remark: '因道路施工绕行，待核实',
          videoSrc: '/videos/1_output.mp4',
        },
        {
          id: 2,
          orderId: 'ORD002',
          date: '2025-04-09',
          normalTrajectory: [
            [120.214736, 30.291241],
            [120.212402, 30.289735],
            [120.211946, 30.289306],
            [120.212385, 30.288661],
          ],
          errorTrajectory: [
            [120.214736, 30.291241],
            [120.213298, 30.290325],
            [120.212166, 30.28958],
            [120.212385, 30.288661],
          ],
          deviationCount: '1次',
          deviationDistance: '0.5公里',
          maxDeviation: '2025-04-09 10:15，偏离0.5公里',
          remark: '正常范围内',
          videoSrc: '/videos/2_output.mp4',
        },
      ],
      additionalFeatures: [
        { name: '设备问题上报', description: '报告电动车、头盔或其他设备的问题。' },
        { name: '排班调整申请', description: '提交工作时间变更或休假请求。' },
        { name: '培训资源', description: '访问配送技巧和安全培训材料。' },
        { name: '顾客反馈查看', description: '查看顾客对您的评价和建议。' },
      ],
    };
  },
  methods: {
    openModal(section) {
      this.modalSection = section;
      this.showModal = true;
      this.selectedTrack = null;
      if (this.map) {
        this.map.clearMap();
        this.map = null;
      }
      this.modalTitle = {
        danger: '危险记录',
        fatigue: '疲劳时间记录',
        trajectory: '历史轨迹',
        history: '历史记录',
      }[section];
    },
    closeModal() {
      this.showModal = false;
      this.modalSection = null;
      this.selectedTrack = null;
      if (this.map) {
        this.map.clearMap();
        this.map = null;
      }
    },
    showTrackDetails(trackId) {
      this.selectedTrack = this.tracks.find((track) => track.id === trackId);
      this.$nextTick(() => {
        this.initMap();
      });
    },
    closeTrackDetails() {
      this.selectedTrack = null;
      if (this.map) {
        this.map.clearMap();
        this.map = null;
      }
    },
    initMap() {
      window._AMapSecurityConfig = {
        securityJsCode: 'ed85bc8a6f2f5af29325bc59c75a70ec',
      };
      window.AMapLoader.load({
        key: '973684a430e0a55f1dc0f700ec295997',
        version: '2.0',
        plugins: ['AMap.Scale'],
      })
          .then((AMap) => {
            this.map = new AMap.Map('mapContainer', {
              viewMode: '2D',
              zoom: 15,
              center: this.selectedTrack.normalTrajectory[0],
            });
            this.drawTrajectory();
          })
          .catch((e) => console.error('Map loading failed:', e));
    },
    drawTrajectory() {
      if (!this.map || !this.selectedTrack) return;
      this.map.clearMap();
      const normalPolyline = new window.AMap.Polyline({
        path: this.selectedTrack.normalTrajectory,
        strokeColor: '#00C851',
        strokeWeight: 6,
        strokeOpacity: 0.8,
        lineJoin: 'round',
      });
      const errorPolyline = new window.AMap.Polyline({
        path: this.selectedTrack.errorTrajectory,
        strokeColor: '#ff4444',
        strokeWeight: 6,
        strokeOpacity: 0.8,
        lineJoin: 'round',
      });
      const startMarker = new window.AMap.Marker({
        position: this.selectedTrack.normalTrajectory[0],
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(25, 34),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
          imageSize: new window.AMap.Size(25, 34),
        }),
        offset: new window.AMap.Pixel(-12, -34),
      });
      const endMarker = new window.AMap.Marker({
        position: this.selectedTrack.normalTrajectory[this.selectedTrack.normalTrajectory.length - 1],
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(25, 34),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
          imageSize: new window.AMap.Size(25, 34),
        }),
        offset: new window.AMap.Pixel(-12, -34),
      });
      const errorEndMarker = new window.AMap.Marker({
        position: this.selectedTrack.errorTrajectory[this.selectedTrack.errorTrajectory.length - 1],
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(25, 34),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
          imageSize: new window.AMap.Size(25, 34),
        }),
        offset: new window.AMap.Pixel(-12, -34),
      });
      this.map.add([normalPolyline, errorPolyline, startMarker, endMarker, errorEndMarker]);
      this.map.setFitView();
      const startInfoWindow = new window.AMap.InfoWindow({
        content: `<div class="info-window-content">起点<br>${this.selectedTrack.normalTrajectory[0]}</div>`,
        offset: new window.AMap.Pixel(0, -30),
      });
      const endInfoWindow = new window.AMap.InfoWindow({
        content: `<div class="info-window-content">正确路线终点<br>${this.selectedTrack.normalTrajectory[this.selectedTrack.normalTrajectory.length - 1]}</div>`,
        offset: new window.AMap.Pixel(0, -30),
      });
      const errorEndInfoWindow = new window.AMap.InfoWindow({
        content: `<div class="info-window-content">实际路线终点<br>${this.selectedTrack.errorTrajectory[this.selectedTrack.errorTrajectory.length - 1]}</div>`,
        offset: new window.AMap.Pixel(0, -30),
      });
      startMarker.on('click', () => startInfoWindow.open(this.map, startMarker.getPosition()));
      endMarker.on('click', () => endInfoWindow.open(this.map, endMarker.getPosition()));
      errorEndMarker.on('click', () => errorEndInfoWindow.open(this.map, errorEndMarker.getPosition()));
    },
    toggleFeatures() {
      this.showFeatures = !this.showFeatures;
    },
  },
  beforeDestroy() {
    if (this.map) {
      this.map.destroy();
    }
  },
};
</script>

<style scoped>
.personal-center {
  display: flex;
  flex-direction: column;
  height: 100vh;
  gap: 2.5vh;
}

.personal-center > * {
  width: 100%;
}

.header-component {
  height: 20%;
  display: flex;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.avatar-container {
  width: 20%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.title-container {
  width: 80%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 1rem;
}

.title-container h1 {
  font-size: 1.5rem;
  font-weight: bold;
}

.title-container p {
  font-size: 1rem;
  color: #4b5563;
}

.content-component {
  height: 40%;
  display: flex;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.personal-info {
  width: 50%;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  padding: 1.5rem;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.personal-info:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.personal-info h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 0.25rem;
}

.personal-info p {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #374151;
  line-height: 1.5;
}

.stats-container {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
}

.stat-box {
  height: 30%;
  padding: 0.3rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.stat-box:last-child {
  margin-bottom: 0;
}

.stat-box h3 {
  font-size: 1rem;
  font-weight: 600;
}

.stat-box p {
  font-size: 1.5rem;
}

.orders {
  background-color: #dbeafe;
  color: #2563eb;
}

.delivery-time {
  background-color: #dcfce7;
  color: #16a34a;
}

.income {
  background-color: #fef9c3;
  color: #ca8a04;
}

.function-component {
  height: 20%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.function-button {
  background-color: #000;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  transition: background-color 0.3s ease;
}

.function-button:hover {
  opacity: 0.9;
}

.danger {
  background-color: #3b82f6;
}

.fatigue {
  background-color: #22c55e;
}

.trajectory {
  background-color: #9333ea;
}

.history {
  background-color: #eab308;
}

.expand-button {
  height: 10vh;
  width: 100%;
  background-color: #e5e7eb;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.expand-button:hover {
  background-color: #d1d5db;
}

.additional-features {
  padding: 1rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.feature-box {
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.feature-box h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-box p {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  border-radius: 12px;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.modal-buttons {
  display: flex;
  gap: 0.5rem;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.3s ease;
}

.close-button:hover {
  color: #374151;
}

.cancel-button {
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.3s ease;
}

.cancel-button:hover {
  background-color: #4b5563;
}

.modal-table {
  width: 100%;
}

.modal-table table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.modal-table th,
.modal-table td {
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  text-align: center;
}

.modal-table thead tr {
  background-color: #e5e7eb;
}

.modal-table tbody td:first-child {
  font-weight: 600;
}

.severity-medium {
  color: #ef4444;
}

.severity-low {
  color: #10b981;
}

.fatigue-high {
  color: #ef4444;
}

.fatigue-medium {
  color: #f59e0b;
}

.track-details {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.track-details h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.map-container {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  margin-bottom: 1.5rem;
}

.video-container {
  margin-bottom: 1.5rem;
}

.video-container video {
  width: 100%;
  border-radius: 8px;
}

.trajectory-analysis {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.trajectory-analysis h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.track-details-footer {
  text-align: right;
  margin-top: 1rem;
}

.track-details-button,
.close-track-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.track-details-button:hover,
.close-track-button:hover {
  background-color: #2563eb;
}

.close-track-button {
  background-color: #6b7280;
}

.close-track-button:hover {
  background-color: #4b5563;
}

.history-tables {
  padding: 1rem;
}

.history-tables h3 {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
}

.history-tables .table-container {
  margin-bottom: 2rem;
}

.history-tables h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.info-window-content {
  padding: 5px;
  font-size: 12px;
}

/* Transition Styles */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>