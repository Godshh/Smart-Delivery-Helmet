<template>
  <div id="app">
    <header class="header">
      <div class="title-section">
        <div class="logo"><i class="fas fa-map-marked-alt"></i></div>
        <div class="title">智慧园区安全监控系统</div>
      </div>
      <div class="status-section">
        <div class="status-item">
          <div class="status-dot"></div>
          <span
            >在线设备：<span class="status-count"
              >{{ fireDevices.filter((d) => d.status !== "offline").length }}/{{
                fireDevices.length
              }}</span
            ></span
          >
        </div>
        <div class="status-item">
          <div class="status-dot warning"></div>
          <span
            >异常设备：<span class="status-count">{{
              fireDevices.filter((d) => d.status === "warning").length
            }}</span></span
          >
        </div>
        <div class="status-item">
          <div class="status-dot danger"></div>
          <span
            >告警设备：<span class="status-count">{{
              fireDevices.filter((d) => d.status === "danger").length
            }}</span></span
          >
        </div>
      </div>
    </header>

    <!-- 中间部分 -->
    <div class="content">
      <!--地图-->
      <div class="map-section">
        <div id="fireMapContainer" class="map-container"></div>
      </div>

      <!-- 设备详情面板 -->
      <div class="details-panel" v-if="selectedDevice">
        <!-- 设备信息 & 视频 -->
        <div class="device-card">
          <div class="device-header">
            <div>
              <div class="device-title">{{ selectedDevice.name }}</div>
              <div class="device-position">{{ selectedDevice.position }}</div>
            </div>
            <div class="device-status" :class="selectedDevice.status">
              {{
                selectedDevice.status === "normal"
                  ? "运行正常"
                  : selectedDevice.status === "warning"
                  ? "轻度异常"
                  : selectedDevice.status === "danger"
                  ? "严重告警"
                  : "设备离线"
              }}
            </div>
          </div>

          <!-- 视频区域 -->
          <div class="video-container">
            <div class="video-placeholder">
              <div class="placeholder-icon">
                <i class="fas fa-video"></i>
              </div>
              <div class="camera-label">{{ selectedDevice.name }}监控画面</div>
              <div class="camera-position">
                {{ selectedDevice.position }}
              </div>
            </div>
            <div class="camera-status">AI智能分析中 - 实时监控画面</div>
          </div>

          <div class="controls">
            <button class="control-btn">
              <i class="fas fa-expand"></i> 全屏显示
            </button>
            <button class="control-btn" @click="showAnalysisModal = true">
              <i class="fas fa-brain"></i> AI智能分析
            </button>
          </div>

          <!-- 统计信息 -->
          <div class="stats-container">
            <div class="stat-row">
              <div class="stat-item">
                <div class="stat-icon" style="color: #e67e22">
                  <i class="fas fa-smog"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-title">烟雾浓度</div>
                  <div
                    class="stat-value"
                    :style="{
                      color:
                        selectedDevice.smoke > 25
                          ? '#e74c3c'
                          : selectedDevice.smoke > 20
                          ? '#f39c12'
                          : '#2ecc71',
                    }"
                  >
                    {{ selectedDevice.smoke }}%
                  </div>
                  <div
                    class="stat-status"
                    :style="{
                      background:
                        selectedDevice.smoke > 25
                          ? 'rgba(231, 76, 60, 0.15)'
                          : selectedDevice.smoke > 20
                          ? 'rgba(243, 156, 18, 0.15)'
                          : 'rgba(46, 204, 113, 0.15)',
                      color:
                        selectedDevice.smoke > 25
                          ? '#c0392b'
                          : selectedDevice.smoke > 20
                          ? '#d35400'
                          : '#27ae60',
                    }"
                  >
                    {{
                      selectedDevice.smoke > 25
                        ? "危险"
                        : selectedDevice.smoke > 20
                        ? "警告"
                        : "安全"
                    }}
                  </div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon" style="color: #e74c3c">
                  <i class="fas fa-fire"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-title">火焰检测</div>
                  <div
                    class="stat-value"
                    :style="{
                      color: selectedDevice.fireDetected
                        ? '#e74c3c'
                        : '#2ecc71',
                    }"
                  >
                    {{ selectedDevice.fireDetected ? "已发现" : "未发现" }}
                  </div>
                  <div
                    class="stat-status"
                    :style="{
                      background: selectedDevice.fireDetected
                        ? 'rgba(231, 76, 60, 0.15)'
                        : 'rgba(46, 204, 113, 0.15)',
                      color: selectedDevice.fireDetected
                        ? '#c0392b'
                        : '#27ae60',
                    }"
                  >
                    {{ selectedDevice.fireDetected ? "火情报警" : "无异常" }}
                  </div>
                </div>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-item">
                <div class="stat-icon" style="color: #3498db">
                  <i class="fas fa-water"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-title">水位监测</div>
                  <div
                    class="stat-value"
                    :style="{
                      color:
                        selectedDevice.waterLevel > 40
                          ? '#e74c3c'
                          : selectedDevice.waterLevel > 30
                          ? '#f39c12'
                          : '#2ecc71',
                    }"
                  >
                    {{ selectedDevice.waterLevel }}cm
                  </div>
                  <div
                    class="stat-status"
                    :style="{
                      background:
                        selectedDevice.waterLevel > 40
                          ? 'rgba(231, 76, 60, 0.15)'
                          : selectedDevice.waterLevel > 30
                          ? 'rgba(243, 156, 18, 0.15)'
                          : 'rgba(46, 204, 113, 0.15)',
                      color:
                        selectedDevice.waterLevel > 40
                          ? '#c0392b'
                          : selectedDevice.waterLevel > 30
                          ? '#d35400'
                          : '#27ae60',
                    }"
                  >
                    {{
                      selectedDevice.waterLevel > 40
                        ? "危险"
                        : selectedDevice.waterLevel > 30
                        ? "警告"
                        : "正常"
                    }}
                  </div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon" style="color: #9b59b6">
                  <i class="fas fa-battery-full"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-title">设备状态</div>
                  <div
                    class="stat-value"
                    :style="{
                      color:
                        selectedDevice.status === 'danger'
                          ? '#e74c3c'
                          : selectedDevice.status === 'warning'
                          ? '#f39c12'
                          : selectedDevice.status === 'normal'
                          ? '#2ecc71'
                          : '#7f8c8d',
                    }"
                  >
                    {{ powerLevel }}%
                  </div>
                  <div
                    class="stat-status"
                    :class="selectedDevice.status || 'offline'"
                  >
                    {{
                      selectedDevice.status === "normal"
                        ? "运行正常"
                        : selectedDevice.status === "warning"
                        ? "轻度异常"
                        : selectedDevice.status === "danger"
                        ? "严重告警"
                        : "设备离线"
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 设备详情面板 -->
      <div
        class="details-panel"
        v-else
        style="justify-content: center; align-items: center"
      >
        <div>
          <div style="text-align: center; margin-bottom: 40px">
            <i
              class="fas fa-map-marker-alt"
              style="font-size: 100px; color: #b5e0ff"
            ></i>
          </div>
          <div
            style="
              font-size: 1.8rem;
              font-weight: 700;
              color: #3498db;
              text-align: center;
            "
          >
            点击地图上的监控设备
          </div>
          <div
            style="
              font-size: 1.2rem;
              margin-top: 15px;
              text-align: center;
              color: #7f8c8d;
            "
          >
            选择地图中任意设备查看实时监控和安全分析
          </div>
        </div>
      </div>
    </div>

    <!-- 分析弹窗 -->
    <div class="modal-overlay" v-if="showAnalysisModal && selectedDevice">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">
            AI 智能分析报告 - {{ selectedDevice.name }}
          </div>
        </div>
        <div class="close-modal" @click="showAnalysisModal = false">
          <img src="/imgs/rightx.png" alt="返回" class="arrow-icon" />
        </div>

        <div class="modal-body">
          <div class="process-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">视频内容识别</div>
                <div class="step-desc">
                  通过实时视频流分析，识别出{{
                    selectedDevice.position
                  }}区域的动态变化。AI模型使用了YOLOv7目标检测算法，检测画面中的异常特征。
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">传感器数据融合</div>
                <div class="step-desc">
                  整合烟雾传感器、热成像仪和水位计的数据，结合视频分析结果进行交叉验证。当前烟雾浓度为{{
                    selectedDevice.smoke
                  }}%，水位高度为{{ selectedDevice.waterLevel }}cm。
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">环境态势评估</div>
                <div class="step-desc">
                  综合风速、温湿度和历史数据预测险情发展趋势。检测到{{
                    selectedDevice.fireDetected ? "2个高温区域" : "无火源迹象"
                  }}，烟雾浓度{{
                    selectedDevice.smoke > 20 ? "高于" : "低于"
                  }}安全阈值。
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <div class="step-title">多模型决策分析</div>
                <div class="step-desc">
                  采用卷积神经网络和循环神经网络相结合的方式，对当前状况进行多维度评估。分析模型考虑了历史事故数据和环境因素，输出风险评估指数。
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-result">
            <div class="result-header">
              <i
                class="fas fa-lightbulb"
                style="color: #f39c12; font-size: 2rem"
              ></i>
              <div class="result-title">综合分析结论与建议</div>
            </div>
            <div class="result-content">
              <p>根据AI模型分析，设备所在区域{{ getRiskLevelText() }}。</p>
              <p v-if="selectedDevice.smoke > 25">
                <i
                  class="fas fa-exclamation-triangle"
                  style="color: #e74c3c"
                ></i>
                烟雾浓度超过安全阈值（{{
                  selectedDevice.smoke
                }}%），建议立即启动通风系统并检查潜在火源。烟雾集中区域位于西北方向。
              </p>
              <p v-if="selectedDevice.fireDetected">
                <i class="fas fa-fire" style="color: #e67e22"></i>
                检测到高温热源（最高温度：128℃），可能存在火情，建议立即派员查看并使用灭火设备。最近灭火器位于东南侧50米。
              </p>
              <p v-if="selectedDevice.waterLevel > 40">
                <i class="fas fa-water" style="color: #3498db"></i>
                水位高度异常（{{
                  selectedDevice.waterLevel
                }}cm），已达到危险水位，建议启动排水系统并检查管道泄漏情况。
              </p>
              <p v-else-if="selectedDevice.status === 'normal'">
                <i class="fas fa-check-circle" style="color: #2ecc71"></i>
                当前所有安全指标均在正常范围内，可继续保持监测状态。建议每30分钟进行一次深度分析扫描。
              </p>
              <p v-if="selectedDevice.status === 'offline'">
                <i class="fas fa-unlink" style="color: #95a5a6"></i>
                设备通讯故障，无法获取实时数据。建议工程人员前往{{
                  selectedDevice.position
                }}进行检查维护。
              </p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn" @click="showAnalysisModal = false">
            <i class="fas fa-check"></i> 关闭报告
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AMapLoader from "@amap/amap-jsapi-loader";

export default {
  data() {
    return {
      fireDevices: [
        {
          id: 1,
          name: "北门口热成像仪",
          position: "北区入口",
          lnglat: [120.212131, 30.288047], // 经纬度位置用于地图 marker
          status: "normal",
          smoke: 18,
          fireDetected: false,
          waterLevel: 22,
        },
        {
          id: 2,
          name: "仓库烟雾探测器",
          position: "西仓库",
          lnglat: [120.212063, 30.289745],
          status: "danger",
          smoke: 32,
          fireDetected: true,
          waterLevel: 15,
        },
        {
          id: 3,
          name: "南广场摄像头",
          position: "南广场",
          lnglat: [120.212, 30.291395],
          status: "warning",
          smoke: 24,
          fireDetected: true,
          waterLevel: 19,
        },
        {
          id: 4,
          name: "主门水情监测",
          position: "东大门",
          lnglat: [120.214899, 30.291708],
          status: "normal",
          smoke: 12,
          fireDetected: false,
          waterLevel: 45,
        },
        {
          id: 5,
          name: "中央监控点",
          position: "中央主楼",
          lnglat: [120.214566, 30.292771],
          status: "normal",
          smoke: 15,
          fireDetected: false,
          waterLevel: 10,
        },
      ],
      selectedDevice: null,
      showAnalysisModal: false,
      powerLevel: 90,
      fireMap: null,
      fireAlertCircles: {},
    };
  },
  computed: {
    onlineDeviceCount() {
      return this.fireDevices.filter((d) => d.status !== "offline").length;
    },
    warningDeviceCount() {
      return this.fireDevices.filter((d) => d.status === "warning").length;
    },
    dangerDeviceCount() {
      return this.fireDevices.filter((d) => d.status === "danger").length;
    },
  },
  methods: {
    initAMap() {
      window._AMapSecurityConfig = {
        securityJsCode: "ed85bc8a6f2f5af29325bc59c75a70ec",
      };
      AMapLoader.load({
        key: "973684a430e0a55f1dc0f700ec295997",
        version: "2.0",
        plugins: [
          "AMap.Scale",
          "AMap.ToolBar",
          "AMap.AutoComplete",
          "AMap.Riding",
          "AMap.Map",
          "AMap.Circle",
        ],
      })
        .then((AMap) => {
          this.fireMap = new AMap.Map("fireMapContainer", {
            viewMode: "3D",
            zoom: 20,
            center: [120.176337, 30.285877],
          });
          this.fireMap.addControl(new AMap.ToolBar());
          this.fireMap.addControl(new AMap.Scale());
          this.fireDevices.forEach((device) => {
            this.addDeviceMarker(device);
          });
        })
        .catch((e) => console.error("AMap 初始化失败:", e));
    },
    // 新增方法：渲染火情点位
    addDeviceMarker(device) {
      const iconPath = device.fireDetected
        ? "/imgs/hapfrie.png"
        : "/imgs/unfire.png";

      // 包一层，不管是否 fire 都保持一致结构
      const markerHtml = `
    <div class="${device.fireDetected ? "fire-marker" : "normal-marker"}">
      <img src="${iconPath}" />
    </div>
  `;

      const marker = new AMap.Marker({
        position: device.lnglat,
        offset: new AMap.Pixel(0, 0),
        content: markerHtml,
        title: device.name,
      });

      marker.on("click", () => {
        this.selectDevice(device);
        if (device.fireDetected) {
          device.fireDetected = false;
          marker.setContent(`
        <div class="normal-marker">
          <img src="/imgs/unfire.png" />
        </div>
      `);
        }
      });

      this.fireMap.add(marker);

      device._marker = marker;
    },

    selectDevice(device) {
      this.selectedDevice = device;
      this.powerLevel = Math.floor(60 + Math.random() * 40);
    },
    getRiskLevelText() {
      if (!this.selectedDevice) return "";
      const device = this.selectedDevice;
      if (device.status === "danger") {
        return "存在高风险（风险指数 8.7）";
      } else if (device.status === "warning") {
        return "存在中度风险（风险指数 5.2）";
      } else if (device.status === "offline") {
        return "设备离线无法评估";
      }
      return "处于安全状态（风险指数 0.8）";
    },
    updateDeviceData() {
      this.fireDevices.forEach((device) => {
        if (device.status !== "offline") {
          device.smoke = Number(
            Math.max(5, device.smoke + (Math.random() - 0.5)).toFixed(1)
          );

          if (device.status === "danger" && Math.random() > 0.3) {
            device.fireDetected = true;
          } else {
            device.fireDetected = Math.random() > 0.9;
          }

          device.waterLevel = Number(
            Math.max(5, device.waterLevel + (Math.random() - 0.5) * 2).toFixed(
              1
            )
          );

          // 重新计算状态
          if (
            device.smoke > 30 ||
            device.fireDetected ||
            device.waterLevel > 40
          ) {
            device.status = "danger";
          } else if (device.smoke > 25 || device.waterLevel > 35) {
            device.status = "warning";
          } else {
            device.status = "normal";
          }

          // ✅ 更新 marker 图标
          if (device._marker) {
            const iconPath = device.fireDetected
              ? "/imgs/hapfrie.png"
              : "/imgs/unfire.png";
            const markerHtml = `
          <div class="${device.fireDetected ? "fire-marker" : "normal-marker"}">
            <img src="${iconPath}" />
          </div>
        `;
            device._marker.setContent(markerHtml);
          }
        }
      });

      if (this.powerLevel > 0 && Math.random() > 0.7) {
        this.powerLevel -= 1;
      }
    },
  },
  mounted() {
    this.initAMap();
    setInterval(this.updateDeviceData, 5000);
  },
  beforeDestroy() {
    // 清理地图实例
    if (this.fireMap) {
      this.fireMap.destroy();
    }
  },
};
</script>

<style scoped>
::v-deep(.fire-marker) {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  position: relative;
}

::v-deep(.fire-marker img) {
  width: 100%;
  height: 100%;
  z-index: 2;
  position: relative;
}

::v-deep(.fire-marker::after) {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 0, 0, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 1.5s ease-out infinite;
  z-index: 1;
}

::v-deep(.fire-marker),
::v-deep(.normal-marker) {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  position: relative;
}

::v-deep(.fire-marker img),
::v-deep(.normal-marker img) {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
}

/* 动画效果只给 fire-marker */
::v-deep(.fire-marker::after) {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 0, 0, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 1.5s ease-out infinite;
  z-index: 1;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}
.normal-marker {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
}
.normal-marker img {
  width: 100%;
  height: 100%;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

.arrow-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.arrow-icon:hover {
  transform: scale(1.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
}

body {
  background: linear-gradient(135deg, #e7f5ff, #d1ebfe);
  color: #2c3e50;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  width: 100%;
  max-width: 100%;
  height: 98vh;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 100, 200, 0.15);
}

/* Header */
.header {
  height: 90px;
  background: linear-gradient(90deg, #3498db, #1abc9c);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 35px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.status-section {
  display: flex;
  gap: 25px;
}

.status-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: white;
  font-weight: 500;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2ecc71;
  box-shadow: 0 0 8px #27ae60;
}

.status-dot.offline {
  background: #95a5a6;
  box-shadow: none;
}

.status-dot.warning {
  background: #f39c12;
  box-shadow: 0 0 8px #f39c12;
}

.status-dot.danger {
  background: #e74c3c;
  box-shadow: 0 0 8px #e74c3c;
}

.status-count {
  font-weight: 700;
  margin-left: 6px;
}

/* Main Content */
.content {
  display: flex;
  flex: 1;
  height: calc(100% - 90px);
  position: relative;
}

/* Map Section */
.map-section {
  flex: 1;
  background: #f8fbff;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  background: #deeeff;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  background-image: linear-gradient(
      rgba(180, 220, 255, 0.3) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(180, 220, 255, 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Details Panel */
.details-panel {
  width: 600px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
}

.device-card {
  background: white;
  border-radius: 25px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(51, 149, 219, 0.15);
  border: 1px solid #eaf5ff;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.device-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
}

.device-position {
  font-size: 1.1rem;
  color: #7f8c8d;
}

.device-status {
  padding: 10px 25px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1.1rem;
}

.normal {
  background: rgba(46, 204, 113, 0.15);
  color: #27ae60;
}
.warning {
  background: rgba(241, 196, 15, 0.15);
  color: #f39c12;
}
.danger {
  background: rgba(231, 76, 60, 0.15);
  color: #c0392b;
}
.offline {
  background: rgba(149, 165, 166, 0.15);
  color: #7f8c8d;
}

.video-container {
  height: 350px;
  background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
  border: 2px solid #e3f2fd;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.video-placeholder {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #3498db;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.camera-label {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

.camera-position {
  color: #7f8c8d;
  margin-top: 10px;
  font-size: 18px;
}

.camera-status {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: #3498db;
  font-weight: 600;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.4);
  padding: 10px;
  backdrop-filter: blur(5px);
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  justify-content: center;
}

.control-btn {
  padding: 12px 30px;
  background: linear-gradient(90deg, #3498db, #1abc9c);
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.control-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.control-btn.analysis {
  background: linear-gradient(90deg, #9b59b6, #8e44ad);
}

.stats-container {
  background: #f9fcff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #e3f2ff;
  margin-top: 10px;
}

.stat-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.stat-item {
  flex: 1;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 15px;
}

.stat-info {
  text-align: center;
}

.stat-title {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 10px;
}

.stat-status {
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

/* Analysis Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;

  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  width: 1500px;
  background: linear-gradient(150deg, #ffffff, #f5faff);
  border-radius: 30px;
  box-shadow: 0 40px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  position: relative;
}

.modal-header {
  padding: 15px 20px;
  background: linear-gradient(90deg, #418de8, #2cbdb8);
  color: white;
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
}

.modal-title {
  font-size: 2rem;
  font-weight: 700;
}

.close-modal {
  position: absolute;
  top: 25px;
  right: 20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.8rem;
  transition: all 0.3s;
  color: white;
}

.close-modal:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(90deg);
}

.modal-body {
  padding: 40px;
  display: flex;
}

.process-steps {
  margin-bottom: 25px;
}

.step {
  display: flex;
  gap: 20px;
  padding: 25px 0;
  border-bottom: 1px solid #e8f2ff;
}

.step-number {
  width: 45px;
  height: 45px;
  background: linear-gradient(90deg, #3498db, #1abc9c);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #3498db;
}

.step-desc {
  font-size: 17px;
  color: #5d6d7e;
  line-height: 1.8;
}

.analysis-result {
  padding: 25px;
  border-radius: 20px;
  margin-left: 20px;
  background: linear-gradient(to right, #fff8e1, #fffde7);
  border-top: 6px solid #f39c12;
  margin-top: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.result-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #e67e22;
}

.result-content {
  font-size: 18px;
  color: #5d6d7e;
  line-height: 1.8;
}

.modal-footer {
  padding: 30px;
  display: flex;
  justify-content: center;
  background: #f8fbff;
  border-top: 1px solid #e8f2ff;
}

.modal-btn {
  padding: 15px 40px;
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.4s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-btn:hover {
  transform: translateY(-3px);
}

/* Animations */
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

@keyframes pulseWarning {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 12px rgba(243, 156, 18, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(243, 156, 18, 0);
  }
}

@keyframes pulseDanger {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 12px rgba(231, 76, 60, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
