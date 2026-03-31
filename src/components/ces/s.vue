<template>
  <div id="app">
    <h1>WebSocket with Vue 3</h1>
    <div v-if="connected">
      <p>Status: <strong style="color: green">Connected</strong></p>
    </div>
    <div v-else>
      <p>Status: <strong style="color: red">Disconnected</strong></p>
    </div>
    <div>
      <h2>Messages from Server:</h2>
      <ul>
        <li v-for="(msg, index) in messages" :key="index">
          {{ msg }}
        </li>
      </ul>
    </div>
    <div id="container">

    </div>
  </div>
</template>
  
  <script>
// 引入 Socket.IO 客户端
import { io } from "socket.io-client";
import AMapLoader from "@amap/amap-jsapi-loader";

export default {
  data() {
    return {
      messages: [], // 存储接收到的消息
      connected: false, // 连接状态
      socket: null, // Socket.IO 实例
      map: null, // 地图对象
      JD: null, // 终点经度
      WD: null, // 终点纬度
      kilometers: "", // 距离（公里）
      yin: [], // 指令数组
      formattedTime: "",
      dh: false, // 是否完成导航绘制
    };
  },
  methods: {
    connectSocketIO() {
      // 使用 Socket.IO 客户端连接到服务端
      this.socket = io("http://localhost:5000"); // 注意这里使用的是 io() 方法

      // 连接成功时触发
      this.socket.on("connect", () => {
        this.connected = true;
        console.log("Socket.IO connection established");
      });

      // 监听从服务器发送的事件
      this.socket.on("server_event", (data) => {
        console.log("Received message:", data);
        this.messages.push(data.message); // 根据服务器返回的数据更新消息列表
      });

      // 连接关闭时触发
      this.socket.on("disconnect", () => {
        this.connected = false;
        console.log("Socket.IO connection closed");
      });

      // 发生错误时触发
      this.socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
      });
    },
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
  },
  mounted() {
    // 组件挂载时连接 Socket.IO
    this.initAMap();
    this.connectSocketIO();
  },
  beforeUnmount() {
    // 组件卸载时关闭连接
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  unmounted() {
    this.map?.destroy();
  },
};
</script>
  
  <style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 50px;
}
#container{
  width: 500px;
  height: 500px;
}
</style>