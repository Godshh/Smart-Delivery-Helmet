<template>
  <div class="main-container">
    <div class="top-panel">
      <div class="header-bar">
        <h2>配送服务</h2>
      </div>

      <div class="divider">
        <div class="divider-left"></div>
        <div class="divider-right"></div>
      </div>

      <div class="tabs-container">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="currentTab = tab"
          :class="{ active: currentTab === tab }"
        >
          {{ tab }}
          <span v-if="tab === '新任务'" class="badge">
            {{ newOrderCount }}
          </span>
        </button>
      </div>
    </div>

    <div class="content-area">
      <component
        :is="currentComponent"
        :orders="filteredOrders"
        :time="currentTime"
        @update-task="updateTask"
        @navigate="handleNavigation"
      ></component>
    </div>
  </div>
</template>

<script>
import NewTask from "./NewTask.vue";
import PendingPickup from "./PendingPickup.vue";
import Delivering from "./Delivering.vue";

import { eventBus } from "@/eventBus.js";
export default {
  components: { NewTask, PendingPickup, Delivering },
  data() {
    return {
      tabs: ["新任务", "待取货", "配送中"],
      currentTab: "新任务",
      currentTime: new Date(),
      orders: [
        // 添加更多真实订单字段
        {
          id: 1,
          orderNumber: "#PS-20241001",
          store: "肯德基 (万象城店)",
          storeAddress: "万象城L1-102",
          userAddress: "天澜国际公寓B座1201室",
          phoneNumber: "13800138001",
          Sdistance: "1.2km",
          Ydistance: "3.8km",
          time: "20分钟",
          reward: 15,
          status: "new",
          customer: "施女士",
          createTime: this.getTimeOffset(5),
          pickupTime: this.getTimeOffset(10),
          eta: this.getTimeOffset(30),
          note: "不要打电话，放门口",
          storeLocation: [119.829388,30.257933], // 商家经纬度
          userLocation: [119.823256,30.264509], // 买家经纬度
        },
        {
          id: 2,
          orderNumber: "#PS-20241002",
          store: "星巴克 (万达广场店)",
          storeAddress: "万达广场2楼",
          userAddress: "海景花园8栋302室",
          phoneNumber: "13900139001",
          Sdistance: "0.8km",
          Ydistance: "2.5km",
          time: "15分钟",
          reward: 12,
          status: "new",
          customer: "孔先生",
          createTime: this.getTimeOffset(10),
          pickupTime: this.getTimeOffset(20),
          eta: this.getTimeOffset(35),
          note: "大杯热拿铁，无糖",
          storeLocation: [119.828623,30.25262], // 商家经纬度
          userLocation: [119.828157,30.261405], // 买家经纬度
        },
        {
          id: 3,
          orderNumber: "#PS-20241003",
          store: "必胜客 (世纪金源店)",
          storeAddress: "世纪金源购物中心3层",
          userAddress: "阳光小区15号楼601室",
          phoneNumber: "13700137001",
          Sdistance: "3.2km",
          Ydistance: "2.1km",
          time: "25分钟",
          reward: 18,
          status: "pending",
          customer: "温女士",
          createTime: this.getTimeOffset(60),
          pickupTime: this.getTimeOffset(60),
          eta: this.getTimeOffset(85),
          note: "少辣，要发票",
          storeLocation: [119.838916,30.257897], // 商家经纬度
          userLocation: [119.822875,30.261754], // 买家经纬度
        },
        {
          id: 4,
          orderNumber: "#PS-20241004",
          store: "喜茶 (太古里店)",
          storeAddress: "太古里B1层",
          userAddress: "创意产业园C栋406室",
          phoneNumber: "13500135001",
          Sdistance: "2.5km",
          Ydistance: "4.3km",
          time: "30分钟",
          reward: 22,
          status: "delivering",
          customer: "郑女士",
          createTime: this.getTimeOffset(35),
          pickupTime: this.getTimeOffset(40),
          eta: this.getTimeOffset(70),
          note: "多冰，少糖，草莓口味",
          storeLocation: [119.845065,30.265472], // 商家经纬度
          userLocation: [119.845065,30.265472], // 买家经纬度
        },
      ],
      timer: null,
    };
  },
  computed: {
    currentComponent() {
      switch (this.currentTab) {
        case "新任务":
          return NewTask;
        case "待取货":
          return PendingPickup;
        case "配送中":
          return Delivering;
        default:
          return null;
      }
    },
    filteredOrders() {
      return this.orders.filter((order) => {
        switch (this.currentTab) {
          case "新任务":
            return order.status === "new";
          case "待取货":
            return order.status === "pending";
          case "配送中":
            return order.status === "delivering";
          default:
            return false;
        }
      });
    },
    newOrderCount() {
      return this.orders.filter((o) => o.status === "new").length;
    },
  },
  methods: {
    getTimeOffset(minutes) {
      const time = new Date();
      time.setMinutes(time.getMinutes() + minutes);
      return time;
    },
    updateTask({ id, status }) {
      const order = this.orders.find((o) => o.id === id);
      if (order) {
        order.status = status;
      }
    },
    handleNavigation(orderId) {
      // 根据订单状态切换到相应标签
      const order = this.orders.find((o) => o.id === orderId);
      if (order) {
        if (order.status === "pending") this.currentTab = "待取货";
        else if (order.status === "delivering") this.currentTab = "配送中";
      }
    },
    formatTime(date) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    updateCurrentTime() {
      this.currentTime = new Date();
    },
  },
  mounted() {
    this.timer = setInterval(this.updateCurrentTime, 60000); // 每分钟更新一次时间
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer);
  },
};
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
  background: #f5f7fa;
  overflow: hidden;
  border-radius: 18px;
}

.top-panel {
  background-color: #ffffff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding-bottom: 10px;
  z-index: 10;
}

.header-bar {
  padding: 20px;
  background: linear-gradient(135deg, #ffd74b 0%, #ffa43b 100%);
  border-radius: 20px 20px 0 0;
}

.header-bar h2 {
  margin: 0;
  color: #ffffff;
  font-weight: 600;
  font-size: 24px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.divider {
  display: flex;
  justify-content: center;
  margin: 0;
}

.divider-left,
.divider-right {
  width: 24px;
  height: 12px;
}

.divider-left {
  background-color: #ffa43b;
  border-radius: 0 0 0 24px;
}

.divider-right {
  background-color: #ffa43b;
  border-radius: 0 0 24px 0;
}

.tabs-container {
  display: flex;
  padding: 15px 0 0;
  background: white;
}

.tabs-container button {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 10px;
  margin: 0 5px;
  border: none;
  background: #f5f5f5;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  border-radius: 50px 50px 0 0;
  box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
}

.tabs-container button.active {
  background: linear-gradient(135deg, #fff9e7 0%, #fff2d4 100%);
  color: #ff8a00;
  font-weight: 600;
  box-shadow: 0 -2px 6px rgba(255, 138, 0, 0.15);
  border-bottom: 3px solid #ff8a00;
}

.tabs-container button:not(.active):hover {
  background: #f0f0f0;
  color: #333;
}

.badge {
  position: absolute;
  top: -5px;
  right: 5px;
  background-color: #ff3b30;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.content-area {
  flex: 1;
  background: linear-gradient(180deg, #fff9e7 0%, #fff6e0 100%);
  border-radius: 0 0 20px 20px;
  padding: 20px 10px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>

  
  
  
  