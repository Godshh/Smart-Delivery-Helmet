<template>
  <div class="mapCo">
    <div
      class="videoConter"
      :style="{
        width: isChanged ? '100%' : '0%',
        borderRadius: isChanged ? '20px 0px 0px 20px' : '20px 20px 20px 20px',
      }"
    >
      <div v-if="isChanged" class="video-feed-container">
        <img
          ref="videoFeed"
          :src="videoFeedUrl"
          class="video-feed"
          alt="Video Feed"
          @load="onVideoLoad"
          @error="onVideoError"
        />
        <canvas
          ref="laneCanvas"
          class="lane-canvas"
          style="pointer-events: none"
        ></canvas>
      </div>
    </div>
    <div
      id="container"
      :style="{
        width: isChanged ? '48%' : '98%',
        borderRadius: isChanged ? '0px 20px 20px 0px' : '20px 20px 20px 20px',
      }"
    >
      <div class="mapsc" :style="{ height: mapscHeight }" v-if="!isChanged">
        <div class="mapsc1">
          <div class="mapinup">
            <div class="mapinuptu">
              <svg
                t="1732110601578"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="4261"
                width="16"
                height="16"
              >
                <path
                  d="M274.510074 461.204104c130.168642-125.846196 260.332167-251.684206 390.490575-377.400442 53.595662-51.864228 133.49848 32.354895 79.653131 84.346013-115.838262 112.008027-231.6755 223.893256-347.450317 335.904353C513.596358 619.888196 629.989251 735.852324 746.444567 851.690586c52.978609 52.733015-26.921139 136.953162-79.712483 84.282568C535.946388 805.873074 405.233348 675.710572 274.510074 545.546024 252.90194 523.93789 252.342192 482.563574 274.510074 461.204104L274.510074 461.204104zM274.510074 461.204104"
                  fill="#ffffff"
                  p-id="4262"
                ></path>
              </svg>
            </div>
            <div class="mapinupst"><input id="search" /></div>
          </div>
          <div class="mapguihua" v-if="yin.length">
            <div class="mapshitu">
              <div class="mapshiz">
                <div class="mapshiz1">{{ formattedTime }}</div>
                <div>{{ kilometers }}公里</div>
              </div>
              <div class="mapshis">:</div>
            </div>
            <div class="mapstar" @click="btnSend">开始导航</div>
          </div>
        </div>
      </div>
      <div id="panel" v-if="!isChanged"></div>
      <div v-if="is3DNavigating" class="nav3d-controls">
        <button @click="exit3DNavigation" class="exit-nav-btn">退出导航</button>
      </div>
      <div v-if="is3DNavigating" class="nav-info">
        <div class="nav-instruction">{{ currentInstruction }}</div>
        <div class="nav-distance">剩余: {{ remainingDistance }}公里</div>
      </div>
      <div v-if="isApproachingIntersection" class="intersection-view">
        <div class="intersection-header">
          <span class="intersection-title">{{ currentIntersectionName }}</span>
          <span class="intersection-distance"
            >{{ intersectionDistance }}米</span
          >
        </div>
        <div class="intersection-visual" ref="intersectionVisual"></div>
        <div class="turn-instruction">
          <div class="turn-icon" :class="turnDirectionClass"></div>
          <div class="turn-text">{{ turnInstructionText }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AMapLoader from "@amap/amap-jsapi-loader";
import { io } from "socket.io-client";
import axios from "axios";
import eventBus from "@/eventBus.js";

export default {
  data() {
    return {
      map: null,
      JD: null,
      WD: null,
      kilometers: "",
      yin: [],
      formattedTime: "",
      dh: false,
      LA: [119.821255, 30.291372],
      socket: null,
      gpsData: {},
      convertedLocation: null,
      is3DNavigating: false,
      navigationInstance: null,
      routeObj: null,
      currentInstruction: "",
      remainingDistance: 0,
      laneLines: [],
      bikeIconPath: "https://img.icons8.com/color/96/electric-scooter.png",
      isApproachingIntersection: false,
      currentIntersectionName: "",
      intersectionDistance: 0,
      turnInstructionText: "",
      turnDirectionClass: "",
      mapDestroyed: false,
      isChanged: false,
      coordinates: { left_lane: [], right_lane: [], timestamp: 0 },
      baseUrl: "http://10.194.90.44:5008",
      videoFeedUrl: "",
      coordinatesUrl: "",
      canvasWidth: 320,
      canvasHeight: 240,
      isLoading: true,
      videoError: "",
      coordinatesError: "",
      isTabActive: true,
      coordinatesInterval: null,
      maxRetries: 3,
      retryDelay: 1000,
      lastInstructionIndex: -1,
      lastSpeakTime: 0,
      riderLocation: [119.825009, 30.260983], // 假设骑手初始位置
      ordersOnMap: [], // 所有需要规划的订单
      polylines: [],
      markers: [],
      ridering: null,
    };
  },

  mounted() {
    this.initAMap();
    this.connectSocketIO();
    eventBus.on("add-order-to-map", this.handleNewOrder);

    eventBus.on("locate-helmet", this.locateHelmet);
    this.videoFeedUrl = `${this.baseUrl}/video_feed`;
    this.coordinatesUrl = `${this.baseUrl}/coordinates`;
    this.checkServerHealth();
    console.log("wMain.vue mounted, eventBus:", eventBus);
  },

  beforeDestroy() {
    this.mapDestroyed = true;
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.is3DNavigating) {
      this.exit3DNavigation();
    }
    eventBus.off("locate-helmet", this.locateHelmet);
    if (this.map) {
      this.map.destroy();
    }
    this.stopVideoFeed();
    console.log("wMain.vue beforeDestroy");
  },

  watch: {
    isChanged(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.startVideoFeed();
        });
      } else {
        this.stopVideoFeed();
      }
    },
  },

  computed: {
    mapscHeight() {
      return this.yin.length ? "200px" : "100px";
    },
  },

  methods: {
    async checkServerHealth() {
      try {
        const response = await axios.get(`${this.baseUrl}/health`, {
          timeout: 5000,
        });
        console.log("Server health:", response.data);
        this.coordinatesError = "";
      } catch (error) {
        console.error("Server health check failed:", error.message);
        this.coordinatesError = `Cannot connect to server at ${this.baseUrl}. Please ensure the backend is running.`;
      }
    },
    // 处理新订单事件
    handleNewOrder(order) {
      console.log("✅ 收到新订单:", order);
      this.ordersOnMap.push(order);
      this.drawMultiPointRoute();
    },
    drawMultiPointRoute() {
      if (!this.map || this.ordersOnMap.length === 0 || !this.riderLocation)
        return;

      this.clearMapOverlays();
      eventBus.emit("onSpeck", "您有新的订单正在为你重新规划路线");
      this.map.setCenter(this.riderLocation);
      this.map.setZoom(17);

      const points = [this.riderLocation];
      this.ordersOnMap.forEach((order) => {
        if (order.storeLocation) points.push(order.storeLocation);
        if (order.userLocation) points.push(order.userLocation);
      });

      // 标记骑手位置
      const riderMarker = new AMap.Marker({
        position: new AMap.LngLat(...this.riderLocation),
        title: "骑手起点",
        map: this.map,
        icon: new AMap.Icon({
          size: new AMap.Size(24, 36),
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
          imageSize: new AMap.Size(24, 36),
        }),
      });
      this.markers.push(riderMarker);

      this.drawSegmentsInOrder(points);
    },

    drawSegmentsInOrder(points) {
      const riding = new AMap.Riding();
      let i = 0;

      const drawNext = () => {
        if (i >= points.length - 1) {
          // 🚩 循环结束后补最后一个终点标记（买家）
          const lastPoint = new AMap.LngLat(...points[points.length - 1]);
          const lastOrderIndex = Math.floor((points.length - 2) / 2);

          const lastBuyerMarker = new AMap.Marker({
            position: lastPoint,
            title: `订单${lastOrderIndex + 1} 买家`,
            map: this.map,
            icon: new AMap.Icon({
              size: new AMap.Size(36, 36),
              image: "./imgs/stroe.png",
              imageSize: new AMap.Size(36, 36),
            }),
          });
          this.markers.push(lastBuyerMarker);
          return;
        }

        const from = new AMap.LngLat(...points[i]);
        const to = new AMap.LngLat(...points[i + 1]);
        const orderIndex = Math.floor(i / 2);

        riding.search(from, to, (status, result) => {
          if (
            status === "complete" &&
            result.routes &&
            result.routes.length > 0
          ) {
            const route = result.routes[0];
            const steps = result.routes[0].rides;
            if (i === 0 && steps.length > 0) {
              this.currentInstruction = steps[0].instruction || "";
              this.remainingDistance = (route.distance / 1000).toFixed(2);
            }

            let fullPath = [];
            steps.forEach((step) => {
              if (step.path && step.path.length > 0) {
                fullPath = fullPath.concat(step.path);
              }
            });

            if (fullPath.length > 0) {
              const polyline = new AMap.Polyline({
                path: fullPath,
                strokeColor: this.getColorByIndex(orderIndex), // 柔和配色
                strokeWeight: 6,
                lineJoin: "round",
                showDir: true,
                isOutline: true,
                outlineColor: "#ffffff",
                strokeOpacity: 0.9,
              });
              this.map.add(polyline);
              this.polylines.push(polyline);
            }

            // 商家或骑手标记
            const fromTitle =
              i === 0 ? "骑手位置" : `订单${orderIndex + 1} 商家`;
            const fromIcon =
              i === 0 ? "./imgs/rider.png" : "./imgs/business.png";

            const fromMarker = new AMap.Marker({
              position: from,
              title: fromTitle,
              map: this.map,
              icon: new AMap.Icon({
                size: new AMap.Size(36, 36),
                image: fromIcon,
                imageSize: new AMap.Size(36, 36),
              }),
            });
            this.markers.push(fromMarker);
            this.is3DNavigating = true;
            this.isChanged = true;
            eventBus.emit("onSpeck",this.currentInstruction);
          } else {
            console.warn(`路径段${i}规划失败`, status, result);
          }

          i++;
          drawNext();
        });
      };

      drawNext();
    },

    // 清除历史覆盖物
    clearMapOverlays() {
      if (this.polylines) {
        this.polylines.forEach((line) => this.map.remove(line));
      }
      if (this.markers) {
        this.markers.forEach((marker) => this.map.remove(marker));
      }
      this.polylines = [];
      this.markers = [];
    },

    // 获取颜色
    getColorByIndex(i) {
      const colors = ["#3366FF", "#FF6633", "#33CC33", "#FF33CC", "#33CCFF"];
      return colors[i % colors.length];
    },

    //地图初始化
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
        ],
      })
        .then((AMap) => {
          this.map = new AMap.Map("container", {
            viewMode: "3D",
            zoom: 11,
            center: [120.176337, 30.285877],
          });
          this.map.addControl(new AMap.ToolBar());
          this.map.addControl(new AMap.Scale());
          const auto = new AMap.AutoComplete({ city: "杭州", input: "search" });
          auto.on("select", (e) => {
            console.log("Selected POI:", e.poi); // Debug the POI object
            if (
              e.poi.location &&
              typeof e.poi.location.lng === "number" &&
              typeof e.poi.location.lat === "number"
            ) {
              this.JD = e.poi.location.lng;
              this.WD = e.poi.location.lat;
              const center = [this.JD, this.WD];
              this.map.setCenter(center);
              this.map.setZoom(19);
              this.map.add(
                new AMap.Marker({
                  position: new AMap.LngLat(this.JD, this.WD),
                  title: e.poi.name,
                })
              );
              this.handleClick();
            } else {
              const name = e.poi.name || "未知地点";
              console.warn(
                `No valid coordinates for selected location: ${name}`
              );
              this.map.setCity(name);
              this.map.setZoom(16);
              eventBus.emit(
                "onSpeck",
                `无法获取 ${name} 的精确坐标，已显示城市范围`
              );
            }
          });
        })
        .catch((e) => console.error("AMap 初始化失败:", e));
    },

    convertTime(time) {
      const days = Math.floor(time / (3600 * 24));
      const hours = Math.floor((time % (3600 * 24)) / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;
      let result = "";
      if (days > 0) result += `${days}天 `;
      if (hours > 0 || days > 0) result += `${hours}小时 `;
      if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}分钟 `;
      result += `${seconds}秒`;
      this.formattedTime = result.trim();
    },

    connectSocketIO() {
      this.socket = io("http://10.194.90.44:8081");
      this.socket.on("gps_update", (data) => {
        const longitude = parseFloat(data.Longitude.slice(0, -1));
        const latitude = parseFloat(data.Latitude.slice(0, -1));
        this.LA = [longitude, latitude];
        this.gpsData = data;
        this.convertGpsToGaode();
      });
      this.socket.on("connect", () =>
        console.log("Connected to GPS WebSocket Server")
      );
      this.socket.on("disconnect", () =>
        console.warn("Disconnected from GPS WebSocket Server")
      );
    },

    convertGpsToGaode() {
      if (
        !this.LA ||
        this.LA.length !== 2 ||
        isNaN(this.LA[0]) ||
        isNaN(this.LA[1])
      ) {
        console.error("Invalid GPS coordinates:", this.LA);
        return;
      }
      AMap.convertFrom(this.LA, "gps", (status, result) => {
        if (result.info === "ok" && result.locations[0]) {
          this.convertedLocation = result.locations[0];
          this.addConvertedMarker(this.convertedLocation);
        } else {
          console.error("GPS coordinate conversion failed:", result);
        }
      });
    },

    addConvertedMarker(lnglat) {
      if (!this.isMapAvailable()) return;
      const marker = new AMap.Marker({ position: lnglat });
      this.map.add(marker);
      this.map.setCenter(lnglat);
      this.map.setZoom(19);
    },

    locateHelmet() {
      if (!this.isMapAvailable()) {
        console.error("地图未初始化");
        return;
      }
      if (
        !this.LA ||
        this.LA.length !== 2 ||
        isNaN(this.LA[0]) ||
        isNaN(this.LA[1])
      ) {
        eventBus.emit("onSpeck", "未获取到头盔GPS数据，请确保头盔已连接");
        return;
      }
      AMap.convertFrom(this.LA, "gps", (status, result) => {
        if (result.info === "ok" && result.locations[0]) {
          const convertedLngLat = result.locations[0];
          this.map.clearMap();
          const helmetMarker = new AMap.Marker({
            position: convertedLngLat,
            title: "头盔位置",
            icon: new AMap.Icon({
              size: new AMap.Size(40, 40),
              image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
              imageSize: new AMap.Size(40, 40),
            }),
            offset: new AMap.Pixel(-20, -40),
          });
          this.map.add(helmetMarker);
          this.map.setCenter(convertedLngLat);
          this.map.setZoom(17);
          const infoWindow = new AMap.InfoWindow({
            content: `<div>头盔当前位置</div>
                      <div>经度: ${this.LA[0]}</div>
                      <div>纬度: ${this.LA[1]}</div>`,
            offset: new AMap.Pixel(0, -30),
          });
          infoWindow.open(this.map, convertedLngLat);
          this.map.add(
            new AMap.Circle({
              center: convertedLngLat,
              radius: 50,
              strokeColor: "#3366FF",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#99CCFF",
              fillOpacity: 0.35,
            })
          );
        } else {
          eventBus.emit("onSpeck", "头盔位置坐标转换失败");
        }
      });
    },

    async sendMapmag(yin) {
      try {
        const response = await axios.post(
          "api/sendInstruction",
          { yin },
          { headers: { "Content-Type": "application/json" } }
        );
        console.log("发送成功:", response.data);
      } catch (error) {
        console.error("Error sending instruction:", error);
      }
    },

    btnSend() {
      this.isChanged = !this.isChanged;
      let index = 0;
      this.start3DNavigation();
      console.log("触发头盔检测语音: 检测到当前您还没有佩戴头盔，请戴好头盔");
      eventBus.emit("onSpeck", "检测到当前您还没有佩戴头盔，请戴好头盔");
      this.lastSpeakTime = Date.now();

      setTimeout(() => {
        if (!this.is3DNavigating) {
          console.warn("导航已退出，取消骑手已佩戴语音");
          return;
        }
        if (this.yin.length > 0) {
          console.log("触发骑手已佩戴语音: 骑手已佩戴，现在为您开始导航");
          eventBus.emit("onSpeck", "骑手已佩戴，现在为您开始导航");
          this.lastSpeakTime = Date.now();

          setTimeout(() => {
            if (!this.is3DNavigating) return;
            console.log(`触发导航指令语音: ${this.yin[0]}`);
            eventBus.emit("onSpeck", this.yin[0]);
            this.lastInstructionIndex = 0;
            this.lastSpeakTime = Date.now();
            this.currentInstruction = this.yin[0];
          }, 3000);
        } else {
          console.warn("无导航指令，播报失败提示");
          eventBus.emit("onSpeck", "路线查询失败，请重新输入目的地");
          this.lastSpeakTime = Date.now();
        }
      }, 8000);

      const intervalId = setInterval(() => {
        if (index < this.yin.length) {
          this.sendMapmag(this.yin[index]);
          index++;
        } else {
          clearInterval(intervalId);
        }
      }, 50000);
    },

    start3DNavigation() {
      if (
        !this.isMapAvailable() ||
        !this.JD ||
        !this.WD ||
        !this.routeObj ||
        (!this.convertedLocation && !this.LA)
      ) {
        console.error("地图、路线或坐标未正确初始化");
        eventBus.emit("onSpeck", "无法开始导航，请检查路线和位置信息");
        return;
      }
      this.is3DNavigating = true;
      this.mapDestroyed = false;
      const currentZoom = this.map.getZoom();
      const currentCenter = this.map.getCenter();
      const currentPitch = this.map.getPitch();
      const currentRotation = this.map.getRotation();
      this.map.setZoom(18);
      this.map.setPitch(60);
      this.map.setRotation(0);
      this.map.on("viewchange", () => {
        if (this.isMapAvailable() && this.map.getRotation() !== 0) {
          this.map.setRotation(0);
        }
      });
      AMapLoader.load({
        key: "973684a430e0a55f1dc0f700ec295997",
        version: "2.0",
        plugins: ["AMap.MoveAnimation"],
      })
        .then((AMap) => {
          if (!this.isMapAvailable()) return;
          this.map.clearMap();
          const navMarker = new AMap.Marker({
            position: this.convertedLocation || this.LA,
            icon: new AMap.Icon({
              size: new AMap.Size(48, 48),
              image: this.bikeIconPath,
              imageSize: new AMap.Size(48, 48),
            }),
            offset: new AMap.Pixel(-24, -24),
            autoRotation: true,
            angle: 90,
          });
          this.map.add(navMarker);
          const path = this.routeObj.rides.reduce((acc, ride) => {
            return ride.path && ride.path.length ? acc.concat(ride.path) : acc;
          }, []);
          this.addLaneLines(path);
          this.remainingDistance = this.kilometers;
          navMarker.moveAlong(path, {
            duration: (this.routeObj.time * 1000) / 5,
            autoRotation: true,
            circlable: false,
            startCallback: () => console.log("导航动画开始"),
            endCallback: () => {
              console.log("导航动画结束");
              this.exit3DNavigation();
            },
          });
          navMarker.on("moving", (e) => {
            if (!this.isMapAvailable()) {
              navMarker.stopMove();
              return;
            }
            try {
              this.map.setCenter(e.target.getPosition());
              if (e.passedPath && e.passedPath.length > 1) {
                const len = e.passedPath.length;
                const lastPoint = e.passedPath[len - 1];
                const prevPoint = e.passedPath[len - 2];
                const angle =
                  (Math.atan2(
                    lastPoint.lng - prevPoint.lng,
                    lastPoint.lat - prevPoint.lat
                  ) *
                    180) /
                  Math.PI;
                this.map.setRotation(0);
                navMarker.setAngle(90 - angle);
                this.updateNavigationInfo(e.target.getPosition(), path);
                if (!this.laneLines.length) {
                  this.addLaneLines(path);
                }
              }
            } catch (error) {
              console.error("导航更新错误:", error);
              navMarker.stopMove();
              this.exit3DNavigation();
            }
          });
          this.navigationInstance = {
            marker: navMarker,
            originalMapState: {
              zoom: currentZoom,
              center: currentCenter,
              pitch: currentPitch,
              rotation: currentRotation,
            },
          };
        })
        .catch((e) => {
          console.error("加载导航插件失败:", e);
          this.is3DNavigating = false;
        });
    },

    addLaneLines(path) {
      if (!this.isMapAvailable() || !path || path.length < 2) return;
      this.laneLines.forEach((line) => this.map.remove(line));
      this.laneLines = [];
      const mainLine = new AMap.Polyline({
        path,
        strokeColor: "#3366FF",
        strokeWeight: 8,
        strokeOpacity: 0.8,
        zIndex: 50,
        strokeStyle: "solid",
        lineJoin: "round",
        showDir: true,
        dirColor: "#FFFFFF",
      });
      const leftOffset = 0.00005;
      const leftPath = path.map((point, idx) => {
        if (idx > 0 && idx < path.length - 1) {
          const prev = path[idx - 1];
          const next = path[idx + 1];
          const dx = next.lng - prev.lng;
          const dy = next.lat - prev.lat;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / len;
          const ny = dx / len;
          return new AMap.LngLat(
            point.lng + nx * leftOffset,
            point.lat + ny * leftOffset
          );
        }
        return point;
      });
      const leftLine = new AMap.Polyline({
        path: leftPath,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        strokeDasharray: [5, 5],
        zIndex: 49,
      });
      const rightPath = path.map((point, idx) => {
        if (idx > 0 && idx < path.length - 1) {
          const prev = path[idx - 1];
          const next = path[idx + 1];
          const dx = next.lng - prev.lng;
          const dy = next.lat - prev.lat;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / len;
          const ny = dx / len;
          return new AMap.LngLat(
            point.lng - nx * leftOffset,
            point.lat - ny * leftOffset
          );
        }
        return point;
      });
      const rightLine = new AMap.Polyline({
        path: rightPath,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        strokeDasharray: [5, 5],
        zIndex: 49,
      });
      this.map.add([mainLine, leftLine, rightLine]);
      this.laneLines = [mainLine, leftLine, rightLine];
    },

    updateNavigationInfo(currentPosition, path) {
      if (!currentPosition || !path || !path.length) return;
      let minDistance = Infinity;
      let closestPointIndex = 0;
      path.forEach((point, index) => {
        const distance = Math.sqrt(
          Math.pow(point.lng - currentPosition.lng, 2) +
            Math.pow(point.lat - currentPosition.lat, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestPointIndex = index;
        }
      });
      const progressPercent = closestPointIndex / path.length;
      this.remainingDistance = (
        this.kilometers *
        (1 - progressPercent)
      ).toFixed(2);
      const instructionIndex = Math.floor(progressPercent * this.yin.length);
      if (
        instructionIndex < this.yin.length &&
        instructionIndex > 0 &&
        instructionIndex !== this.lastInstructionIndex
      ) {
        const now = Date.now();
        if (now - this.lastSpeakTime >= 1000) {
          this.currentInstruction = this.yin[instructionIndex];
          console.log(
            `触发导航指令语音: ${this.currentInstruction}, 索引: ${instructionIndex}`
          );
          eventBus.emit("onSpeck", this.currentInstruction);
          this.lastInstructionIndex = instructionIndex;
          this.lastSpeakTime = now;
        }
      }
    },

    exit3DNavigation() {
      this.isChanged = false;
      this.clearMapOverlays();
      this.yin = [];
      this.kilometers = "";
      this.formattedTime = "";
      if (this.ridingInstance) {
        this.ridingInstance.clear();
      }

      if (!this.is3DNavigating) return;
      try {
        if (this.navigationInstance?.marker) {
          this.navigationInstance.marker.stopMove();
          this.map.remove(this.navigationInstance.marker);
        }
        if (this.laneLines.length) {
          this.laneLines.forEach((line) => {
            try {
              this.map.remove(line);
            } catch (e) {
              console.warn("移除车道线错误:", e);
            }
          });
          this.laneLines = [];
        }
        if (this.navigationInstance?.originalMapState) {
          const { zoom, center, pitch, rotation } =
            this.navigationInstance.originalMapState;
          this.map.setZoom(zoom);
          this.map.setCenter(center);
          this.map.setPitch(pitch);
          this.map.setRotation(rotation);
        }
      } catch (error) {
        console.error("退出导航错误:", error);
      } finally {
        this.is3DNavigating = false;
        this.navigationInstance = null;
        this.currentInstruction = "";
        this.remainingDistance = 0;
        this.isApproachingIntersection = false;
        this.lastInstructionIndex = -1;
        this.lastSpeakTime = 0;
      }
    },

    isMapAvailable() {
      return this.map && !this.mapDestroyed;
    },

    async handleClick() {
      if (
        !this.isMapAvailable() ||
        !this.JD ||
        !this.WD ||
        !this.LA ||
        this.LA.length !== 2
      ) {
        console.error("地图或坐标未正确初始化", {
          JD: this.JD,
          WD: this.WD,
          LA: this.LA,
        });
        eventBus.emit("onSpeck", "无法规划路线，请检查起点和终点坐标");
        return;
      }
      // 如果已有实例，先清除之前路线
      if (this.ridering) {
        this.clearMapOverlays();
        this.ridering.clear();
      } else {
        this.ridering = new AMap.Riding({
          map: this.map,
          policy: 0,
          panel: "panel",
        });
      }
      this.ridering.search(this.LA, [this.JD, this.WD], (status, result) => {
        if (status === "complete") {
          this.routeObj = result.routes[0];
          const distance = result.routes[0].distance;
          const time = result.routes[0].time;
          this.yin = result.routes[0].rides.map((ride) => ride.instruction);
          this.kilometers = distance / 1000;
          this.convertTime(time);
          this.dh = true;
          console.log("路线查询成功, yin:", this.yin);
          // 把所有备选路线发给 rider.vue 做拥堵分析
          eventBus.emit("routes-updated", result.routes);
        } else {
          console.error("骑行路线查询失败:", result);
          eventBus.emit("onSpeck", "路线查询失败，请重新输入目的地");
        }
      });
    },

    startVideoFeed() {
      this.resizeCanvas();
      this.renderCanvas();
      window.addEventListener("resize", this.resizeCanvas);
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
      this.fetchCoordinatesWithRetry();
      this.coordinatesInterval = setInterval(() => {
        if (this.isTabActive) {
          this.fetchCoordinatesWithRetry();
        }
      }, 200);
    },

    stopVideoFeed() {
      window.removeEventListener("resize", this.resizeCanvas);
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
      if (this.coordinatesInterval) {
        clearInterval(this.coordinatesInterval);
        this.coordinatesInterval = null;
      }
      this.isLoading = true;
      this.videoError = "";
      this.coordinatesError = "";
    },

    resizeCanvas() {
      const canvas = this.$refs.laneCanvas;
      const img = this.$refs.videoFeed;
      if (!canvas || !img) {
        console.warn("Canvas or video feed not available");
        return;
      }
      if (img.complete && img.naturalWidth) {
        this.canvasWidth = img.naturalWidth || img.width;
        this.canvasHeight = img.naturalHeight || img.height;
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        canvas.style.width = `${img.clientWidth}px`;
        canvas.style.height = `${img.clientHeight}px`;
      } else {
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        canvas.style.width = "100%";
        canvas.style.height = "auto";
      }
    },

    async fetchCoordinatesWithRetry(retries = 0) {
      try {
        const response = await axios.get(this.coordinatesUrl, {
          timeout: 10000,
        });
        console.log("Coordinates fetched:", response.data);
        this.coordinates = response.data;
        this.coordinatesError = "";
        if (
          this.coordinates.left_lane.length === 2 &&
          this.coordinates.right_lane.length === 2 &&
          this.coordinates.left_lane[0][0] === 100 &&
          this.coordinates.right_lane[0][0] === 220
        ) {
          console.warn("Received fallback coordinates from server");
        }
      } catch (error) {
        console.error(
          "Error fetching coordinates:",
          error.message,
          error.config
        );
        let errorMessage = "Failed to fetch lane coordinates.";
        if (error.code === "ECONNREFUSED") {
          errorMessage = `Connection refused at ${this.coordinatesUrl}. Ensure the server is running.`;
        } else if (error.message.includes("timeout")) {
          errorMessage = `Request to ${this.coordinatesUrl} timed out after 10 seconds.`;
        }
        if (retries < this.maxRetries) {
          console.log(
            `Retrying fetchCoordinates (${retries + 1}/${this.maxRetries})...`
          );
          setTimeout(
            () => this.fetchCoordinatesWithRetry(retries + 1),
            this.retryDelay
          );
        } else {
          this.coordinatesError = `${errorMessage} Please check the server and network.`;
        }
      }
    },

    renderCanvas() {
      const canvas = this.$refs.laneCanvas;
      if (!canvas) {
        console.warn("Canvas not available for rendering");
        return;
      }
      const ctx = canvas.getContext("2d");
      let animationFrameId = null;

      const animate = () => {
        if (!this.isChanged) {
          cancelAnimationFrame(animationFrameId);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (
          this.coordinates.left_lane.length === 2 &&
          this.coordinates.right_lane.length === 2
        ) {
          const leftLaneStart = this.coordinates.left_lane[0];
          const leftLaneEnd = this.coordinates.left_lane[1];
          const rightLaneStart = this.coordinates.right_lane[0];
          const rightLaneEnd = this.coordinates.right_lane[1];

          ctx.beginPath();
          ctx.moveTo(leftLaneStart[0], leftLaneStart[1]);
          ctx.lineTo(leftLaneEnd[0], leftLaneEnd[1]);
          ctx.lineTo(rightLaneEnd[0], rightLaneEnd[1]);
          ctx.lineTo(rightLaneStart[0], rightLaneStart[1]);
          ctx.closePath();
          ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
          ctx.strokeStyle = "#00FFFF";
          ctx.lineWidth = 1;
          ctx.shadowColor = "#00FFFF";
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          const leftLaneY1 = leftLaneStart[1];
          const leftLaneY2 = leftLaneEnd[1];
          const rightLaneY1 = rightLaneStart[1];
          const rightLaneY2 = rightLaneEnd[1];
          const leftLaneX1 = leftLaneStart[0];
          const leftLaneX2 = leftLaneEnd[0];
          const rightLaneX1 = rightLaneStart[0];
          const rightLaneX2 = rightLaneEnd[0];
          const leftSlope =
            (leftLaneX2 - leftLaneX1) / (leftLaneY2 - leftLaneY1 + 1e-5);
          const rightSlope =
            (rightLaneX2 - rightLaneX1) / (rightLaneY2 - rightLaneY1 + 1e-5);
          const interval = 25;
          const startY = Math.min(leftLaneY1, rightLaneY1);
          const endY = Math.max(leftLaneY2, rightLaneY2);

          ctx.globalAlpha = 0.9;
          for (let y = startY; y <= endY; y += interval) {
            const leftXAtY = leftLaneX1 + leftSlope * (y - leftLaneY1);
            const rightXAtY = rightLaneX1 + rightSlope * (y - rightLaneY1);
            const midX = (leftXAtY + rightXAtY) / 2;
            const laneWidth = Math.abs(rightXAtY - leftXAtY);
            const chevronWidth = laneWidth * 0.5;
            const chevronHeight = chevronWidth * 0.15;

            ctx.fillStyle = "#00FFFF";
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#00FFFF";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(midX, y - chevronHeight / 2);
            ctx.lineTo(midX - chevronWidth, y + chevronHeight / 2);
            ctx.lineTo(midX + chevronWidth, y + chevronHeight / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        }
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    },

    onVideoLoad() {
      this.isLoading = false;
      this.videoError = "";
      this.resizeCanvas();
    },

    onVideoError() {
      this.isLoading = false;
      this.videoError = "Failed to load video feed. Please check the server.";
    },

    handleVisibilityChange() {
      this.isTabActive = !document.hidden;
    },
  },
  unmounted() {
    eventBus.off("add-order-to-map", this.handleNewOrder);
  },
};
</script>

<style scoped lang="less">
.videoConter {
  width: 48%;
  height: 98%;
  background-color: #f5f5f5ef;
  transition: width 0.3s ease, border-radius 0.3s ease;
  position: relative;
  overflow: hidden;
}

.video-feed-container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-feed-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.video-feed {
  width: 100%;
  height: 100%;
  max-height: 100%;
}

.lane-canvas {
  position: absolute;
  width: calc(100% - 0px);
  height: 100%;
}

.video-loading {
  text-align: center;
  color: #6b7280;
  margin: 16px 0;
}

.video-error {
  text-align: center;
  color: #dc2626;
  margin: 16px 0;
}

.video-status {
  text-align: center;
  color: #6b7280;
  margin-top: 8px;
  font-size: 14px;
}

.retry-btn {
  margin-top: 8px;
  padding: 8px 16px;
  background-color: #3366ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #4a7bff;
  }
}

.mapCo {
  background-color: #fafafa47;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  #container {
    width: 98%;
    border-radius: 20px;
    height: 98%;
    display: flex;
    position: relative;
    transition: width 0.3s ease, border-radius 0.3s ease;
  }
}

.nav3d-controls {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  .exit-nav-btn {
    background-color: #ff4d4f;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    &:hover {
      background-color: #ff7875;
    }
  }
}

.nav-info {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 300px;
  text-align: center;
  .nav-instruction {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
  }
  .nav-distance {
    font-size: 16px;
    color: #666;
  }
}

.intersection-view {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  width: 80%;
  max-width: 400px;
  .intersection-header {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .intersection-visual {
    height: 100px;
    background-color: #f0f0f0;
    border-radius: 5px;
    margin-bottom: 10px;
  }
  .turn-instruction {
    display: flex;
    align-items: center;
    .turn-icon {
      width: 30px;
      height: 30px;
      margin-right: 10px;
      background-color: #3366ff;
      border-radius: 5px;
    }
    .turn-text {
      font-size: 16px;
      color: #333;
    }
  }
}

#panel {
  right: 0;
  top: 0;
  margin: 20px;
  position: absolute;
  z-index: 99;
}

.mapsc {
  margin: 20px;
  background-color: #f5f5f5ef;
  position: relative;
  width: 300px;
  display: flex;
  justify-content: center;
  border-radius: 8px;
  z-index: 99;
  .mapsc1 {
    display: flex;
    flex-direction: column;
    margin: 15px;
    width: 92%;
    height: 90%;
    .mapinup {
      background-color: #a8a8a8a1;
      width: 100%;
      height: 55px;
      display: flex;
      border-radius: 25px;
      justify-content: center;
      align-items: center;
      .mapinupst {
        border: none;
        width: 85%;
        height: 100%;
        display: flex;
        border-radius: 25px;
        input {
          border: none;
          height: 95%;
          outline: none;
          background-color: transparent;
          border-radius: 5px;
          width: 100%;
          color: #ffffff;
          font-size: 16px;
        }
      }
    }
  }
}

.mapguihua {
  display: flex;
  flex-direction: column;
  margin-top: 15px;
  width: 100%;
  height: 100%;
  .mapstar {
    background-color: #fff;
    width: 100%;
    font-size: 24px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 35%;
    border-radius: 15px;
  }
  .mapshitu {
    width: 100%;
    height: 65%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .mapshiz {
      margin-left: 10px;
      font-size: 18px;
      .mapshiz1 {
        margin-bottom: 8px;
      }
    }
  }
}
</style>