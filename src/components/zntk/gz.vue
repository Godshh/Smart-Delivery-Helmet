<template>
  <div class="container">
    <div class="header">
      <div class="back-button" @click="reHome">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="30"
          height="30"
        >
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </div>
      <div class="title">行车轨迹回放</div>
    </div>

    <div id="mapContainer"></div>

    <div class="control-card">
      <div class="card-content">
        <div class="time-section">
          <div class="time-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="30"
              height="30"
            >
              <path
                d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                fill="#4789F0"
              />
            </svg>
          </div>
          <div class="time-text">2024.10.18 14:26</div>
        </div>

        <div class="route-section">
          <div class="route-line">
            <div class="start-point"></div>
            <div class="line"></div>
            <div class="end-point"></div>
          </div>
          <div class="addresses">
            <div class="start-address">浙江省杭州市临安区大园路168号</div>
            <div class="end-address">浙江省杭州市临安区青山湖科技城</div>
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-item">
            <div class="value">8.1km</div>
            <div class="label">距离</div>
          </div>
          <div class="stat-item">
            <div class="value">00:32:54</div>
            <div class="label">时长</div>
          </div>
        </div>

        <div class="action-section">
          <button class="replay-button" @click="startReplay">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"
                fill="#fff"
              />
            </svg>
            <span>开始回放</span>
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
      lineArr: [
        [116.478935, 39.997761],
        [116.478939, 39.997825],
        [116.478912, 39.998549],
        [116.478998, 39.998555],
        [116.479282, 39.99856],
        [116.479658, 39.998528],
        [116.480151, 39.998453],
        [116.480784, 39.998302],
        [116.481149, 39.998184],
        [116.481573, 39.997997],
        [116.481863, 39.997846],
        [116.482072, 39.997718],
        [116.482362, 39.997718],
        [116.483633, 39.998935],
        [116.48367, 39.998968],
        [116.484648, 39.999861],
      ],
      map2: null,
      startMarker: null,
      endMarker: null,
      polyline: null,
      passedPolyline: null,
    };
  },
  mounted() {
    this.initAMap2();
  },
  unmounted() {
    this.map2?.destroy();
  },
  methods: {
    initAMap2() {
      window._AMapSecurityConfig = {
        securityJsCode: "ed85bc8a6f2f5af29325bc59c75a70ec",
      };
      AMapLoader.load({
        key: "973684a430e0a55f1dc0f700ec295997",
        version: "2.0",
        plugins: [
          "AMap.Scale",
          "AMap.MoveAnimation",
          "AMap.Marker",
          "AMap.Polyline",
          
        ],
      })
        .then((AMap) => {
          this.map2 = new AMap.Map("mapContainer", {
            zoom: 14,
            center: [116.478935, 39.997761],
            mapStyle: "amap://styles/fresh", // 使用清新的亮色主题
            viewMode: "3D",
          });

          // 添加控制工具条
          this.map2.addControl(new AMap.Scale());

          // 起点标记
          this.startMarker = new AMap.Marker({
            map: this.map2,
            position: this.lineArr[0],
            icon: "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png",
            offset: new AMap.Pixel(-13, -26),
          });

          // 终点标记
          this.endMarker = new AMap.Marker({
            map: this.map2,
            position: this.lineArr[this.lineArr.length - 1],
            icon: "//a.amap.com/jsapi_demos/static/images/end.png",
            offset: new AMap.Pixel(-13, -26),
          });

          // 轨迹线
          this.polyline = new AMap.Polyline({
            map: this.map2,
            path: this.lineArr,
            showDir: true,
            strokeColor: "#4789F0",
            strokeWeight: 6,
          });

          this.passedPolyline = new AMap.Polyline({
            map: this.map2,
            strokeColor: "#20ce67",
            strokeWeight: 6,
          });

          this.startMarker.on("moving", (e) => {
            this.passedPolyline.setPath(e.passedPath);
            this.map2.setCenter(e.target.getPosition(), true);
          });

          this.map2.setFitView();
        })
        .catch((e) => {
          console.error("地图加载失败:", e);
        });
    },
    reHome() {
      console.log("gz");
      this.$emit("reHome");
    },

    startReplay() {
      console.log("开始回放");
      if (this.startMarker) {
        this.startMarker.moveAlong(this.lineArr, {
          duration: 500,
          autoRotation: true,
        });
      }
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f9fc;
  border-radius: 20px;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-radius: 20px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.back-button {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f5ff;
  cursor: pointer;
}

.back-button svg {
  fill: #4789f0;
}

.back-button:hover {
  background-color: #e6edff;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-left: 15px;
}

#mapContainer {
  flex: 1;
  min-height: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.control-card {
  background-color: #fff;
  border-radius: 16px;
  margin: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
}

.card-content {
  padding: 20px;
}

.time-section {
  display: flex;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f4f9;
  margin-bottom: 15px;
}

.time-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.time-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.route-section {
  display: flex;
  margin-bottom: 15px;
}

.route-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 15px;
  padding-top: 5px;
}

.start-point {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #20ce67;
  position: relative;
}

.start-point::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
}

.line {
  width: 2px;
  height: 50px;
  background: linear-gradient(to bottom, #20ce67, #4789f0);
  margin: 4px 0;
}

.end-point {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #4789f0;
}

.addresses {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 14px;
}

.start-address {
  margin-bottom: 20px;
  color: #555;
  position: relative;
  padding-left: 15px;
}

.start-address::before {
  content: "起";
  position: absolute;
  left: -8px;
  top: -1px;
  font-size: 12px;
  background-color: #20ce67;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.end-address {
  color: #333;
  font-weight: 500;
  position: relative;
  padding-left: 15px;
}

.end-address::before {
  content: "终";
  position: absolute;
  left: -8px;
  top: -1px;
  font-size: 12px;
  background-color: #4789f0;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  margin: 15px 0;
  background-color: #f8fbff;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.label {
  font-size: 13px;
  color: #888;
}

.action-section {
  display: flex;
  justify-content: center;
}

.replay-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(to right, #4789f0, #36b9ff);
  color: white;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(71, 137, 240, 0.3);
  transition: all 0.3s ease;
}

.replay-button svg {
  margin-right: 10px;
}

.replay-button:hover {
  box-shadow: 0 6px 20px rgba(71, 137, 240, 0.4);
  transform: translateY(-2px);
}

.replay-button:active {
  transform: translateY(0);
}
</style>
