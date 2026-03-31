<template>
  <div id="app">
    <h1>GPS Data Viewer</h1>
    <pre>{{ gpsData }}</pre>
    <div id="container"></div>
  </div>
</template>
  
  <script>
import { io } from "socket.io-client";
import AMapLoader from "@amap/amap-jsapi-loader";

export default {
  name: "App",
  data() {
    return {
      gpsData: {}, // 存储 GPS 数据
      map: null, // 地图对象
      LA: [],
      socket: null, // Socket.IO 实例
    };
  },
  mounted() {
    this.initAMap();
    this.connectSocketIO
  },
  unmounted() {
    this.map?.destroy();
  },
  methods: {
    initAMap() {
      window._AMapSecurityConfig = {
        securityJsCode: "ed85bc8a6f2f5af29325bc59c75a70ec",
      };
      AMapLoader.load({
        key: "973684a430e0a55f1dc0f700ec295997", // 申请好的Web端开发者Key，首次调用 load 时必填
        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        plugins: [
          "AMap.Scale",
          "AMap.ToolBar",
          "AMap.Scale",
          "AMap.AutoComplete",
          "AMap.Riding",
        ], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
      })
        .then((AMap) => {
          this.map = new AMap.Map("container", {
            // 设置地图容器id
            viewMode: "3D", // 是否为3D地图模式
            zoom: 11, // 初始化地图级别
            center: [120.176337, 30.285877], // 初始化地图中心点位置
          });
          //控件
          let toobar = new AMap.ToolBar();
          this.map.addControl(toobar);

          let scale = new AMap.Scale();
          this.map.addControl(scale);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    connectSocketIO() {
      // 连接到 Socket.IO 服务器
      this.socket = io("http://localhost:5000");

      // 监听 'gps_update' 事件
      this.socket.on("gps_update", (data) => {
        const longitude = parseFloat(data.Longitude.slice(0, -1));
        const latitude = parseFloat(data.Latitude.slice(0, -1));

        this.LA = [longitude, latitude];

        this.gpsData = data; // 更新 GPS 数据

        this.convertGpsToGaode();
      });

      this.socket.on("connect", () => {
        console.log("Connected to GPS WebSocket Server");
      });

      this.socket.on("disconnect", () => {
        console.warn("Disconnected from GPS WebSocket Server");
      });
    },
    convertGpsToGaode() {
      AMap.convertFrom(this.LA, "gps", (status, result) => {
        if (result.info === "ok") {
          var convertedLngLat = result.locations[0];
          console.log("转换后的" + convertedLngLat);
          this.addConvertedMarker(convertedLngLat);
        }
      });
    },
    // 添加转换后的标记
    addConvertedMarker(lnglat) {
      var marker = new AMap.Marker({
        position: lnglat,
      });
      this.map.add(marker);
      this.map.setCenter(lnglat);
      this.map.setZoom(19);
      console.log("添加marke");
    },
  },
  beforeUnmount() {
    // 组件卸载时关闭连接
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>
  
  <style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
pre {
  background: #f4f4f4;
  padding: 15px;
  border-radius: 5px;
  text-align: left;
  display: inline-block;
  font-size: 1rem;
}
#container {
  width: 500px;
  height: 500px;
}
</style>
  